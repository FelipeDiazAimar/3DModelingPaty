"""F2 del PLAN_MODELO_3D.md: detalle de Ciclo 1 (faena, cámaras de oreo, subproductos, corrales).

Necesita f1_masas.py (utilidades y edificios) y kit.py (piezas repetidas):
    R = r"<repo>/blender/"
    for f in ("f1_masas.py", "kit.py", "f2_ciclo1.py"): exec(open(R + f, encoding="utf-8").read())
    armar_kit(); f2()

Idempotente: rehace solo la colección F2_CICLO1. Las piezas repetidas (medias, animales, ganchos,
hacienda, operarios, matafuegos) son copias enlazadas del kit.
Recorrido del riel (coordenadas de Blender):
  tramo A, y = 35, hacia el este: noqueo, izado, sangría, patas y cabeza   (riel a 4,6 m, animal con cuero)
  tramo B, y = 23, hacia el oeste: cuereo, descueradora, eviscerado        (animal limpio desde la descueradora)
  tramo C, y = 11, hacia el este: sierra, prolijado, lavado, caravana, palco, balanza (riel a 3,4 m, medias)
  sigue por y = 11 a las cámaras de oreo (spray chilling a la entrada) y al desposte.
"""
import math
import random

import bpy
import bmesh

R_ALTO, R_BAJO = 4.6, 3.4
FAENA = dict(x0=-355, x1=-275, y0=-10, y1=50, h=12.0)
OREO = dict(x0=-275, x1=-210, y0=-30, y1=70, h=9.0)
SUB = dict(x0=-355, x1=-275, y0=-65, y1=-15, h=8.0)


# --------------------------------------------------------------------------- utilidades
def obj_bm(col, name, mats, fn):
    """Crea un objeto con una malla armada por fn(bm) (usa caja_bm, cil_bm, loft del kit)."""
    bm = bmesh.new()
    fn(bm)
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    for m in mats:
        me.materials.append(bpy.data.materials[m])
    o = bpy.data.objects.new(name, me)
    col.objects.link(o)
    return o


def kit_combinado(name, partes):
    """Une piezas del kit en una sola malla: partes = [(kit, (dx,dy,dz), rot_z)]."""
    from mathutils import Matrix
    bm = bmesh.new()
    mats = []
    for kn, d, rz in partes:
        me = bpy.data.objects[kn].data.copy()
        me.transform(Matrix.Translation(d) @ Matrix.Rotation(rz, 4, "Z"))
        mp = []
        for m in me.materials:
            if m.name not in mats:
                mats.append(m.name)
            mp.append(mats.index(m.name))
        for p in me.polygons:
            p.material_index = mp[p.material_index]
        bm.from_mesh(me)
        bpy.data.meshes.remove(me)
    return _nuevo(name, bm, mats)


def barra(col, name, p0, p1, z, ancho=0.08, alto=0.08, material="M_Inox"):
    """Barra horizontal recta entre dos puntos xy a la altura z (eje de la barra en z)."""
    (x0, y0), (x1, y1) = p0, p1
    if abs(x1 - x0) >= abs(y1 - y0):
        return caja(col, name, min(x0, x1), max(x0, x1), y0 - ancho / 2, y0 + ancho / 2, z - alto / 2, z + alto / 2, material)
    return caja(col, name, x0 - ancho / 2, x0 + ancho / 2, min(y0, y1), max(y0, y1), z - alto / 2, z + alto / 2, material)


def plataforma(col, name, x0, x1, y0, y1, z, escalera="O"):
    """Plataforma de operario con patas, piso de chapa, baranda amarilla y escalera."""
    caja(col, name + "_Piso", x0, x1, y0, y1, z - 0.06, z, "M_Metal_Estructura")
    for px in (x0 + 0.05, x1 - 0.05):
        for py in (y0 + 0.05, y1 - 0.05):
            caja(col, f"{name}_Pata_{px:.0f}_{py:.0f}", px - 0.04, px + 0.04, py - 0.04, py + 0.04, 0, z, "M_Metal_Estructura")
    for i, (a, b, c, d) in enumerate(((x0, x1, y0, y0 + 0.04), (x0, x1, y1 - 0.04, y1), (x0, x0 + 0.04, y0, y1))):
        caja(col, f"{name}_Baranda_{i}", a, b, c, d, z + 1.0, z + 1.05, "M_Amarillo_Seg")
        caja(col, f"{name}_Baranda_Media_{i}", a, b, c, d, z + 0.5, z + 0.54, "M_Amarillo_Seg")
    for px in (x0, x1):
        for py in (y0, y1):
            caja(col, f"{name}_Parante_{px:.0f}_{py:.0f}", px - 0.03 + (0.03 if px == x0 else -0.03), px + 0.03 + (0.03 if px == x0 else -0.03),
                 py - 0.03 + (0.03 if py == y0 else -0.03), py + 0.03 + (0.03 if py == y0 else -0.03), z, z + 1.05, "M_Amarillo_Seg")
    if z > 0.5:  # escalera de peldaños
        n = int(z / 0.25)
        sx = x0 - 0.9 if escalera == "O" else x1
        for i in range(n):
            zz = (i + 1) * z / n
            xx = sx + (0.9 - 0.9 * (i + 1) / n if escalera == "O" else 0.9 * i / n)
            caja(col, f"{name}_Peldano_{i}", xx, xx + 0.9 / n + 0.05, y0 + 0.1, y0 + 0.8, zz - 0.04, zz, "M_Metal_Estructura")


