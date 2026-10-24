"""Protege las posiciones que usa FlexSim (ver PLAN_MODELO_3D.md, sección 1).

Correr dentro de Blender:
    exec(open(r"<repo>/blender/check_anclas.py", encoding="utf-8").read())
    crear_anclas()      # colección FLEXSIM_ANCLAS con un empty por objeto del manifiesto
    foto()              # guarda la posición de todo lo protegido en anclas_foto.json (una sola vez)
    controlar()         # compara contra la foto; imprime lo que se movió y devuelve la cantidad

Lo protegido: colecciones de L7, L8, almacenes y muelles (las máquinas sobre las que FlexSim
pone sus objetos lógicos) más las anclas del manifiesto.
"""
import json
import os

import bpy
from mathutils import Vector

REPO = os.path.dirname(os.path.dirname(os.path.abspath(bpy.data.filepath)))
MANIFIESTO = os.path.join(REPO, "manifests_v2", "logicos_v2.json")
FOTO = os.path.join(REPO, "blender", "anclas_foto.json")
PROTEGIDAS = ("02_LINEA7", "03_LINEA8", "04_ALMACENES", "05_MUELLES")
TOL_POS = 0.01   # m
TOL_TAM = 0.02   # relativo


def crear_anclas():
    d = json.load(open(MANIFIESTO, encoding="utf-8"))
    col = bpy.data.collections.get("FLEXSIM_ANCLAS")
    if col is None:
        col = bpy.data.collections.new("FLEXSIM_ANCLAS")
        bpy.context.scene.collection.children.link(col)
    for o in list(col.objects):
        bpy.data.objects.remove(o)
    n = 0
    for grupo in ("fijos", "moviles"):
        for it in d[grupo]:
            e = bpy.data.objects.new("ANCLA_" + it["name"], None)
            e.empty_display_type = "CUBE" if grupo == "fijos" else "SPHERE"
            e.location = (it["cx"], it["cy"], it.get("z", 0.0))
            if "sx" in it:
                e.scale = (it["sx"] / 2, it["sy"] / 2, it["sz"] / 2)
            col.objects.link(e)
            n += 1
    for it in d["cintas"]:
        e = bpy.data.objects.new("ANCLA_" + it["name"], None)
        e.empty_display_type = "ARROWS"
        e.location = ((it["x1"] + it["x2"]) / 2, (it["y1"] + it["y2"]) / 2, it["z"])
        e["x1y1x2y2"] = [it["x1"], it["y1"], it["x2"], it["y2"]]
        col.objects.link(e)
        n += 1
    col.hide_render = True
    col.hide_select = True
    print("anclas creadas:", n)
    return n


def _estado():
    bpy.context.view_layer.update()  # sin esto, los objetos recién creados tienen matrix_world en el origen
    out = {}
    for cn in PROTEGIDAS + ("FLEXSIM_ANCLAS",):
        c = bpy.data.collections.get(cn)
        if c is None:
            continue
        for o in c.all_objects:
            m = o.matrix_world
            dims = list(o.dimensions) if o.type == "MESH" else [0, 0, 0]
            out[o.name] = {"pos": list(m.translation), "dims": dims, "col": cn}
    return out


def foto(forzar=False):
    if os.path.exists(FOTO) and not forzar:
        print("ya existe", FOTO, "(usar foto(forzar=True) para reemplazarla)")
        return
    est = _estado()
    json.dump(est, open(FOTO, "w", encoding="utf-8"), indent=0)
    print("foto guardada:", len(est), "objetos")


def controlar():
    ref = json.load(open(FOTO, encoding="utf-8"))
    act = _estado()
    malos = []
    for name, r in ref.items():
        a = act.get(name)
        if a is None:
            malos.append((name, "falta"))
            continue
        dp = (Vector(a["pos"]) - Vector(r["pos"])).length
        if dp > TOL_POS:
            malos.append((name, f"se movió {dp:.3f} m"))
            continue
        for x, y in zip(a["dims"], r["dims"]):
            if y > 1e-6 and abs(x - y) / y > TOL_TAM:
                malos.append((name, f"cambió de tamaño {r['dims']} -> {a['dims']}"))
                break
    for m in malos[:50]:
        print("  ", *m)
    print(f"control de anclas: {len(ref)} objetos, {len(malos)} con problemas")
    return len(malos)
