"""Operario v2: parte de operario_worker.glb (proyecto de Tecnologías para la Automatización, CC0) y lo adapta a la
planta de alimentos: mameluco azul, chaleco verde reflectivo, casco, cofia, barbijo, guantes de nitrilo y botas
blancas; sin bigote. Renombra los clips del rig (sin prefijo) y arma los que faltan: Jump, Sit, Yes, No, Dance.
Corrige el rig: Idle/Interact/Wave pierden las rotaciones de pierna (con el pie fijo estiraban una bota a 0,35 m y achicaban la otra),
los clips armados aquí llevan el pie al tobillo y el Run se cierra sin salto en el loop.

Uso (headless):
  blender -b --python blender/operario_worker.py -- <operario_worker.glb> <salida.glb> [<salida.blend>]
Los nombres de clip que usa el código (Walk.tsx, Scene3D.tsx, GESTOS) son: Idle Walk Run Jump Sit Interact Wave Yes No Dance.
"""
import bpy, bmesh, sys, math
from mathutils import Vector, Matrix, Quaternion

src, dst = sys.argv[sys.argv.index("--") + 1:][:2]
blend_out = sys.argv[sys.argv.index("--") + 3] if len(sys.argv) > sys.argv.index("--") + 3 else None
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=src)
A = next(o for o in bpy.data.objects if o.type == "ARMATURE")
MW = A.matrix_world
if "Icosphere" in bpy.data.objects: bpy.data.objects.remove(bpy.data.objects["Icosphere"])  # forma de hueso del importador
M = {n: bpy.data.objects["Worker_" + n] for n in ("Body", "Legs", "Feet", "Head")}

# ---------- materiales ----------
def mat(name, rgb, rough=0.75):
    m = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    m.use_nodes = True
    b = next(n for n in m.node_tree.nodes if n.type == "BSDF_PRINCIPLED")
    b.inputs["Base Color"].default_value = (*rgb, 1)
    b.inputs["Metallic"].default_value = 0
    b.inputs["Roughness"].default_value = rough
    return m
MAMELUCO, MAMELUCO2 = mat("Op_Mameluco", (0.03, 0.11, 0.45)), mat("Op_Mameluco_Rodilla", (0.02, 0.07, 0.30))
CHALECO, REFL = mat("Op_Chaleco", (0.56, 0.87, 0.02)), mat("Op_Reflectivo", (0.81, 0.85, 0.89), 0.4)
CASCO, BOTA, SUELA = mat("Op_Casco", (1.0, 0.56, 0.01), 0.45), mat("Op_Bota", (0.9, 0.92, 0.94), 0.5), mat("Op_Suela", (0.12, 0.12, 0.13))
GUANTE, BARBIJO, COFIA = mat("Op_Guante", (0.04, 0.24, 1.0)), mat("Op_Barbijo", (0.33, 0.62, 0.85), 0.9), mat("Op_Cofia", (0.93, 0.94, 0.95), 0.95)
def remap(o, table):
    for i, s in enumerate(o.material_slots):
        if s.material and s.material.name in table: s.material = table[s.material.name]
remap(M["Body"], {"LightBrown": MAMELUCO, "Worker_Vest": CHALECO, "Worker_Yellow": REFL})
remap(M["Legs"], {"Brown": MAMELUCO, "Brown2": MAMELUCO2})
remap(M["Feet"], {"Black": BOTA, "Grey": SUELA})
remap(M["Head"], {"Worker_Yellow": CASCO})
for m in (bpy.data.materials["Skin"],): m.node_tree.nodes["Principled BSDF"].inputs["Metallic"].default_value = 0

def slot(o, m):
    if m.name not in [s.material.name for s in o.material_slots if s.material]: o.data.materials.append(m)
    return next(i for i, s in enumerate(o.material_slots) if s.material == m)

# guantes: la piel de las manos (más allá de la muñeca) pasa a nitrilo azul
bo = M["Body"]; gi = slot(bo, GUANTE)
for p in bo.data.polygons:
    if bo.material_slots[p.material_index].material.name == "Skin" and abs((bo.matrix_world @ p.center).x) > 0.575: p.material_index = gi

