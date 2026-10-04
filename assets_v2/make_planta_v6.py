"""Genera PATY_Planta_v9.glb a partir de PATY_Planta_v5.glb para FlexSim:
- colores más vivos (mismos nombres de material que usa la web),
- pasto verde sobre una isla de bordes redondeados (reemplaza M_Campo y M_Pasto),
- vegetación (árboles, pinos, arbustos, flores) agregada como geometría,
- sin los robots estibadores B (queda 1 por línea: EstA_L7 y EstA_L8); los camiones estáticos de los muelles se conservan.
FlexSim dibuja baseColorFactor tal cual (sin gamma), por eso se usan los hex sRGB directamente.
Uso: python make_planta_v6.py"""
import json, math, struct
import numpy as np

SRC, DST = "PATY_Planta_v5.glb", "PATY_Planta_v9.glb"

COLORS = {
    "M_Rack_Azul": "#2b74ff", "M_Rack_Naranja": "#ff7d1f", "M_Amarillo_Seg": "#ffc61a", "M_Azul_Compresor": "#3a86ff",
    "M_Rojo_PATY": "#f23a4f", "M_Metal_Estructura": "#8aa4cf", "M_Negro_Cinta": "#344060", "M_Goma": "#3c4660", "M_Llanta": "#7c8aa6",
    "M_Inox": "#d7e2f5", "M_Inox_Cepillado": "#c9d7ee", "M_Cromo": "#e6eefb", "M_Carton": "#f3b567", "M_Madera_Pallet": "#e7ae6d",
    "M_Madera_Mueble": "#d89a5c", "M_Panel_Sandwich": "#f1f6ff", "M_Blanco_Aislado": "#ffffff", "M_Hormigon_Piso": "#eaf1ff",
    "M_Asfalto": "#b4c2dd", "M_Vereda": "#f6ead8", "M_Cordon": "#efe8da", "M_Pino": "#1fae62", "M_Copa_Verde": "#4fd35c",
    "M_Arbusto": "#43c765", "M_Tronco": "#9a6238", "M_Verde_Industrial": "#1ccd84", "M_Bateas_Rojas": "#ff3d52",
    "M_Auto_Rojo": "#ff3b4e", "M_Auto_Azul": "#2f7bff", "M_Auto_Plata": "#e4ecf8", "M_Auto_Gris": "#94a9c9", "M_Auto_Negro": "#39425a",
    "M_Moto_Azul": "#2f7bff", "M_Moto_Roja": "#ff3b4e", "M_Cabina_Azul": "#2f7bff", "M_Cabina_Roja": "#ff3b4e", "M_Locker": "#62adff",
    "M_Gris_Puerta": "#8fa2c4", "M_Alambrado": "#9fb0cc", "M_Junta": "#8a98b3", "M_Panel_Junta": "#e2eaf8",
}
DROP = {"M_Campo", "M_Pasto"}
TRUCK_MATS = set()  # no se quitan camiones (antes: {"M_Camion_Blanco", "M_Cabina_Azul", "M_Llanta", "M_Goma"})
STACKER_MATS = {"M_Amarillo_Seg", "M_Metal_Estructura", "M_Negro_Cinta", "M_Caja_PT", "M_Baliza_Roja", "M_Baliza_Verde",
                "M_Baliza_Amarilla", "M_Alambrado", "M_Inox_Cepillado"}
# celdas de los estibadores B (coord. glTF x, z = -y de Blender): L7 y=14.25 -> z=-14.25 ; L8 y=-17.75 -> z=17.75
REGIONS = [(STACKER_MATS, 26.0, 33.0, cz - 2.15, cz + 2.15) for cz in (-14.25, 17.75)]


def rgb(h):
    h = h.lstrip("#")
    return [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]


def rng(seed):
    s = [seed & 0xFFFFFFFF]

    def r():
        s[0] = (s[0] + 0x6D2B79F5) & 0xFFFFFFFF
        t = s[0]
        t = ((t ^ (t >> 15)) * (t | 1)) & 0xFFFFFFFF
        t ^= (t + (((t ^ (t >> 7)) * (t | 61)) & 0xFFFFFFFF)) & 0xFFFFFFFF
        return ((t ^ (t >> 14)) & 0xFFFFFFFF) / 4294967296
    return r


