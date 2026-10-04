"""Genera hamburguesa.glb: bandeja de 4x4 hamburguesas crudas (disco ~9 cm), normalizada al cubo unitario [0,1]^3.
FlexSim la usa como forma del ítem mientras es carne formada (formadora -> túnel -> envasado); se escala con
el tamaño del ítem (0.40 x 0.40 x 0.02 m). Un ítem = un lote visual de hamburguesas (5 kg en el modelo)."""
import json, math, struct

N = 4                 # 4 x 4 hamburguesas por ítem
SEG = 16              # lados del disco
R = 0.92 / (2 * N)    # radio relativo (deja un pequeño hueco entre discos)

pos, nor, idx = [], [], []


def disc(cx, cz):
    """Cilindro vertical (eje Y de glTF) de altura 1 centrado en (cx, cz) en el cubo unitario."""
    b = len(pos)
    # tapa superior + tapa inferior
    for y, ny in ((1.0, 1.0), (0.0, -1.0)):
        c = len(pos)
        pos.append((cx, y, cz)); nor.append((0, ny, 0))
        for i in range(SEG):
            a = 2 * math.pi * i / SEG
            pos.append((cx + R * math.cos(a), y, cz + R * math.sin(a))); nor.append((0, ny, 0))
        for i in range(SEG):
            j = (i + 1) % SEG
            if ny > 0:
                idx.extend([c, c + 1 + j, c + 1 + i])
            else:
                idx.extend([c, c + 1 + i, c + 1 + j])
    # lateral
    s = len(pos)
    for i in range(SEG):
        a = 2 * math.pi * i / SEG
        n = (math.cos(a), 0, math.sin(a))
        pos.append((cx + R * n[0], 0.0, cz + R * n[2])); nor.append(n)
        pos.append((cx + R * n[0], 1.0, cz + R * n[2])); nor.append(n)
    for i in range(SEG):
        j = (i + 1) % SEG
        a0, a1, b0, b1 = s + 2 * i, s + 2 * i + 1, s + 2 * j, s + 2 * j + 1
        idx.extend([a0, b0, b1, a0, b1, a1])


for ix in range(N):
    for iz in range(N):
        disc((ix + 0.5) / N, (iz + 0.5) / N)

blob = b""
views, accessors = [], []
for data, fmt, comp, typ, target in (
    (pos, "<3f", 5126, "VEC3", 34962),
    (nor, "<3f", 5126, "VEC3", 34962),
    (idx, "<I", 5125, "SCALAR", 34963),
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

gltf = {
    "asset": {"version": "2.0", "generator": "make_hamburguesa.py"},
    "scene": 0,
    "scenes": [{"nodes": [0]}],
    "nodes": [{"mesh": 0, "name": "Hamburguesas"}],
    "meshes": [{"name": "Hamburguesas", "primitives": [{"attributes": {"POSITION": 0, "NORMAL": 1}, "indices": 2, "material": 0}]}],
    "materials": [{"name": "M_Carne_Cruda", "doubleSided": True,
                   "pbrMetallicRoughness": {"baseColorFactor": [0.62, 0.24, 0.22, 1], "metallicFactor": 0, "roughnessFactor": 0.85}}],
    "accessors": accessors,
    "bufferViews": views,
    "buffers": [{"byteLength": len(blob)}],
}
js = json.dumps(gltf, separators=(",", ":")).encode()
js += b" " * (-len(js) % 4)
blob += b"\0" * (-len(blob) % 4)
out = struct.pack("<4sII", b"glTF", 2, 12 + 8 + len(js) + 8 + len(blob))
out += struct.pack("<I4s", len(js), b"JSON") + js + struct.pack("<I4s", len(blob), b"BIN\0") + blob
open("hamburguesa.glb", "wb").write(out)
print("hamburguesa.glb", len(out), "bytes;", N * N, "discos,", len(idx) // 3, "triángulos")
