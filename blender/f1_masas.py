"""F1 del PLAN_MODELO_3D.md: edificios de la planta completa como volúmenes con el estilo de la nave actual.

Correr dentro de Blender (escena PATY_Planta_Completa.blend):
    exec(open(r"<repo>/blender/f1_masas.py", encoding="utf-8").read()); f1()

Es idempotente: borra y rehace solo lo que crea (colecciones con prefijo F1_). No toca
L7, L8, almacenes ni muelles (lo controla check_anclas.py). El decorado viejo que cae
dentro de los terrenos nuevos se mueve a ZZ_RETIRADO (oculto, no se borra).
Layout: tabla 3.2 del plan (hipótesis, no hay plano).
"""
import math

import bpy

H_NAVE = 7.0      # altura de muro como la nave actual
T_MURO = 0.25
PASO_COL = 8.0

# --------------------------------------------------------------------------- utilidades
def mat(name):
    return bpy.data.materials[name]


def coleccion(name, parent=None):
    c = bpy.data.collections.get(name)
    if c is None:
        c = bpy.data.collections.new(name)
        (parent or bpy.context.scene.collection).children.link(c)
    return c


def vaciar(c):
    for ch in list(c.children):
        vaciar(ch)
        bpy.data.collections.remove(ch)
    for o in list(c.objects):
        me = o.data if o.type == "MESH" else None
        bpy.data.objects.remove(o)
        if me is not None and me.users == 0:
            bpy.data.meshes.remove(me)


def caja(col, name, x0, x1, y0, y1, z0, z1, material):
    v = [(x0, y0, z0), (x1, y0, z0), (x1, y1, z0), (x0, y1, z0),
         (x0, y0, z1), (x1, y0, z1), (x1, y1, z1), (x0, y1, z1)]
    f = [(0, 3, 2, 1), (4, 5, 6, 7), (0, 1, 5, 4), (1, 2, 6, 5), (2, 3, 7, 6), (3, 0, 4, 7)]
    me = bpy.data.meshes.new(name)
    me.from_pydata(v, [], f)
    me.materials.append(mat(material))
    o = bpy.data.objects.new(name, me)
    col.objects.link(o)
    return o


def prisma(col, name, pts, z0, z1, material):
    """Prisma vertical de base poligonal (pts en sentido antihorario)."""
    n = len(pts)
    v = [(x, y, z0) for x, y in pts] + [(x, y, z1) for x, y in pts]
    f = [tuple(reversed(range(n))), tuple(range(n, 2 * n))]
    f += [(i, (i + 1) % n, n + (i + 1) % n, n + i) for i in range(n)]
    me = bpy.data.meshes.new(name)
    me.from_pydata(v, [], f)
    me.materials.append(mat(material))
    o = bpy.data.objects.new(name, me)
    col.objects.link(o)
    return o


def texto(col, name, txt, x, y, z, size, material, rot_z=0.0):
    cu = bpy.data.curves.new(name, "FONT")
    cu.body = txt
    cu.size = size
    cu.align_x = "CENTER"
    cu.align_y = "CENTER"
    cu.extrude = 0.01
    o = bpy.data.objects.new(name, cu)
    o.location = (x, y, z)
    o.rotation_euler = (0, 0, rot_z)
    cu.materials.append(mat(material))
    col.objects.link(o)
    return o


# --------------------------------------------------------------------------- edificio tipo
def muro_con_vanos(col, name, eje, fijo, a0, a1, vanos, h):
    """Muro sobre el eje 'x' (corre en x, y = fijo) o 'y'. vanos = [(centro, ancho, alto)]."""
    tramos, cur = [], a0
    for c, w, hv in sorted(vanos):
        tramos.append((cur, c - w / 2, None))
        tramos.append((c - w / 2, c + w / 2, hv))
        cur = c + w / 2
    tramos.append((cur, a1, None))
    for i, (s0, s1, hv) in enumerate(tramos):
        if s1 - s0 < 0.01:
            continue
        z0 = 0.0 if hv is None else hv
        nm = f"{name}_{'t' if hv is None else 'dintel'}{i}"
        if eje == "x":
            caja(col, nm, s0, s1, fijo - T_MURO / 2, fijo + T_MURO / 2, z0, h, "M_Panel_Sandwich")
        else:
            caja(col, nm, fijo - T_MURO / 2, fijo + T_MURO / 2, s0, s1, z0, h, "M_Panel_Sandwich")
        if hv is not None:  # marco de portón
            if eje == "x":
                caja(col, nm + "_marco", s0, s1, fijo - 0.18, fijo + 0.18, hv - 0.15, hv, "M_Amarillo_Seg")
            else:
                caja(col, nm + "_marco", fijo - 0.18, fijo + 0.18, s0, s1, hv - 0.15, hv, "M_Amarillo_Seg")