# ---------- cabeza: sin bigote; cofia y barbijo copiando la piel de la cara ----------
ho = M["Head"]; me = ho.data
bm = bmesh.new(); bm.from_mesh(me); bm.verts.ensure_lookup_table()
mi = {s.material.name: i for i, s in enumerate(ho.material_slots)}
bmesh.ops.delete(bm, geom=[f for f in bm.faces if f.material_index == mi["Moustache"]], context="FACES")
def capa(cond, material):
    """Pasa a `material` las caras de piel que cumplen cond (centro en mundo). No se duplica malla: copiar caras
    deformables dejó vértices sueltos al animar."""
    for f in bm.faces:
        if f.material_index == mi["Skin"] and cond(ho.matrix_world @ f.calc_center_median()): f.material_index = material
bm.normal_update(); bm.to_mesh(me); bm.free()
ci, bi = slot(ho, COFIA), slot(ho, BARBIJO)
bm = bmesh.new(); bm.from_mesh(me); bm.verts.ensure_lookup_table(); bm.normal_update()
mi = {s.material.name: i for i, s in enumerate(ho.material_slots)}
capa(lambda c: c.z > 1.72 or (c.z > 1.635 and c.y > -0.035 and abs(c.x) < 0.094), ci)  # sin tapar las orejas
capa(lambda c: 1.585 < c.z < 1.668 and c.y < -0.045, bi)
bm.normal_update(); bm.to_mesh(me); bm.free()

# ---------- clips del rig: se quitan los de combate y se renombran sin prefijo ----------
KEEP = {"Idle", "Walk", "Run", "Interact", "Wave"}
for a in list(bpy.data.actions):
    n = a.name.split("|")[-1]
    if n in KEEP: a.name = n; a.use_fake_user = True
    else: bpy.data.actions.remove(a)

A.animation_data_create(); bpy.context.view_layer.objects.active = A
# ---------- clips nuevos: poses por dirección de hueso (FK) ----------
FK = ["Body", "Hips", "Abdomen", "Torso", "Chest", "Neck", "Head", "Shoulder.L", "UpperArm.L", "LowerArm.L", "Wrist.L",
      "Shoulder.R", "UpperArm.R", "LowerArm.R", "Wrist.R", "UpperLeg.L", "LowerLeg.L", "UpperLeg.R", "LowerLeg.R", "Foot.L", "Foot.R"]
V = lambda *a: Vector(a).normalized()
UP, FWD = Vector((0, 0, 1)), Vector((0, -1, 0))   # el frente del modelo mira a -Y de Blender
def upd(): bpy.context.view_layer.update()
def wdir(pb): return (MW.to_3x3() @ (pb.tail - pb.head)).normalized()
def aim(name, d, twist=0.0):
    pb = A.pose.bones[name]; upd()
    q = wdir(pb).rotation_difference(Vector(d).normalized())
    if twist: q = Quaternion(Vector(d).normalized(), twist) @ q
    pb.matrix = Matrix.Translation(pb.matrix.translation) @ q.to_matrix().to_4x4() @ pb.matrix.to_3x3().to_4x4()
def shift(name, d):  # desplaza el hueso d metros (mundo)
    pb = A.pose.bones[name]; upd()
    pb.matrix = Matrix.Translation(MW.inverted().to_3x3() @ Vector(d)) @ pb.matrix
def pie_al_tobillo(s):
    """El pie del rig es un objetivo de IK (hijo de Root) que el glTF no ata a la pierna: se lo lleva al tobillo, a 0,51 m
    de la rodilla en la dirección de la pierna baja, para que la bota (pesos en LowerLeg y Foot) no se estire."""
    upd()
    ll, pf = A.pose.bones["LowerLeg." + s], A.pose.bones["Foot." + s]
    ank = MW @ ll.head + wdir(ll) * 0.51
    rest = MW @ A.data.bones["Foot." + s].head_local
    pf.matrix = Matrix.Translation(MW.inverted() @ Vector((ank.x, ank.y, max(ank.z, rest.z)))) @ pf.matrix.to_3x3().to_4x4()
def usar(a):
    A.animation_data.action = a
    if hasattr(A.animation_data, "action_slot") and a.slots: A.animation_data.action_slot = a.slots[0]
