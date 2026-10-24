"""Kit de piezas repetidas para las fases F2 en adelante (PLAN_MODELO_3D.md).

Cada pieza es UNA malla en la colección oculta ZZ_KIT; en la planta se usan copias enlazadas
(mismo mesh data), así 2.500 medias pesan en memoria lo mismo que una.

    exec(open(r"<repo>/blender/kit.py", encoding="utf-8").read()); armar_kit()
    poner("KIT_Media", col, (x, y, z), rot_z)   # devuelve el objeto

Piezas: KIT_Media (media res colgada del garrón), KIT_Animal_Cuero / KIT_Animal_Limpio (animal entero
colgado, con y sin cuero), KIT_Novillo_{Negro,Colorado,Hereford} (hacienda parada), KIT_Gancho
(roldana + gancho), KIT_Operario (operario armado con las piezas del operario de la picadora L7),
KIT_Matafuegos (Poly Haven, CC0, reducido) y KIT_Cartel_Matafuegos.
"""
import math

import bpy
import bmesh

KIT = "ZZ_KIT"


# --------------------------------------------------------------------------- materiales
def material(name, rgb, rough=0.6, metal=0.0):
    m = bpy.data.materials.get(name)
    if m is None:
        m = bpy.data.materials.new(name)
        m.use_nodes = True
    b = next(n for n in m.node_tree.nodes if n.type == "BSDF_PRINCIPLED")
    b.inputs["Base Color"].default_value = (*rgb, 1.0)
    b.inputs["Roughness"].default_value = rough
    b.inputs["Metallic"].default_value = metal
    m.diffuse_color = (*rgb, 1.0)
    return m


def materiales():
    material("M_Cuero_Negro", (0.05, 0.045, 0.04), 0.8)
    material("M_Cuero_Colorado", (0.36, 0.13, 0.06), 0.8)
    material("M_Cuero_Blanco", (0.85, 0.82, 0.76), 0.8)
    material("M_Hueso", (0.93, 0.9, 0.82), 0.5)
    material("M_Cuerno", (0.55, 0.5, 0.42), 0.4)
    material("M_Hocico", (0.2, 0.15, 0.15), 0.6)


# --------------------------------------------------------------------------- utilidades de malla
def _col_kit():
    c = bpy.data.collections.get(KIT)
    if c is None:
        c = bpy.data.collections.new(KIT)
        bpy.context.scene.collection.children.link(c)
    lc = bpy.context.view_layer.layer_collection.children.get(KIT)
    if lc:
        lc.exclude = True
    return c


def _nuevo(name, bm, mats):
    old = bpy.data.objects.get(name)
    if old is not None:
        me_old = old.data
        bpy.data.objects.remove(old)
        if me_old.users == 0:
            bpy.data.meshes.remove(me_old)
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    for m in mats:
        me.materials.append(bpy.data.materials[m])
    for p in me.polygons:
        p.use_smooth = True
    o = bpy.data.objects.new(name, me)
    _col_kit().objects.link(o)
    return o


def loft(bm, rings, mat_idx=0, cap=True, flat_mat=None):
    """rings: listas de vértices (x,y,z) con la misma cantidad; une anillos consecutivos."""
    vs = [[bm.verts.new(p) for p in r] for r in rings]
    n = len(rings[0])
    for a, b in zip(vs[:-1], vs[1:]):
        for i in range(n):
            f = bm.faces.new((a[i], a[(i + 1) % n], b[(i + 1) % n], b[i]))
            f.material_index = mat_idx
            if flat_mat is not None and i == n - 1:  # el lado que cierra el anillo (cara de corte)
                f.material_index = flat_mat
    if cap:
        f = bm.faces.new(list(reversed(vs[0])))
        f.material_index = mat_idx if flat_mat is None else flat_mat
        f = bm.faces.new(vs[-1])
        f.material_index = mat_idx if flat_mat is None else flat_mat
    return vs


def caja_bm(bm, x0, x1, y0, y1, z0, z1, mat_idx=0):
    r = [[(x0, y0, z), (x1, y0, z), (x1, y1, z), (x0, y1, z)] for z in (z0, z1)]
    loft(bm, r, mat_idx)