# ---------------- primitivas de malla (devuelven pos, nor, idx como arrays) ----------------
def icosphere(sub=1):
    t = (1 + 5 ** 0.5) / 2
    v = [(-1, t, 0), (1, t, 0), (-1, -t, 0), (1, -t, 0), (0, -1, t), (0, 1, t), (0, -1, -t), (0, 1, -t), (t, 0, -1), (t, 0, 1), (-t, 0, -1), (-t, 0, 1)]
    f = [(0, 11, 5), (0, 5, 1), (0, 1, 7), (0, 7, 10), (0, 10, 11), (1, 5, 9), (5, 11, 4), (11, 10, 2), (10, 7, 6), (7, 1, 8),
         (3, 9, 4), (3, 4, 2), (3, 2, 6), (3, 6, 8), (3, 8, 9), (4, 9, 5), (2, 4, 11), (6, 2, 10), (8, 6, 7), (9, 8, 1)]
    v = [np.array(p, float) / np.linalg.norm(p) for p in v]
    cache = {}

    def mid(a, b):
        k = (min(a, b), max(a, b))
        if k not in cache:
            m = (v[a] + v[b]) / 2
            v.append(m / np.linalg.norm(m))
            cache[k] = len(v) - 1
        return cache[k]
    for _ in range(sub):
        nf = []
        for a, b, c in f:
            ab, bc, ca = mid(a, b), mid(b, c), mid(c, a)
            nf += [(a, ab, ca), (b, bc, ab), (c, ca, bc), (ab, bc, ca)]
        f = nf
    pos = np.array(v, np.float32)
    return pos, pos.copy(), np.array(f, np.uint32).reshape(-1)


def cylinder(r0, r1, h, seg=10, cap=True):
    pos, nor, idx = [], [], []
    for i in range(seg):
        a0, a1 = 2 * math.pi * i / seg, 2 * math.pi * (i + 1) / seg
        b = len(pos)
        for a, rr, y in ((a0, r0, 0), (a1, r0, 0), (a1, r1, h), (a0, r1, h)):
            pos.append((rr * math.cos(a), y, rr * math.sin(a))); nor.append((math.cos(a), 0.2, math.sin(a)))
        idx += [b, b + 2, b + 1, b, b + 3, b + 2]
    if cap:
        for y, ny in ((h, 1), (0, -1)):
            c = len(pos); rr = r1 if y else r0
            pos.append((0, y, 0)); nor.append((0, ny, 0))
            for i in range(seg):
                a = 2 * math.pi * i / seg
                pos.append((rr * math.cos(a), y, rr * math.sin(a))); nor.append((0, ny, 0))
            for i in range(seg):
                j = (i + 1) % seg
                idx += [c, c + 1 + j, c + 1 + i] if ny > 0 else [c, c + 1 + i, c + 1 + j]
    return np.array(pos, np.float32), np.array(nor, np.float32), np.array(idx, np.uint32)


def cone(r, h, seg=10):
    return cylinder(r, 0.001, h, seg)


def rounded_slab(w, d, r, y0, y1, seg=10):
    """Losa con esquinas redondeadas (planta) entre y0 e y1; devuelve malla cerrada."""
    pts = []
    for cx, cz, a0 in ((w / 2 - r, d / 2 - r, 0), (-w / 2 + r, d / 2 - r, 90), (-w / 2 + r, -d / 2 + r, 180), (w / 2 - r, -d / 2 + r, 270)):
        for k in range(seg + 1):
            a = math.radians(a0 + 90 * k / seg)
            pts.append((cx + r * math.cos(a), cz + r * math.sin(a)))
    n = len(pts)
    pos, nor, idx = [], [], []
    for i in range(n):  # laterales
        p, q = pts[i], pts[(i + 1) % n]
        e = np.array([q[0] - p[0], q[1] - p[1]]); nn = np.array([e[1], -e[0]]); nn = nn / (np.linalg.norm(nn) or 1)
        b = len(pos)
        for (x, z, y) in ((p[0], p[1], y0), (q[0], q[1], y0), (q[0], q[1], y1), (p[0], p[1], y1)):
            pos.append((x, y, z)); nor.append((nn[0], 0, nn[1]))
        idx += [b, b + 1, b + 2, b, b + 2, b + 3]
    c = len(pos)  # tapa superior
    pos.append((0, y1, 0)); nor.append((0, 1, 0))
    for p in pts:
        pos.append((p[0], y1, p[1])); nor.append((0, 1, 0))
    for i in range(n):
        idx += [c, c + 1 + (i + 1) % n, c + 1 + i]
    return np.array(pos, np.float32), np.array(nor, np.float32), np.array(idx, np.uint32)


