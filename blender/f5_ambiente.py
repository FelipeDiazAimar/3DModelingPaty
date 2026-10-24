"""F5 del PLAN_MODELO_3D.md: ambiente y lectura de la planta completa.

    R = r"<repo>/blender/"
    for f in ("f1_masas.py", "kit.py", "f2_ciclo1.py", "f5_ambiente.py"): exec(open(R + f, encoding="utf-8").read())
    f5()

Idempotente: rehace solo F5_AMBIENTE. Luminarias LED en todas las naves nuevas, carteles de SALIDA sobre las
puertas de personal, alumbrado de calles, arbolado, estacionamiento del personal y camiones jaula.
Reutiliza de la escena el pino, el árbol de copa y el auto estacionado (kit_desde_escena) y el árbol de
Poly Haven ya reducido (malla Arbol_PolyHaven_Liviano).
"""
import math
import random

import bpy
import bmesh

# naves nuevas: (x0, x1, y0, y1, altura de luminaria)
NAVES = {
    "EL_Ampliacion_L1_L6": (-75, 75, 35, 160, 6.2), "C2_Desposte": (-210, -135, -30, 70, 7.2),
    "C2_Camaras_Cajas": (-210, -135, -65, -35, 6.9), "C1_Camaras_Oreo": (-275, -210, -30, 70, 6.2),
    "C1_Abasto": (-275, -210, -65, -35, 7.2), "C1_Playa_Faena": (-355, -275, -10, 50, 10.8),
    "C1_Subproductos": (-355, -275, -65, -15, 7.2), "SV_Sala_Maquinas": (-355, -290, 85, 130, 8.2),
    "SV_Calderas": (-280, -240, 85, 115, 9.2), "SV_Personal": (-210, -150, 85, 115, 6.2),
}


