"""Hornea la luz sobre los pisos de la planta para la web ("Iluminación realista" en el dashboard).

Corre en segundo plano, sin abrir la interfaz de Blender:

    blender -b --python blender/hornear_piso.py -- [--probar] [--px 4096] [--muestras 128]

- Importa dashboard/web/public/models/planta_v10.glb tal como lo ve la web (sin los camiones fijos que la web oculta).
- Pone un plano blanco apenas sobre el piso que cubre la zona construida y le hornea la luz difusa (directa del sol
  + rebotada del cielo) con Cycles: las sombras de edificios, máquinas y árboles quedan en una textura.
- La textura se normaliza (piso a pleno sol = 1) y se guarda en dashboard/web/public/models/planta_luz.jpg, con su
  rectángulo en planta_luz.json. La web la multiplica sobre los materiales de piso; planta_v10.glb no se toca.
"""
import json
import math
import os
import re
import sys
import time

import bpy

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
GLB = os.path.join(REPO, "dashboard", "web", "public", "models", "planta_v10.glb")
SALIDA = os.path.join(REPO, "dashboard", "web", "public", "models", "planta_luz.jpg")
SALIDA_JSON = os.path.join(REPO, "dashboard", "web", "public", "models", "planta_luz.json")
# los mismos que oculta Scene3D.tsx (TRUCK_HIDE): en la web no están, así que tampoco hacen sombra
OCULTOS = re.compile(r"^(Camion_Descarga_MP_|Camion_Carga_PT_|Camion_Bascula_|Camion_Espera_Bascula|CamionCine|Caja_PATY_|Hamburguesas_)")
MAT_OCULTOS = {"M_Campo", "M_Pasto"}

args = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
PROBAR = "--probar" in args
PX = int(args[args.index("--px") + 1]) if "--px" in args else 4096
MUESTRAS = int(args[args.index("--muestras") + 1]) if "--muestras" in args else 128


def log(*a):
    print("[hornear]", *a, flush=True)


bpy.ops.wm.read_factory_settings(use_empty=True)
t0 = time.time()
bpy.ops.import_scene.gltf(filepath=GLB)
log(f"importado en {time.time() - t0:.0f} s: {len(bpy.data.objects)} objetos")

# lo que la web no dibuja tampoco hace sombra
for o in bpy.data.objects:
    p, oculto = o, False
    while p:
        if OCULTOS.match(p.name):
            oculto = True
            break
        p = p.parent
    if o.type == "MESH" and any(m and m.name.split(".")[0] in MAT_OCULTOS for m in o.data.materials):
        oculto = True
    if oculto:
        o.hide_render = True
        continue
    # los pisos (mallas chatas a menos de 60 cm, el mismo criterio que usa la web) reciben la luz: no tapan al receptor
    if o.type == "MESH":
        zs = [(o.matrix_world @ __import__("mathutils").Vector(c)).z for c in o.bound_box]
        if max(zs) < 0.6 and max(zs) - min(zs) < 0.6:
            o.hide_render = True

# zona construida: todo lo que se levanta más de 1 m (edificios, máquinas, árboles cercanos)
xs, ys = [], []
for o in bpy.data.objects:
    if o.type != "MESH" or o.hide_render:
        continue
    cs = [o.matrix_world @ v for v in (__import__("mathutils").Vector(c) for c in o.bound_box)]
    if max(c.z for c in cs) > 1.0 and max(abs(c.x) for c in cs) < 700 and max(abs(c.y) for c in cs) < 700:
        xs += [c.x for c in cs]
        ys += [c.y for c in cs]
x0, x1, y0, y1 = min(xs) - 10, max(xs) + 10, min(ys) - 10, max(ys) + 10
log(f"zona construida: x {x0:.0f}..{x1:.0f}  y {y0:.0f}..{y1:.0f}  ({x1 - x0:.0f} x {y1 - y0:.0f} m)")
if PROBAR:
    sys.exit(0)

W, H = (PX, max(256, round(PX * (y1 - y0) / (x1 - x0)))) if x1 - x0 >= y1 - y0 else (max(256, round(PX * (x1 - x0) / (y1 - y0))), PX)
log(f"textura {W} x {H}: {(x1 - x0) / W * 100:.1f} cm por pixel")