def edificio(nombre, x0, x1, y0, y1, h=H_NAVE, vanos=None, sin=(), piso=True, techo=True, cumbrera_en_x=True,
             parent=None, rotulo=None):
    """Nave con el estilo de la actual. vanos = {'N':[(c,w,h)], 'S':..., 'E':..., 'O':...}; sin = lados sin muro."""
    vanos = vanos or {}
    col = coleccion("F1_" + nombre, parent)
    tcol = coleccion("F1_" + nombre + "_TECHO", col)
    if piso:
        caja(col, nombre + "_Piso", x0, x1, y0, y1, -0.45, 0.0, "M_Hormigon_Piso")
    if "S" not in sin:
        muro_con_vanos(col, nombre + "_Muro_Sur", "x", y0, x0, x1, vanos.get("S", []), h)
    if "N" not in sin:
        muro_con_vanos(col, nombre + "_Muro_Norte", "x", y1, x0, x1, vanos.get("N", []), h)
    if "O" not in sin:
        muro_con_vanos(col, nombre + "_Muro_Oeste", "y", x0, y0, y1, vanos.get("O", []), h)
    if "E" not in sin:
        muro_con_vanos(col, nombre + "_Muro_Este", "y", x1, y0, y1, vanos.get("E", []), h)
    zf = h - 1.0
    for lado, (a, b, c, d) in {"S": (x0, x1, y0 - 0.16, y0 - 0.1), "N": (x0, x1, y1 + 0.1, y1 + 0.16),
                               "O": (x0 - 0.16, x0 - 0.1, y0, y1), "E": (x1 + 0.1, x1 + 0.16, y0, y1)}.items():
        if lado not in sin:
            caja(col, f"{nombre}_Franja_Roja_{lado}", a, b, c, d, zf - 0.4, zf + 0.4, "M_Rojo_PATY")
    # columnas perimetrales
    nx = max(1, round((x1 - x0) / PASO_COL))
    ny = max(1, round((y1 - y0) / PASO_COL))
    for i in range(nx + 1):
        x = x0 + (x1 - x0) * i / nx
        for y, s in ((y0 + 0.35, "S"), (y1 - 0.35, "N")):
            if s not in sin:
                caja(col, f"{nombre}_Columna_{i:02d}_{s}", x - 0.15, x + 0.15, y - 0.15, y + 0.15, 0, h, "M_Metal_Estructura")
    if techo:
        _techo(tcol, nombre, x0, x1, y0, y1, h, cumbrera_en_x)
    if rotulo:
        # tamaño según el largo del texto (una letra ocupa ~0,62 del tamaño) y orientado al lado largo
        largo_x = (x1 - x0) >= (y1 - y0)
        L = max(x1 - x0, y1 - y0)
        s_techo = min(6.0, 0.75 * L / (0.62 * len(rotulo)))
        s_piso = min(2.0, 0.45 * L / (0.62 * len(rotulo)))
        rz = 0.0 if largo_x else math.pi / 2
        texto(tcol, nombre + "_Rotulo_Techo", rotulo, (x0 + x1) / 2, (y0 + y1) / 2, h + 2.6, s_techo, "M_Rojo_PATY", rz)
        if largo_x:   # en el piso, junto al muro sur (entrada), para no quedar debajo de las máquinas
            texto(col, nombre + "_Rotulo_Piso", rotulo, (x0 + x1) / 2, y0 + 1.2 + s_piso / 2, 0.02, s_piso, "M_Blanco_Senda")
        else:
            texto(col, nombre + "_Rotulo_Piso", rotulo, x1 - 1.2 - s_piso / 2, (y0 + y1) / 2, 0.02, s_piso, "M_Blanco_Senda", rz)
        # cartel de fachada sobre el muro sur, mirando a la calle (no si el sur da a otro edificio)
        o = None if "S" in sin else texto(col, nombre + "_Rotulo_Fachada", rotulo, (x0 + x1) / 2, y0 - 0.2, h - 2.4,
                  min(1.6, 0.6 * (x1 - x0) / (0.62 * len(rotulo))), "M_Rojo_PATY")
        if o is not None:
            o.rotation_euler = (math.pi / 2, 0, 0)
    return col


