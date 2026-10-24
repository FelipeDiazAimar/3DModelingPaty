"""Interiores de los edificios de servicio (PLAN_MODELO_3D.md, F5): vestuarios/comedor/oficinas, calderas y
sala de máquinas de frío (amoníaco), con condensadores evaporativos y rack de cañerías hacia las cámaras.

    R = r"<repo>/blender/"
    for f in ("f1_masas.py", "kit.py", "f2_ciclo1.py", "f5_servicios.py"): exec(open(R + f, encoding="utf-8").read())
    f5_servicios()

Idempotente: rehace solo F5_SERVICIOS. Reutiliza de la nave original (sin tocarla) la silla y el escritorio de
oficina, la mesa y los bancos del comedor, los lockers y el banco del vestuario, el microondas y el compresor y
el tablero eléctrico de la sala de frío.
"""
import math
import random

import bpy


def kits_servicios():
    kit_desde_escena("KIT_Silla_Oficina", "Oficinas_Silla_00_")
    kit_desde_escena("KIT_Escritorio", "Oficinas_Escritorio_00")
    kit_desde_escena("KIT_Mesa_Comedor", "Comedor_Mesa_00")
    kit_desde_escena("KIT_Bancos_Comedor", "Comedor_Banco_00_")
    kit_desde_escena("KIT_Lockers", "Vestuarios_Lockers")
    kit_desde_escena("KIT_Banco_Vestuario", "Vestuarios_Banco_0")
    kit_desde_escena("KIT_Microondas", "Comedor_Microondas_0")
    kit_desde_escena("KIT_Compresor", "Sala_Frio_Compresor_0_")
    kit_desde_escena("KIT_Tablero", "Sala_Frio_Tablero_Electrico")
    kit_mesa_bancos()


def kit_mesa_bancos():
    """Mesa de comedor con tapa, patas y dos bancos (la de la nave original es un bloque sin patas)
    y estante de ropería con uniformes doblados."""
    import bmesh
    bm = bmesh.new()
    caja_bm(bm, -1.2, 1.2, -0.45, 0.45, 0.72, 0.76, 0)
    for sx in (-1.1, 1.1):
        for sy in (-0.35, 0.35):
            caja_bm(bm, sx - 0.03, sx + 0.03, sy - 0.03, sy + 0.03, 0, 0.72, 1)
    for sy in (-0.85, 0.85):
        caja_bm(bm, -1.2, 1.2, sy - 0.15, sy + 0.15, 0.42, 0.46, 0)
        for sx in (-1.05, 1.05):
            caja_bm(bm, sx - 0.03, sx + 0.03, sy - 0.03, sy + 0.03, 0, 0.42, 1)
    _nuevo("KIT_Mesa_Bancos", bm, ["M_Madera_Mueble", "M_Metal_Estructura"])
    bm = bmesh.new()
    for z in (0.0, 0.5, 1.0, 1.5, 2.0):
        caja_bm(bm, -1.0, 1.0, -0.3, 0.3, z + 0.1, z + 0.13, 0)
        for i in range(5):
            caja_bm(bm, -0.95 + i * 0.39, -0.62 + i * 0.39, -0.25, 0.25, z + 0.13, z + 0.33, 1)
    for sx in (-0.98, 0.98):
        for sy in (-0.28, 0.28):
            caja_bm(bm, sx - 0.02, sx + 0.02, sy - 0.02, sy + 0.02, 0, 2.5, 0)
    _nuevo("KIT_Estante_Ropa", bm, ["M_Metal_Estructura", "M_Ropa_Blanca"])


def tabique(col, name, x0, x1, y0, y1, h=3.0):
    return caja(col, name, x0, x1, y0, y1, 0, h, "M_Panel_Junta")


def tanque_h(col, name, x0, x1, y, z, r, mats=("M_Inox_Cepillado", "M_Metal_Estructura"), eje="x"):
    """Tanque horizontal con casquetes y dos cunas de apoyo."""
    if eje == "x":
        return obj_bm(col, name, list(mats), lambda bm: (
            cil_bm(bm, y, z, x0, x1, r, 16, 0, eje="x"),
            cil_bm(bm, y, z, x0 - 0.25, x0, r * 0.8, 16, 0, eje="x"), cil_bm(bm, y, z, x1, x1 + 0.25, r * 0.8, 16, 0, eje="x"),
            caja_bm(bm, x0 + 0.5, x0 + 0.8, y - r * 0.8, y + r * 0.8, 0, z - r * 0.6, 1),
            caja_bm(bm, x1 - 0.8, x1 - 0.5, y - r * 0.8, y + r * 0.8, 0, z - r * 0.6, 1)))
    return obj_bm(col, name, list(mats), lambda bm: (
        cil_bm(bm, x0, z, y, y + (x1 - x0), r, 16, 0, eje="y"),
        caja_bm(bm, x0 - r * 0.8, x0 + r * 0.8, y + 0.5, y + 0.8, 0, z - r * 0.6, 1),
        caja_bm(bm, x0 - r * 0.8, x0 + r * 0.8, y + (x1 - x0) - 0.8, y + (x1 - x0) - 0.5, 0, z - r * 0.6, 1)))


