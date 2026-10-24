"""F6 del PLAN_MODELO_3D.md: exporta la planta completa a GLB para FlexSim y para la web.

    exec(open(r"<repo>/blender/exportar_glb.py", encoding="utf-8").read())
    exportar()            # -> assets_v2/PATY_Planta_v10.glb (FlexSim) y dashboard/web/public/models/planta_v10.glb (web)

- Solo lo visible (techos, kit y retirados quedan afuera).
- Sin texturas: los materiales con imagen (matafuegos y árbol de Poly Haven) llevan el color promedio de su textura.
- Las copias enlazadas salen como nodos que comparten malla (el archivo pesa lo que la geometría única).
- FlexSim dibuja baseColorFactor tal cual, sin corrección gamma (ver assets_v2/make_planta_v6.py): en la versión de
  FlexSim los colores se pasan a sRGB. La web (three.js) usa los valores lineales del estándar glTF.
"""
import json
import os
import struct

import bpy

REPO = os.path.dirname(os.path.dirname(os.path.abspath(bpy.data.filepath)))
SALIDA_FLEXSIM = os.path.join(REPO, "assets_v2", "PATY_Planta_v10.glb")
SALIDA_WEB = os.path.join(REPO, "dashboard", "web", "public", "models", "planta_v10.glb")


def _lin_a_srgb(c):
    return 12.92 * c if c <= 0.0031308 else 1.055 * (c ** (1 / 2.4)) - 0.055


