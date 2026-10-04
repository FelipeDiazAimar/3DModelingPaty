"""Genera pallet_mp.glb: pallet de madera 1.20 x 1.00 m con 5 capas de 3x3 cajas blancas (45 cajas),
alto total 1.40 m, normalizado al cubo unitario [0,1]^3. FlexSim lo usa como forma del pallet de materia prima
(ítem 'PalletMP', tamaño 1.20 x 1.00 x 1.40) para que el montacargas lleve un pallet completo."""
import json, struct

W, D, H = 1.20, 1.00, 1.40           # tamaño total (m): X, Y(fondo), Z(alto)
PAL_H = 0.15                          # alto del pallet de madera
LAYERS, NX, NY = 5, 3, 3
GAP = 0.012


def box(x0, x1, y0, y1, z0, z1):
    """Caja alineada en coords de Blender-like (x, y, z) -> glTF (x, z, -y), normalizada por (W, D, H)."""
    def P(x, y, z):
        return (x / W, z / H, 1.0 - y / D)
    faces = [
        ((1, 0, 0), [(x1, y0, z0), (x1, y1, z0), (x1, y1, z1), (x1, y0, z1)]),
        ((-1, 0, 0), [(x0, y1, z0), (x0, y0, z0), (x0, y0, z1), (x0, y1, z1)]),
        ((0, 1, 0), [(x1, y1, z0), (x0, y1, z0), (x0, y1, z1), (x1, y1, z1)]),
        ((0, -1, 0), [(x0, y0, z0), (x1, y0, z0), (x1, y0, z1), (x0, y0, z1)]),
        ((0, 0, 1), [(x0, y0, z1), (x1, y0, z1), (x1, y1, z1), (x0, y1, z1)]),
        ((0, 0, -1), [(x0, y1, z0), (x1, y1, z0), (x1, y0, z0), (x0, y0, z0)]),
    ]
    pos, nor, idx = [], [], []
    for n, quad in faces:
        b = len(pos)
        pos += [P(*q) for q in quad]
        nn = (n[0], n[2], -n[1])
        nor += [nn] * 4
        idx += [b, b + 1, b + 2, b, b + 2, b + 3]
    return pos, nor, idx


def merge(parts):
    pos, nor, idx = [], [], []
    for p, n, i in parts:
        b = len(pos)
        pos += p; nor += n; idx += [k + b for k in i]
    return pos, nor, idx


wood = []
wood.append(box(0, W, 0, D, PAL_H - 0.03, PAL_H))                      # tablero superior
for k in range(3):                                                      # 3 largueros
    y0 = k * (D - 0.10) / 2
    wood.append(box(0, W, y0, y0 + 0.10, 0.0, PAL_H - 0.03))

cartons = []
cw, cd, ch = W / NX, D / NY, (H - PAL_H) / LAYERS
for L in range(LAYERS):
    for i in range(NX):
        for j in range(NY):
            cartons.append(box(i * cw + GAP, (i + 1) * cw - GAP, j * cd + GAP, (j + 1) * cd - GAP,
                               PAL_H + L * ch + GAP / 2, PAL_H + (L + 1) * ch - GAP / 2))


def build(n):
    prims_data = [merge(wood)] + ([merge(cartons[:n])] if n > 0 else [])

    blob = b""
    views, accessors, prims = [], [], []
    for mat, (pos, nor, idx) in enumerate(prims_data):
        base = len(accessors)
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
        prims.append({"attributes": {"POSITION": base, "NORMAL": base + 1}, "indices": base + 2, "material": mat})

    gltf = {
        "asset": {"version": "2.0", "generator": "make_pallet_mp.py"},
        "scene": 0,
        "scenes": [{"nodes": [0]}],
        "nodes": [{"mesh": 0, "name": "PalletMP"}],
        "meshes": [{"name": "PalletMP", "primitives": prims}],
        "materials": [
            {"name": "M_Madera_Pallet", "pbrMetallicRoughness": {"baseColorFactor": [0.55, 0.38, 0.20, 1], "metallicFactor": 0, "roughnessFactor": 0.9}},
            {"name": "M_Caja_MP_Blanca", "pbrMetallicRoughness": {"baseColorFactor": [0.93, 0.93, 0.90, 1], "metallicFactor": 0, "roughnessFactor": 0.7}},
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
    return out


if __name__ == '__main__':
    out = build(len(cartons))
    open('pallet_mp.glb', 'wb').write(out)
    for n in range(len(cartons)):
        open(f'pallet_mp_{n:02d}.glb', 'wb').write(build(n))
    print('pallet_mp.glb +', len(cartons), 'variantes (0..%d cajas restantes)' % (len(cartons) - 1))