def _techo(col, nombre, x0, x1, y0, y1, h, cumbrera_en_x):
    """Techo a dos aguas como el de la nave actual (agua de 0,12 m, cumbrera roja, cerchas cada 8 m)."""
    pend = 2.0  # sube 2 m hasta la cumbrera
    e = 0.5
    if cumbrera_en_x:
        ym = (y0 + y1) / 2
        for lado, (ya, yb) in (("S", (y0 - e, ym)), ("N", (ym, y1 + e))):
            za, zb = (h, h + pend) if lado == "S" else (h + pend, h)
            v = [(x0 - e, ya, za), (x1 + e, ya, za), (x1 + e, yb, zb), (x0 - e, yb, zb)]
            v += [(x, y, z + 0.12) for x, y, z in v]
            _losa(col, f"{nombre}_Techo_Agua_{lado}", v)
        caja(col, nombre + "_Cumbrera", x0 - e, x1 + e, ym - 0.5, ym + 0.5, h + pend + 0.05, h + pend + 0.2, "M_Rojo_PATY")
        n = max(1, round((x1 - x0) / PASO_COL))
        for i in range(n + 1):
            x = x0 + (x1 - x0) * i / n
            caja(col, f"{nombre}_Cercha_{i:02d}", x - 0.12, x + 0.12, y0, y1, h - 0.5, h, "M_Metal_Estructura")
    else:
        xm = (x0 + x1) / 2
        for lado, (xa, xb) in (("O", (x0 - e, xm)), ("E", (xm, x1 + e))):
            za, zb = (h, h + pend) if lado == "O" else (h + pend, h)
            v = [(xa, y0 - e, za), (xb, y0 - e, zb), (xb, y1 + e, zb), (xa, y1 + e, za)]
            v += [(x, y, z + 0.12) for x, y, z in v]
            _losa(col, f"{nombre}_Techo_Agua_{lado}", v)
        caja(col, nombre + "_Cumbrera", xm - 0.5, xm + 0.5, y0 - e, y1 + e, h + pend + 0.05, h + pend + 0.2, "M_Rojo_PATY")
        n = max(1, round((y1 - y0) / PASO_COL))
        for i in range(n + 1):
            y = y0 + (y1 - y0) * i / n
            caja(col, f"{nombre}_Cercha_{i:02d}", x0, x1, y - 0.12, y + 0.12, h - 0.5, h, "M_Metal_Estructura")


def _losa(col, name, v):
    f = [(0, 1, 2, 3), (7, 6, 5, 4), (0, 4, 5, 1), (1, 5, 6, 2), (2, 6, 7, 3), (3, 7, 4, 0)]
    me = bpy.data.meshes.new(name)
    me.from_pydata(v, [], f)
    me.materials.append(mat("M_Panel_Sandwich"))
    o = bpy.data.objects.new(name, me)
    col.objects.link(o)
    return o




# --------------------------------------------------------------------------- decorado viejo
# Terrenos nuevos (bbox xy). El predio actual (x ±127, frente sur en y ≈ −87) se respeta: lo nuevo va al
# oeste de x = −135 y al norte de la nave (ampliación de Elaborados y calle norte).
ZONAS_NUEVAS = [(-465, -135, -86, 185), (-80, 80, 35.3, 185), (-135, 130, 140, 185)]
RETIRAR_POR_NOMBRE = ("Cerco_Perimetral", "Postes_Luz", "Calle_Interna_Norte", "Galpon_Vecino_5")
RETIRABLES = ("00_ENTORNO", "06_PERSONAS", "07_VEHICULOS", "08_VEGETACION", "09_ILUMINACION", "10_CARTELES_SUELO")


def _bbox_xy(o):
    from mathutils import Vector
    ws = [o.matrix_world @ Vector(v) for v in o.bound_box]
    return min(w.x for w in ws), max(w.x for w in ws), min(w.y for w in ws), max(w.y for w in ws)


