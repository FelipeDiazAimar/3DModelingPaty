"""Genera caja_pt.glb: caja PT de Blender (Caja_PATY_*: 0.50x0.40x0.32 m, kraft blanco + franja roja PATY)
normalizada a un cubo unitario [0,1]^3 para usar como forma de flowitem en FlexSim
(FlexSim la escala con el tamaño del ítem)."""
import json, struct

BODY = (0.50, 0.40, 0.32)
BAND = (0.51, 0.41, 0.07)          # franja centrada en altura
U = (max(BODY[0], BAND[0]), max(BODY[1], BAND[1]), BODY[2])  # bbox total


def box(cx, cy, cz, sx, sy, sz):
    """Caja en coords glTF (Y arriba). Devuelve posiciones, normales e índices (24 vértices)."""
    x0, x1, y0, y1, z0, z1 = cx - sx / 2, cx + sx / 2, cy - sy / 2, cy + sy / 2, cz - sz / 2, cz + sz / 2
    faces = [
        ((1, 0, 0), [(x1, y0, z0), (x1, y1, z0), (x1, y1, z1), (x1, y0, z1)]),
        ((-1, 0, 0), [(x0, y0, z1), (x0, y1, z1), (x0, y1, z0), (x0, y0, z0)]),
        ((0, 1, 0), [(x0, y1, z0), (x0, y1, z1), (x1, y1, z1), (x1, y1, z0)]),
        ((0, -1, 0), [(x0, y0, z1), (x0, y0, z0), (x1, y0, z0), (x1, y0, z1)]),
        ((0, 0, 1), [(x0, y0, z1), (x1, y0, z1), (x1, y1, z1), (x0, y1, z1)]),
        ((0, 0, -1), [(x1, y0, z0), (x0, y0, z0), (x0, y1, z0), (x1, y1, z0)]),
    ]
    pos, nor, idx = [], [], []
    for n, quad in faces:
        b = len(pos)
        pos += quad
        nor += [n] * 4
        idx += [b, b + 1, b + 2, b, b + 2, b + 3]
    return pos, nor, idx


# Blender (x, y, z) -> glTF (x, z, -y). En unidades normalizadas el bbox total ocupa [0,1]^3.
# Ancho (X Blender) -> X glTF, alto (Z Blender) -> Y glTF, fondo (Y Blender) -> Z glTF.
parts = [
    box(0.5, 0.5, 0.5, BODY[0] / U[0], BODY[2] / U[2], BODY[1] / U[1]),
    box(0.5, 0.5, 0.5, BAND[0] / U[0], BAND[2] / U[2], BAND[1] / U[1]),
]

blob = b""
accessors, views, prims = [], [], []
for mat, (pos, nor, idx) in enumerate(parts):
    for data, fmt, comp, typ, target in (
        (pos, "<3f", 5126, "VEC3", 34962),
        (nor, "<3f", 5126, "VEC3", 34962),
        (idx, "<H", 5123, "SCALAR", 34963),
    ):
        raw = b"".join(struct.pack(fmt, *(v if isinstance(v, tuple) else (v,))) for v in data)
        while len(blob) % 4:
            blob += b"\0"
        views.append({"buffer": 0, "byteOffset": len(blob), "byteLength": len(raw), "target": target})
        acc = {"bufferView": len(views) - 1, "componentType": comp, "count": len(data), "type": typ}
        if typ == "VEC3" and data is pos:
            acc["min"] = [min(p[i] for p in pos) for i in range(3)]
            acc["max"] = [max(p[i] for p in pos) for i in range(3)]
        accessors.append(acc)
        blob += raw
    a = len(accessors)
    prims.append({"attributes": {"POSITION": a - 3, "NORMAL": a - 2}, "indices": a - 1, "material": mat})

gltf = {
    "asset": {"version": "2.0", "generator": "make_caja_pt.py"},
    "scene": 0,
    "scenes": [{"nodes": [0]}],
    "nodes": [{"mesh": 0, "name": "Caja_PT"}],
    "meshes": [{"name": "Caja_PT", "primitives": prims}],
    "materials": [
        {"name": "M_Caja_PT", "pbrMetallicRoughness": {"baseColorFactor": [0.95, 0.95, 0.93, 1], "metallicFactor": 0, "roughnessFactor": 0.7}},
        {"name": "M_Rojo_PATY", "pbrMetallicRoughness": {"baseColorFactor": [0.70, 0.03, 0.04, 1], "metallicFactor": 0, "roughnessFactor": 0.4}},
    ],
    "accessors": accessors,
    "bufferViews": views,
    "buffers": [{"byteLength": len(blob)}],
}
js = json.dumps(gltf, separators=(",", ":")).encode()
js += b" " * (-len(js) % 4)
blob += b"\0" * (-len(blob) % 4)
out = struct.pack("<4sII", b"glTF", 2, 12 + 8 + len(js) + 8 + len(blob))
out += struct.pack("<I4s", len(js), b"JSON") + js + struct.pack("<I4s", len(blob), b"BIN\0") + blob
open("caja_pt.glb", "wb").write(out)
print("caja_pt.glb", len(out), "bytes; tamaño real", BODY)