def esterilizador(col, name, x, y, rot=0.0):
    """Lavamanos + esterilizador de cuchillos (82 °C) de puesto."""
    o = obj_bm(col, name, ["M_Inox", "M_Vapor"], lambda bm: (
        caja_bm(bm, -0.25, 0.25, -0.15, 0.15, 0.75, 1.0, 0),
        caja_bm(bm, -0.04, 0.04, -0.12, -0.04, 0.0, 0.75, 0),
        cil_bm(bm, 0.15, 0, 1.0, 1.35, 0.07, 8, 0),
        caja_bm(bm, -0.2, 0.0, -0.1, 0.1, 1.0, 1.02, 1)))
    o.location = (x, y, 0)
    o.rotation_euler = (0, 0, rot)
    return o


def matafuegos(col, x, y, mira, n):
    """Matafuegos sobre ménsula a 0,9 m con cartel arriba; mira = ángulo hacia el interior."""
    poner("KIT_Matafuegos", col, (x, y, 0.9), mira + math.pi / 2, f"Matafuegos_{n:03d}")
    dx, dy = -0.02 * math.cos(mira), -0.02 * math.sin(mira)
    poner("KIT_Cartel_Matafuegos", col, (x + dx, y + dy, 1.75), mira - math.pi / 2, f"Cartel_Matafuegos_{n:03d}")


def matafuegos_perimetro(col, x0, x1, y0, y1, paso, n0):
    n = n0
    for x in range(int(x0) + 6, int(x1) - 3, paso):
        matafuegos(col, x, y0 + 0.35, math.pi / 2, n); n += 1
        matafuegos(col, x, y1 - 0.35, -math.pi / 2, n); n += 1
    for y in range(int(y0) + 6, int(y1) - 3, paso):
        matafuegos(col, x0 + 0.35, y, 0.0, n); n += 1
        matafuegos(col, x1 - 0.35, y, math.pi, n); n += 1
    return n


def colgar(col, kit, x, y, z, rot, nombre):
    return poner(kit, col, (x, y, z), rot, nombre)