def cil_bm(bm, cx, cy, z0, z1, r, seg=8, mat_idx=0, eje="z"):
    rings = []
    for z in (z0, z1):
        ring = []
        for i in range(seg):
            a = 2 * math.pi * i / seg
            u, v = r * math.cos(a), r * math.sin(a)
            ring.append({"z": (cx + u, cy + v, z), "x": (z, cx + u, cy + v), "y": (cx + u, z, cy + v)}[eje])
        rings.append(ring)
    loft(bm, rings, mat_idx)


def elipsoide_bm(bm, c, rx, ry, rz, seg=8, anillos=5, mat_idx=0):
    rings = []
    for j in range(1, anillos):
        t = math.pi * j / anillos
        rings.append([(c[0] + rx * math.sin(t) * math.cos(2 * math.pi * i / seg),
                       c[1] + ry * math.sin(t) * math.sin(2 * math.pi * i / seg),
                       c[2] + rz * math.cos(t)) for i in range(seg)])
    vs = loft(bm, rings, mat_idx, cap=False)
    top = bm.verts.new((c[0], c[1], c[2] + rz))
    bot = bm.verts.new((c[0], c[1], c[2] - rz))
    for i in range(seg):
        f = bm.faces.new((vs[0][i], vs[0][(i + 1) % seg], top)) if False else bm.faces.new((top, vs[0][(i + 1) % seg], vs[0][i]))
        f.material_index = mat_idx
        f = bm.faces.new((bot, vs[-1][i], vs[-1][(i + 1) % seg]))
        f.material_index = mat_idx


# --------------------------------------------------------------------------- piezas
# Perfil de la media colgada del garrón: (t de 0 arriba a 1 abajo, ancho x, profundidad y)
PERFIL_MEDIA = [(0.0, 0.10, 0.07), (0.07, 0.22, 0.12), (0.18, 0.52, 0.24), (0.32, 0.60, 0.27), (0.48, 0.48, 0.20),
                (0.62, 0.54, 0.22), (0.78, 0.66, 0.29), (0.9, 0.48, 0.21), (1.0, 0.24, 0.11)]
L_MEDIA = 2.45


def _anillo_media(t_w_d, z, lado=1, seg=9):
    """Medio anillo (lado exterior con grasa) + cierre recto = cara de corte."""
    _, w, d = t_w_d
    return [(w / 2 * math.cos(math.pi * i / (seg - 1)), lado * d * math.sin(math.pi * i / (seg - 1)), z)
            for i in range(seg)]


def kit_media():
    bm = bmesh.new()
    rings = [_anillo_media(p, -0.12 - p[0] * L_MEDIA) for p in PERFIL_MEDIA]
    loft(bm, rings, mat_idx=1, flat_mat=0)       # 0 = carne (cara de corte), 1 = grasa
    cil_bm(bm, 0, 0.03, -0.14, 0.0, 0.035, 6, mat_idx=2)   # garrón
    return _nuevo("KIT_Media", bm, ["M_Media_Res", "M_Grasa", "M_Hueso"])


def _animal_colgado(name, mat_cuerpo, con_cabeza):
    bm = bmesh.new()
    rings = []
    for p in PERFIL_MEDIA:
        t, w, d = p
        z = -0.12 - t * 2.6
        rings.append([(w / 2 * 1.05 * math.cos(2 * math.pi * i / 12), d * 1.05 * math.sin(2 * math.pi * i / 12), z)
                      for i in range(12)])
    loft(bm, rings, 0)
    for s in (-1, 1):  # patas traseras abiertas hacia el gancho (V)
        cil_bm(bm, s * 0.12, 0, -0.3, 0.0, 0.045, 6, 2)
    if con_cabeza:
        elipsoide_bm(bm, (0, 0.02, -2.95), 0.13, 0.17, 0.3, 8, 5, 0)
        for s in (-1, 1):  # manos colgando
            cil_bm(bm, s * 0.18, 0.05, -2.95, -2.35, 0.05, 6, 0)
    return _nuevo(name, bm, [mat_cuerpo, "M_Grasa", "M_Hueso"])