def tanque_v(col, name, x, y, z0, h, r, mat="M_Inox_Cepillado"):
    return obj_bm(col, name, [mat, "M_Metal_Estructura"], lambda bm: (
        cil_bm(bm, x, y, z0, z0 + h, r, 16, 0), cil_bm(bm, x, y, z0 + h, z0 + h + 0.2, r * 0.7, 16, 0),
        *[caja_bm(bm, x + dx - 0.05, x + dx + 0.05, y + dy - 0.05, y + dy + 0.05, 0, z0 + 0.3, 1)
          for dx, dy in ((r * 0.7, 0), (-r * 0.7, 0), (0, r * 0.7), (0, -r * 0.7))]))


def cano(col, name, pts, r=0.12, mat="M_Aislante_Caneria"):
    """Cañería por tramos rectos entre puntos (x, y, z), con eje en x, y o z en cada tramo."""
    for i, (a, b) in enumerate(zip(pts[:-1], pts[1:])):
        (x0, y0, z0), (x1, y1, z1) = a, b
        if abs(x1 - x0) > 1e-6:
            obj_bm(col, f"{name}_{i}", [mat], lambda bm, a=a, b=b: cil_bm(bm, a[1], a[2], min(a[0], b[0]), max(a[0], b[0]), r, 8, 0, eje="x"))
        elif abs(y1 - y0) > 1e-6:
            obj_bm(col, f"{name}_{i}", [mat], lambda bm, a=a, b=b: cil_bm(bm, a[0], a[2], min(a[1], b[1]), max(a[1], b[1]), r, 8, 0, eje="y"))
        else:
            obj_bm(col, f"{name}_{i}", [mat], lambda bm, a=a, b=b: cil_bm(bm, a[0], a[1], min(a[2], b[2]), max(a[2], b[2]), r, 8, 0))


