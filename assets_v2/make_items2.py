"""Genera bateas_carne.glb y carne_picada.glb (cubo unitario [0,1]^3; FlexSim los escala con el tamaño del ítem).
- bateas_carne: columna de 6 bateas rojas (como las de la mesa de desencajado), cada una con un bloque de carne
  (6 x 250 kg = lote de 1500 kg). Tamaño en el modelo: 1.00 x 0.64 x 1.40 m.
- carne_picada: montículo de carne picada rosada-rojiza, 0.80 x 0.80 x 0.35 m."""
import json, math, struct

W, D, H = 1.00, 0.64, 1.40


def box(x0, x1, y0, y1, z0, z1, dims=(W, D, H)):
    """Caja en metros (x ancho, y fondo, z alto) -> glTF (x, z, -y) normalizado y desplazado a [0,1]^3."""
    w, d, h = dims

    def P(x, y, z):
        return (x / w, z / h, 1.0 - y / d)

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
        nor += [(n[0], n[2], -n[1])] * 4
        idx += [b, b + 1, b + 2, b, b + 2, b + 3]
    return pos, nor, idx


def merge(parts):
    pos, nor, idx = [], [], []
    for p, n, i in parts:
        b = len(pos)
        pos += p; nor += n; idx += [k + b for k in i]
    return pos, nor, idx


def write(fn, parts, mats):
    blob = b""
    views, accessors, prims = [], [], []
    for m, (pos, nor, idx) in enumerate(parts):
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
        prims.append({"attributes": {"POSITION": base, "NORMAL": base + 1}, "indices": base + 2, "material": m})
    gltf = {
        "asset": {"version": "2.0", "generator": "make_items2.py"},
        "scene": 0, "scenes": [{"nodes": [0]}],
        "nodes": [{"mesh": 0, "name": fn}],
        "meshes": [{"name": fn, "primitives": prims}],
        "materials": [{"name": n, "doubleSided": True,
                       "pbrMetallicRoughness": {"baseColorFactor": c, "metallicFactor": 0, "roughnessFactor": r}} for n, c, r in mats],
        "accessors": accessors, "bufferViews": views, "buffers": [{"byteLength": len(blob)}],
    }
    js = json.dumps(gltf, separators=(",", ":")).encode()
    js += b" " * (-len(js) % 4)
    blob += b"\0" * (-len(blob) % 4)
    out = struct.pack("<4sII", b"glTF", 2, 12 + 8 + len(js) + 8 + len(blob))
    out += struct.pack("<I4s", len(js), b"JSON") + js + struct.pack("<I4s", len(blob), b"BIN\0") + blob
    open(fn + ".glb", "wb").write(out)
    print(fn + ".glb", len(out), "bytes")


# ---- bateas_carne: 6 bateas rojas apiladas, cada una con un bloque de carne ----
tray, meat = [], []
LAYERS, PITCH, T = 6, H / 6, 0.025          # alto de cada batea 0.233 m, espesor de pared 2.5 cm
for k in range(LAYERS):
    z0 = k * PITCH
    z1 = z0 + PITCH - 0.01
    tray.append(box(0, W, 0, D, z0, z0 + T))                         # fondo
    tray.append(box(0, T, 0, D, z0, z1))                              # paredes
    tray.append(box(W - T, W, 0, D, z0, z1))
    tray.append(box(T, W - T, 0, T, z0, z1))
    tray.append(box(T, W - T, D - T, D, z0, z1))
    meat.append(box(T + 0.02, W - T - 0.02, T + 0.02, D - T - 0.02, z0 + T, z1 - 0.025))   # bloque de carne
write("bateas_carne", [merge(tray), merge(meat)],
      [("M_Bateas_Rojas", [0.75, 0.05, 0.05, 1], 0.5), ("M_Carne_Bloque", [0.62, 0.16, 0.16, 1], 0.8)])


# ---- carne_picada: semielipsoide rugoso en el cubo unitario ----
def mound(nu=24, nv=10):
    pos, nor, idx = [], [], []
    for j in range(nv + 1):
        v = (math.pi / 2) * j / nv                 # 0 = base, pi/2 = cima
        for i in range(nu + 1):
            u = 2 * math.pi * i / nu
            rough = 1.0 + 0.06 * math.sin(5 * u + 3 * v) * math.cos(4 * v)
            x = 0.5 + 0.5 * rough * math.cos(v) * math.cos(u)
            z = 0.5 + 0.5 * rough * math.cos(v) * math.sin(u)
            y = rough * math.sin(v)
            pos.append((x, y, z))
            nor.append((math.cos(v) * math.cos(u), math.sin(v), math.cos(v) * math.sin(u)))
    for j in range(nv):
        for i in range(nu):
            a, b = j * (nu + 1) + i, j * (nu + 1) + i + 1
            c, d = (j + 1) * (nu + 1) + i, (j + 1) * (nu + 1) + i + 1
            idx += [a, c, b, b, c, d]
    # base
    c0 = len(pos)
    pos.append((0.5, 0.0, 0.5)); nor.append((0, -1, 0))
    for i in range(nu + 1):
        u = 2 * math.pi * i / nu
        pos.append((0.5 + 0.5 * math.cos(u), 0.0, 0.5 + 0.5 * math.sin(u))); nor.append((0, -1, 0))
    for i in range(nu):
        idx += [c0, c0 + 1 + i, c0 + 2 + i]
    return pos, nor, idx


write("carne_picada", [mound()], [("M_Carne_Picada", [0.74, 0.28, 0.27, 1], 0.9)])


# ---- batea_carne: UNA batea roja con su bloque de carne (1.00 x 0.64 x 0.22 m), el ítem que viaja por el elevador ----
H1 = 0.22
T1 = 0.025
d1 = (W, D, H1)
tray1 = [box(0, W, 0, D, 0, T1, d1), box(0, T1, 0, D, 0, H1, d1), box(W - T1, W, 0, D, 0, H1, d1),
         box(T1, W - T1, 0, T1, 0, H1, d1), box(T1, W - T1, D - T1, D, 0, H1, d1)]
meat1 = [box(T1 + 0.03, W - T1 - 0.03, T1 + 0.03, D - T1 - 0.03, T1, H1 - 0.03, d1)]
write("batea_carne", [merge(tray1), merge(meat1)],
      [("M_Bateas_Rojas", [0.75, 0.05, 0.05, 1], 0.5), ("M_Carne_Bloque", [0.62, 0.16, 0.16, 1], 0.8)])


# ---- carga_batch: una carga del batch = carro/contenedor rojo (tipo Eurobin) con carne mezclada (0.60 x 0.40 x 0.36 m) ----
W2, D2, H2 = 0.60, 0.40, 0.36
d2 = (W2, D2, H2)
T2 = 0.02
bin2 = [box(0, W2, 0, D2, 0, T2, d2), box(0, T2, 0, D2, 0, H2, d2), box(W2 - T2, W2, 0, D2, 0, H2, d2),
        box(T2, W2 - T2, 0, T2, 0, H2, d2), box(T2, W2 - T2, D2 - T2, D2, 0, H2, d2)]
mass2 = [box(T2 + 0.01, W2 - T2 - 0.01, T2 + 0.01, D2 - T2 - 0.01, T2, H2 - 0.04, d2)]
write("carga_batch", [merge(bin2), merge(mass2)],
      [("M_Bateas_Rojas", [0.75, 0.05, 0.05, 1], 0.5), ("M_Carne_Mezclada", [0.70, 0.22, 0.22, 1], 0.9)])