def kit_novillo(name, mat_cuerpo, cara_blanca=False):
    """Novillo parado mirando a +x, ~1,4 m a la cruz."""
    bm = bmesh.new()
    rings = []
    for x, ry, rz, zc in [(-0.75, 0.2, 0.22, 1.05), (-0.6, 0.3, 0.33, 1.02), (-0.2, 0.34, 0.36, 1.0),
                          (0.25, 0.33, 0.37, 1.02), (0.55, 0.28, 0.36, 1.06), (0.75, 0.16, 0.2, 1.12)]:
        rings.append([(x, ry * math.cos(2 * math.pi * i / 10), zc + rz * math.sin(2 * math.pi * i / 10)) for i in range(10)])
    loft(bm, rings, 0)
    for px in (-0.55, 0.45):
        for py in (-0.17, 0.17):
            cil_bm(bm, px, py, 0.0, 0.78, 0.065, 6, 0)
            cil_bm(bm, px, py, 0.0, 0.08, 0.07, 6, 3)          # pezuña
    # cuello y cabeza
    rings = []
    for x, ry, rz, zc in [(0.7, 0.17, 0.22, 1.15), (0.9, 0.13, 0.16, 1.2), (1.05, 0.12, 0.14, 1.12), (1.18, 0.09, 0.09, 1.02)]:
        rings.append([(x, ry * math.cos(2 * math.pi * i / 8), zc + rz * math.sin(2 * math.pi * i / 8)) for i in range(8)])
    loft(bm, rings, 1 if cara_blanca else 0)
    elipsoide_bm(bm, (1.22, 0, 1.0), 0.05, 0.08, 0.06, 6, 3, 3)    # hocico
    for s in (-1, 1):
        elipsoide_bm(bm, (0.92, s * 0.17, 1.27), 0.03, 0.08, 0.04, 6, 3, 0)  # orejas
    cil_bm(bm, -0.78, 0, 0.45, 1.1, 0.025, 5, 0)  # cola
    return _nuevo(name, bm, [mat_cuerpo, "M_Cuero_Blanco", "M_Cuerno", "M_Hocico"])


def kit_gancho():
    bm = bmesh.new()
    cil_bm(bm, 0, 0, 0.0, 0.05, 0.06, 8, 0, eje="x")         # roldana sobre el riel
    caja_bm(bm, -0.01, 0.01, -0.012, 0.012, -0.28, 0.0, 0)  # vástago
    caja_bm(bm, -0.06, 0.01, -0.012, 0.012, -0.30, -0.27, 0)  # curva del gancho
    caja_bm(bm, -0.06, -0.04, -0.012, 0.012, -0.30, -0.2, 0)
    return _nuevo("KIT_Gancho", bm, ["M_Inox"])


def kit_operario():
    """Une las piezas del operario de la picadora de L7 (sin moverlo) en una sola malla en el origen."""
    piezas = [o for o in bpy.data.objects if o.name.startswith("Operario_L7_Picadora_") and o.type == "MESH"]
    bm = bmesh.new()
    mats = []
    ref = next(o for o in piezas if o.name.endswith("_Piernas")).matrix_world.translation.copy()
    for o in piezas:
        me = o.data.copy()
        me.transform(o.matrix_world)
        me.transform(__import__("mathutils").Matrix.Translation((-ref.x, -ref.y, 0)))
        idx_map = []
        for m in me.materials:
            if m.name not in mats:
                mats.append(m.name)
            idx_map.append(mats.index(m.name))
        for p in me.polygons:
            p.material_index = idx_map[p.material_index] if idx_map else 0
        bm.from_mesh(me)
        bpy.data.meshes.remove(me)
    return _nuevo("KIT_Operario", bm, mats)