# --------------------------------------------------------------------------- vestuarios, comedor y oficinas
def personal(P):
    col = coleccion("F5_Personal", P)
    gen = coleccion("F5_Personal_Gente", P)
    rnd = random.Random(71)
    # tabiques: vestuarios (x −210 a −186) | hall sanitario (x −186 a −174, y < 93) | comedor (x −174 a −150, y < 105) | oficinas (norte)
    tabique(col, "Tab_Vest_Hall", -186.1, -186.0, 85, 105)
    tabique(col, "Tab_Vest_HM", -210, -186, 99.95, 100.05)
    tabique(col, "Tab_Hall_Comedor", -174.1, -174.0, 85, 90.5)
    tabique(col, "Tab_Hall_Comedor_b", -174.1, -174.0, 92.5, 105)
    tabique(col, "Tab_Hall_N_a", -186, -181, 92.95, 93.05)
    tabique(col, "Tab_Hall_N_b", -179, -174, 92.95, 93.05)
    tabique(col, "Tab_Oficinas", -210, -150, 104.95, 105.05)
    for x in (-196, -183, -165):  # puertas en el tabique de oficinas
        caja(col, f"Puerta_Oficinas_{x}", x - 0.45, x + 0.45, 104.9, 105.1, 0, 2.1, "M_Gris_Puerta")
    tabique(col, "Tab_Sala_Reuniones", -160.1, -160.0, 105, 115)
    # hall / barrera sanitaria: lavabotas, lavamanos, pediluvio, secamanos
    caja(col, "Pediluvio", -182.5, -177.5, 85.4, 87.4, 0, 0.12, "M_Inox")
    caja(col, "Pediluvio_Agua", -182.3, -177.7, 85.6, 87.2, 0.12, 0.13, "M_Vapor")
    for i in range(3):
        x = -185.0 + i * 1.2
        caja(col, f"Lavabotas_{i}", x - 0.45, x + 0.45, 88.5, 89.4, 0, 0.35, "M_Inox")
        caja(col, f"Lavabotas_{i}_Cepillo", x - 0.3, x + 0.3, 88.6, 89.3, 0.35, 0.5, "M_Azul_Compresor")
    caja(col, "Lavamanos_Hall", -179.5, -175.0, 91.9, 92.5, 0.8, 0.95, "M_Inox")
    caja(col, "Lavamanos_Hall_Base", -179.4, -175.1, 92.0, 92.4, 0, 0.8, "M_Inox_Cepillado")
    for i in range(4):
        caja(col, f"Canilla_Hall_{i}", -179.0 + i * 1.1, -178.9 + i * 1.1, 92.3, 92.4, 0.95, 1.2, "M_Cromo")
    for k in range(5):  # ropería: entrega de ropa limpia, entre la barrera sanitaria y las oficinas
        poner("KIT_Estante_Ropa", col, (-184.6, 94.5 + k * 2.1, 0), math.pi / 2, f"Estante_Ropa_{k}")
    caja(col, "Roperia_Mostrador", -178.5, -177.5, 94.0, 103.5, 0, 1.05, "M_Madera_Mueble")
    for k in range(3):
        caja(col, f"Carro_Ropa_{k}", -176.0, -175.0, 95.0 + k * 1.4, 96.0 + k * 1.4, 0.2, 1.0, "M_Ropa_Blanca")
    poner("KIT_Operario", gen, (-179.5, 98.0, 0), -math.pi / 2, "Op_Roperia")
    texto(col, "Rotulo_Roperia", "ROPERÍA", -180, 104.0, 0.03, 0.45, "M_Rojo_PATY")
    texto(col, "Rotulo_Barrera_Sanitaria", "BARRERA SANITARIA", -180, 90.2, 0.03, 0.4, "M_Rojo_PATY")
    poner("KIT_Operario", gen, (-184.0, 90.0, 0), math.pi / 2, "Op_Hall_0")
    # vestuarios hombres (norte) y mujeres (sur): lockers, bancos, duchas, inodoros y lavamanos
    for g, (ya, yb) in (("Hombres", (100.05, 105)), ("Mujeres", (85, 99.95))):
        for i, y in enumerate((ya + 1.0, ya + 3.6) if g == "Hombres" else (ya + 1.0, ya + 5.0, ya + 9.0)):
            o = poner("KIT_Lockers", col, (-200.0, y, 0), 0.0 if i % 2 == 0 else math.pi, f"Lockers_{g}_{i}")
            o.scale = (0.8, 1, 1)
            if i < 2:
                poner("KIT_Banco_Vestuario", col, (-200.0, y + 1.3, 0), 0.0, f"Banco_{g}_{i}")
        for k in range(5):  # duchas
            y0 = ya + 0.2 + k * ((yb - ya - 0.4) / 5)
            caja(col, f"Ducha_{g}_{k}_Tab", -210, -208.2, y0, y0 + 0.05, 0, 2.1, "M_Ceramica")
            caja(col, f"Ducha_{g}_{k}_Plato", -209.9, -208.3, y0 + 0.1, y0 + (yb - ya - 0.4) / 5 - 0.05, 0, 0.05, "M_Ceramica")
            caja(col, f"Ducha_{g}_{k}_Flor", -209.85, -209.6, y0 + 0.4, y0 + 0.6, 2.0, 2.05, "M_Cromo")
        caja(col, f"Mesada_Lavamanos_{g}", -188.0, -186.2, ya + 0.5, ya + 4.0, 0.8, 0.9, "M_Ceramica")
        caja(col, f"Espejo_{g}", -186.15, -186.1, ya + 0.5, ya + 4.0, 1.2, 2.0, "M_Vidrio")
        for k in range(3):  # inodoros con cubículo
            x0 = -192.0 + k * 1.4
            yy = yb - 1.6 if g == "Hombres" else ya + 0.0
            caja(col, f"Cubiculo_{g}_{k}", x0, x0 + 0.05, yy, yy + 1.6, 0, 2.0, "M_Panel_Junta")
            caja(col, f"Inodoro_{g}_{k}", x0 + 0.45, x0 + 0.95, (yy + 0.1) if g == "Mujeres" else (yy + 0.9), (yy + 0.75) if g == "Mujeres" else (yy + 1.5), 0, 0.42, "M_Ceramica")
        texto(col, f"Rotulo_Vest_{g}", f"VESTUARIO {g.upper()}", -198, (ya + yb) / 2 + (1.5 if g == "Mujeres" else 0), 0.03, 0.5, "M_Rojo_PATY")
    for k in range(4):
        poner("KIT_Operario", gen, (-205 + k * 4.5, 93.5 + (k % 2) * 8, 0), rnd.uniform(0, 6.28), f"Op_Vestuario_{k}")
    # comedor: 3 × 3 mesas con bancos, línea de autoservicio, microondas, heladeras y dispensers
    for i in range(3):
        for j in range(3):
            x, y = -170 + i * 6.0, 88.5 + j * 5.0
            poner("KIT_Mesa_Bancos", col, (x, y, 0), 0.0, f"Mesa_Comedor_{i}{j}")
            if rnd.random() < 0.5:
                poner("KIT_Operario", gen, (x - 0.6, y + 0.75, 0), -math.pi / 2, f"Op_Comedor_{i}{j}")
    caja(col, "Autoservicio_Linea", -151.5, -150.6, 86, 103, 0.85, 0.95, "M_Inox")
    caja(col, "Autoservicio_Base", -151.4, -150.7, 86.1, 102.9, 0, 0.85, "M_Inox_Cepillado")
    caja(col, "Autoservicio_Vidrio", -151.5, -151.45, 86, 103, 0.95, 1.4, "M_Vidrio")
    caja(col, "Mesada_Microondas", -173.6, -173.0, 96, 104, 0.85, 0.9, "M_Inox")
    for k in range(4):
        poner("KIT_Microondas", col, (-173.3, 96.8 + k * 1.8, 0.9), math.pi / 2, f"Microondas_{k}")
    for k in range(3):
        caja(col, f"Heladera_{k}", -173.8, -173.1, 86.5 + k * 1.0, 87.4 + k * 1.0, 0, 1.9, "M_Blanco_Aislado")
    texto(col, "Rotulo_Comedor", "COMEDOR", -162, 102.5, 0.03, 0.8, "M_Rojo_PATY")
    # oficinas: 2 filas de escritorios con PC y silla; sala de reuniones con mesa larga
    for i in range(8):
        for j in range(2):
            x, y = -206 + i * 5.5, 107.5 + j * 4.5
            if x > -162:
                continue
            poner("KIT_Escritorio", col, (x, y, 0), 0.0, f"Escritorio_{i}{j}")
            poner("KIT_Silla_Oficina", col, (x, y - 0.8, 0), 0.0, f"Silla_Oficina_{i}{j}")
            caja(col, f"PC_{i}{j}", x - 0.3, x + 0.3, y + 0.15, y + 0.2, 0.78, 1.15, "M_Pantalla")
            if rnd.random() < 0.6:
                poner("KIT_Operario", gen, (x, y - 0.8, 0), 0.0, f"Op_Oficina_{i}{j}")
    caja(col, "Mesa_Reuniones", -157.5, -152.5, 108.5, 111.5, 0.72, 0.78, "M_Madera_Mueble")
    caja(col, "Mesa_Reuniones_Base", -156.0, -154.0, 109.5, 110.5, 0, 0.72, "M_Metal_Estructura")
    for k in range(6):
        poner("KIT_Silla_Oficina", col, (-157.0 + (k % 3) * 2.0, 107.8 if k < 3 else 112.2, 0), 0.0 if k < 3 else math.pi, f"Silla_Reunion_{k}")
    caja(col, "Pantalla_Reuniones", -150.2, -150.1, 108.8, 111.2, 1.2, 2.5, "M_Pantalla")
    texto(col, "Rotulo_Oficinas", "OFICINAS · PRODUCCIÓN · CALIDAD · MANTENIMIENTO", -185, 114.2, 0.03, 0.4, "M_Rojo_PATY")
    texto(col, "Rotulo_Reuniones", "SALA DE REUNIONES", -155, 114.2, 0.03, 0.35, "M_Rojo_PATY")


