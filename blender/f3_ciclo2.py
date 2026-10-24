"""F3 del PLAN_MODELO_3D.md: detalle de Ciclo 2 (pesaje de oreo, cuarteo, desposte, encajado, charqueo,
túneles y cámaras de cajas, abasto) y muelles con camiones del bloque oeste.

    R = r"<repo>/blender/"
    for f in ("f1_masas.py", "kit.py", "f2_ciclo1.py", "f3_ciclo2.py"): exec(open(R + f, encoding="utf-8").read())
    armar_kit(); kit_ciclo2(); f3()

Idempotente: rehace solo la colección F3_CICLO2. Recorrido: el riel de medias llega de las cámaras de oreo
por y = 11 (3,4 m) → balanza de oreo → sierra de cuarteo → rieles de traseros y delanteros (buffer) →
cabeceras de las dos líneas de desposte → cinta central → encajado (puestos A–D) → cinta de cajas →
túneles y cámara de cajas → muelles. El asado sale del cuarteo a las sierras sinfín.
"""
import math
import random

import bpy

DESP = dict(x0=-210, x1=-135, y0=-30, y1=70, h=8.0)
CAJ = dict(x0=-210, x1=-135, y0=-65, y1=-35, h=9.0)
ABA = dict(x0=-275, x1=-210, y0=-65, y1=-35, h=8.0)