def kit_matafuegos():
    """Matafuegos de Poly Haven (korean_fire_extinguisher_01, CC0) reducido a ~1.000 caras."""
    src = bpy.data.objects.get("korean_fire_extinguisher_01")
    if src is None:
        print("falta importar korean_fire_extinguisher_01 de Poly Haven")
        return None
    old = bpy.data.objects.get("KIT_Matafuegos")
    if old is not None:
        bpy.data.objects.remove(old)
    me = src.data.copy()
    me.name = "KIT_Matafuegos"
    o = bpy.data.objects.new("KIT_Matafuegos", me)
    _col_kit().objects.link(o)
    bpy.context.scene.collection.objects.link(o)
    mod = o.modifiers.new("dec", "DECIMATE")
    mod.ratio = 0.05   # ~310 caras: de cerca se sigue leyendo como matafuegos
    dg = bpy.context.evaluated_depsgraph_get()
    me2 = bpy.data.meshes.new_from_object(o.evaluated_get(dg))
    o.modifiers.clear()
    o.data = me2
    bpy.data.meshes.remove(me)
    me2.name = "KIT_Matafuegos"
    bpy.context.scene.collection.objects.unlink(o)
    # el original de Poly Haven sale de la escena (queda en el kit como referencia, oculto)
    for c in list(src.users_collection):
        c.objects.unlink(src)
    _col_kit().objects.link(src)
    return o


def kit_cartel_matafuegos():
    bm = bmesh.new()
    caja_bm(bm, -0.15, 0.15, 0, 0.01, 0, 0.3, 0)
    return _nuevo("KIT_Cartel_Matafuegos", bm, ["M_Rojo_PATY"])


def armar_kit():
    materiales()
    kit_media()
    _animal_colgado("KIT_Animal_Cuero", "M_Cuero_Negro", True)
    _animal_colgado("KIT_Animal_Limpio", "M_Media_Res", False)
    kit_novillo("KIT_Novillo_Negro", "M_Cuero_Negro")
    kit_novillo("KIT_Novillo_Colorado", "M_Cuero_Colorado")
    kit_novillo("KIT_Novillo_Hereford", "M_Cuero_Colorado", cara_blanca=True)
    kit_gancho()
    kit_operario()
    kit_matafuegos()
    kit_cartel_matafuegos()
    for o in _col_kit().objects:
        if o.type == "MESH":
            print(f"{o.name:28s} {len(o.data.polygons):6d} caras  {tuple(round(v, 2) for v in o.dimensions)}")


def poner(kit_name, col, loc, rot_z=0.0, nombre=None, escala=1.0):
    src = bpy.data.objects[kit_name]
    o = bpy.data.objects.new(nombre or kit_name.replace("KIT_", ""), src.data)
    o.location = loc
    o.rotation_euler = (0, 0, rot_z)
    if escala != 1.0:
        o.scale = (escala, escala, escala)
    col.objects.link(o)
    return o


# --------------------------------------------------------------------------- piezas tomadas de la escena (F3)
def kit_desde_escena(name, prefijo, excluir=(), origen="base"):
    """Une en una malla las piezas cuyo nombre empieza con `prefijo` (sin moverlas ni borrarlas).
    El kit queda con el centro xy del conjunto en el origen y el punto más bajo en z = 0."""
    from mathutils import Matrix, Vector
    # solo piezas de las colecciones originales (o retiradas): nunca copias hechas por las fases F1–F5,
    # que pueden llamarse igual (p. ej. "Autoelevador_Cajas_0") y se mezclarían en el kit al reconstruir
    nuevas = ("F1_", "F2_", "F3_", "F4_", "F5_", KIT)
    piezas = [o for o in bpy.data.objects if o.type == "MESH" and o.name.startswith(prefijo)
              and not any(e in o.name for e in excluir)
              and not any(c.name.startswith(nuevas) for c in o.users_collection)]
    ws = [o.matrix_world @ Vector(v) for o in piezas for v in o.bound_box]
    cx = (min(w.x for w in ws) + max(w.x for w in ws)) / 2
    cy = (min(w.y for w in ws) + max(w.y for w in ws)) / 2
    z0 = min(w.z for w in ws)
    bm = bmesh.new()
    mats = []
    for o in piezas:
        me = o.data.copy()
        me.transform(Matrix.Translation((-cx, -cy, -z0)) @ o.matrix_world)
        mp = []
        for m in me.materials:
            nm = m.name if m else "M_Metal_Estructura"
            if nm not in mats:
                mats.append(nm)
            mp.append(mats.index(nm))
        for p in me.polygons:
            p.material_index = mp[p.material_index] if mp else 0
        bm.from_mesh(me)
        bpy.data.meshes.remove(me)
    o = _nuevo(name, bm, mats)
    for p in o.data.polygons:
        p.use_smooth = False
    return o