class Acc:
    """Acumula instancias de una malla por material."""
    def __init__(self):
        self.pos, self.nor, self.idx, self.n = [], [], [], 0

    def add(self, mesh, sx, sy, sz, tx, ty, tz):
        p, nr, i = mesh
        q = p * np.array([sx, sy, sz], np.float32) + np.array([tx, ty, tz], np.float32)
        self.pos.append(q); self.nor.append(nr); self.idx.append(i + self.n); self.n += len(p)

    def out(self):
        return np.concatenate(self.pos), np.concatenate(self.nor), np.concatenate(self.idx).astype(np.uint32)


def build_scene():
    r = rng(7)
    ZONES = [(-146, 146, -100, -58), (-146, 146, 93, 103), (133, 148, -100, 103), (-148, -133, -100, 103)]

    def at():
        z = ZONES[int(r() * len(ZONES))]
        return z[0] + r() * (z[1] - z[0]), z[2] + r() * (z[3] - z[2])

    def pick(a):
        return a[int(r() * len(a))]
    greens = ["#4cc957", "#35b95b", "#72d84c", "#27a85f", "#8be04e"]
    blossom = ["#ff8fb1", "#ffb347", "#ffd84d", "#ff7aa8"]
    pines_c = ["#1f9d5a", "#16864b", "#2db36a", "#35c277"]
    flower_c = ["#ff5d8f", "#ffd23f", "#ffffff", "#b388ff", "#ff8a3d", "#5ec8ff"]
    mats = {}

    def acc(color):
        return mats.setdefault(color, Acc())
    sph2, sph1, sph0 = icosphere(2), icosphere(1), icosphere(0)
    trunk = cylinder(0.35, 0.5, 2.2, 8)
    cn = cone(1, 1, 9)
    for _ in range(95):
        x, z = at(); s = 0.8 + r() * 0.9
        c = pick(blossom) if r() < 0.16 else pick(greens)
        acc("#9a6238").add(trunk, s, s, s, x, 0, z)
        acc(c).add(sph2, 2.3 * s, 2.1 * s, 2.3 * s, x, 3.9 * s, z)
    for _ in range(55):
        x, z = at(); s = 0.8 + r() * 0.8
        acc("#9a6238").add(trunk, s, s, s, x, 0, z)
        acc(pick(pines_c)).add(cn, 1.9 * s, 6 * s, 1.9 * s, x, 1.2 * s, z)
    for _ in range(90):
        x, z = at(); s = 0.7 + r() * 0.9
        acc(pick(greens + ["#a6e35a"])).add(sph1, 1.3 * s, 0.85 * s, 1.3 * s, x, 0.55 * s, z)
    for _ in range(520):
        x, z = at()
        acc(pick(flower_c)).add(sph0, 0.3, 0.3, 0.3, x, 0.3, z)
    # isla: tierra (más abajo) y pasto encima, ambas con esquinas redondeadas
    acc("#c58a52").add(rounded_slab(312, 216, 34, -10.0, -1.2), 1, 1, 1, 0, 0, 0)
    acc("#79d957").add(rounded_slab(310, 214, 33, -1.2, -0.3), 1, 1, 1, 0, 0, 0)
    return mats


# ---------------- lectura / escritura GLB ----------------
def read_glb(path):
    b = open(path, "rb").read()
    jl = struct.unpack("<I", b[12:16])[0]
    j = json.loads(b[20:20 + jl])
    off = 20 + jl + 8
    return j, bytearray(b[off:off + struct.unpack("<I", b[20 + jl:24 + jl])[0]])