# --------------------------------------------------------------------------- calderas
def calderas(P):
    col = coleccion("F5_Calderas", P)
    for i, x in enumerate((-272.0, -262.0)):
        # caldera humotubular horizontal (eje y), quemador al frente (sur) y chimenea atrás
        obj_bm(col, f"Caldera_{i+1}", ["M_Blanco_Aislado", "M_Metal_Estructura", "M_Rojo_PATY", "M_Inox_Cepillado"], lambda bm, x=x: (
            cil_bm(bm, x, 1.9, 95.0, 102.5, 1.35, 20, 0, eje="y"),
            cil_bm(bm, x, 1.9, 94.7, 95.0, 1.4, 20, 3, eje="y"), cil_bm(bm, x, 1.9, 102.5, 102.8, 1.4, 20, 3, eje="y"),
            caja_bm(bm, x - 1.1, x + 1.1, 96.0, 96.4, 0, 0.7, 1), caja_bm(bm, x - 1.1, x + 1.1, 101.0, 101.4, 0, 0.7, 1),
            caja_bm(bm, x - 0.6, x + 0.6, 93.4, 94.7, 1.1, 2.6, 2),                     # quemador
            caja_bm(bm, x - 0.25, x + 0.25, 92.9, 93.4, 1.6, 2.1, 2),
            cil_bm(bm, x, 102.0, 3.2, 16.0, 0.4, 12, 3)))                              # chimenea (sale sobre la nave)
        caja(col, f"Caldera_{i+1}_Tablero", x + 1.3, x + 1.9, 93.6, 94.0, 0, 1.8, "M_Gris_Puerta")
        caja(col, f"Caldera_{i+1}_Tablero_HMI", x + 1.45, x + 1.75, 93.55, 93.6, 1.2, 1.5, "M_HMI")
        plataforma(col, f"Plat_Caldera_{i+1}", x - 1.0, x + 1.0, 97.0, 101.0, 3.4, "O")
        texto(col, f"Rotulo_Caldera_{i+1}", f"CALDERA {i+1}", x, 92.4, 0.03, 0.45, "M_Rojo_PATY")
    tanque_h(col, "Tanque_Alimentacion_Desaireador", -253.0, -247.0, 109.0, 4.2, 0.85, ("M_Inox_Cepillado", "M_Metal_Estructura"))
    for px in (-252.5, -247.5):
        for py in (108.2, 109.8):
            caja(col, f"Estructura_Desaireador_{px}_{py}", px - 0.08, px + 0.08, py - 0.08, py + 0.08, 0, 3.4, "M_Metal_Estructura")
    caja(col, "Estructura_Desaireador_Piso", -253.2, -246.8, 108.0, 110.0, 3.3, 3.4, "M_Metal_Estructura")
    for k, x in enumerate((-251.5, -250.0, -248.5)):  # bombas de alimentación
        caja(col, f"Bomba_Alim_{k}", x - 0.4, x + 0.4, 104.5, 105.3, 0, 0.3, "M_Metal_Estructura")
        obj_bm(col, f"Bomba_Alim_{k}_Motor", ["M_Azul_Compresor"], lambda bm, x=x: cil_bm(bm, 104.9, 0.55, x - 0.35, x + 0.35, 0.22, 10, 0, eje="x"))
    tanque_v(col, "Ablandador_1", -246.0, 92.0, 0.0, 1.8, 0.35, "M_Azul_Compresor")
    tanque_v(col, "Ablandador_2", -246.0, 93.2, 0.0, 1.8, 0.35, "M_Azul_Compresor")
    tanque_v(col, "Tanque_Salmuera", -246.0, 95.0, 0.0, 1.2, 0.5, "M_Blanco_Aislado")
    # colector de vapor y cañerías aisladas que salen hacia la planta por el muro este
    cano(col, "Colector_Vapor", [(-272, 103.5, 4.5), (-242, 103.5, 4.5)], 0.22)
    for x in (-272.0, -262.0):
        cano(col, f"Salida_Vapor_{x}", [(x, 102.2, 3.3), (x, 102.2, 4.5), (x, 103.5, 4.5)], 0.12)
    cano(col, "Vapor_A_Planta", [(-242, 103.5, 4.5), (-238, 103.5, 4.5), (-238, 103.5, 6.0), (-238, 80.0, 6.0)], 0.16)
    for y in range(82, 104, 6):  # soportes del tramo exterior
        caja(col, f"Soporte_Vapor_{y}", -238.1, -237.9, y - 0.1, y + 0.1, 0, 5.85, "M_Metal_Estructura")
    obj_bm(col, "Estacion_Gas", ["M_Amarillo_Seg", "M_Alambrado", "M_Hormigon_Piso"], lambda bm: (
        caja_bm(bm, -238.0, -233.0, 87.0, 91.0, 0, 0.15, 2),
        caja_bm(bm, -237.0, -234.0, 88.0, 90.0, 0.15, 1.3, 0),
        caja_bm(bm, -238.0, -233.0, 86.98, 87.02, 0.15, 2.0, 1), caja_bm(bm, -238.0, -233.0, 90.98, 91.02, 0.15, 2.0, 1),
        caja_bm(bm, -233.02, -232.98, 87.0, 91.0, 0.15, 2.0, 1)))
    texto(col, "Rotulo_Gas", "REGULADORA DE GAS", -235.5, 92.0, 0.06, 0.35, "M_Rojo_PATY")
    poner("KIT_Tablero", col, (-243.0, 113.8, 0), math.pi, "Tablero_Calderas")
    poner("KIT_Operario", col, (-258.0, 92.5, 0), math.pi / 2, "Op_Calderista")
    matafuegos(col, -279.6, 92.0, 0.0, 700)
    matafuegos(col, -279.6, 108.0, 0.0, 701)