def kit_ambiente():
    bm = bmesh.new()                                   # luminaria LED colgante (campana lineal)
    caja_bm(bm, -0.6, 0.6, -0.12, 0.12, 0.0, 0.08, 0)
    caja_bm(bm, -0.58, 0.58, -0.1, 0.1, -0.01, 0.0, 1)
    caja_bm(bm, -0.01, 0.01, -0.01, 0.01, 0.08, 0.6, 0)
    _nuevo("KIT_Luminaria", bm, ["M_Metal_Estructura", "M_LED_Blanco"])
    bm = bmesh.new()                                   # aplique LED de pared (wall-pack); la pared está en y = 0
    caja_bm(bm, -0.2, 0.2, 0.0, 0.04, -0.2, 0.2, 0)
    caja_bm(bm, -0.04, 0.04, 0.04, 0.35, -0.04, 0.04, 0)
    caja_bm(bm, -0.38, 0.38, 0.3, 0.62, -0.12, 0.02, 0)
    caja_bm(bm, -0.35, 0.35, 0.32, 0.6, -0.125, -0.12, 1)
    _nuevo("KIT_Aplique", bm, ["M_Metal_Estructura", "M_LED_Blanco"])
    bm = bmesh.new()                                   # columna de alumbrado de calle (9 m, brazo)
    cil_bm(bm, 0, 0, 0.0, 9.0, 0.09, 8, 0)
    caja_bm(bm, 0.0, 1.6, -0.04, 0.04, 8.8, 8.9, 0)
    caja_bm(bm, 1.2, 1.9, -0.18, 0.18, 8.65, 8.85, 0)
    caja_bm(bm, 1.25, 1.85, -0.15, 0.15, 8.63, 8.65, 1)
    cil_bm(bm, 0, 0, 0.0, 0.5, 0.2, 8, 2)
    _nuevo("KIT_Poste_Luz", bm, ["M_Metal_Estructura", "M_LED_Blanco", "M_Hormigon_Piso"])
    bm = bmesh.new()                                   # cartel luminoso de salida
    caja_bm(bm, -0.3, 0.3, -0.04, 0.04, 0.0, 0.22, 0)
    caja_bm(bm, -0.25, 0.05, -0.045, 0.045, 0.05, 0.17, 1)
    _nuevo("KIT_Cartel_Salida", bm, ["M_Emergencia_Verde", "M_Blanco_Senda"])
    bm = bmesh.new()                                   # camión jaula de hacienda (acoplado de 2 pisos + tractor)
    caja_bm(bm, -7.0, 6.5, -1.25, 1.25, 1.1, 1.3, 0)                 # piso del acoplado
    for k in range(6):                                                 # barandas horizontales (jaula)
        z = 1.5 + k * 0.55
        for s in (-1, 1):
            caja_bm(bm, -7.0, 6.5, s * 1.25 - 0.03, s * 1.25 + 0.03, z, z + 0.12, 1)
    for k in range(9):                                                 # parantes
        x = -7.0 + k * 1.69
        for s in (-1, 1):
            caja_bm(bm, x - 0.05, x + 0.05, s * 1.25 - 0.05, s * 1.25 + 0.05, 1.3, 4.3, 1)
    caja_bm(bm, -7.0, 6.5, -1.25, 1.25, 4.3, 4.38, 1)
    caja_bm(bm, -7.0, 6.5, -1.2, 1.2, 2.7, 2.78, 0)                   # piso intermedio
    for x in (-5.5, -4.2, 3.5, 4.8):                                   # ruedas
        for s in (-1, 1):
            cil_bm(bm, x, 0.5, s * 1.3 - 0.15, s * 1.3 + 0.15, 0.5, 10, 2, eje="y")
    caja_bm(bm, 6.8, 9.2, -1.25, 1.25, 0.6, 3.5, 3)                   # tractor
    caja_bm(bm, 8.9, 9.25, -1.0, 1.0, 2.2, 3.2, 4)                    # parabrisas
    for x in (7.5, 8.7):
        for s in (-1, 1):
            cil_bm(bm, x, 0.5, s * 1.25 - 0.15, s * 1.25 + 0.15, 0.5, 10, 2, eje="y")
    _nuevo("KIT_Camion_Jaula", bm, ["M_Metal_Estructura", "M_Gris_Puerta", "M_Goma", "M_Cabina_Roja", "M_Vidrio"])
    kit_desde_escena("KIT_Pino", "Pino_05_")
    kit_desde_escena("KIT_Arbol_Copa", "Arbol_Copa_04_")
    kit_desde_escena("KIT_Auto", "Auto_Estacionado_1_")
    # El árbol de Poly Haven (1,15 M caras; reducido a 50.800 y aun así el 22 % de lo dibujado) era el único de
    # otro estilo: todas sus copias pasan a usar el árbol de copa low-poly del resto de la planta.
    # KIT_Arbol_PH queda como alias del árbol de copa para no romper los scripts que lo nombran.
    copa = bpy.data.objects["KIT_Arbol_Copa"].data
    for nm in ("Arbol_PolyHaven_Liviano",):
        me_ph = bpy.data.meshes.get(nm)
        if me_ph is not None:
            for o in bpy.data.objects:
                if o.type == "MESH" and o.data == me_ph:
                    o.data = copa
            if me_ph.users == 0:
                bpy.data.meshes.remove(me_ph)
    o = bpy.data.objects.get("KIT_Arbol_PH")
    if o is None:
        o = bpy.data.objects.new("KIT_Arbol_PH", copa)
        bpy.data.collections[KIT].objects.link(o)
    o.data = copa