def _cuarto(name, t0, t1, lado_doble=False):
    bm = bmesh.new()
    sel = [p for p in PERFIL_MEDIA if t0 <= p[0] <= t1]
    rings = [_anillo_media(p, -0.12 - (p[0] - t0) * L_MEDIA) for p in sel]
    loft(bm, rings, mat_idx=1, flat_mat=0)
    cil_bm(bm, 0, 0.03, -0.14, 0.0, 0.035, 6, mat_idx=2)
    return _nuevo(name, bm, ["M_Media_Res", "M_Grasa", "M_Hueso"])


def kit_ciclo2():
    _cuarto("KIT_Trasero", 0.0, 0.48)
    _cuarto("KIT_Delantero", 0.48, 1.0)
    bm = bmesh.new()                                   # asado: placa de costillar
    caja_bm(bm, -0.45, 0.45, -0.25, 0.25, 0.0, 0.07, 0)
    for i in range(7):
        caja_bm(bm, -0.42 + i * 0.13, -0.39 + i * 0.13, -0.24, 0.24, 0.07, 0.085, 1)
    _nuevo("KIT_Asado", bm, ["M_Media_Res", "M_Hueso"])
    bm = bmesh.new()                                   # caja de carne (cartón, 25 kg)
    caja_bm(bm, -0.3, 0.3, -0.2, 0.2, 0.0, 0.2, 0)
    caja_bm(bm, -0.3, 0.3, -0.05, 0.05, 0.2, 0.202, 1)
    _nuevo("KIT_Caja_Carne", bm, ["M_Carton", "M_Blanco_Senda"])
    bm = bmesh.new()                                   # pallet con 40 cajas de carne
    caja_bm(bm, -0.6, 0.6, -0.5, 0.5, 0.0, 0.15, 1)
    for k in range(5):
        caja_bm(bm, -0.6, 0.6, -0.5, 0.5, 0.15 + k * 0.2, 0.34 + k * 0.2, 0)
        caja_bm(bm, -0.61, 0.61, -0.005, 0.005, 0.15 + k * 0.2, 0.34 + k * 0.2, 2)
    caja_bm(bm, -0.605, 0.605, -0.505, 0.505, 0.15, 1.12, 3)
    _nuevo("KIT_Pallet_Carne", bm, ["M_Carton", "M_Madera_Pallet", "M_Negro_Cinta", "M_Film"])
    bm = bmesh.new()                                   # carro rojo de huesos / recortes
    caja_bm(bm, -0.45, 0.45, -0.35, 0.35, 0.25, 0.95, 0)
    for sx in (-0.35, 0.35):
        for sy in (-0.25, 0.25):
            cil_bm(bm, sx, sy, 0.0, 0.25, 0.06, 6, 1)
    caja_bm(bm, -0.42, 0.42, -0.32, 0.32, 0.9, 0.93, 2)
    _nuevo("KIT_Carro_Rojo", bm, ["M_Bateas_Rojas", "M_Goma", "M_Media_Res"])
    bm = bmesh.new()                                   # sierra sinfín de asado
    caja_bm(bm, -0.5, 0.5, -0.4, 0.4, 0.0, 0.9, 0)
    caja_bm(bm, -0.6, 0.6, -0.5, 0.5, 0.9, 0.95, 1)
    caja_bm(bm, -0.35, 0.35, 0.15, 0.4, 0.95, 2.1, 0)
    caja_bm(bm, -0.01, 0.01, -0.1, 0.15, 0.95, 1.4, 1)
    _nuevo("KIT_Sierra_Sinfin", bm, ["M_Inox", "M_Inox_Cepillado"])
    # puesto de desposte: mesa inox + esterilizador + operario + corte sobre la mesa (una malla)
    from mathutils import Matrix
    bm = bmesh.new()
    caja_bm(bm, -0.9, 0.9, 0.0, 0.8, 0.85, 0.9, 0)
    for sx in (-0.85, 0.85):
        caja_bm(bm, sx - 0.03, sx + 0.03, 0.05, 0.75, 0.0, 0.85, 0)
    caja_bm(bm, -0.3, 0.2, 0.15, 0.55, 0.9, 1.02, 1)          # pieza en trabajo
    caja_bm(bm, -0.85, -0.6, 0.6, 0.78, 0.9, 1.25, 0)         # esterilizador de cuchillos
    caja_bm(bm, 0.5, 0.75, 0.55, 0.78, 0.9, 0.95, 2)          # tabla
    ops = bpy.data.objects["KIT_Operario"].data.copy()
    ops.transform(Matrix.Translation((0, -0.35, 0)))
    nm = ["M_Inox", "M_Media_Res", "M_Blanco_Senda"]
    mp = []
    for m in ops.materials:
        if m.name not in nm:
            nm.append(m.name)
        mp.append(nm.index(m.name))
    for p in ops.polygons:
        p.material_index = mp[p.material_index]
    bm.from_mesh(ops)
    bpy.data.meshes.remove(ops)
    _nuevo("KIT_Puesto_Desposte", bm, nm)
    # puesto de encajado: balanza + terminal + impresora + operario + cajas vacías
    bm = bmesh.new()
    caja_bm(bm, -0.4, 0.4, 0.0, 0.6, 0.0, 0.8, 0)             # balanza de piso con plato
    caja_bm(bm, -0.35, 0.35, 0.05, 0.55, 0.8, 0.83, 0)
    caja_bm(bm, 0.5, 0.56, 0.4, 0.46, 0.0, 1.5, 0)            # columna del terminal
    caja_bm(bm, 0.4, 0.66, 0.35, 0.5, 1.5, 1.72, 1)           # terminal (pantalla)
    caja_bm(bm, 0.65, 0.95, 0.2, 0.5, 0.9, 1.15, 2)           # impresora de etiquetas
    for k in range(4):
        caja_bm(bm, -1.2, -0.6, 0.1, 0.5, k * 0.21, k * 0.21 + 0.2, 3)  # cajas vacías
    caja_bm(bm, -0.3, 0.3, 0.1, 0.5, 0.83, 1.03, 3)            # caja en la balanza
    ops = bpy.data.objects["KIT_Operario"].data.copy()
    ops.transform(Matrix.Translation((0, -0.4, 0)))
    nm = ["M_Inox", "M_Pantalla", "M_Blanco_Senda", "M_Carton"]
    mp = []
    for m in ops.materials:
        if m.name not in nm:
            nm.append(m.name)
        mp.append(nm.index(m.name))
    for p in ops.polygons:
        p.material_index = mp[p.material_index]
    bm.from_mesh(ops)
    bpy.data.meshes.remove(ops)
    _nuevo("KIT_Puesto_Encajado", bm, nm)
    # de la escena (L7/L8 y entorno; los originales no se tocan)
    kit_desde_escena("KIT_Camion", "Camion_Carga_PT_1_")
    kit_desde_escena("KIT_Autoelevador", "Autoelevador_", excluir=("Camara_MP",))
    kit_desde_escena("KIT_Rack", "Rack_Congelado_PT_01_")
    kit_desde_escena("KIT_Muelle", "Muelle_Expedicion_1_")
    kit_desde_escena("KIT_Pallet_PT", "Pallet_Expedicion_PT_1_")
    for n in ("KIT_Trasero", "KIT_Delantero", "KIT_Asado", "KIT_Caja_Carne", "KIT_Pallet_Carne", "KIT_Carro_Rojo",
              "KIT_Sierra_Sinfin", "KIT_Puesto_Desposte", "KIT_Puesto_Encajado", "KIT_Camion", "KIT_Autoelevador",
              "KIT_Rack", "KIT_Muelle", "KIT_Pallet_PT"):
        o = bpy.data.objects[n]
        print(f"{n:22s} {len(o.data.polygons):6d} caras  {tuple(round(v, 2) for v in o.dimensions)}")