# --------------------------------------------------------------------------- sala de máquinas (amoníaco)
def sala_maquinas(P):
    col = coleccion("F5_Sala_Maquinas", P)
    for i in range(6):  # compresores de tornillo (kit de la sala de frío original, más grande)
        x = -350.0 + i * 7.0
        poner("KIT_Compresor", col, (x, 122.0, 0), 0.0, f"Compresor_NH3_{i+1}", escala=1.5)
        caja(col, f"Compresor_NH3_{i+1}_Base", x - 2.6, x + 2.6, 120.6, 123.4, 0, 0.15, "M_Hormigon_Piso")
        texto(col, f"Rotulo_Compresor_{i+1}", f"COMPRESOR {i+1}", x, 119.6, 0.03, 0.4, "M_Rojo_PATY")
    tanque_h(col, "Recibidor_NH3", -350.0, -342.0, 104.0, 1.3, 0.75, ("M_Gris_Puerta", "M_Metal_Estructura"))
    tanque_v(col, "Separador_Recirculador_1", -334.0, 104.0, 0.4, 4.0, 0.85, "M_Gris_Puerta")
    tanque_v(col, "Separador_Recirculador_2", -330.0, 104.0, 0.4, 4.0, 0.85, "M_Gris_Puerta")
    tanque_v(col, "Separador_Recirculador_3", -326.0, 108.0, 0.4, 4.0, 0.85, "M_Gris_Puerta")
    tanque_h(col, "Recibidor_NH3_2", -350.0, -342.0, 108.0, 1.3, 0.75, ("M_Gris_Puerta", "M_Metal_Estructura"))
    tanque_h(col, "Intercambiador_Placas", -347.0, -345.0, 96.0, 0.9, 0.5, ("M_Inox_Cepillado", "M_Metal_Estructura"))
    plataforma(col, "Plat_Recirculadores", -336.0, -324.0, 106.2, 107.2, 4.0, "E")
    # taller de mantenimiento (este de la sala): bancos de trabajo, armarios de herramientas y repuestos
    tabique(col, "Tab_Taller", -306.1, -306.0, 85, 110, 3.0)
    tabique(col, "Tab_Taller_N", -306, -290, 109.95, 110.05, 3.0)
    for k in range(3):
        caja(col, f"Banco_Trabajo_{k}", -303.5 + k * 4.5, -300.5 + k * 4.5, 100.0, 101.0, 0.88, 0.95, "M_Madera_Mueble")
        caja(col, f"Banco_Trabajo_{k}_Base", -303.4 + k * 4.5, -300.6 + k * 4.5, 100.1, 100.9, 0, 0.88, "M_Metal_Estructura")
        caja(col, f"Morsa_{k}", -301.0 + k * 4.5, -300.7 + k * 4.5, 100.3, 100.6, 0.95, 1.15, "M_Azul_Compresor")
        caja(col, f"Armario_Herramientas_{k}", -303.0 + k * 4.5, -301.0 + k * 4.5, 109.2, 109.8, 0, 1.9, "M_Rojo_PATY")
    for k in range(4):
        poner("KIT_Estante_Aditivos", col, (-305.3, 88.0 + k * 3.0, 0), math.pi / 2, f"Estante_Repuestos_{k}")
    caja(col, "Taladro_Banco", -294.0, -293.4, 92.0, 92.6, 0, 1.7, "M_Verde_Industrial")
    poner("KIT_Operario", col, (-299.0, 99.2, 0), math.pi / 2, "Op_Mantenimiento_1")
    poner("KIT_Operario", col, (-294.5, 99.2, 0), math.pi / 2, "Op_Mantenimiento_2")
    texto(col, "Rotulo_Taller", "TALLER DE MANTENIMIENTO", -298, 87.0, 0.03, 0.5, "M_Rojo_PATY")
    # subestación eléctrica (noreste): 2 transformadores y celdas de media tensión, enrejada
    for k in range(2):
        x = -302.0 + k * 6.0
        caja(col, f"Transformador_{k+1}", x - 1.2, x + 1.2, 121.0, 123.4, 0, 2.3, "M_Gris_Puerta")
        for r in range(5):
            caja(col, f"Transformador_{k+1}_Aleta_{r}", x - 1.3, x + 1.3, 121.2 + r * 0.5, 121.25 + r * 0.5, 0.3, 2.0, "M_Metal_Estructura")
        obj_bm(col, f"Transformador_{k+1}_Aisladores", ["M_Ceramica"], lambda bm, cx=x: (
            *[cil_bm(bm, cx + d, 122.2, 2.3, 2.9, 0.07, 8, 0) for d in (-0.6, 0.0, 0.6)],))
    for k in range(6):
        caja(col, f"Celda_MT_{k}", -305.0 + k * 1.0, -304.1 + k * 1.0, 128.6, 129.7, 0, 2.2, "M_Gris_Puerta")
    caja(col, "Reja_Subestacion_S", -306, -292, 117.95, 118.05, 0, 2.2, "M_Alambrado")
    caja(col, "Reja_Subestacion_O", -306.05, -305.95, 118, 130, 0, 2.2, "M_Alambrado")
    texto(col, "Rotulo_Subestacion", "SUBESTACIÓN · PELIGRO ALTA TENSIÓN", -299, 117.4, 0.03, 0.4, "M_Amarillo_Seg")
    tanque_v(col, "Enfriador_Aceite", -325.0, 104.0, 0.3, 2.2, 0.4, "M_Inox_Cepillado")
    for k, x in enumerate((-334.0, -330.0)):  # bombas de amoníaco bajo los recirculadores
        caja(col, f"Bomba_NH3_{k}", x - 0.5, x + 0.5, 101.5, 102.5, 0, 0.35, "M_Metal_Estructura")
        obj_bm(col, f"Bomba_NH3_{k}_Motor", ["M_Azul_Compresor"], lambda bm, x=x: cil_bm(bm, 102.0, 0.6, x - 0.4, x + 0.4, 0.25, 10, 0, eje="x"))
    # cañerías aisladas: compresores → colector alto → separadores → salida al rack hacia las cámaras
    cano(col, "Colector_Succion", [(-352, 118.5, 5.5), (-312, 118.5, 5.5)], 0.25)
    for i in range(6):
        x = -350.0 + i * 7.0
        cano(col, f"Succion_{i+1}", [(x + 0.8, 122.0, 3.0), (x + 0.8, 122.0, 5.5), (x + 0.8, 118.5, 5.5)], 0.12)
    cano(col, "Linea_A_Separadores", [(-322, 118.5, 5.5), (-322, 104.0, 5.5), (-336, 104.0, 5.5)], 0.18)
    cano(col, "Linea_A_Camaras", [(-322, 104.0, 5.5), (-300, 104.0, 5.5), (-300, 104.0, 6.5), (-290, 104.0, 6.5)], 0.18, "M_Aislante_Caneria")
    poner("KIT_Tablero", col, (-312.0, 129.6, 0), math.pi, "Tablero_Sala_Maquinas_1")
    poner("KIT_Tablero", col, (-308.0, 129.6, 0), math.pi, "Tablero_Sala_Maquinas_2")
    caja(col, "Consola_Operador", -316.0, -313.0, 112.0, 113.0, 0, 0.8, "M_Madera_Mueble")
    caja(col, "Consola_Operador_Pantalla", -315.6, -313.4, 112.6, 112.7, 0.8, 1.3, "M_Pantalla")
    poner("KIT_Silla_Oficina", col, (-314.5, 111.4, 0), 0.0, "Silla_Consola")
    poner("KIT_Operario", col, (-314.5, 111.4, 0), 0.0, "Op_Frigorista")
    poner("KIT_Operario", col, (-338.0, 112.0, 0), math.pi / 2, "Op_Frigorista_2")
    # seguridad: ducha y lavaojos de emergencia, carteles de amoníaco, detectores
    obj_bm(col, "Ducha_Emergencia", ["M_Emergencia_Verde", "M_Amarillo_Seg"], lambda bm: (
        caja_bm(bm, -291.2, -291.0, 90.0, 90.2, 0, 2.4, 0), caja_bm(bm, -291.7, -291.0, 90.0, 90.2, 2.3, 2.4, 0),
        cil_bm(bm, -291.6, 90.1, 2.1, 2.3, 0.18, 10, 1), caja_bm(bm, -291.5, -291.0, 89.9, 90.3, 1.0, 1.1, 1)))
    for k, (x, y, rz) in enumerate(((-322.0, 85.3, 0.0), (-340.0, 85.3, 0.0), (-354.7, 110.0, -math.pi / 2))):
        o = texto(col, f"Cartel_NH3_{k}", "PELIGRO · AMONÍACO", x, y, 3.2, 0.4, "M_Amarillo_Seg")
        o.rotation_euler = (math.pi / 2, 0, rz)
    for k, x in enumerate((-350, -335, -320, -305)):
        caja(col, f"Detector_NH3_{k}", x - 0.1, x + 0.1, 129.7, 129.85, 2.8, 3.0, "M_Sensor_Rojo")
    matafuegos(col, -354.6, 95.0, 0.0, 710)
    matafuegos(col, -290.4, 120.0, math.pi, 711)
    # condensadores evaporativos afuera (norte) sobre platea, con ventiladores
    for i in range(3):
        x = -350.0 + i * 10.0
        obj_bm(col, f"Condensador_Evap_{i+1}", ["M_Panel_Sandwich", "M_Metal_Estructura", "M_Negro_Cinta", "M_Hormigon_Piso"], lambda bm, x=x: (
            caja_bm(bm, x - 3.5, x + 3.5, 132.0, 138.0, 0, 0.25, 3),
            caja_bm(bm, x - 3.0, x + 3.0, 132.5, 137.5, 0.25, 4.2, 0),
            *[cil_bm(bm, x + dx, 135.0, 4.2, 4.9, 1.1, 16, 1) for dx in (-1.5, 1.5)],
            *[cil_bm(bm, x + dx, 135.0, 4.9, 4.92, 1.0, 16, 2) for dx in (-1.5, 1.5)]))
    cano(col, "Linea_Condensadores", [(-345, 129.0, 6.0), (-345, 132.0, 6.0), (-345, 132.0, 4.2)], 0.15, "M_Inox_Cepillado")
    texto(col, "Rotulo_Condensadores", "CONDENSADORES EVAPORATIVOS", -340, 139.5, 0.08, 0.6, "M_Rojo_PATY")
    # rack de cañerías de amoníaco hacia las cámaras de oreo: sale por el muro este, baja por x = -286 y corre
    # por y = 82 (al sur de calderas, sobre el patio norte) hasta el muro norte de las cámaras
    postes = [(-286.0, y) for y in range(104, 81, -6)] + [(x, 82.0) for x in range(-280, -239, 6)]
    for k, (x, y) in enumerate(postes):
        caja(col, f"Rack_Canerias_Poste_{k:02d}", x - 0.12, x + 0.12, y - 0.12, y + 0.12, 0, 6.5, "M_Metal_Estructura")
        caja(col, f"Rack_Canerias_Viga_{k:02d}", x - 0.7, x + 0.7, y - 0.7, y + 0.7, 6.4, 6.55, "M_Metal_Estructura")
    cano(col, "NH3_A_Camaras_Liquido", [(-290, 103.6, 6.75), (-286.4, 103.6, 6.75), (-286.4, 81.6, 6.75), (-240, 81.6, 6.75),
                                        (-240, 71.0, 6.75), (-240, 71.0, 6.0)], 0.12)
    cano(col, "NH3_A_Camaras_Succion", [(-290, 104.4, 6.9), (-285.6, 104.4, 6.9), (-285.6, 82.4, 6.9), (-244, 82.4, 6.9),
                                        (-244, 71.0, 6.9), (-244, 71.0, 6.0)], 0.2)
    for k, y in enumerate((76.0, 71.5)):
        caja(col, f"Soporte_NH3_{k}", -244.4, -239.6, y - 0.1, y + 0.1, 6.45, 6.6, "M_Metal_Estructura")
        caja(col, f"Soporte_NH3_Poste_{k}", -242.1, -241.9, y - 0.1, y + 0.1, 0, 6.45, "M_Metal_Estructura")


def f5_servicios():
    raiz = coleccion("F5_SERVICIOS")
    vaciar(raiz)
    kits_servicios()
    personal(raiz)
    calderas(raiz)
    sala_maquinas(raiz)
    objs = [o for o in raiz.all_objects if o.type == "MESH"]
    print("F5 servicios:", len(objs), "objetos,", sum(len(o.data.polygons) for o in objs), "caras dibujadas,",
          len({o.data.name for o in objs}), "mallas distintas")