def retirar_decorado():
    ret = coleccion("ZZ_RETIRADO")
    n = 0
    for cn in RETIRABLES:
        c = bpy.data.collections.get(cn)
        if c is None:
            continue
        for o in list(c.objects):
            if o.type not in ("MESH", "CURVE", "FONT", "EMPTY"):
                continue
            x0, x1, y0, y1 = _bbox_xy(o)
            if max(x1 - x0, y1 - y0) > 300:      # suelos base (campos de 1200 m) quedan
                continue
            cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
            dentro = any(a < cx < b and c_ < cy < d for a, b, c_, d in ZONAS_NUEVAS)
            if dentro or o.name.startswith(RETIRAR_POR_NOMBRE):
                c.objects.unlink(o)
                ret.objects.link(o)
                n += 1
    lc = bpy.context.view_layer.layer_collection.children.get("ZZ_RETIRADO")
    if lc:
        lc.exclude = True
    print("decorado retirado:", n)


# --------------------------------------------------------------------------- planta
def f1():
    raiz = coleccion("F1_PLANTA_COMPLETA")
    vaciar(raiz)
    retirar_decorado()
    P = raiz
    pt = (4.0, 4.5)  # portón de muelle: ancho, alto

    # Elaborados: ampliación L1–L6 al norte; la pared norte actual (y = 35) queda como divisoria.
    edificio("EL_Ampliacion_L1_L6", -75, 75, 35, 160, sin=("S",), parent=P, rotulo="ELABORADOS  L1 – L6",
             vanos={"O": [(63, 5, 4.5), (103, 5, 4.5), (143, 5, 4.5)], "E": [(63, 5, 4.5), (103, 5, 4.5), (143, 5, 4.5)]})

    # Ciclo 2: cuarteo, desposte, encajado y charqueo, frente a la recepción de MP de Elaborados
    edificio("C2_Desposte", -210, -135, -30, 70, h=8.0, parent=P, rotulo="CICLO 2  DESPOSTE", cumbrera_en_x=False,
             vanos={"E": [(-10, 5, 4.5), (30, 3, 3)], "S": [(-185, *pt), (-160, *pt)], "O": [(11, 3, 4.5)]})
    edificio("C2_Pasillo_Cajas", -192, -153, -35, -30, h=5.0, sin=("N", "S"), parent=P)
    edificio("C2_Camaras_Cajas", -210, -135, -65, -35, h=9.0, parent=P, rotulo="TÚNELES Y CÁMARAS DE CAJAS",
             vanos={"S": [(x, 3.5, 4.0) for x in (-200, -190, -180, -165, -155, -145)], "N": [(-185, *pt), (-160, *pt)]})

    # Ciclo 1: cámaras de oreo, abasto, playa de faena, subproductos y corrales
    edificio("C1_Camaras_Oreo", -275, -210, -30, 70, h=9.0, parent=P, rotulo="CÁMARAS DE OREO", cumbrera_en_x=False,
             vanos={"O": [(11, 3, 4.5)], "E": [(11, 3, 4.5)], "S": [(-242, *pt)]})
    edificio("C1_Pasillo_Abasto", -247, -237, -35, -30, h=5.0, sin=("N", "S"), parent=P)
    edificio("C1_Abasto", -275, -210, -65, -35, h=8.0, parent=P, rotulo="ABASTO",
             vanos={"S": [(x, 3.5, 4.0) for x in (-262, -248, -234, -220)], "N": [(-242, *pt)]})
    edificio("C1_Playa_Faena", -355, -275, -10, 50, h=12.0, parent=P, rotulo="CICLO 1  PLAYA DE FAENA",
             vanos={"O": [(35, 3, 3.5)], "E": [(11, 3, 4.5)], "S": [(-330, 3, 3.5), (-300, 3, 3.5)]})
    edificio("C1_Pasillo_Sub", -335, -295, -15, -10, h=5.0, sin=("N", "S"), parent=P)
    edificio("C1_Subproductos", -355, -275, -65, -15, h=8.0, parent=P, rotulo="MENUDENCIAS · DIGESTOR · CUEROS",
             vanos={"N": [(-330, 3, 3.5), (-300, 3, 3.5)], "S": [(-340, 3.5, 4.0), (-290, 3.5, 4.0)]})

    # Servicios y personal
    edificio("SV_Sala_Maquinas", -355, -290, 85, 130, h=9.0, parent=P, rotulo="SALA DE MÁQUINAS (FRÍO)",
             vanos={"S": [(-322, 4, 4.5)]})
    edificio("SV_Calderas", -280, -240, 85, 115, h=10.0, parent=P, rotulo="CALDERAS", vanos={"S": [(-260, 4, 4.5)]})
    edificio("SV_Personal", -210, -150, 85, 115, h=7.0, parent=P, rotulo="VESTUARIOS · COMEDOR · OFICINAS",
             vanos={"S": [(-180, 2.5, 2.6)], "N": [(-180, 1.6, 2.4)]})

    _corrales(coleccion("F1_C1_Corrales", P))
    _patios(coleccion("F1_PATIOS_Y_CALLES", P))
    _cerco(coleccion("F1_CERCO", P))
    print("F1 lista")