def cinta(col, name, p0, p1, z=0.9, ancho=0.8):
    """Cinta transportadora recta con bastidor y patas cada 2 m."""
    (x0, y0), (x1, y1) = p0, p1
    barra(col, name, p0, p1, z, ancho, 0.08, "M_Negro_Cinta")
    L = math.dist(p0, p1)
    for k in range(int(L // 2) + 1):
        t = k * 2 / L if L else 0
        x, y = x0 + (x1 - x0) * t, y0 + (y1 - y0) * t
        caja(col, f"{name}_Pata_{k:02d}", x - 0.04, x + 0.04, y - 0.04, y + 0.04, 0, z - 0.04, "M_Metal_Estructura")
    for s in (-1, 1):  # baranda lateral inox
        if abs(x1 - x0) >= abs(y1 - y0):
            barra(col, f"{name}_Borde_{s}", (x0, y0 + s * ancho / 2), (x1, y1 + s * ancho / 2), z + 0.08, 0.03, 0.08, "M_Inox")
        else:
            barra(col, f"{name}_Borde_{s}", (x0 + s * ancho / 2, y0), (x1 + s * ancho / 2, y1), z + 0.08, 0.03, 0.08, "M_Inox")


def riel_con_carga(riel_col, car_col, name, p0, p1, z, kit, paso, rot, colgantes_h, ocupacion=1.0):
    barra(riel_col, f"Riel_{name}", p0, p1, z, 0.07, 0.09, "M_Inox_Cepillado")
    L = math.dist(p0, p1)
    for k in range(int(L // 3) + 1):
        t = k * 3 / L if L else 0
        x, y = p0[0] + (p1[0] - p0[0]) * t, p0[1] + (p1[1] - p0[1]) * t
        caja(riel_col, f"Riel_{name}_Colgante_{k:02d}", x - 0.04, x + 0.04, y - 0.04, y + 0.04, z, colgantes_h, "M_Metal_Estructura")
    n = int(L * ocupacion / paso)
    for k in range(n):
        t = (k + 0.5) * paso / L
        x, y = p0[0] + (p1[0] - p0[0]) * t, p0[1] + (p1[1] - p0[1]) * t
        poner(kit, car_col, (x, y, z), rot if k % 2 == 0 else rot + math.pi, f"{name}_{k:03d}")
    return n


def muelles_sur(col, nombre, xs, y_muro, camiones):
    """Muelle (niveladora, sello, luz) en cada portón del muro sur y camión en los indicados."""
    for i, x in enumerate(xs):
        poner("KIT_Muelle", col, (x, y_muro - 0.1, 0), -math.pi / 2, f"{nombre}_Muelle_{i}")
        if i in camiones:
            poner("KIT_Camion", col, (x, y_muro - 10.6, 0), -math.pi / 2, f"{nombre}_Camion_{i}")


# --------------------------------------------------------------------------- desposte
def desposte(P):
    est = coleccion("F3_Desposte_Equipos", P)
    riel = coleccion("F3_Desposte_Rieles", P)
    car = coleccion("F3_Desposte_Cuartos", P)
    pue = coleccion("F3_Desposte_Puestos", P)
    gen = coleccion("F3_Desposte_Personas", P)
    H = DESP["h"]
    ch = H - 0.6
    rnd = random.Random(21)

    # pesaje de oreo: el riel de medias entra por la puerta oeste (y = 11)
    n_med = riel_con_carga(riel, car, "Medias_Entrada", (-210, 11), (-204.5, 11), R_BAJO, "KIT_Media_G", 0.75, 0.0, ch)
    obj_bm(est, "Balanza_Oreo", ["M_Inox", "M_Pantalla", "M_Gris_Puerta"], lambda bm: (
        caja_bm(bm, -208.5, -206.5, 10.8, 11.2, 3.45, 3.75, 0), caja_bm(bm, -207.6, -207.4, 8.8, 9.0, 0, 2.2, 2),
        caja_bm(bm, -208.0, -207.0, 8.8, 8.9, 1.6, 2.2, 1)))
    poner("KIT_Operario", gen, (-207.5, 8.2, 0), math.pi / 2, "Op_Pesaje_Oreo")
    texto(est, "Rotulo_Pesaje_Oreo", "PESAJE DE OREO · pH", -207.5, 6.5, 0.02, 0.6, "M_Blanco_Senda")

    # cuarteo: sierra, 3 puestos de pesaje con hoja de pared (Delantero, Trasero, Asado)
    plataforma(est, "Plat_Cuarteo", -205.5, -202.5, 12.4, 13.6, 1.4, "O")
    obj_bm(est, "Sierra_Cuarteo", ["M_Amarillo_Seg", "M_Inox", "M_Negro_Cinta"], lambda bm: (
        caja_bm(bm, -204.4, -203.6, 12.0, 12.4, 1.6, 2.5, 0), caja_bm(bm, -204.2, -203.8, 11.4, 12.0, 1.8, 2.3, 1),
        caja_bm(bm, -204.05, -203.95, 12.2, 12.3, 2.5, H - 0.6, 2)))
    poner("KIT_Operario", gen, (-204.0, 13.0, 1.4), -math.pi / 2, "Op_Cuarteo")
    for i, (nm, x) in enumerate((("Trasero", -201.0), ("Delantero", -197.5), ("Asado", -194.0))):
        obj_bm(est, f"Puesto_Pesaje_{nm}", ["M_Inox", "M_Pantalla", "M_Blanco_Senda", "M_Panel_Sandwich"], lambda bm, x=x: (
            caja_bm(bm, x - 0.6, x + 0.6, 7.0, 8.2, 0, 0.85, 0), caja_bm(bm, x - 0.5, x + 0.5, 7.1, 8.1, 0.85, 0.88, 0),
            caja_bm(bm, x + 0.7, x + 0.76, 7.0, 7.06, 0, 1.6, 0), caja_bm(bm, x + 0.6, x + 0.9, 7.0, 7.08, 1.6, 1.85, 1),
            caja_bm(bm, x - 1.0, x + 1.0, 5.9, 6.0, 1.0, 2.2, 3),                   # hoja de pared
            *[caja_bm(bm, x - 0.9 + c * 0.38, x - 0.62 + c * 0.38, 6.0, 6.01, 1.15 + r * 0.33, 1.4 + r * 0.33, 2)
              for c in range(5) for r in range(3)]))
        poner("KIT_Operario", gen, (x, 8.8, 0), -math.pi / 2, f"Op_Pesaje_{nm}")
    texto(est, "Rotulo_Cuarteo", "CUARTEO · DELANTERO / TRASERO / ASADO", -199, 4.6, 0.02, 0.55, "M_Blanco_Senda")

    # rieles de cuartos: buffer hacia el norte y a las cabeceras de las líneas
    n_cu = 0
    n_cu += riel_con_carga(riel, car, "Traseros_N", (-201, 12.5), (-201, 64), R_BAJO, "KIT_Trasero", 0.7, math.pi / 2, ch, 0.9)
    n_cu += riel_con_carga(riel, car, "Traseros_E", (-201, 64), (-172, 64), R_BAJO, "KIT_Trasero", 0.7, 0.0, ch, 0.85)
    n_cu += riel_con_carga(riel, car, "Delanteros_N", (-197.5, 12.5), (-197.5, 61), R_BAJO, "KIT_Delantero", 0.7, math.pi / 2, ch, 0.9)
    n_cu += riel_con_carga(riel, car, "Delanteros_E", (-197.5, 61), (-150, 61), R_BAJO, "KIT_Delantero", 0.7, 0.0, ch, 0.8)
    # asado: cinta a las sierras sinfín
    cinta(est, "Cinta_Asado", (-194, 9), (-194, 40))
    for k in range(int(31 / 1.6)):
        poner("KIT_Asado", car, (-194, 9.8 + k * 1.6, 0.98), 0.0, f"Asado_Cinta_{k:02d}")
    for i in range(3):
        y = 42 + i * 3.0
        poner("KIT_Sierra_Sinfin", est, (-192.5, y, 0), math.pi / 2, f"Sierra_Sinfin_{i}")
        poner("KIT_Operario", gen, (-191.2, y, 0), math.pi / 2, f"Op_Sierra_Sinfin_{i}")
    caja(est, "Mesa_Asado", -195.0, -193.5, 41, 51, 0.85, 0.9, "M_Inox")
    texto(est, "Rotulo_Asado", "ASADO", -194, 53, 0.02, 0.6, "M_Blanco_Senda")

    # dos líneas de desposte: traseros (x = -172) y delanteros (x = -150)
    n_pu = 0
    for li, (xl, nombre, kit_c) in enumerate(((-172, "Traseros", "KIT_Trasero"), (-150, "Delanteros", "KIT_Delantero"))):
        cinta(est, f"Cinta_Desposte_{nombre}", (xl, 60), (xl, -8))
        cinta(est, f"Cinta_Huesos_{nombre}", (xl, 58), (xl, -6), z=1.7, ancho=0.5)
        caja(est, f"Mesa_Descarga_{nombre}", xl - 1.2, xl + 1.2, 60.5, 63.0, 0.8, 0.85, "M_Inox")
        poner("KIT_Operario", gen, (xl + 1.6, 61.8, 0), math.pi, f"Op_Descarga_{nombre}")
        for k in range(32):
            y = 57 - k * 2.0
            for s in (-1, 1):
                o = poner("KIT_Puesto_Desposte", pue, (xl + s * 0.45, y, 0), math.pi / 2 if s < 0 else -math.pi / 2,
                          f"Puesto_{nombre}_{k:02d}_{'O' if s < 0 else 'E'}")
                n_pu += 1
            if k % 2 == 0:  # cortes viajando por la cinta
                caja(car, f"Corte_{nombre}_{k:02d}", xl - 0.25, xl + 0.2, y - 0.3, y + 0.3, 0.98, 1.1, "M_Media_Res")
            if k % 4 == 0:  # carros de huesos y grasa detrás de los puestos
                for s in (-1, 1):
                    poner("KIT_Carro_Rojo", est, (xl + s * 2.6, y - 1.0, 0), 0.0, f"Carro_{nombre}_{k:02d}_{s}")
        texto(est, f"Rotulo_Linea_{nombre}", f"DESPOSTE · {nombre.upper()}", xl, 66.5, 0.02, 0.8, "M_Blanco_Senda")
        # impresora de etiquetas de corte (emisión por rango) cada 8 puestos
        for k in range(0, 32, 8):
            y = 57 - k * 2.0
            caja(est, f"Impresora_Cortes_{nombre}_{k:02d}", xl + 3.2, xl + 3.6, y - 0.3, y + 0.3, 0.9, 1.2, "M_Blanco_Senda")
            caja(est, f"Impresora_Cortes_{nombre}_{k:02d}_Mesa", xl + 3.1, xl + 3.7, y - 0.4, y + 0.4, 0, 0.9, "M_Metal_Estructura")

    # encajado: al final de cada línea, 4 puestos (A–D) a cada lado de la cinta
    for xl, nombre in ((-172, "Traseros"), (-150, "Delanteros")):
        cinta(est, f"Cinta_Encajado_{nombre}", (xl, -8), (xl, -24))
        for j, letra in enumerate("ABCD"):
            y = -10 - j * 3.6
            for s in (-1, 1):
                poner("KIT_Puesto_Encajado", pue, (xl + s * 1.0, y, 0), math.pi / 2 if s < 0 else -math.pi / 2,
                      f"Encajado_{nombre}_{letra}_{'O' if s < 0 else 'E'}")
        texto(est, f"Rotulo_Encajado_{nombre}", "ENCAJADO  A · B · C · D", xl, -26.3, 0.02, 0.6, "M_Blanco_Senda")
    # cinta de cajas cerradas al pasillo de los túneles (puerta sur en x = -160)
    cinta(est, "Cinta_Cajas_Colectora", (-176, -25), (-146, -25), z=0.8, ancho=0.6)
    cinta(est, "Cinta_Cajas_Tuneles", (-160, -25), (-160, -38), z=0.8, ancho=0.6)
    for k in range(34):
        x = -175.5 + k * 0.9
        poner("KIT_Caja_Carne", car, (x, -25, 0.84), 0.0, f"Caja_Colectora_{k:02d}")
    for k in range(13):
        poner("KIT_Caja_Carne", car, (-160, -26 - k, 0.84), math.pi / 2, f"Caja_A_Tuneles_{k:02d}")

    # charqueo: línea de cajas no trazables (recortes), con su balanza
    for i in range(2):
        y = -12 - i * 7
        cinta(est, f"Cinta_Charqueo_{i}", (-207, y), (-186, y))
        for k in range(8):
            for s in (-1, 1):
                poner("KIT_Puesto_Desposte", pue, (-205 + k * 2.4, y + s * 0.45, 0), 0.0 if s < 0 else math.pi,
                      f"Puesto_Charqueo_{i}_{k}_{s}")
    poner("KIT_Puesto_Encajado", pue, (-184.0, -16, 0), -math.pi / 2, "Balanza_Charqueo")
    poner("KIT_Puesto_Encajado", pue, (-184.0, -23, 0), -math.pi / 2, "Balanza_Charqueo_2")
    texto(est, "Rotulo_Charqueo", "CHARQUEO", -197, -27.3, 0.02, 0.7, "M_Blanco_Senda")
    # recortes que van a Elaborados por el portón este (y = -10)
    for k in range(8):
        poner("KIT_Carro_Rojo", est, (-139 - (k % 4) * 1.1, -12 + (k // 4) * 1.0, 0), 0.0, f"Carro_Recortes_{k}")
    texto(est, "Rotulo_Recortes", "RECORTES → ELABORADOS", -140, -4, 0.02, 0.55, "M_Blanco_Senda")
    seg = coleccion("F3_Desposte_Seguridad", P)
    matafuegos_perimetro(seg, DESP["x0"], DESP["x1"], DESP["y0"], DESP["y1"], 15, 300)
    print(f"desposte: {n_pu} puestos, {n_cu} cuartos colgados, {n_med} medias en la entrada")


# --------------------------------------------------------------------------- túneles y cámara de cajas
def camaras_cajas(P):
    est = coleccion("F3_Cajas_Estructura", P)
    alm = coleccion("F3_Cajas_Almacen", P)
    cie = coleccion("F3_Cajas_Cielorrasos", P)
    x0, x1, y0, y1 = CAJ["x0"], CAJ["x1"], CAJ["y0"], CAJ["y1"]
    rnd = random.Random(31)
    hc = 7.2
    yn = -40.0   # antecámara norte (y -40 a -35) que une el pasillo con túneles y cámara
    # 3 túneles estáticos de congelado (x -210 a -186)
    for i in range(3):
        xa, xb = -210 + i * 8, -202 + i * 8
        caja(est, f"Tunel_{i+1}_Muro_O", xa, xa + 0.15, y0, yn, 0, hc, "M_Blanco_Aislado")
        caja(est, f"Tunel_{i+1}_Muro_E", xb - 0.15, xb, y0, yn, 0, hc, "M_Blanco_Aislado")
        xm = (xa + xb) / 2
        caja(est, f"Tunel_{i+1}_Muro_N_a", xa, xm - 1.6, yn - 0.15, yn, 0, hc, "M_Blanco_Aislado")
        caja(est, f"Tunel_{i+1}_Muro_N_b", xm + 1.6, xb, yn - 0.15, yn, 0, hc, "M_Blanco_Aislado")
        caja(est, f"Tunel_{i+1}_Dintel", xm - 1.6, xm + 1.6, yn - 0.15, yn, 4.0, hc, "M_Blanco_Aislado")
        caja(est, f"Tunel_{i+1}_Puerta", xm + 1.5, xm + 4.2 if i < 2 else xm + 3.5, yn + 0.05, yn + 0.15, 0, 4.1, "M_Gris_Puerta")
        caja(cie, f"Tunel_{i+1}_Cielorraso", xa, xb, y0, yn, hc, hc + 0.15, "M_Blanco_Aislado")
        texto(est, f"Tunel_{i+1}_Numero", f"TÚNEL {i+1}", xm, yn + 0.2, 4.8, 0.45, "M_Rojo_PATY")
        bpy.data.objects[f"Tunel_{i+1}_Numero"].rotation_euler = (math.pi / 2, 0, math.pi)
        obj_bm(est, f"Tunel_{i+1}_Evaporador", ["M_Blanco_Aislado", "M_Negro_Cinta"], lambda bm, xa=xa, xb=xb: (
            caja_bm(bm, xa + 0.3, xb - 0.3, y0 + 0.2, y0 + 1.6, 1.0, 6.8, 0),
            *[cil_bm(bm, xa + 1.5 + j * 2.5, 3.0 + r * 2.2, y0 + 1.6, y0 + 1.62, 0.7, 12, 1, eje="y")
              for j in range(2) for r in range(2)]))
        for fila in range(4):  # carros/racks de túnel cargados de cajas
            for c in range(2):
                poner("KIT_Pallet_Carne", alm, (xa + 2.0 + c * 4.0, y0 + 3.5 + fila * 4.2, 0), 0.0, f"Tunel_{i+1}_Pallet_{fila}_{c}")
                poner("KIT_Pallet_Carne", alm, (xa + 2.0 + c * 4.0, y0 + 3.5 + fila * 4.2, 1.15), 0.0, f"Tunel_{i+1}_Pallet_{fila}_{c}_b")
    # cámara de producto (x -185 a -135): racks y zona de preparación de despacho
    caja(est, "CamCajas_Muro_O", -185.15, -185, y0, yn, 0, hc, "M_Blanco_Aislado")
    caja(est, "CamCajas_Muro_N_a", -185, -162, yn - 0.15, yn, 0, hc, "M_Blanco_Aislado")
    caja(est, "CamCajas_Muro_N_b", -158, -135, yn - 0.15, yn, 0, hc, "M_Blanco_Aislado")
    caja(est, "CamCajas_Dintel", -162, -158, yn - 0.15, yn, 4.0, hc, "M_Blanco_Aislado")
    caja(cie, "CamCajas_Cielorraso", -185, -135, y0, yn, hc, hc + 0.15, "M_Blanco_Aislado")
    nr = 0
    for xc in (-183.6, -173.0, -162.4, -151.8, -141.2):      # pares espalda con espalda, pasillos de ~9 m
        for s in (-1, 1):
            if xc == -183.6 and s < 0:
                continue
            for ym in (-53.6, -45.0):
                poner("KIT_Rack", alm, (xc + s * 0.66, ym, 0), 0.0 if s < 0 else math.pi, f"Rack_Cajas_{nr:02d}")
                nr += 1
    # pallets en la playa de despacho (al sur, frente a los muelles) y autoelevadores
    for k in range(18):
        x = -183 + (k % 9) * 5.6 + rnd.uniform(-0.3, 0.3)
        y = -62.8 + (k // 9) * 1.4
        poner("KIT_Pallet_Carne", alm, (x, y, 0), rnd.choice((0.0, math.pi / 2)), f"Pallet_Despacho_{k:02d}")
    for i, (x, y, r) in enumerate(((-175, -59.5, 0.0), (-152, -59.0, math.pi), (-196, -42.5, math.pi / 2))):
        poner("KIT_Autoelevador", alm, (x, y, 0), r, f"Autoelevador_Cajas_{i}")
        poner("KIT_Operario", alm, (x, y, 0.55), r, f"Op_Autoelevador_Cajas_{i}")
    texto(est, "Rotulo_Despacho_Cajas", "DESPACHO DE CAJAS", -160, -61.5, 0.02, 0.6, "M_Blanco_Senda")
    muelles_sur(est, "Cajas", (-200, -190, -180, -165, -155, -145), y0, {0, 2, 3, 5})
    seg = coleccion("F3_Cajas_Seguridad", P)
    n = 400
    for x in range(-205, -137, 12):
        matafuegos(seg, x, yn + 0.4, math.pi / 2, n); n += 1


# --------------------------------------------------------------------------- abasto
def abasto(P):
    est = coleccion("F3_Abasto_Estructura", P)
    car = coleccion("F3_Abasto_Carga", P)
    x0, x1, y0, y1 = ABA["x0"], ABA["x1"], ABA["y0"], ABA["y1"]
    H = ABA["h"]
    # riel que baja del pasillo de cámaras (x = -242) y distribuye en 6 rieles de armado de pedidos
    riel_con_carga(est, car, "Abasto_Bajada", (-242, -30), (-242, -40), R_BAJO, "KIT_Media_G", 0.75, 0.0, H - 0.6, 0.8)
    barra(est, "Riel_Abasto_Colector", (-270, -40), (-214, -40), R_BAJO, 0.07, 0.09, "M_Inox_Cepillado")
    n = 0
    for i, x in enumerate((-268, -262, -256, -228, -222, -216)):
        kit = ("KIT_Media_G", "KIT_Trasero", "KIT_Delantero")[i % 3]
        n += riel_con_carga(est, car, f"Abasto_Pedido_{i}", (x, -40), (x, -57), R_BAJO, kit, 0.75, math.pi / 2, H - 0.6, 0.85)
    obj_bm(est, "Balanza_Abasto", ["M_Inox", "M_Pantalla", "M_Gris_Puerta"], lambda bm: (
        caja_bm(bm, -243, -241, -40.2, -39.8, 3.45, 3.75, 0), caja_bm(bm, -240.6, -240.4, -42.0, -41.8, 0, 2.2, 2),
        caja_bm(bm, -241.0, -240.0, -42.0, -41.9, 1.6, 2.2, 1)))
    caja(est, "Escritorio_Pedidos", -250, -246, -45, -44, 0, 0.8, "M_Madera_Mueble")
    caja(est, "Escritorio_Pedidos_PC", -249, -248.4, -44.8, -44.6, 0.8, 1.2, "M_Pantalla")
    for k, (x, y) in enumerate(((-247.5, -45.8), (-240, -43), (-262, -60), (-222, -60))):
        poner("KIT_Operario", car, (x, y, 0), math.pi / 2, f"Op_Abasto_{k}")
    texto(est, "Rotulo_Abasto_Pedidos", "ARMADO DE PEDIDOS (CON HUESO)", -242, -50, 0.02, 0.6, "M_Blanco_Senda")
    muelles_sur(est, "Abasto", (-262, -248, -234, -220), y0, {0, 1, 3})
    seg = coleccion("F3_Abasto_Seguridad", P)
    matafuegos_perimetro(seg, x0, x1, y0, y1, 15, 500)
    print("abasto: piezas colgadas", n)


def f3():
    raiz = coleccion("F3_CICLO2")
    vaciar(raiz)
    desposte(coleccion("F3_DESPOSTE", raiz))
    camaras_cajas(coleccion("F3_CAMARAS_CAJAS", raiz))
    abasto(coleccion("F3_ABASTO", raiz))
    # camiones de subproductos (harinas y cueros) en los portones sur del edificio de subproductos
    sub = coleccion("F3_Muelles_Subproductos", raiz)
    muelles_sur(sub, "Subproductos", (-340, -290), -65, {0, 1})
    objs = [o for o in raiz.all_objects if o.type == "MESH"]
    print("F3:", len(objs), "objetos,", sum(len(o.data.polygons) for o in objs), "caras dibujadas,",
          len({o.data.name for o in objs}), "mallas distintas")
