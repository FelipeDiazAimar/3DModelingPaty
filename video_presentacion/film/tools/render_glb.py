"""Renderiza un GLB real del proyecto con Blender (Workbench) en órbita, visto desde arriba.

blender -b --python tools/render_glb.py -- <in.glb> <out_dir> <frames> <res_x> <res_y> <elev_grados> <dist_factor> [z_objetivo_m]
"""
import math
import os
import sys

import bpy
from mathutils import Vector

argv = sys.argv[sys.argv.index("--") + 1:]
src, out, frames, rx, ry = argv[0], argv[1], int(argv[2]), int(argv[3]), int(argv[4])
elev, dist_f = float(argv[5]), float(argv[6])
os.makedirs(out, exist_ok=True)

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=src)
sc = bpy.context.scene

meshes = [o for o in sc.objects if o.type == "MESH"]
pts = [o.matrix_world @ Vector(c) for o in meshes for c in o.bound_box]
lo = Vector((min(p.x for p in pts), min(p.y for p in pts), min(p.z for p in pts)))
hi = Vector((max(p.x for p in pts), max(p.y for p in pts), max(p.z for p in pts)))
c = (lo + hi) / 2
size = max(hi.x - lo.x, hi.y - lo.y, hi.z - lo.z)
print("BBOX", lo, hi, "objetos", len(meshes))
if len(argv) > 7:  # encuadre fijo en metros: tamaño, centro x, centro y
    size, c = float(argv[7]), Vector((float(argv[8]), float(argv[9]), float(os.environ.get("CZ", "3.0"))))
ocultos = 0
for o in meshes:
    if any(k in o.name.lower() for k in ("techo", "roof", "cubierta", "cielorraso")):
        o.hide_render = True
        ocultos += 1
print("OCULTOS", ocultos, "EJEMPLOS", sorted({o.name.split(".")[0][:18] for o in meshes})[:60])

cam = bpy.data.objects.new("cam", bpy.data.cameras.new("cam"))
sc.collection.objects.link(cam)
sc.camera = cam
cam.data.lens = 50
target = bpy.data.objects.new("t", None)
sc.collection.objects.link(target)
target.location = c
tr = cam.constraints.new("TRACK_TO")
tr.target = target
tr.track_axis = "TRACK_NEGATIVE_Z"
tr.up_axis = "UP_Y"

r = sc.render
r.engine = "BLENDER_WORKBENCH"
r.resolution_x, r.resolution_y = rx, ry
r.film_transparent = False
sc.display.shading.background_type = "VIEWPORT"
sc.display.shading.background_color = (0.0, 0.0, 0.0)
sc.view_settings.view_transform = "Standard"
anim = os.environ.get("ANIM")
if anim:
    acc = next((a for a in bpy.data.actions if anim.lower() in a.name.lower()), None)
    arm = next((o for o in sc.objects if o.type == "ARMATURE"), None)
    print("ANIM", acc.name if acc else None, acc.frame_range if acc else None)
    if acc and arm:
        arm.animation_data_create()
        arm.animation_data.action = acc
        if arm.animation_data.action_slot is None and acc.slots:
            arm.animation_data.action_slot = acc.slots[0]
r.image_settings.file_format = "PNG"
r.image_settings.color_mode = "RGBA"
s = sc.display.shading
s.light = "STUDIO"
s.color_type = "MATERIAL"
s.show_cavity = True
s.cavity_type = "WORLD"
s.show_object_outline = True
s.object_outline_color = (0, 0, 0)
s.show_shadows = True
sc.display.render_aa = "16"

dist = size * dist_f
e = math.radians(elev)
for i in range(frames):
    a = math.radians(-60 + (i / max(1, frames)) * 24)
    cam.location = c + Vector((dist * math.cos(e) * math.cos(a), dist * math.cos(e) * math.sin(a), dist * math.sin(e)))
    if anim:
        sc.frame_set(1 + int(i * 0.44))
    r.filepath = os.path.join(out, "f%04d.png" % i)
    bpy.ops.render.render(write_still=True)
    print("OK", i, flush=True)