def f5():
    raiz = coleccion("F5_AMBIENTE")
    vaciar(raiz)
    kit_ambiente()
    rnd = random.Random(51)

    # apliques LED en las paredes interiores cada 10 m (sin techos, una luminaria colgante quedaría flotando)
    lum = coleccion("F5_Luminarias", raiz)
    n = 0
    naves = dict(NAVES)
    naves["Nave_Original_L7_L8"] = (-75, 75, -35, 35, 6.2)
    for nm, (x0, x1, y0, y1, z) in naves.items():
        z = min(z - 0.8, 5.6)
        for lado, (p0, p1, fijo, rz) in {"S": (x0, x1, y0 + 0.13, 0.0), "N": (x0, x1, y1 - 0.13, math.pi),
                                          "O": (y0, y1, x0 + 0.13, -math.pi / 2), "E": (y0, y1, x1 - 0.13, math.pi / 2)}.items():
            if nm == "EL_Ampliacion_L1_L6" and lado == "S":
                continue  # muro divisorio: ya lo iluminan los apliques del lado norte de la nave original
            m = max(1, int((p1 - p0) // 10))
            for i in range(m):
                u = p0 + (p1 - p0) * (i + 0.5) / m
                loc = (u, fijo, z) if lado in "SN" else (fijo, u, z)
                poner("KIT_Aplique", lum, loc, rz, f"Aplique_{nm}_{lado}_{i:02d}")
                n += 1
    print("apliques de pared:", n)

    # carteles de SALIDA sobre cada puerta de personal (vanos de menos de 3,6 m de alto), a los dos lados del muro
    sal = coleccion("F5_Salidas", raiz)
    from mathutils import Vector
    k = 0
    for o in bpy.data.collections["F1_PLANTA_COMPLETA"].all_objects:
        if "_dintel" not in o.name or o.name.endswith("_marco") or o.type != "MESH":
            continue
        ws = [o.matrix_world @ Vector(v) for v in o.bound_box]
        z0 = min(w.z for w in ws)
        if z0 > 3.6:
            continue
        cx = (min(w.x for w in ws) + max(w.x for w in ws)) / 2
        cy = (min(w.y for w in ws) + max(w.y for w in ws)) / 2
        en_x = (max(w.x for w in ws) - min(w.x for w in ws)) > (max(w.y for w in ws) - min(w.y for w in ws))
        for s in (-1, 1):
            loc = (cx, cy + s * 0.2, z0 + 0.25) if en_x else (cx + s * 0.2, cy, z0 + 0.25)
            rz = 0.0 if en_x else math.pi / 2
            poner("KIT_Cartel_Salida", sal, loc, rz, f"Salida_{k:03d}")
            k += 1
    print("carteles de salida:", k)

    # alumbrado de calles nuevas
    pl = coleccion("F5_Alumbrado", raiz)
    k = 0
    for x in range(-455, 126, 30):
        if -163 < x < -134:
            continue  # playa de báscula
        poner("KIT_Poste_Luz", pl, (x, 163.9, 0), math.pi / 2, f"Poste_Norte_{k:02d}"); k += 1
    for y in range(-80, 161, 30):
        poner("KIT_Poste_Luz", pl, (-124.3, y, 0), math.pi, f"Poste_C2_Elab_{k:02d}"); k += 1
    for x in range(-455, -140, 30):
        poner("KIT_Poste_Luz", pl, (x, -100.8, 0), math.pi / 2, f"Poste_Sur_Oeste_{k:02d}"); k += 1
    for y in range(55, 161, 30):
        poner("KIT_Poste_Luz", pl, (125.5, y, 0), math.pi, f"Poste_Este_{k:02d}"); k += 1
    for x in range(-450, -140, 40):
        poner("KIT_Poste_Luz", pl, (x, 84.4, 0), -math.pi / 2, f"Poste_Norte_Oeste_{k:02d}"); k += 1

    # arbolado: cortina contra el cerco norte y oeste, y grupo frente al edificio del personal
    ve = coleccion("F5_Vegetacion", raiz)
    kits = ["KIT_Pino", "KIT_Arbol_Copa"]  # livianos; el de Poly Haven (50 mil caras) solo frente a vestuarios
    k = 0
    for x in range(-458, 126, 11):
        if any(abs(x - c) < 9 for c in (-407, -130, 100)):
            continue  # frente a los portones norte
        poner(rnd.choice(kits), ve, (x + rnd.uniform(-2, 2), 182.0 + rnd.uniform(-0.8, 0.8), 0), rnd.uniform(0, 6.28),
              f"Arbol_Norte_{k:03d}", rnd.uniform(0.85, 1.2)); k += 1
    for y in range(-80, 180, 11):
        poner(rnd.choice(kits), ve, (-462.0 + rnd.uniform(-0.8, 0.8), y + rnd.uniform(-2, 2), 0), rnd.uniform(0, 6.28),
              f"Arbol_Oeste_{k:03d}", rnd.uniform(0.85, 1.2)); k += 1
    for i in range(8):  # (al este empieza la playa de báscula)
        poner("KIT_Arbol_PH" if i % 2 == 0 else "KIT_Arbol_Copa", ve, (-208 + i * 6.0, 118.5 + rnd.uniform(-0.5, 0.5), 0), rnd.uniform(0, 6.28),
              f"Arbol_Personal_{i}", 1.1)
    for i in range(6):  # sombra en la calle de arreo de los corrales
        poner("KIT_Arbol_Copa", ve, (-450 + i * 15.0, 16.0, 0), 0.0, f"Arbol_Corrales_{i}", 1.1)
    print("árboles:", k + 16)

    # estacionamiento del personal frente a vestuarios (patio norte oeste)
    es = coleccion("F5_Estacionamiento", raiz)
    for i in range(22):
        x = -208.5 + i * 2.7
        for fila, y in ((0, 76.0), (1, 82.0)):
            caja(es, f"Estac_Linea_{i}_{fila}", x - 0.06, x + 0.06, y - 2.4, y + 2.4, 0.012, 0.022, "M_Blanco_Senda")
            if rnd.random() < 0.75 and i < 21:
                poner("KIT_Auto", es, (x + 1.35, y, 0), math.pi / 2 + (math.pi if fila else 0) + rnd.uniform(-0.05, 0.05),
                      f"Auto_Personal_{i}_{fila}")
    texto(es, "Rotulo_Estacionamiento", "ESTACIONAMIENTO PERSONAL", -180, 79, 0.03, 0.7, "M_Blanco_Senda")

    # camiones jaula esperando la descarga en la rampa de hacienda
    cj = coleccion("F5_Hacienda_Camiones", raiz)
    poner("KIT_Camion_Jaula", cj, (-407.0, 95.5, 0), math.pi / 2, "Camion_Jaula_Descarga")
    poner("KIT_Camion_Jaula", cj, (-425.0, 94.0, 0), math.pi / 2 + 0.05, "Camion_Jaula_Espera_1")
    poner("KIT_Camion_Jaula", cj, (-443.0, 94.0, 0), math.pi / 2 - 0.04, "Camion_Jaula_Espera_2")

    objs = [o for o in raiz.all_objects if o.type == "MESH"]
    print("F5:", len(objs), "objetos,", sum(len(o.data.polygons) for o in objs), "caras dibujadas,",
          len({o.data.name for o in objs}), "mallas distintas")


# --------------------------------------------------------------------------- techos fuera, exterior
def quitar_techos():
    """Excluye techos y cielorrasos de la escena (no se borran: se vuelven a ver con lc.exclude = False).
    Hay que correrlo después de f1()/f2()/f3()/f4(), que los recrean."""
    n = 0

    def walk(lc):
        nonlocal n
        for ch in lc.children:
            if ch.name.endswith("_TECHO") or "Cielorraso" in ch.name:
                ch.exclude = True
                n += 1
            else:
                walk(ch)
    walk(bpy.context.view_layer.layer_collection)
    print("colecciones de techo excluidas:", n)


# calles exteriores nuevas (x0, x1, y0, y1)
CALLES_EXT = {
    "Calle_Publica_Sur_Oeste": (-620, -128, -112, -105),
    "Calle_Publica_Conector": (-136, -128, -105, -84),
    "Calle_Publica_Este": (130, 620, -90, -84),
    "Ruta_Norte": (-620, 620, 196, 206),
    "Calle_Oeste": (-492, -482, -112, 196),
    "Acceso_Norte_Hacienda": (-412, -402, 185, 196),
    "Acceso_Norte_C2": (-135, -125, 185, 196),
}
VEREDAS = {
    "Vereda_Sur_Oeste_N": (-620, -136, -104.6, -102.6), "Vereda_Sur_Oeste_S": (-620, -128, -114.5, -112.5),
    "Vereda_Este_S": (130, 620, -92.5, -90.5), "Banquina_Ruta_S": (-620, 620, 194, 196), "Banquina_Ruta_N": (-620, 620, 206, 208),
    "Vereda_Oeste_O": (-494.5, -492.5, -112, 194), "Vereda_Oeste_E": (-482, -480, -112, 194),
}


def _demarcacion(col, nombre, x0, x1, y0, y1):
    """Línea central discontinua y bordes continuos según el sentido largo de la calle."""
    en_x = (x1 - x0) >= (y1 - y0)
    if en_x:
        yc = (y0 + y1) / 2
        for i, x in enumerate(range(int(x0) + 2, int(x1) - 3, 9)):
            caja(col, f"{nombre}_Linea_{i:03d}", x, x + 4.5, yc - 0.08, yc + 0.08, 0.012, 0.02, "M_Blanco_Senda")
        if y1 - y0 >= 9:
            for s, yy in (("a", y0 + 0.4), ("b", y1 - 0.55)):
                caja(col, f"{nombre}_Borde_{s}", x0, x1, yy, yy + 0.15, 0.012, 0.02, "M_Blanco_Senda")
    else:
        xc = (x0 + x1) / 2
        for i, y in enumerate(range(int(y0) + 2, int(y1) - 3, 9)):
            caja(col, f"{nombre}_Linea_{i:03d}", xc - 0.08, xc + 0.08, y, y + 4.5, 0.012, 0.02, "M_Blanco_Senda")


def _cebra(col, nombre, x0, x1, y, ancho=3.0):
    """Senda peatonal (cebra) que cruza en x entre x0 y x1, centrada en y."""
    for i in range(int((x1 - x0) / 1.0)):
        x = x0 + i * 1.0
        caja(col, f"{nombre}_{i:02d}", x, x + 0.5, y - ancho / 2, y + ancho / 2, 0.012, 0.022, "M_Blanco_Senda")


def _ocupado():
    """Rectángulos donde no va vegetación: edificios, patios, calles, corrales y el predio original."""
    from mathutils import Vector
    rects = [(-136, 130, -90, 90)]               # predio original (tiene su propio parque)
    for cn in ("F1_PLANTA_COMPLETA",):
        for o in bpy.data.collections[cn].all_objects:
            if o.type != "MESH" or not (o.name.endswith("_Piso") or o.users_collection[0].name == "F1_PATIOS_Y_CALLES"):
                continue
            ws = [o.matrix_world @ Vector(v) for v in o.bound_box]
            rects.append((min(w.x for w in ws), max(w.x for w in ws), min(w.y for w in ws), max(w.y for w in ws)))
    rects += list(CALLES_EXT.values()) + list(VEREDAS.values())
    rects.append((-212, -146, 70, 86))            # estacionamiento del personal
    rects += EXTRA_OCUPADO
    sv = bpy.data.collections.get("F5_SERVICIOS")
    if sv:                                          # condensadores, reguladora de gas, rack y soportes
        for o in sv.all_objects:
            if o.type == "MESH" and o.name.startswith(("Condensador", "Estacion_Gas", "Rack_Canerias", "Soporte")):
                ws = [o.matrix_world @ Vector(v) for v in o.bound_box]
                rects.append((min(w.x for w in ws), max(w.x for w in ws), min(w.y for w in ws), max(w.y for w in ws)))
    return rects


EXTRA_OCUPADO = [(-162, -135, 118, 165),        # playa de báscula
                 (-181.2, -178.8, 115, 185),       # sendero peatonal parada -> vestuarios
                 (-196, -184, 186, 194),           # parada de colectivo
                 (-181.2, -178.8, 185, 194),       # sendero sobre la banquina
                 (-455, -398, 86, 103)]            # camiones jaula esperando la descarga


def _libre(rects, x, y, m):
    return not any(a - m < x < b + m and c - m < y < d + m for a, b, c, d in rects)


def f5_exterior():
    raiz = coleccion("F5_EXTERIOR")
    vaciar(raiz)
    material("M_Pasto_Predio", (0.2, 0.44, 0.13), 0.9)
    material("M_Pasto_Campo", (0.3, 0.5, 0.17), 0.9)
    material("M_Lote_Trigo", (0.62, 0.55, 0.26), 0.9)
    material("M_Lote_Soja", (0.25, 0.42, 0.12), 0.9)
    material("M_Lote_Rastrojo", (0.45, 0.38, 0.24), 0.9)
    rnd = random.Random(61)

    # pasto: predio completo, campo alrededor y lotes rurales
    pa = coleccion("F5_Pasto", raiz)
    # capas bien separadas en altura para que no titilen: campo -0,25 / lotes -0,20 / base del predio -0,15;
    # el césped visible del predio va elevado +0,05 sobre el asfalto (_cesped_elevado)
    retirar_suelo_viejo()
    caja(pa, "Pasto_Predio", -470, 135, -104, 190, -0.3, -0.15, "M_Pasto_Predio")
    caja(pa, "Pasto_Campo", -620, 620, -620, 620, -0.4, -0.25, "M_Pasto_Campo")
    lotes = ("M_Lote_Trigo", "M_Lote_Soja", "M_Lote_Rastrojo", "M_Pasto_Campo")
    k = 0
    for i in range(-3, 3):
        for j in range(-3, 3):
            x0, y0 = i * 200 + 10, j * 200 + 10
            x1, y1 = x0 + 180, y0 + 180
            if x1 > -500 and x0 < 140 and y1 > -120 and y0 < 215:
                continue  # planta y calles
            caja(pa, f"Lote_{k:02d}", x0, x1, y0, y1, -0.25, -0.2, lotes[(i * 7 + j * 3) % 4])
            k += 1

    # calles exteriores, veredas, demarcación y sendas
    ca = coleccion("F5_Calles", raiz)
    for nm, a in CALLES_EXT.items():
        caja(ca, nm, *a, -0.45, 0.012, "M_Asfalto")
        if not nm.startswith(("Acceso", "Calle_Publica_Conector")):
            _demarcacion(ca, nm, *a)
    for nm, a in VEREDAS.items():
        caja(ca, nm, *a, -0.45, 0.1 if nm.startswith("Vereda") else 0.02, "M_Vereda" if nm.startswith("Vereda") else "M_Cordon")
    _demarcacion(ca, "Calle_Norte_Bordes", -460, 130, 165, 180)
    for c in (-407, -130):
        _cebra(ca, f"Cebra_Ruta_{c}", c - 5, c + 5, 194.8, 1.6)
    texto(ca, "Rotulo_Ruta", "RUTA PROVINCIAL", -250, 201, 0.03, 1.4, "M_Blanco_Senda")

    _cesped_elevado(pa)

    # árboles: cortinas a los dos lados de las calles exteriores y bosquecillos en los espacios libres del predio
    ar = coleccion("F5_Arboles_Exterior", raiz)
    kits = ["KIT_Pino", "KIT_Arbol_Copa", "KIT_Arbol_Copa"]
    accesos = [v for kk, v in CALLES_EXT.items() if kk.startswith("Acceso")]
    n = 0

    def plantar(x, y, kit=None, esc=None):
        nonlocal n
        if any(a - 3 < x < b + 3 and c - 3 < y < d + 3 for a, b, c, d in accesos):
            return
        if any(a - 1.5 < x < b + 1.5 and c - 1.5 < y < d + 1.5 for a, b, c, d in list(CALLES_EXT.values()) + list(VEREDAS.values()) + EXTRA_OCUPADO):
            return
        poner(kit or rnd.choice(kits), ar, (x, y, 0), rnd.uniform(0, 6.28), f"Arbol_Ext_{n:04d}", esc or rnd.uniform(0.8, 1.3))
        n += 1
    for x in range(-615, 616, 14):
        plantar(x + rnd.uniform(-2, 2), 191.5 + rnd.uniform(-0.5, 0.5))
        plantar(x + rnd.uniform(-2, 2), 210.5 + rnd.uniform(-0.8, 0.8))
    for y in range(-110, 192, 14):
        plantar(-497.5 + rnd.uniform(-0.5, 0.5), y + rnd.uniform(-2, 2))
        plantar(-476.5 + rnd.uniform(-0.5, 0.5), y + rnd.uniform(-2, 2))
    for x in range(-615, -140, 14):
        plantar(x + rnd.uniform(-2, 2), -117.5 + rnd.uniform(-0.5, 0.5))
    for x in range(136, 616, 14):
        plantar(x + rnd.uniform(-2, 2), -95.5 + rnd.uniform(-0.5, 0.5))
    rects = _ocupado()
    m_int = 0
    for gx in range(-462, 128, 9):
        for gy in range(-100, 184, 9):
            x, y = gx + rnd.uniform(-3, 3), gy + rnd.uniform(-3, 3)
            if _libre(rects, x, y, 3.0) and rnd.random() < 0.55:
                plantar(x, y)
                m_int += 1
    # arbustos en los bordes libres de los edificios (kit tomado del arbusto del frente)
    arb = next((o.name for o in bpy.data.objects if o.name.startswith("Arbusto_Frente") and o.type == "MESH"), None)
    nb = 0
    if arb:
        kit_desde_escena("KIT_Arbusto", arb)
        for gx in range(-462, 128, 4):
            for gy in range(-100, 184, 4):
                x, y = gx + rnd.uniform(-1.5, 1.5), gy + rnd.uniform(-1.5, 1.5)
                if _libre(rects, x, y, 1.0) and not _libre(rects, x, y, 3.0) and rnd.random() < 0.18:
                    poner("KIT_Arbusto", ar, (x, y, 0), rnd.uniform(0, 6.28), f"Arbusto_Ext_{nb:04d}", rnd.uniform(0.7, 1.3))
                    nb += 1
    print(f"exterior: {n} árboles ({m_int} dentro del predio), {nb} arbustos, {k} lotes rurales")
    objs = [o for o in raiz.all_objects if o.type == "MESH"]
    print("F5 exterior:", len(objs), "objetos,", sum(len(o.data.polygons) for o in objs), "caras dibujadas")


def retirar_suelo_viejo():
    """El campo beige original (Campo_*) queda por encima del pasto nuevo: se pasa a ZZ_RETIRADO (no se borra)."""
    ret = coleccion("ZZ_RETIRADO")
    n = 0
    for o in list(bpy.data.collections["00_ENTORNO"].objects):
        if o.name.startswith("Campo_"):
            bpy.data.collections["00_ENTORNO"].objects.unlink(o)
            ret.objects.link(o)
            n += 1
    lc = bpy.context.view_layer.layer_collection.children.get("ZZ_RETIRADO")
    if lc:
        lc.exclude = True
    print("suelo viejo retirado:", n)


def _celda_libre(rects, x0, x1, y0, y1, m):
    return not any(a - m < x1 and x0 < b + m and c - m < y1 and y0 < d + m for a, b, c, d in rects)


def _cesped_elevado(col, paso=0.5, alto=0.05):
    """Césped 5 cm sobre el asfalto en los espacios libres del predio nuevo, con 3 tonos de verde por manchas.
    Una sola malla armada por franjas (corridas de celdas libres de 1 m), con cordón de hormigón en el borde."""
    import bmesh
    material("M_Cesped_1", (0.2, 0.46, 0.13), 0.95)
    material("M_Cesped_2", (0.28, 0.54, 0.16), 0.95)
    material("M_Cesped_3", (0.14, 0.36, 0.09), 0.95)
    rects = _ocupado()
    bm = bmesh.new()
    x_a, x_b, y_a, y_b = -464.5, 129.5, -101.5, 184.5

    def tono(x, y):  # manchas de baja frecuencia, sin ruido aleatorio por celda
        v = math.sin(x * 0.045) + math.sin(y * 0.06 + 1.3) + math.sin((x + y) * 0.03)
        return 0 if v > 0.6 else (1 if v > -0.6 else 2)
    nf = 0
    y = y_a
    while y < y_b:
        x = x_a
        run0, run_t = None, None
        while x <= x_b:
            libre = x < x_b and _celda_libre(rects, x, x + paso, y, y + paso, 0.02)
            t = tono(x, y) if libre else None
            if run0 is not None and t != run_t:
                caja_bm(bm, run0, x, y, y + paso, -0.15, alto, run_t)
                nf += 1
                run0 = None
            if libre and run0 is None:
                run0, run_t = x, t
            x += paso
        y += paso
    o = _nuevo_obj(col, "Cesped_Predio", bm, ["M_Cesped_1", "M_Cesped_2", "M_Cesped_3"])
    print("césped elevado:", nf, "franjas,", len(o.data.polygons), "caras")


def _nuevo_obj(col, name, bm, mats):
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    for m in mats:
        me.materials.append(bpy.data.materials[m])
    o = bpy.data.objects.new(name, me)
    col.objects.link(o)
    return o