def pose(f, dz=0.0, dy=0.0, lean=0.0, head=(0.0, 0.0), roll=0.0, arms=None, legs=None, spin=0.0, yaw=0.0):
    """Una pose en el cuadro f. arms/legs: {'L'|'R': (dir_alto, dir_bajo)} en mundo (x=lado). lean: inclina el torso hacia adelante (rad).
    head=(giro, cabeceo); spin: giro del torso sobre su eje; yaw: giro de cadera; roll: inclinación lateral del torso."""
    for pb in A.pose.bones: pb.location = (0, 0, 0); pb.rotation_quaternion = (1, 0, 0, 0)
    upd()
    shift("Body", (0, dy, dz))
    lean_d = lambda a, r=0.0: V(math.sin(r), -math.sin(a), math.cos(a))
    for n, k in (("Hips", 0.2), ("Abdomen", 0.3), ("Torso", 0.5), ("Chest", 0.7), ("Neck", 0.4)): aim(n, lean_d(lean * k, roll * k), (yaw if n == "Hips" else spin * 0.3))
    aim("Head", lean_d(head[1], 0), head[0])
    for s, sd in (("L", 1), ("R", -1)):
        u, l = (arms or {}).get(s, (V(sd * 0.12, 0, -1), V(sd * 0.1, -0.25, -1)))
        aim("Shoulder." + s, V(sd, 0, 0.05 + 0.5 * max(0.0, u.z)))  # brazo arriba: sube la clavícula, si no el hombro se hunde en el cuello
        aim("UpperArm." + s, u); aim("LowerArm." + s, l); aim("Wrist." + s, l)
        u, l = (legs or {}).get(s, (V(0, 0, -1), V(0, 0, -1)))
        aim("UpperLeg." + s, u); aim("LowerLeg." + s, l)
        pie_al_tobillo(s)
    upd()
    for n in FK:
        pb = A.pose.bones[n]
        pb.keyframe_insert("rotation_quaternion", frame=f); pb.keyframe_insert("location", frame=f)

def clip(name, build, n):
    a = bpy.data.actions.new(name); a.use_fake_user = True; A.animation_data.action = a
    build(); a.frame_range = (1, n)
    for fc in (a.layers[0].strips[0].channelbags[0].fcurves if hasattr(a, "layers") and a.layers else a.fcurves):
        for k in fc.keyframe_points: k.interpolation = "BEZIER"

SIDE = lambda s: 1 if s == "L" else -1
down = lambda s, o=0.12, f=0.0: V(SIDE(s) * o, -f, -1)
def arms_both(fn): return {s: fn(s) for s in "LR"}

def jump():  # en el aire: sube con brazos arriba, recoge las piernas y extiende para caer
    up = lambda s: (V(SIDE(s) * 0.35, -0.6, 0.7), V(SIDE(s) * 0.3, -0.7, 0.65))
    pose(1, dz=-0.12, lean=0.25, arms=arms_both(lambda s: (V(SIDE(s) * 0.2, 0.5, -0.8), V(SIDE(s) * 0.2, 0.7, -0.7))), legs=arms_both(lambda s: (V(0, -0.45, -0.9), V(0, 0.5, -0.85))))
    pose(6, dz=0.0, lean=0.0, arms=arms_both(up), legs=arms_both(lambda s: (V(0, -0.2, -1), V(0, 0.1, -1))))
    pose(14, dz=0.05, lean=0.1, arms=arms_both(up), legs=arms_both(lambda s: (V(SIDE(s) * 0.05, -0.75, -0.65), V(0, 0.55, -0.85))))
    pose(24, dz=0.0, arms=arms_both(lambda s: (V(SIDE(s) * 0.7, -0.2, -0.7), V(SIDE(s) * 0.7, -0.3, -0.65))), legs=arms_both(lambda s: (V(SIDE(s) * 0.05, -0.3, -1), V(0, 0.05, -1))))

def sit():  # manejando: muslos horizontales, rodillas a 90 grados, manos adelante al volante
    pose(1, lean=0.06, arms=arms_both(lambda s: (V(SIDE(s) * 0.3, -0.75, -0.55), V(SIDE(s) * 0.15, -1, 0.05))),
         legs=arms_both(lambda s: (V(SIDE(s) * 0.12, -1, 0), V(-SIDE(s) * 0.02, -0.06, -1))))
    pose(24, lean=0.07, arms=arms_both(lambda s: (V(SIDE(s) * 0.3, -0.75, -0.55), V(SIDE(s) * 0.15, -1, 0.05))),
         legs=arms_both(lambda s: (V(SIDE(s) * 0.12, -1, 0), V(-SIDE(s) * 0.02, -0.06, -1))))

def yes():
    for i, (f, p) in enumerate(((1, 0), (7, 0.38), (13, -0.08), (19, 0.38), (25, -0.08), (31, 0.38), (40, 0))): pose(f, head=(0, p), lean=0.03)