# plano receptor, blanco, 3 cm sobre el piso; sus UV (0..1) cubren el rectángulo
bpy.ops.mesh.primitive_plane_add(size=1, location=((x0 + x1) / 2, (y0 + y1) / 2, 0.03))
plano = bpy.context.active_object
plano.scale = (x1 - x0, y1 - y0, 1)
bpy.ops.object.transform_apply(scale=True)
img = bpy.data.images.new("luz", W, H, float_buffer=True)
mat = bpy.data.materials.new("Receptor")
mat.use_nodes = True
nodos = mat.node_tree.nodes
bsdf = next(n for n in nodos if n.type == "BSDF_PRINCIPLED")
bsdf.inputs["Base Color"].default_value = (1, 1, 1, 1)
bsdf.inputs["Roughness"].default_value = 1
tex = nodos.new("ShaderNodeTexImage")
tex.image = img
nodos.active = tex
plano.data.materials.append(mat)

# sol con el mismo rumbo que la luz de la web (three (80, 150, 60) -> Blender (80, -60, ·)) pero más bajo, a ~38°:
# con el de la web (56°) casi toda la sombra cae debajo de las máquinas y no se ve; y cielo celeste
sol = bpy.data.lights.new("Sol", "SUN")
sol.energy = 3.0
sol.angle = math.radians(2.5)  # sombras con borde suave
so = bpy.data.objects.new("Sol", sol)
bpy.context.scene.collection.objects.link(so)
d = __import__("mathutils").Vector((80, -60, 78)).normalized()
so.rotation_euler = d.to_track_quat("Z", "Y").to_euler()
mundo = bpy.data.worlds.new("Cielo")
mundo.use_nodes = True
fondo = next(n for n in mundo.node_tree.nodes if n.type == "BACKGROUND")
fondo.inputs["Color"].default_value = (0.62, 0.8, 1.0, 1)
fondo.inputs["Strength"].default_value = 1.4
bpy.context.scene.world = mundo

esc = bpy.context.scene
esc.render.engine = "CYCLES"
esc.cycles.samples = MUESTRAS
esc.cycles.max_bounces = 3
try:  # GPU si hay; si no, CPU
    prefs = bpy.context.preferences.addons["cycles"].preferences
    for tipo in ("OPTIX", "CUDA", "HIP", "ONEAPI", "METAL"):
        try:
            prefs.compute_device_type = tipo
            prefs.get_devices()
            if any(dv.type == tipo for dv in prefs.devices):
                for dv in prefs.devices:
                    dv.use = True
                esc.cycles.device = "GPU"
                log("dispositivo:", tipo)
                break
        except TypeError:
            continue
    else:
        log("dispositivo: CPU")
except Exception as e:  # noqa: BLE001 - sin GPU configurable: CPU
    log("dispositivo: CPU", e)

bpy.ops.object.select_all(action="DESELECT")
plano.select_set(True)
bpy.context.view_layer.objects.active = plano
esc.render.bake.use_pass_direct = True
esc.render.bake.use_pass_indirect = True
esc.render.bake.use_pass_color = False
esc.render.bake.margin = 2
t0 = time.time()
log("horneando...")
bpy.ops.object.bake(type="DIFFUSE")
log(f"horneado en {time.time() - t0:.0f} s")

# normalizar: el piso a pleno sol (percentil 97) vale 1; debajo de las cosas, más oscuro pero nunca menos de PISO_LUZ
# (adentro de lo techado no hay luces en la escena: sin ese mínimo, los interiores quedarían negros al recorrerlos)
PISO_LUZ = 0.45
px = list(img.pixels)
lum = sorted(px[i] for i in range(0, len(px), 4 * 7))
ref = lum[int(len(lum) * 0.97)] or 1.0
out = bpy.data.images.new("luz8", W, H)
out.pixels = [PISO_LUZ + (1 - PISO_LUZ) * min(1.0, v / ref) if (i % 4) != 3 else 1.0 for i, v in enumerate(px)]
out.filepath_raw = SALIDA
out.file_format = "JPEG"
esc.render.image_settings.quality = 90
out.save()
with open(SALIDA_JSON, "w", encoding="utf-8") as f:
    # rectángulo en coordenadas three: x igual, z = -y de Blender
    json.dump({"x0": x0, "x1": x1, "z0": -y1, "z1": -y0, "w": W, "h": H, "muestras": MUESTRAS}, f)
log("listo:", SALIDA)