def _corrales(col):
    """Corrales a cielo abierto con manga hasta el cajón de noqueo (entra a la playa por el oeste, y = 35)."""
    x0, x1, y0, y1 = -455, -370, -40, 80
    caja(col, "Corrales_Piso", x0, x1, y0, y1, -0.45, 0.02, "M_Hormigon_Piso")
    ancho, largo, k = 10.0, 13.0, 0
    for i in range(int((x1 - x0) // ancho)):
        for j in range(int((y1 - y0 - 8) // largo)):
            cx0 = x0 + i * ancho
            cy0 = y0 + j * largo + (8 if j >= 4 else 0)  # calle de arreo de 8 m al medio
            for (a, b, c, d) in ((cx0, cx0 + ancho, cy0, cy0 + 0.1), (cx0, cx0 + 0.1, cy0, cy0 + largo)):
                caja(col, f"Corral_{k:03d}_Baranda", a, b, c, d, 0, 1.6, "M_Metal_Estructura")
                k += 1
    caja(col, "Corrales_Baranda_Norte", x0, x1, y1 - 0.1, y1, 0, 1.6, "M_Metal_Estructura")
    caja(col, "Corrales_Baranda_Este", x1 - 0.1, x1, y0, y1, 0, 1.6, "M_Metal_Estructura")
    # manga: arco desde la calle de arreo (y ≈ 20) hasta la puerta oeste de la playa (y = 35)
    cx, cy, r = -370, 27.5, 7.5
    pts = [(cx + r * math.cos(math.radians(a)), cy + r * math.sin(math.radians(a))) for a in range(-90, 91, 10)]
    for i in range(len(pts) - 1):
        (px, py), (qx, qy) = pts[i], pts[i + 1]
        for s, off in (("a", -0.45), ("b", 0.45)):
            caja(col, f"Manga_{i:02d}_{s}", min(px, qx) - 0.05, max(px, qx) + 0.05,
                 min(py, qy) + off - 0.05, max(py, qy) + off + 0.05, 0, 1.8, "M_Gris_Puerta")
    caja(col, "Manga_Recta_a", -370, -355, 34.5, 34.6, 0, 1.8, "M_Gris_Puerta")
    caja(col, "Manga_Recta_b", -370, -355, 35.4, 35.5, 0, 1.8, "M_Gris_Puerta")
    caja(col, "Bascula_Hacienda", -440, -424, 88, 92, 0, 0.3, "M_Metal_Estructura")
    caja(col, "Rampa_Descarga_Jaula", -410, -404, 80, 88, 0, 1.2, "M_Hormigon_Piso")
    texto(col, "Corrales_Rotulo", "CORRALES", (x0 + x1) / 2, (y0 + y1) / 2 - 4, 0.05, 6, "M_Blanco_Senda")


def _patios(col):
    """Patios y calles nuevas; quedan 1,2 cm sobre las viejas para no superponerse."""
    for nm, a in {
        "Calle_C2_Elab": (-135, -125, -82.5, 165),     # entre Ciclo 2 y la playa oeste actual
        "Patio_Sur_Oeste": (-460, -136, -101.5, -65),  # muelles de cajas, abasto y subproductos
        "Patio_Norte_Oeste": (-460, -135, 70, 85),
        "Calle_Norte": (-460, 130, 165, 180),
        "Patio_Ampliacion_Este": (75, 127, 52, 165),
        "Patio_Ampliacion_Oeste": (-125, -75, 52, 165),
        "Playa_Jaulas": (-460, -370, 80, 100),
        "Calle_Faena": (-370, -355, -65, 85),
    }.items():
        caja(col, nm, *a, -0.45, 0.012, "M_Asfalto")
    for i, x in enumerate(range(-456, 126, 6)):
        caja(col, f"Senda_Norte_{i:03d}", x, x + 3, 172.3, 172.7, 0.012, 0.022, "M_Blanco_Senda")


# Cerco: al este del bloque oeste va detrás de la calle pública existente (y = -82,5); el bloque oeste baja
# hasta y = -102 para que entren los camiones de los muelles. Portones (centro, ancho) sobre cada tramo.
CERCO = [((-465, -102), (-136, -102)), ((-136, -102), (-136, -82.5)), ((-136, -82.5), (130, -82.5)),
         ((130, -82.5), (130, 185)), ((130, 185), (-465, 185)), ((-465, 185), (-465, -102))]
PORTONES = {0: [(-300, 10), (-180, 10)], 4: [(-407, 10), (-130, 10), (100, 10), (-180, 2)]}
CERRADOS = {(0, -300), (0, -180), (4, 100)}   # salidas de emergencia: el camión entra y sale por la báscula


def _cerco(col):
    k = 0
    for si, (p0, p1) in enumerate(CERCO):
        en_x = p0[1] == p1[1]
        a0, a1 = (p0[0], p1[0]) if en_x else (p0[1], p1[1])
        lo, hi = min(a0, a1), max(a0, a1)
        cortes = sorted(PORTONES.get(si, []))
        tramos, cur = [], lo
        for c, w in cortes:
            tramos.append((cur, c - w / 2))
            cur = c + w / 2
        tramos.append((cur, hi))
        fijo = p0[1] if en_x else p0[0]
        for ti, (u0, u1) in enumerate(tramos):
            if en_x:
                caja(col, f"Cerco_Nuevo_{si}_{ti}", u0, u1, fijo - 0.04, fijo + 0.04, 0.1, 2.1, "M_Alambrado")
            else:
                caja(col, f"Cerco_Nuevo_{si}_{ti}", fijo - 0.04, fijo + 0.04, u0, u1, 0.1, 2.1, "M_Alambrado")
            u = u0
            while u <= u1 + 0.01:
                x, y = (u, fijo) if en_x else (fijo, u)
                caja(col, f"Cerco_Poste_{k:04d}", x - 0.05, x + 0.05, y - 0.05, y + 0.05, 0, 2.2, "M_Metal_Estructura")
                k += 1
                u += 5
        for c, w in cortes:  # portón corredizo abierto, estacionado al costado, con pilares
            for s_ in (-1, 1):
                x, y = (c + s_ * w / 2, fijo) if en_x else (fijo, c + s_ * w / 2)
                caja(col, f"Porton_{si}_{c}_Pilar_{s_}", x - 0.2, x + 0.2, y - 0.2, y + 0.2, 0, 2.6, "M_Hormigon_Piso")
            cerrado = (si, c) in CERRADOS
            a0_, a1_ = (c - w / 2, c + w / 2) if cerrado else (c + w / 2, c + w / 2 + w)
            if w <= 2:  # puerta peatonal con molinete
                caja(col, f"Molinete_{si}_{c}", c - 0.4, c + 0.4, fijo - 0.6, fijo + 0.6, 0, 1.0, "M_Inox")
                caja(col, f"Molinete_{si}_{c}_Brazos", c - 0.5, c + 0.5, fijo - 0.03, fijo + 0.03, 0.9, 0.95, "M_Inox_Cepillado")
            elif en_x:
                caja(col, f"Porton_{si}_{c}_Hoja", a0_, a1_, fijo + 0.15, fijo + 0.25, 0.1, 2.0, "M_Amarillo_Seg")
            else:
                caja(col, f"Porton_{si}_{c}_Hoja", fijo + 0.15, fijo + 0.25, a0_, a1_, 0.1, 2.0, "M_Amarillo_Seg")
            if cerrado:
                texto(col, f"Porton_{si}_{c}_Cartel", "SALIDA DE EMERGENCIA", c, fijo + 0.3, 2.3, 0.35, "M_Emergencia_Verde")
                bpy.data.objects[f"Porton_{si}_{c}_Cartel"].rotation_euler = (math.pi / 2, 0, math.pi if si == 4 else 0)