def no():
    for f, y in ((1, 0), (7, 0.7), (13, -0.7), (19, 0.7), (25, -0.7), (31, 0.7), (40, 0)): pose(f, head=(y, 0), spin=y * 0.2)

def dance():  # rebote con brazos alternados; el cuadro 49 repite el 1 para que cierre el ciclo
    hi = lambda s: (V(SIDE(s) * 0.5, -0.3, 0.8), V(SIDE(s) * 0.35, -0.5, 0.75))
    lo = lambda s: (V(SIDE(s) * 0.55, -0.1, -0.8), V(SIDE(s) * 0.5, -0.5, -0.7))
    beats = [(1, 0, "L"), (13, -0.06, "R"), (25, 0, "R"), (37, -0.06, "L"), (49, 0, "L")]
    for f, dz, hand in beats:
        o = "R" if hand == "L" else "L"
        pose(f, dz=dz, lean=0.08, roll=0.12 * SIDE(hand), spin=0.3 * SIDE(hand), yaw=0.25 * SIDE(o), head=(0.25 * SIDE(hand), 0.05),
             arms={hand: hi(hand), o: lo(o)},
             legs={hand: (V(SIDE(hand) * 0.25, -0.1, -1), V(SIDE(hand) * 0.2, 0.15, -1)), o: (V(-SIDE(o) * 0.0, -0.3, -0.95), V(0, 0.4, -0.9))})

# ---------- retarget de los clips del rig ----------
sc = bpy.context.scene
def cuadros(a): return range(int(a.frame_range[0]), int(a.frame_range[1]) + 1)
import re
for n in ("Idle", "Interact", "Wave"):
    # el rig original las animó con las piernas abiertas y el pie (objetivo de IK) quieto en el piso: el glTF no trae el IK y la
    # suela de un pie se estiraba a 0,35 m y la del otro se achicaba a 0,20 (bind: 0,28). Sin esos canales quedan las piernas rectas
    # del rig (la cadera no se mueve: el Body del Wave se inclinaba y también corría los tobillos), que llegan justo al pie.
    cb = bpy.data.actions[n].layers[0].strips[0].channelbags[0]
    for fc in [fc for fc in cb.fcurves if re.search(r'"(Body|(Upper|Lower)Leg\.[LR])"', fc.data_path)]: cb.fcurves.remove(fc)
def cerrar_loop(n, m):
    """Mezcla los últimos m cuadros hacia el primero (smoothstep) para que el ciclo cierre sin salto."""
    a = bpy.data.actions[n]; usar(a)
    bones = sorted({fc.data_path.split('"')[1] for fc in a.layers[0].strips[0].channelbags[0].fcurves if fc.data_path.startswith("pose.bones")})
    f0, f1 = cuadros(a)[0], cuadros(a)[-1]
    sc.frame_set(f0)
    q0 = {b: A.pose.bones[b].rotation_quaternion.copy() for b in bones}; l0 = {b: A.pose.bones[b].location.copy() for b in bones}
    for f in range(f1 - m, f1 + 1):
        sc.frame_set(f)
        t = (f - (f1 - m)) / m; t = t * t * (3 - 2 * t)
        for b in bones:
            pb = A.pose.bones[b]
            pb.rotation_quaternion = pb.rotation_quaternion.slerp(q0[b], t); pb.location = pb.location.lerp(l0[b], t)
            pb.keyframe_insert("rotation_quaternion", frame=f)
            if any(fc.data_path.endswith(f'"{b}"].location') for fc in a.layers[0].strips[0].channelbags[0].fcurves): pb.keyframe_insert("location", frame=f)
cerrar_loop("Run", 5)

for n, fn, fr in (("Jump", jump, 24), ("Sit", sit, 24), ("Yes", yes, 40), ("No", no, 40), ("Dance", dance, 49)): clip(n, fn, fr)
A.animation_data.action = bpy.data.actions["Idle"]
for pb in A.pose.bones: pb.location = (0, 0, 0); pb.rotation_quaternion = (1, 0, 0, 0)

# ---------- exportar ----------
for o in bpy.data.objects: o.select_set(False)
for o in [A, *M.values()]: o.select_set(True)
bpy.ops.export_scene.gltf(filepath=dst, use_selection=True, export_format="GLB", export_yup=True, export_animation_mode="ACTIONS",
                          export_force_sampling=True, export_optimize_animation_size=True)
if blend_out: bpy.ops.wm.save_as_mainfile(filepath=blend_out)