def _color_material(m):
    """Color base lineal (r, g, b, a): del nodo Principled, o el promedio de su textura si tiene imagen."""
    if m.use_nodes:
        b = next((n for n in m.node_tree.nodes if n.type == "BSDF_PRINCIPLED"), None)
        if b is not None:
            inp = b.inputs["Base Color"]
            if inp.is_linked:
                img = next((n.image for n in m.node_tree.nodes if n.type == "TEX_IMAGE" and n.image), None)
                if img is not None and img.size[0] > 0:
                    px = img.pixels[:]
                    paso = max(4, (len(px) // 4 // 4000) * 4)
                    r = g = bl = n = 0.0
                    for i in range(0, len(px) - 3, paso):
                        r += px[i]; g += px[i + 1]; bl += px[i + 2]; n += 1
                    if n:
                        # pixels de una imagen sRGB vienen en lineal dentro de Blender si es float; si no, en sRGB
                        cr, cg, cb = r / n, g / n, bl / n
                        if img.colorspace_settings.name == "sRGB" and not img.is_float:
                            to_lin = lambda c: c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
                            cr, cg, cb = to_lin(cr), to_lin(cg), to_lin(cb)
                        return (cr, cg, cb, 1.0)
            v = inp.default_value
            alpha = b.inputs["Alpha"].default_value if "Alpha" in b.inputs else 1.0
            return (v[0], v[1], v[2], alpha)
    d = m.diffuse_color
    return (d[0], d[1], d[2], d[3])


def _leer_glb(path):
    b = open(path, "rb").read()
    L = struct.unpack("<I", b[12:16])[0]
    j = json.loads(b[20:20 + L])
    rest = b[20 + L:]
    return j, rest


def _escribir_glb(path, j, rest):
    js = json.dumps(j, separators=(",", ":")).encode("utf-8")
    js += b" " * ((4 - len(js) % 4) % 4)
    total = 12 + 8 + len(js) + len(rest)
    with open(path, "wb") as f:
        f.write(struct.pack("<III", 0x46546C67, 2, total))
        f.write(struct.pack("<II", len(js), 0x4E4F534A))
        f.write(js)
        f.write(rest)


def _post(path_in, path_out, colores, srgb):
    j, rest = _leer_glb(path_in)
    for m in j.get("materials", []):
        c = colores.get(m.get("name"))
        if c is None:
            continue
        rgb = [_lin_a_srgb(x) for x in c[:3]] if srgb else list(c[:3])
        pbr = m.setdefault("pbrMetallicRoughness", {})
        pbr["baseColorFactor"] = [round(x, 4) for x in rgb] + [round(c[3], 4)]
        pbr.pop("baseColorTexture", None)
        pbr["metallicFactor"] = 0.0
        if c[3] < 0.999:
            m["alphaMode"] = "BLEND"
    j.pop("images", None)
    j.pop("textures", None)
    j.pop("samplers", None)
    _escribir_glb(path_out, j, rest)
    return j


# Piezas que FlexSim anima como ítems (cajas y bandejas de hamburguesas): fijas en el GLB se ven quietas
# encima de los ítems que se mueven. No se exportan (siguen en Blender). El camión de la cinemática solo va a la web.
NO_EXPORTAR = ("Caja_PATY_", "Hamburguesas_")
SOLO_WEB = ("CamionCine",)


def _ocultar(prefijos):
    ocultos = []
    for o in bpy.context.view_layer.objects:
        if o.name.startswith(prefijos) and o.visible_get():
            o.hide_set(True)
            ocultos.append(o)
    return ocultos


def exportar():
    bpy.context.view_layer.update()
    ocultos = _ocultar(NO_EXPORTAR)
    for o in bpy.context.selected_objects:
        o.select_set(False)
    tmp = os.path.join(REPO, "assets_v2", "_tmp_export.glb")
    kw = dict(filepath=tmp, export_format="GLB", use_visible=True, export_yup=True, export_apply=False,
              export_texcoords=False, export_normals=True, export_cameras=False, export_lights=False,
              export_animations=False, export_extras=False, export_materials="EXPORT")
    try:
        bpy.ops.export_scene.gltf(export_image_format="NONE", **kw)
    except TypeError:
        bpy.ops.export_scene.gltf(**kw)
    finally:
        for o in ocultos:
            o.hide_set(False)
    colores = {m.name: _color_material(m) for m in bpy.data.materials}
    j = _post(tmp, SALIDA_FLEXSIM, colores, srgb=True)
    os.makedirs(os.path.dirname(SALIDA_WEB), exist_ok=True)
    _post(tmp, SALIDA_WEB, colores, srgb=False)
    os.remove(tmp)
    caras = 0
    for me in j["meshes"]:
        for p in me["primitives"]:
            if "indices" in p:
                caras += j["accessors"][p["indices"]]["count"] // 3
    print(f"GLB: {len(j['nodes'])} nodos, {len(j['meshes'])} mallas, {len(j.get('materials', []))} materiales, "
          f"{caras} triángulos únicos; FlexSim {os.path.getsize(SALIDA_FLEXSIM) / 1e6:.1f} MB, "
          f"web {os.path.getsize(SALIDA_WEB) / 1e6:.1f} MB")
    return j


SALIDA_FLEXSIM_UNIDO = os.path.join(REPO, "assets_v2", "PATY_Planta_v10u.glb")


def exportar_flexsim_unido(salida=SALIDA_FLEXSIM_UNIDO, excluir=NO_EXPORTAR + SOLO_WEB):
    """Versión para FlexSim en UNA malla con un grupo por material (como el v9): FlexSim dibuja lento un GLB
    con miles de nodos (1 FPS con 17.500); unida son ~100 llamadas de dibujo. `excluir` = prefijos de
    nombre que no van (para una versión más liviana si hiciera falta)."""
    import bmesh
    from mathutils import Matrix
    bpy.context.view_layer.update()
    dg = bpy.context.evaluated_depsgraph_get()
    bm = bmesh.new()
    mats, n = [], 0
    for o in bpy.context.scene.objects:
        if o.type not in ("MESH", "FONT", "CURVE") or not o.visible_get() or o.name.startswith(tuple(excluir)):
            continue
        if o.parent is not None and o.parent.name.startswith(tuple(excluir)):
            continue
        me = bpy.data.meshes.new_from_object(o.evaluated_get(dg)) if o.type != "MESH" else o.data.copy()
        me.transform(o.matrix_world)
        if o.matrix_world.determinant() < 0:
            me.flip_normals()
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
        n += 1
    me = bpy.data.meshes.new("PATY_Planta_v10u")
    bm.to_mesh(me)
    bm.free()
    for nm in mats:
        me.materials.append(bpy.data.materials[nm])
    tmp_o = bpy.data.objects.new("PATY_Planta_v10u", me)
    bpy.context.scene.collection.objects.link(tmp_o)
    for o in bpy.context.selected_objects:
        o.select_set(False)
    tmp_o.select_set(True)
    tmp = os.path.join(REPO, "assets_v2", "_tmp_unido.glb")
    kw = dict(filepath=tmp, export_format="GLB", use_selection=True, export_yup=True, export_apply=False,
              export_texcoords=False, export_normals=True, export_cameras=False, export_lights=False,
              export_animations=False, export_extras=False, export_materials="EXPORT")
    try:
        bpy.ops.export_scene.gltf(export_image_format="NONE", **kw)
    except TypeError:
        bpy.ops.export_scene.gltf(**kw)
    caras = len(me.polygons)
    bpy.data.objects.remove(tmp_o)
    bpy.data.meshes.remove(me)
    colores = {m.name: _color_material(m) for m in bpy.data.materials}
    j = _post(tmp, salida, colores, srgb=True)
    os.remove(tmp)
    print(f"GLB unido: {n} objetos -> 1 malla, {len(mats)} materiales, {caras} caras; "
          f"{os.path.getsize(salida) / 1e6:.1f} MB")
    return j