# --------------------------------------------------------------------------- playa de faena
def faena(P):
    est = coleccion("F2_Faena_Equipos", P)
    riel = coleccion("F2_Faena_Riel", P)
    car = coleccion("F2_Faena_Carcasas", P)
    gen = coleccion("F2_Faena_Personas", P)
    H = FAENA["h"]

    # riel aéreo y colgantes al techo cada 3 m
    tramos = [((-352, 35), (-281, 35), R_ALTO), ((-281, 35), (-281, 23), R_ALTO), ((-281, 23), (-349, 23), R_ALTO),
              ((-349, 23), (-349, 11), R_ALTO), ((-349, 11), (-275, 11), R_BAJO)]
    for i, (a, b, z) in enumerate(tramos):
        barra(riel, f"Riel_Faena_{i}", a, b, z, 0.07, 0.09, "M_Inox_Cepillado")
        L = math.dist(a, b)
        for k in range(int(L // 3) + 1):
            t = k * 3 / L if L else 0
            x, y = a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t
            caja(riel, f"Riel_Faena_{i}_Colgante_{k:02d}", x - 0.04, x + 0.04, y - 0.04, y + 0.04, z, H - 0.5, "M_Metal_Estructura")
    caja(riel, "Riel_Faena_Bajada_Sierra", -349.04, -348.96, 10.9, 11.1, R_BAJO, R_ALTO, "M_Inox_Cepillado")
    # viga de soporte longitudinal sobre cada tramo
    for i, (a, b, z) in enumerate(tramos):
        barra(riel, f"Viga_Riel_{i}", a, b, H - 0.6, 0.2, 0.2, "M_Metal_Estructura")

    # carcasas a lo largo del riel
    paso = 1.25
    n = 0
    for x in [(-351 + paso * k) for k in range(int((-283 + 351) / paso) + 1)]:
        colgar(car, "KIT_Animal_Cuero_G", x, 35, R_ALTO, 0.0, f"Animal_A_{n:03d}"); n += 1
    for x in [(-283 - paso * k) for k in range(int((349 - 283) / paso) + 1)]:
        kit = "KIT_Animal_Cuero_G" if x > -306 else "KIT_Animal_Limpio_G"
        colgar(car, kit, x, 23, R_ALTO, math.pi, f"Animal_B_{n:03d}"); n += 1
    colgar(car, "KIT_Animal_Limpio_G", -349, 17, R_ALTO, -math.pi / 2, f"Animal_Bajada_{n:03d}"); n += 1
    x = -345.5
    k = 0
    while x < -276:
        colgar(car, "KIT_Media_G", x, 11, R_BAJO, 0.0 if k % 2 == 0 else math.pi, f"Media_C_{k:03d}")
        x += 0.75
        k += 1

    # --- tramo A: cajón de noqueo, cajón ritual, izado, sangría, patas y cabeza
    obj_bm(est, "Cajon_Noqueo", ["M_Inox", "M_Amarillo_Seg", "M_Goma"], lambda bm: (
        caja_bm(bm, -354.6, -351.6, 34.4, 34.5, 0, 2.0, 0), caja_bm(bm, -354.6, -351.6, 35.5, 35.6, 0, 2.0, 0),
        caja_bm(bm, -351.7, -351.6, 34.4, 35.6, 0.6, 2.0, 1),                  # puerta guillotina
        caja_bm(bm, -354.6, -351.6, 34.4, 35.6, 0, 0.3, 2),                    # piso basculante
        caja_bm(bm, -354.6, -351.6, 34.4, 35.6, 2.0, 2.06, 0)))
    obj_bm(est, "Cajon_Ritual_Rotativo", ["M_Inox", "M_Metal_Estructura"], lambda bm: (
        cil_bm(bm, 31.0, 1.1, -354.8, -351.2, 1.0, 12, 0, eje="x"),
        caja_bm(bm, -355.0, -351.0, 29.8, 32.2, 0, 0.6, 1)))
    plataforma(est, "Plat_Noqueador", -354.6, -351.6, 36.0, 37.2, 1.5, "E")
    poner("KIT_Operario", gen, (-353.0, 36.6, 1.5), -math.pi / 2, "Op_Noqueador")
    obj_bm(est, "Polipasto_Izado", ["M_Amarillo_Seg", "M_Metal_Estructura", "M_Negro_Cinta"], lambda bm: (
        caja_bm(bm, -350.2, -350.0, 33.6, 33.8, 0, 6.0, 1), caja_bm(bm, -350.2, -350.0, 36.2, 36.4, 0, 6.0, 1),
        caja_bm(bm, -350.3, -349.9, 33.6, 36.4, 5.8, 6.1, 1), caja_bm(bm, -350.5, -349.7, 34.7, 35.3, 5.3, 5.8, 0),
        caja_bm(bm, -350.12, -350.08, 34.98, 35.02, 4.0, 5.3, 2)))
    obj_bm(est, "Canaleta_Sangria", ["M_Inox", "M_Sangre"], lambda bm: (
        caja_bm(bm, -348.0, -326.0, 34.2, 34.3, 0, 0.6, 0), caja_bm(bm, -348.0, -326.0, 35.7, 35.8, 0, 0.6, 0),
        caja_bm(bm, -348.0, -326.0, 34.2, 35.8, 0, 0.08, 0), caja_bm(bm, -347.9, -326.1, 34.3, 35.7, 0.08, 0.12, 1),
        caja_bm(bm, -348.1, -347.9, 34.2, 35.8, 0, 0.6, 0), caja_bm(bm, -326.1, -325.9, 34.2, 35.8, 0, 0.6, 0)))
    plataforma(est, "Plat_Degüello", -347.5, -344.0, 36.0, 37.0, 0.6, "E")
    poner("KIT_Operario", gen, (-346.0, 36.5, 0.6), -math.pi / 2, "Op_Deguello")
    esterilizador(est, "Esterilizador_Deguello", -343.5, 36.8)
    for i, (xa, xb, ya, yb, zz, txt) in enumerate([(-322, -318, 36.0, 37.2, 1.8, "Patas"), (-313, -309, 32.8, 34.0, 1.6, "Cabeza"),
                                                    (-301, -297, 36.0, 37.2, 2.2, "Patas_Traseras"), (-292, -288, 32.8, 34.0, 2.2, "Ubre_Pecho")]):
        plataforma(est, f"Plat_{txt}", xa, xb, ya, yb, zz, "O")
        poner("KIT_Operario", gen, ((xa + xb) / 2, (ya + yb) / 2, zz), -math.pi / 2 if ya > 35 else math.pi / 2, f"Op_{txt}")
        esterilizador(est, f"Esterilizador_{txt}", xb - 0.4, yb - 0.3 if ya > 35 else ya + 0.3)
    # mesa de cabezas con lavado
    obj_bm(est, "Lavador_Cabezas", ["M_Inox", "M_Vapor"], lambda bm: (
        caja_bm(bm, -314, -308, 29.5, 31.5, 0.8, 1.0, 0), caja_bm(bm, -313.9, -308.1, 29.6, 31.4, 0, 0.8, 0),
        caja_bm(bm, -314, -308, 29.5, 31.5, 2.2, 2.4, 0), caja_bm(bm, -313.8, -308.2, 29.7, 31.3, 1.0, 1.6, 1)))

    # --- tramo B: cuereo, descueradora, eviscerado y mesa de vísceras
    for i, x in enumerate((-287, -293, -299)):
        for lado, ya, yb in (("N", 24.0, 25.2), ("S", 20.8, 22.0)):
            plataforma(est, f"Plat_Cuereo_{i}_{lado}", x - 1.6, x + 1.6, ya, yb, 1.2 + 0.4 * i, "E")
            poner("KIT_Operario", gen, (x, (ya + yb) / 2, 1.2 + 0.4 * i), -math.pi / 2 if lado == "N" else math.pi / 2, f"Op_Cuereo_{i}_{lado}")
    obj_bm(est, "Descueradora", ["M_Azul_Compresor", "M_Metal_Estructura", "M_Negro_Cinta", "M_Cuero_Negro"], lambda bm: (
        caja_bm(bm, -307.5, -307.1, 19.2, 19.6, 0, 5.5, 1), caja_bm(bm, -304.9, -304.5, 19.2, 19.6, 0, 5.5, 1),
        caja_bm(bm, -307.5, -304.5, 19.2, 19.6, 5.5, 5.8, 1),
        cil_bm(bm, 19.9, 1.0, -307.0, -305.0, 0.45, 12, 0, eje="x"),
        caja_bm(bm, -306.2, -305.8, 19.6, 22.6, 1.1, 1.2, 2),                   # cadenas al cuero
        caja_bm(bm, -307.5, -304.5, 17.2, 19.2, 0, 1.2, 3)))                    # cuero arrollado / tolva
    obj_bm(est, "Tolva_Cueros", ["M_Inox"], lambda bm: (caja_bm(bm, -307.8, -304.2, 16.8, 17.2, 0, 1.4, 0),))
    plataforma(est, "Plat_Eviscerado_Blanco", -326, -318, 24.0, 25.4, 1.6, "E")
    plataforma(est, "Plat_Eviscerado_Rojo", -337, -331, 24.0, 25.4, 2.4, "E")
    plataforma(est, "Plat_Inspeccion_Vet", -345, -341, 24.0, 25.2, 1.0, "E")
    for nm, x, z in (("Evisc_B1", -324, 1.6), ("Evisc_B2", -320, 1.6), ("Evisc_R1", -335, 2.4), ("Evisc_R2", -333, 2.4), ("Vet", -343, 1.0)):
        poner("KIT_Operario", gen, (x, 24.6, z), -math.pi / 2, "Op_" + nm)
        esterilizador(est, "Esterilizador_" + nm, x + 1.0, 25.0)
    # mesa de vísceras: cinta de bandejas inox paralela al riel (lado sur) y tolva al piso inferior
    caja(est, "Mesa_Visceras_Cinta", -342, -314, 19.4, 21.4, 0.85, 0.95, "M_Negro_Cinta")
    caja(est, "Mesa_Visceras_Bastidor", -342, -314, 19.5, 21.3, 0.0, 0.85, "M_Metal_Estructura")
    for k in range(22):
        xb = -341.4 + k * 1.25
        obj_bm(est, f"Bandeja_Visceras_{k:02d}", ["M_Inox", "M_Media_Res"], lambda bm, xb=xb: (
            caja_bm(bm, xb, xb + 1.0, 19.6, 21.2, 0.95, 1.12, 0),
            caja_bm(bm, xb + 0.2, xb + 0.7, 19.9, 20.7, 1.02, 1.18, 1) if k % 3 else None))
    obj_bm(est, "Tolva_Visceras", ["M_Inox"], lambda bm: (caja_bm(bm, -344.5, -342.0, 19.0, 21.8, 0, 1.0, 0),))
    for i in range(6):
        poner("KIT_Operario", gen, (-339 + i * 4.0, 18.6, 0), math.pi / 2, f"Op_Visceras_{i}")

    # --- tramo C: sierra, prolijado, lavado, caravana, palco, balanza
    plataforma(est, "Plat_Sierra", -348.2, -344.8, 12.4, 13.6, 2.2, "E")
    obj_bm(est, "Sierra_Medias", ["M_Amarillo_Seg", "M_Inox", "M_Negro_Cinta"], lambda bm: (
        caja_bm(bm, -347.2, -346.4, 12.1, 12.5, 2.5, 3.4, 0), caja_bm(bm, -347.0, -346.6, 11.5, 12.1, 2.7, 3.2, 1),
        caja_bm(bm, -346.83, -346.77, 11.0, 11.5, 1.2, 3.4, 1), caja_bm(bm, -346.85, -346.75, 12.2, 12.3, 3.4, 7.0, 2)))
    poner("KIT_Operario", gen, (-346.0, 13.0, 2.2), -math.pi / 2, "Op_Sierra")
    for i, x in enumerate((-338, -334, -330)):
        for lado, ya, yb in (("N", 12.2, 13.4), ("S", 8.6, 9.8)):
            plataforma(est, f"Plat_Prolijado_{i}_{lado}", x - 1.5, x + 1.5, ya, yb, 0.9, "E")
            poner("KIT_Operario", gen, (x, (ya + yb) / 2, 0.9), -math.pi / 2 if lado == "N" else math.pi / 2, f"Op_Prolijado_{i}_{lado}")
    obj_bm(est, "Lavadora_Medias", ["M_Inox", "M_Vapor", "M_Policarbonato"], lambda bm: (
        caja_bm(bm, -326, -319, 9.2, 9.3, 0, 4.4, 0), caja_bm(bm, -326, -319, 12.7, 12.8, 0, 4.4, 0),
        caja_bm(bm, -326, -319, 9.2, 12.8, 4.4, 4.5, 0),
        *[caja_bm(bm, -325.6 + i * 0.7, -325.5 + i * 0.7, 9.3, 9.45, 0.8, 3.8, 1) for i in range(10)],
        *[caja_bm(bm, -325.6 + i * 0.7, -325.5 + i * 0.7, 12.55, 12.7, 0.8, 3.8, 1) for i in range(10)],
        caja_bm(bm, -326.1, -325.9, 9.3, 12.7, 3.6, 4.4, 2), caja_bm(bm, -319.1, -318.9, 9.3, 12.7, 3.6, 4.4, 2)))
    obj_bm(est, "Arco_Caravana_RFID", ["M_Gris_Puerta", "M_HMI", "M_Sensor_Rojo"], lambda bm: (
        caja_bm(bm, -314.1, -313.9, 9.4, 9.6, 0, 3.6, 0), caja_bm(bm, -314.1, -313.9, 12.4, 12.6, 0, 3.6, 0),
        caja_bm(bm, -314.1, -313.9, 9.4, 12.6, 3.6, 3.8, 0), caja_bm(bm, -314.3, -313.9, 8.9, 9.4, 1.3, 1.7, 1),
        caja_bm(bm, -314.12, -313.88, 10.8, 11.2, 3.5, 3.6, 2)))
    poner("KIT_Operario", gen, (-313.0, 8.6, 0), math.pi / 2, "Op_Pickeo_Caravana")
    # palco de tipificación y dientes: cabina elevada con vidrio al riel
    obj_bm(est, "Palco_Tipificacion", ["M_Panel_Sandwich", "M_Vidrio", "M_Metal_Estructura", "M_HMI"], lambda bm: (
        caja_bm(bm, -308, -300, 6.0, 9.2, 2.0, 2.1, 2),
        caja_bm(bm, -308, -300, 6.0, 6.1, 2.1, 4.4, 0), caja_bm(bm, -308.1, -308.0, 6.0, 9.2, 2.1, 4.4, 0),
        caja_bm(bm, -300.0, -299.9, 6.0, 9.2, 2.1, 4.4, 0), caja_bm(bm, -308, -300, 9.1, 9.2, 2.1, 2.9, 0),
        caja_bm(bm, -308, -300, 9.12, 9.18, 2.9, 4.2, 1), caja_bm(bm, -308.1, -299.9, 5.9, 9.3, 4.4, 4.55, 0),
        caja_bm(bm, -307.8, -307.6, 6.2, 6.4, 0, 2.0, 2), caja_bm(bm, -300.4, -300.2, 6.2, 6.4, 0, 2.0, 2),
        caja_bm(bm, -307.8, -307.6, 8.8, 9.0, 0, 2.0, 2), caja_bm(bm, -300.4, -300.2, 8.8, 9.0, 0, 2.0, 2),
        caja_bm(bm, -306.5, -305.0, 8.4, 8.9, 2.1, 2.9, 2), caja_bm(bm, -306.4, -305.1, 8.5, 8.6, 2.9, 3.3, 3),
        caja_bm(bm, -303.0, -301.5, 8.4, 8.9, 2.1, 2.9, 2), caja_bm(bm, -302.9, -301.6, 8.5, 8.6, 2.9, 3.3, 3)))
    for i in range(8):  # escalera del palco
        caja(est, f"Palco_Escalon_{i}", -310.2 + i * 0.27, -309.9 + i * 0.27, 6.2, 7.2, (i + 1) * 0.25 - 0.05, (i + 1) * 0.25, "M_Metal_Estructura")
    texto(est, "Palco_Cartel", "PALCO TIPIFICACIÓN", -304, 6.0 - 0.02, 4.0, 0.35, "M_Rojo_PATY", 0)
    bpy.data.objects["Palco_Cartel"].rotation_euler = (math.pi / 2, 0, 0)
    poner("KIT_Operario", gen, (-305.7, 7.6, 2.1), math.pi / 2, "Op_Tipificador")
    poner("KIT_Operario", gen, (-302.2, 7.6, 2.1), math.pi / 2, "Op_Dientes")
    obj_bm(est, "Balanza_Riel", ["M_Inox", "M_Pantalla", "M_Gris_Puerta"], lambda bm: (
        caja_bm(bm, -295.5, -293.5, 10.8, 11.2, 3.45, 3.75, 0), caja_bm(bm, -294.6, -294.4, 9.0, 9.2, 0, 2.2, 2),
        caja_bm(bm, -295.0, -294.0, 9.0, 9.1, 1.6, 2.2, 1), caja_bm(bm, -295.2, -294.6, 9.0, 9.4, 1.0, 1.3, 2)))
    poner("KIT_Operario", gen, (-292.8, 8.9, 0), math.pi / 2, "Op_Balanza_Playa")
    texto(est, "Faena_Piso_A", "NOQUEO → SANGRÍA → PATAS Y CABEZA", -318, 38.5, 0.02, 0.9, "M_Blanco_Senda")
    texto(est, "Faena_Piso_B", "CUEREO → EVISCERADO → INSPECCIÓN", -315, 27.0, 0.02, 0.9, "M_Blanco_Senda")
    texto(est, "Faena_Piso_C", "SIERRA → PROLIJADO → LAVADO → CARAVANA → PALCO → BALANZA", -312, 4.0, 0.02, 0.9, "M_Blanco_Senda")
    seg = coleccion("F2_Faena_Seguridad", P)
    matafuegos_perimetro(seg, FAENA["x0"], FAENA["x1"], FAENA["y0"], FAENA["y1"], 15, 0)


# --------------------------------------------------------------------------- cámaras de oreo
def camaras_oreo(P):
    est = coleccion("F2_Oreo_Estructura", P)
    cie = coleccion("F2_Oreo_Cielorrasos", P)
    med = coleccion("F2_Oreo_Medias", P)
    gen = coleccion("F2_Oreo_Personas", P)
    x0, x1, y0, y1 = OREO["x0"], OREO["x1"], OREO["y0"], OREO["y1"]
    xc0, xc1 = -245.0, -239.0          # pasillo central N-S
    yt0, yt1 = 8.0, 14.0               # pasillo transversal (entrada desde la playa y salida al desposte)
    hc = 6.5                           # cielorraso de cámara
    rnd = random.Random(7)
    # cámaras: (código, x0, x1, y0, y1, lado del pasillo)
    cams = []
    n = 1
    for xa, xb, lado in ((x0, xc0, "E"), (xc1, x1, "O")):
        for ya, yb in ((-30, -17.33), (-17.33, -4.67), (-4.67, yt0), (yt1, 28), (28, 42), (42, 56), (56, 70)):
            cams.append((f"{n:02d}", xa, xb, ya, yb, lado))
            n += 1
    # ocupación: llena, media o vacía (en lavado)
    estado = {c[0]: e for c, e in zip(cams, ["llena"] * 6 + ["media"] * 3 + ["llena"] * 3 + ["vacia", "media"])}

    # riel principal: pasillo transversal y central
    barra(est, "Riel_Oreo_Transversal", (x0, 11), (x1, 11), R_BAJO, 0.07, 0.09, "M_Inox_Cepillado")
    barra(est, "Riel_Oreo_Central", (-242, y0 + 1), (-242, y1 - 1), R_BAJO, 0.07, 0.09, "M_Inox_Cepillado")
    for k in range(34):
        y = y0 + 1 + k * 3
        caja(est, f"Riel_Oreo_Colgante_{k:02d}", -242.04, -241.96, y - 0.04, y + 0.04, R_BAJO, hc, "M_Metal_Estructura")
    # spray chilling a la entrada (pasillo transversal, lado oeste)
    obj_bm(est, "Spray_Chilling", ["M_Inox", "M_Vapor", "M_Azul_Compresor"], lambda bm: (
        caja_bm(bm, -273, -263, 9.0, 9.1, 0, 4.2, 0), caja_bm(bm, -273, -263, 12.9, 13.0, 0, 4.2, 0),
        caja_bm(bm, -273, -263, 9.0, 13.0, 4.2, 4.3, 0), caja_bm(bm, -272.5, -263.5, 9.3, 12.7, 0.8, 3.6, 1),
        *[caja_bm(bm, -272.5 + i, -272.3 + i, 9.1, 12.9, 3.9, 4.0, 2) for i in range(10)]))
    texto(est, "Spray_Rotulo", "SPRAY CHILLING", -268, 13.05, 4.6, 0.45, "M_Rojo_PATY")
    bpy.data.objects["Spray_Rotulo"].rotation_euler = (math.pi / 2, 0, 0)
    # muros de pasillos (aislados) y cielorrasos de pasillo no: el pasillo queda abierto al techo del edificio
    k = 0
    for c, xa, xb, ya, yb, lado in cams:
        xp = xb if lado == "E" else xa        # muro que da al pasillo central
        # muros de la cámara (panel aislado blanco), con puerta corrediza al pasillo
        caja(est, f"Cam{c}_Muro_S", xa, xb, ya, ya + 0.15, 0, hc, "M_Blanco_Aislado")
        caja(est, f"Cam{c}_Muro_N", xa, xb, yb - 0.15, yb, 0, hc, "M_Blanco_Aislado")
        yd = (ya + yb) / 2
        for s, (p, q) in enumerate(((ya, yd - 1.4), (yd + 1.4, yb))):
            caja(est, f"Cam{c}_Muro_Pasillo_{s}", xp - 0.075, xp + 0.075, p, q, 0, hc, "M_Blanco_Aislado")
        caja(est, f"Cam{c}_Dintel", xp - 0.075, xp + 0.075, yd - 1.4, yd + 1.4, 4.2, hc, "M_Blanco_Aislado")
        dx = 0.12 if lado == "E" else -0.12
        caja(est, f"Cam{c}_Puerta_Corrediza", xp + dx - 0.05, xp + dx + 0.05, yd + 1.3, yd + 4.0, 0, 4.3, "M_Gris_Puerta")
        caja(est, f"Cam{c}_Guia_Puerta", xp + dx - 0.04, xp + dx + 0.04, yd - 1.5, yd + 4.1, 4.3, 4.45, "M_Metal_Estructura")
        caja(est, f"Cam{c}_Cortina_PVC", xp - 0.02, xp + 0.02, yd - 1.3, yd + 1.3, 0.3, 4.2, "M_Policarbonato")
        texto(est, f"Cam{c}_Numero", f"CÁMARA {c}", xp + dx * 1.5, yd - 2.6, 4.9, 0.5, "M_Rojo_PATY")
        bpy.data.objects[f"Cam{c}_Numero"].rotation_euler = (math.pi / 2, 0, math.pi / 2 if lado == "E" else -math.pi / 2)
        caja(est, f"Cam{c}_Codigo_Barras", xp + dx * 1.2 - 0.01, xp + dx * 1.2 + 0.01, yd - 2.2, yd - 1.7, 1.3, 1.6, "M_Blanco_Senda")
        caja(cie, f"Cam{c}_Cielorraso", xa, xb, ya, yb, hc, hc + 0.15, "M_Blanco_Aislado")
        # evaporadores en el muro del fondo
        xf = xa + 0.2 if lado == "E" else xb - 1.3
        for j, yy in enumerate((ya + (yb - ya) * 0.3, ya + (yb - ya) * 0.7)):
            obj_bm(est, f"Cam{c}_Evaporador_{j}", ["M_Blanco_Aislado", "M_Negro_Cinta"], lambda bm, xf=xf, yy=yy: (
                caja_bm(bm, xf, xf + 1.1, yy - 1.8, yy + 1.8, 5.0, 6.2, 0),
                *[cil_bm(bm, yy + o, 5.6, xf + (1.1 if lado == "E" else -0.02), xf + (1.12 if lado == "E" else 0.0), 0.42, 10, 1, eje="x") for o in (-0.9, 0.9)]))
        # rieles internos (5 por cámara) perpendiculares al pasillo y medias colgadas
        nr = 5
        for r in range(nr):
            yr = ya + (yb - ya) * (r + 1) / (nr + 1)
            xr0, xr1 = (xa + 1.5, xb) if lado == "E" else (xa, xb - 1.5)
            barra(est, f"Cam{c}_Riel_{r}", (xr0, yr), (xr1, yr), R_BAJO, 0.06, 0.08, "M_Inox_Cepillado")
            for q in range(int((xr1 - xr0) // 6) + 1):
                xq = xr0 + q * 6
                caja(est, f"Cam{c}_Riel_{r}_Colgante_{q}", xq - 0.03, xq + 0.03, yr - 0.03, yr + 0.03, R_BAJO, hc, "M_Metal_Estructura")
            ocup = {"llena": 1.0, "media": 0.5, "vacia": 0.0}[estado[c]]
            L = (xr1 - xr0 - 2.5) * ocup
            m = 0
            while m * 0.62 < L:
                xm = (xr0 + 0.8 + m * 0.62) if lado == "E" else (xr1 - 0.8 - m * 0.62)
                colgar(med, "KIT_Media_G", xm, yr, R_BAJO, math.pi / 2 if m % 2 == 0 else -math.pi / 2, f"Cam{c}_Media_{r}_{m:02d}")
                m += 1
                k += 1
    # datacollector y operario en el pasillo
    for i, y in enumerate((-20, 30, 55)):
        poner("KIT_Operario", gen, (-241.2, y, 0), rnd.uniform(0, 6.28), f"Op_Camaras_{i}")
    texto(est, "Oreo_Piso", "PASILLO DE CÁMARAS", -242, 40, 0.02, 0.8, "M_Blanco_Senda")
    bpy.data.objects["Oreo_Piso"].rotation_euler = (0, 0, math.pi / 2)
    seg = coleccion("F2_Oreo_Seguridad", P)
    n = 100
    for y in range(-24, 68, 15):
        matafuegos(seg, -244.6, y, 0.0, n); n += 1
    print("medias en cámaras:", k)


# --------------------------------------------------------------------------- subproductos
def subproductos(P):
    est = coleccion("F2_Sub_Equipos", P)
    gen = coleccion("F2_Sub_Personas", P)
    x0, x1, y0, y1 = SUB["x0"], SUB["x1"], SUB["y0"], SUB["y1"]
    # tabiques: menudencias (oeste) | digestor (centro) | cueros (este)
    for xm, nm in ((-322, "A"), (-296, "B")):
        caja(est, f"Sub_Tabique_{nm}", xm - 0.1, xm + 0.1, y0, y1 - 6, 0, 5.0, "M_Blanco_Aislado")
    # menudencias: mesas inox con cinta central, balanza de cajas, cajas apiladas
    for i in range(4):
        yy = -55 + i * 8
        caja(est, f"Menud_Cinta_{i}", -350, -327, yy - 0.4, yy + 0.4, 0.85, 0.95, "M_Negro_Cinta")
        caja(est, f"Menud_Mesa_{i}_N", -350, -327, yy + 0.4, yy + 1.4, 0.88, 0.92, "M_Inox")
        caja(est, f"Menud_Mesa_{i}_S", -350, -327, yy - 1.4, yy - 0.4, 0.88, 0.92, "M_Inox")
        caja(est, f"Menud_Bastidor_{i}", -350, -327, yy - 1.3, yy + 1.3, 0, 0.86, "M_Metal_Estructura")
        for j in range(5):
            xx = -347 + j * 4.5
            poner("KIT_Operario", gen, (xx, yy + 1.9, 0), -math.pi / 2, f"Op_Menud_{i}_{j}_N")
            caja(est, f"Menud_Bandeja_{i}_{j}", xx - 0.4, xx + 0.4, yy - 0.3, yy + 0.3, 0.95, 1.08, "M_Media_Res")
    obj_bm(est, "Menud_Balanza_Cajas", ["M_Inox", "M_Pantalla"], lambda bm: (
        caja_bm(bm, -326, -324.5, -60.5, -59.0, 0, 0.8, 0), caja_bm(bm, -325.6, -324.9, -59.0, -58.9, 1.0, 1.5, 1)))
    poner("KIT_Operario", gen, (-325.3, -61.3, 0), math.pi / 2, "Op_Menud_Balanza")
    for i in range(3):
        for j in range(4):
            for k in range(5):
                caja(est, f"Menud_Caja_{i}_{j}_{k}", -352 + i * 1.3, -351 + i * 1.3, -63 + j * 0.5, -62.6 + j * 0.5,
                     0.15 + k * 0.3, 0.42 + k * 0.3, "M_Carton")
        caja(est, f"Menud_Pallet_{i}", -352.1 + i * 1.3, -350.9 + i * 1.3, -63.1, -61.0, 0, 0.15, "M_Madera_Pallet")
    texto(est, "Menud_Rotulo", "MENUDENCIAS", -338, -20, 0.02, 1.2, "M_Blanco_Senda")
    # digestor: cocinador horizontal, condensador, ciclón y chimenea que sale por el techo
    obj_bm(est, "Digestor_Cocinador", ["M_Inox_Cepillado", "M_Metal_Estructura", "M_Azul_Compresor"], lambda bm: (
        cil_bm(bm, -45, 2.4, -318, -302, 1.6, 16, 0, eje="x"),
        *[caja_bm(bm, x - 0.2, x + 0.2, -46.6, -43.4, 0, 1.0, 1) for x in (-316, -310, -304)],
        caja_bm(bm, -302, -300.5, -45.8, -44.2, 1.0, 3.6, 2),
        cil_bm(bm, -45, 2.4, -320, -318, 0.6, 12, 2, eje="x")))
    obj_bm(est, "Digestor_Condensador_Chimenea", ["M_Inox_Cepillado", "M_Metal_Estructura"], lambda bm: (
        cil_bm(bm, -307, -55, 0, 6.5, 1.1, 14, 0), cil_bm(bm, -307, -55, 6.5, 7.2, 0.6, 10, 0),
        cil_bm(bm, -307, -55, 7.2, 13.0, 0.35, 10, 1)))
    obj_bm(est, "Digestor_Prensa_Harinas", ["M_Azul_Compresor", "M_Metal_Estructura"], lambda bm: (
        caja_bm(bm, -318, -312, -58, -55, 0, 2.2, 0), caja_bm(bm, -312, -300, -57, -56, 1.2, 1.5, 1)))
    plataforma(est, "Plat_Digestor", -318, -302, -42.6, -41.4, 4.2, "E")
    poner("KIT_Operario", gen, (-310, -42, 4.2), math.pi / 2, "Op_Digestor")
    texto(est, "Digestor_Rotulo", "DIGESTOR · HARINAS Y SEBO", -309, -20, 0.02, 1.0, "M_Blanco_Senda")
    # cueros: pallets de cueros salados y montaña de sal
    for i in range(4):
        for j in range(3):
            xx, yy = -292 + i * 4.0, -60 + j * 4.5
            caja(est, f"Cuero_Pallet_{i}_{j}", xx, xx + 2.4, yy, yy + 2.0, 0, 0.15, "M_Madera_Pallet")
            caja(est, f"Cuero_Pila_{i}_{j}", xx + 0.1, xx + 2.3, yy + 0.1, yy + 1.9, 0.15, 0.6 + 0.25 * ((i + j) % 3), "M_Cuero_Negro" if (i + j) % 2 else "M_Cuero_Colorado")
    obj_bm(est, "Sal_Montana", ["M_Blanco_Senda"], lambda bm: loft(bm, [
        [(-286 + 3.5 * math.cos(2 * math.pi * i / 12), -30 + 3.5 * math.sin(2 * math.pi * i / 12), 0) for i in range(12)],
        [(-286 + 2.2 * math.cos(2 * math.pi * i / 12), -30 + 2.2 * math.sin(2 * math.pi * i / 12), 1.3) for i in range(12)],
        [(-286 + 0.6 * math.cos(2 * math.pi * i / 12), -30 + 0.6 * math.sin(2 * math.pi * i / 12), 2.2) for i in range(12)]], 0))
    poner("KIT_Operario", gen, (-289, -34, 0), math.pi, "Op_Cueros")
    texto(est, "Cueros_Rotulo", "CUEROS", -285, -20, 0.02, 1.2, "M_Blanco_Senda")
    seg = coleccion("F2_Sub_Seguridad", P)
    matafuegos_perimetro(seg, x0, x1, y0, y1, 15, 200)


# --------------------------------------------------------------------------- corrales con hacienda
def hacienda(P):
    col = coleccion("F2_Corrales_Hacienda", P)
    eq = coleccion("F2_Corrales_Equipos", P)
    rnd = random.Random(11)
    x0, x1, y0, y1 = -455, -370, -40, 80
    ancho, largo = 10.0, 13.0
    kits = ["KIT_Novillo_Negro", "KIT_Novillo_Negro", "KIT_Novillo_Colorado", "KIT_Novillo_Hereford"]
    n = 0
    for i in range(int((x1 - x0) // ancho)):
        for j in range(int((y1 - y0 - 8) // largo)):
            cx0 = x0 + i * ancho
            cy0 = y0 + j * largo + (8 if j >= 4 else 0)
            # bebedero en cada corral
            caja(eq, f"Bebedero_{i}_{j}", cx0 + 0.3, cx0 + 0.9, cy0 + 2, cy0 + 5, 0, 0.6, "M_Inox")
            if rnd.random() < 0.3:
                continue          # corral vacío
            tropa = rnd.choice(kits)
            for a in range(rnd.randint(6, 14)):
                x = cx0 + rnd.uniform(1.5, ancho - 1.2)
                y = cy0 + rnd.uniform(1.2, largo - 1.2)
                k = tropa if rnd.random() < 0.8 else rnd.choice(kits)
                poner(k, col, (x, y, 0), rnd.uniform(0, 2 * math.pi), f"Novillo_{n:04d}", escala=rnd.uniform(0.92, 1.06))
                n += 1
    # fila en la manga hasta el cajón
    cx, cy, r = -370, 27.5, 7.5
    for a in range(-80, 91, 20):
        t = math.radians(a)
        poner("KIT_Novillo_Negro", col, (cx + r * math.cos(t), cy + r * math.sin(t), 0), t + math.pi / 2, f"Novillo_Manga_{a + 90:03d}")
    for k in range(5):
        poner("KIT_Novillo_Colorado", col, (-368 + k * 2.4, 35, 0), 0.0, f"Novillo_Manga_Recta_{k}")
    # baños de aspersión previos al ingreso (pórtico con picos)
    obj_bm(eq, "Banio_Aspersion", ["M_Gris_Puerta", "M_Vapor"], lambda bm: (
        caja_bm(bm, -364, -363.8, 33.8, 34.0, 0, 3.0, 0), caja_bm(bm, -364, -363.8, 36.0, 36.2, 0, 3.0, 0),
        caja_bm(bm, -364, -363.8, 33.8, 36.2, 3.0, 3.2, 0), caja_bm(bm, -364.6, -363.2, 34.0, 36.0, 1.0, 2.8, 1)))
    poner("KIT_Operario", col, (-372, 22, 0), 0.0, "Op_Corrales_1")
    poner("KIT_Operario", col, (-410, 18, 0), 1.0, "Op_Corrales_2")
    print("novillos:", n)


# --------------------------------------------------------------------------- principal
def kits_colgados():
    material("M_Sangre", (0.32, 0.02, 0.02), 0.25)
    kit_combinado("KIT_Media_G", [("KIT_Gancho", (0, 0, 0), 0), ("KIT_Media", (0, 0, -0.3), 0)])
    kit_combinado("KIT_Animal_Cuero_G", [("KIT_Gancho", (0, -0.12, 0), 0), ("KIT_Gancho", (0, 0.12, 0), 0),
                                         ("KIT_Animal_Cuero", (0, 0, -0.3), 0)])
    kit_combinado("KIT_Animal_Limpio_G", [("KIT_Gancho", (0, -0.12, 0), 0), ("KIT_Gancho", (0, 0.12, 0), 0),
                                          ("KIT_Animal_Limpio", (0, 0, -0.3), 0)])


def f2():
    raiz = coleccion("F2_CICLO1")
    vaciar(raiz)
    kits_colgados()
    faena(coleccion("F2_PLAYA_FAENA", raiz))
    camaras_oreo(coleccion("F2_CAMARAS_OREO", raiz))
    subproductos(coleccion("F2_SUBPRODUCTOS", raiz))
    hacienda(coleccion("F2_CORRALES", raiz))
    objs = [o for o in raiz.all_objects if o.type == "MESH"]
    print("F2:", len(objs), "objetos,", sum(len(o.data.polygons) for o in objs), "caras dibujadas,",
          len({o.data.name for o in objs}), "mallas distintas")