def main(web=False):
    """web=True: solo quita pasto/campo y los camiones estáticos (la web recolorea y agrega isla y árboles por su cuenta)."""
    j, blob = read_glb(SRC)
    acc, bvs = j["accessors"], j["bufferViews"]
    mats = j["materials"]
    names = [m["name"] for m in mats]

    def read(ai):
        a = acc[ai]; v = bvs[a["bufferView"]]
        ct = {5126: "<f4", 5123: "<u2", 5125: "<u4"}[a["componentType"]]
        n = {"VEC3": 3, "SCALAR": 1, "VEC2": 2}[a["type"]]
        o = v.get("byteOffset", 0) + a.get("byteOffset", 0)
        x = np.frombuffer(bytes(blob), dtype=ct, count=a["count"] * n, offset=o)
        return x.reshape(-1, n) if n > 1 else x

    def append(arr, target):
        while len(blob) % 4:
            blob.append(0)
        raw = arr.tobytes()
        bvs.append({"buffer": 0, "byteOffset": len(blob), "byteLength": len(raw), "target": target})
        blob.extend(raw)
        return len(bvs) - 1

    # 1) colores
    for m in ([] if web else mats):
        h = COLORS.get(m["name"])
        pb = m.setdefault("pbrMetallicRoughness", {})
        pb["metallicFactor"] = 0.0
        pb["roughnessFactor"] = max(pb.get("roughnessFactor", 0.6), 0.6)
        if h:
            a = pb.get("baseColorFactor", [1, 1, 1, 1])
            pb["baseColorFactor"] = rgb(h) + [a[3] if len(a) > 3 else 1]

    # 2) quitar pasto/campo y camiones estáticos del muelle oeste
    prims, kept, removed_tris = j["meshes"][0]["primitives"], [], 0
    for p in prims:
        nm = names[p["material"]]
        if nm in DROP:
            continue
        regs = [r for r in REGIONS if nm in r[0]]
        if regs:
            pos, idx = read(p["attributes"]["POSITION"]), read(p["indices"])
            tri = idx.reshape(-1, 3).astype(np.uint32)
            c = pos[tri].mean(axis=1)
            inside = np.zeros(len(tri), bool)
            for _, x0, x1, z0, z1 in regs:
                inside |= (c[:, 0] > x0) & (c[:, 0] < x1) & (c[:, 2] > z0) & (c[:, 2] < z1)
            removed_tris += int(inside.sum())
            if inside.any():
                new = tri[~inside].ravel()
                ia = dict(acc[p["indices"]]); ia.update(componentType=5125, count=int(len(new)), bufferView=append(new, 34963))
                ia.pop("byteOffset", None); ia.pop("min", None); ia.pop("max", None)
                acc.append(ia); p["indices"] = len(acc) - 1
        kept.append(p)
    j["meshes"][0]["primitives"] = kept

    # 3) isla + vegetación
    for color, a in ({} if web else build_scene()).items():
        pos, nor, idx = a.out()
        pi = len(acc); acc.append({"bufferView": append(pos, 34962), "componentType": 5126, "count": len(pos), "type": "VEC3",
                                   "min": pos.min(0).tolist(), "max": pos.max(0).tolist()})
        ni = len(acc); acc.append({"bufferView": append(nor, 34962), "componentType": 5126, "count": len(nor), "type": "VEC3"})
        ii = len(acc); acc.append({"bufferView": append(idx, 34963), "componentType": 5125, "count": len(idx), "type": "SCALAR"})
        mats.append({"name": "M_V6_" + color.lstrip("#"), "pbrMetallicRoughness": {"baseColorFactor": rgb(color) + [1], "metallicFactor": 0.0, "roughnessFactor": 0.9}})
        j["meshes"][0]["primitives"].append({"attributes": {"POSITION": pi, "NORMAL": ni}, "indices": ii, "material": len(mats) - 1})

    j["buffers"][0]["byteLength"] = len(blob)
    js = json.dumps(j, separators=(",", ":")).encode()
    js += b" " * (-len(js) % 4)
    blob.extend(b"\0" * (-len(blob) % 4))
    out = struct.pack("<4sII", b"glTF", 2, 12 + 8 + len(js) + 8 + len(blob))
    out += struct.pack("<I4s", len(js), b"JSON") + js + struct.pack("<I4s", len(blob), b"BIN\0") + blob
    dst = "../dashboard/web/public/models/planta.glb" if web else DST
    open(dst, "wb").write(out)
    print(dst, round(len(out) / 1e6, 1), "MB; triángulos quitados (estibadores B):", removed_tris, "; primitivas:", len(j["meshes"][0]["primitives"]))


if __name__ == "__main__":
    import sys
    main(web="--web" in sys.argv)
