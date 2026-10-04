"""Genera bloque_carne.glb y paquete.glb (cubo unitario [0,1]^3, FlexSim los escala con el tamaño del ítem).
- bloque_carne: bloque de carne roja con un poco de grasa blanca arriba (0.60 x 0.40 x 0.25 m en el modelo).
- paquete: paquete de hamburguesas envasado, bolsa blanca con franja roja PATY (0.30 x 0.20 x 0.06 m)."""
import json, struct


def box(x0, x1, y0, y1, z0, z1):
    """Caja en coords glTF (Y arriba) dentro del cubo unitario."""
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


def write(fn, parts, mats):
    blob = b""
    views, accessors, prims = [], [], []
    for m, (pos, nor, idx) in enumerate(parts):
        base = len(accessors)
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
        prims.append({"attributes": {"POSITION": base, "NORMAL": base + 1}, "indices": base + 2, "material": m})
    gltf = {
        "asset": {"version": "2.0", "generator": "make_items.py"},
        "scene": 0, "scenes": [{"nodes": [0]}],
        "nodes": [{"mesh": 0, "name": fn}],
        "meshes": [{"name": fn, "primitives": prims}],
        "materials": [{"name": n, "pbrMetallicRoughness": {"baseColorFactor": c, "metallicFactor": 0, "roughnessFactor": r}} for n, c, r in mats],
        "accessors": accessors, "bufferViews": views, "buffers": [{"byteLength": len(blob)}],
    }
    js = json.dumps(gltf, separators=(",", ":")).encode()
    js += b" " * (-len(js) % 4)
    blob += b"\0" * (-len(blob) % 4)
    out = struct.pack("<4sII", b"glTF", 2, 12 + 8 + len(js) + 8 + len(blob))
    out += struct.pack("<I4s", len(js), b"JSON") + js + struct.pack("<I4s", len(blob), b"BIN\0") + blob
    open(fn + ".glb", "wb").write(out)
    print(fn + ".glb", len(out), "bytes")


# bloque de carne: cuerpo rojo + capa de grasa blanca arriba
write("bloque_carne",
      [box(0, 1, 0, 0.82, 0, 1), box(0.03, 0.97, 0.82, 1.0, 0.03, 0.97)],
      [("M_Carne_Bloque", [0.55, 0.12, 0.12, 1], 0.8), ("M_Grasa", [0.93, 0.88, 0.80, 1], 0.9)])

# paquete envasado: bolsa blanca + franja roja PATY al medio
write("paquete",
      [box(0, 1, 0, 1, 0, 1), box(-0.0, 1.0, 0.0, 1.0, 0.38, 0.62)],
      [("M_Bolsa_Blanca", [0.96, 0.96, 0.94, 1], 0.5), ("M_Rojo_PATY", [0.70, 0.03, 0.04, 1], 0.4)])
