"""F4 del PLAN_MODELO_3D.md: Elaborados L1–L6 en la ampliación (x −75 a 75, y 35 a 160).

    R = r"<repo>/blender/"
    for f in ("f1_masas.py", "kit.py", "f2_ciclo1.py", "f4_elaborados.py"): exec(open(R + f, encoding="utf-8").read())
    f4()

Idempotente: rehace solo F4_ELABORADOS. L7 y L8 NO se tocan: las líneas nuevas son copias enlazadas
(mismo mesh data) de las piezas de L7 desplazadas en y. Según el sistema de planeamiento:
  - L1, L2, L4, L5, L6: una formadora; desde la formadora en adelante (sin el carril B). Se alimentan
    con carritos desde los trenes compartidos T1 y T2 (1 picadora + 2 mezcladoras cada uno).
  - L3: bloque propio (picadora, 2 mezcladoras, descarga directa por cañería, 2 formadoras, 2 estuchadoras),
    es decir la copia completa de L7.
Supuesto: cada línea conserva su túnel (en la planta hay un túnel cada 2 líneas; sin plano no se sabe cuáles comparten).
"""
import math
import random
import re

import bpy
from mathutils import Matrix

EJE_L7 = 12.0
LINEAS = {  # n: (eje y, formadora, envasado)
    1: (143.0, "F19", "PDC · sin estuche"),
    2: (123.0, "F19", "Estuche Camma"),
    3: (103.0, "F26 ×2", "Estuche Camma ×2 (L3A / L3B)"),
    4: (83.0, "F19", "Estuche Bradman Lake"),
    5: (63.0, "F26", "M10 · sin estuche"),
    6: (43.0, "F26", "Granel"),
}
TRENES = {"T1": 63.0, "T2": 123.0}  # eje y de cada tren (comparten las líneas 1–6, menos L3)
DX_TRENES = -22.0
FRENTE = ("Mesada_Desencajado", "Elevador", "Picadora", "Plataforma_Mezcladoras", "Mezcladora", "Escalera_Mezcladoras",
          "Caneria_Pasta", "Bomba_Pasta", "Cinta_L7_Picadora_Salida", "Cinta_L7_Desvio")
RE_B = re.compile(r"(^|_)B(_|$)")


def _es_frente(name):
    return name.startswith(FRENTE)


def _copiar(src, col, dx, dy, n_txt):
    data = src.data
    if src.type == "FONT" and "L7" in data.body:  # los textos llevan su propia línea (no se comparten)
        data = data.copy()
        data.body = data.body.replace("L7", n_txt.strip("_"))
    o = bpy.data.objects.new(src.name.replace("_L7", n_txt), data)
    o.matrix_world = Matrix.Translation((dx, dy, 0)) @ src.matrix_world
    col.objects.link(o)
    return o


def copiar_linea(n, eje, col, gen):
    dy = eje - EJE_L7
    completa = n == 3
    k = 0
    for src in bpy.data.collections["02_LINEA7"].all_objects:
        if src.type not in ("MESH", "CURVE", "FONT"):
            continue
        base = src.name.replace("_L7", "")
        if not completa and (_es_frente(src.name) or RE_B.search(base)):
            continue
        _copiar(src, col, 0, dy, f"_L{n}")
        k += 1
    pref = ("Operario_L7_",) if completa else ("Operario_L7_Formadora_A", "Operario_L7_Envasadora", "Operario_L7_Encajonadora")
    for src in bpy.data.collections["06_PERSONAS"].all_objects:
        if src.type == "MESH" and src.name.startswith(pref):
            _copiar(src, gen, 0, dy, f"_L{n}")
    return k


def copiar_tren(nombre, eje, col, gen):
    dy = eje - EJE_L7
    k = 0
    for src in bpy.data.collections["02_LINEA7"].all_objects:
        if src.type != "MESH" or not _es_frente(src.name) or src.name.startswith(("Caneria_Pasta", "Bomba_Pasta")):
            continue
        _copiar(src, col, DX_TRENES, dy, "_" + nombre)
        k += 1
    for src in bpy.data.collections["06_PERSONAS"].all_objects:
        if src.type == "MESH" and src.name.startswith(("Operario_L7_Picadora", "Operario_L7_Plataforma", "Operario_L7_Desencajado")):
            _copiar(src, gen, DX_TRENES, dy, "_" + nombre)
    return k


def kit_elaborados():
    import bmesh
    bm = bmesh.new()                                   # carrito de pasta (euro-bin 200 L)
    loft(bm, [[(-0.35, -0.35, 0.3), (0.35, -0.35, 0.3), (0.35, 0.35, 0.3), (-0.35, 0.35, 0.3)],
              [(-0.42, -0.42, 1.0), (0.42, -0.42, 1.0), (0.42, 0.42, 1.0), (-0.42, 0.42, 1.0)]], 0)
    caja_bm(bm, -0.4, 0.4, -0.4, 0.4, 0.88, 0.95, 1)   # pasta
    for sx in (-0.3, 0.3):
        for sy in (-0.3, 0.3):
            cil_bm(bm, sx, sy, 0.0, 0.3, 0.06, 6, 2)
    caja_bm(bm, -0.04, 0.04, -0.48, -0.42, 0.95, 1.0, 0)
    _nuevo("KIT_Carrito_Pasta", bm, ["M_Inox", "M_Hamburguesa_Cruda", "M_Goma"])
    bm = bmesh.new()                                   # volcador de carritos (columna + cuna)
    caja_bm(bm, -0.25, 0.25, -0.25, 0.25, 0.0, 3.4, 0)
    caja_bm(bm, -0.6, 0.6, -0.5, 0.5, 0.0, 0.2, 1)
    caja_bm(bm, 0.25, 0.95, -0.45, 0.45, 2.6, 3.2, 2)  # cuna con el carrito volcado arriba
    caja_bm(bm, 0.3, 0.9, -0.4, 0.4, 3.2, 3.3, 3)
    _nuevo("KIT_Volcador", bm, ["M_Azul_Compresor", "M_Metal_Estructura", "M_Inox", "M_Hamburguesa_Cruda"])
    bm = bmesh.new()                                   # estante con bolsas de aditivos
    for z in (0.0, 0.7, 1.4, 2.1):
        caja_bm(bm, -1.0, 1.0, -0.3, 0.3, z + 0.12, z + 0.16, 0)
        for i in range(4):
            caja_bm(bm, -0.9 + i * 0.46, -0.5 + i * 0.46, -0.25, 0.25, z + 0.16, z + 0.42, 1)
    for sx in (-0.98, 0.98):
        for sy in (-0.28, 0.28):
            caja_bm(bm, sx - 0.02, sx + 0.02, sy - 0.02, sy + 0.02, 0, 2.6, 0)
    _nuevo("KIT_Estante_Aditivos", bm, ["M_Metal_Estructura", "M_Blanco_Senda"])


def f4():
    raiz = coleccion("F4_ELABORADOS")
    vaciar(raiz)
    kit_elaborados()
    rnd = random.Random(41)
    gen = coleccion("F4_Personas", raiz)
    eq = coleccion("F4_Equipos", raiz)
    n_obj = 0
    for n, (eje, form, env) in LINEAS.items():
        col = coleccion(f"F4_LINEA{n}", raiz)
        n_obj += copiar_linea(n, eje, col, gen)
        if n != 3:  # alimentación por carritos: volcador en la tolva de la formadora y carritos esperando
            poner("KIT_Volcador", eq, (-25.2, eje - 2.4, 0), math.pi, f"Volcador_L{n}")
            for k in range(2):
                poner("KIT_Carrito_Pasta", eq, (-27.0 - k * 1.1, eje - 3.4, 0), rnd.uniform(-0.2, 0.2), f"Carrito_L{n}_{k}")
        texto(eq, f"Rotulo_L{n}", f"LÍNEA {n}  ·  {form}  ·  {env}", -2.0, eje - 4.6, 0.02, 0.7, "M_Blanco_Senda")
        o = texto(eq, f"Cartel_L{n}", f"L{n}", -23.0, eje - 4.0, 5.2, 1.4, "M_Rojo_PATY")
        o.rotation_euler = (math.pi / 2, 0, 0)

    # sala de trenes de picado (x −75 a −42) con mampara de policarbonato
    tr = coleccion("F4_TRENES", raiz)
    for nombre, eje in TRENES.items():
        n_obj += copiar_tren(nombre, eje, tr, gen)
        texto(eq, f"Rotulo_{nombre}", f"TREN DE PICADO {nombre[1]}  ·  1 picadora + 2 mezcladoras", -58, eje - 5.0, 0.02, 0.6, "M_Blanco_Senda")
        for k in range(6):  # carritos cargados saliendo de las mezcladoras
            poner("KIT_Carrito_Pasta", eq, (-45.5 + (k % 3) * 1.1, eje - 2.0 + (k // 3) * 4.0, 0), rnd.uniform(-0.3, 0.3), f"Carrito_{nombre}_{k}")
    caja(eq, "Mampara_Trenes", -42.1, -42.0, 36, 98, 2.4, 6.0, "M_Policarbonato")
    caja(eq, "Mampara_Trenes_N", -42.1, -42.0, 116, 158, 2.4, 6.0, "M_Policarbonato")
    # pasillo de carritos pintado (x −41 a −37) de los trenes a todas las líneas
    caja(eq, "Pasillo_Carritos", -41.0, -37.0, 37, 158, 0.0, 0.012, "M_Amarillo_Seg")
    for k in range(40):
        y = 39 + k * 3.0
        caja(eq, f"Pasillo_Carritos_Flecha_{k:02d}", -39.3, -38.7, y, y + 1.4, 0.012, 0.02, "M_Blanco_Senda")
    texto(eq, "Rotulo_Pasillo_Carritos", "CARRITOS DE PASTA", -39, 96, 0.03, 0.55, "M_Rojo_PATY")
    bpy.data.objects["Rotulo_Pasillo_Carritos"].rotation_euler = (0, 0, math.pi / 2)
    for n, (eje, _, _) in LINEAS.items():
        if n == 3:
            continue
        caja(eq, f"Senda_Carritos_L{n}", -37.0, -26.0, eje - 3.9, eje - 2.9, 0.0, 0.012, "M_Amarillo_Seg")
    for k in range(4):
        x, y = -39.0, 50 + k * 26
        poner("KIT_Carrito_Pasta", eq, (x, y, 0), math.pi / 2, f"Carrito_Pasillo_{k}")
        poner("KIT_Operario", gen, (x - 0.9, y, 0), math.pi / 2, f"Op_Carritos_{k}")

    # sala de aditivos (noroeste) con estantes, balanza y mesa de pesaje por fórmula
    sa = coleccion("F4_Sala_Aditivos", raiz)
    for nm, a in {"S": (-75, -48, 149.0, 149.15), "E": (-48.15, -48, 149, 160)}.items():
        caja(sa, f"Aditivos_Muro_{nm}", *a, 0, 4.0, "M_Blanco_Aislado")
    caja(sa, "Aditivos_Puerta", -48.2, -48.1, 152, 154.2, 0, 2.4, "M_Gris_Puerta")
    for i in range(5):
        poner("KIT_Estante_Aditivos", sa, (-72.0 + i * 4.6, 158.7, 0), 0.0, f"Estante_Aditivos_{i}")
    caja(sa, "Aditivos_Mesa", -66, -58, 152.5, 154, 0.85, 0.9, "M_Inox")
    caja(sa, "Aditivos_Mesa_Base", -65.9, -58.1, 152.6, 153.9, 0, 0.85, "M_Metal_Estructura")
    poner("KIT_Puesto_Encajado", sa, (-55.0, 153.0, 0), math.pi, "Balanza_Aditivos")
    for k in range(3):
        poner("KIT_Operario", sa, (-64 + k * 3.0, 151.6, 0), 0.0, f"Op_Aditivos_{k}")
    texto(sa, "Rotulo_Aditivos", "SALA DE ADITIVOS", -62, 150.6, 0.02, 0.6, "M_Blanco_Senda")

    # cámara de PT y supercongelados (x 38 a 75) con racks; muelles y camiones al este
    pt = coleccion("F4_Camara_PT", raiz)
    caja(pt, "CamPT_Muro_O_a", 38.0, 38.15, 36, 58, 0, 6.8, "M_Blanco_Aislado")
    caja(pt, "CamPT_Muro_O_b", 38.0, 38.15, 68, 98, 0, 6.8, "M_Blanco_Aislado")
    caja(pt, "CamPT_Muro_O_c", 38.0, 38.15, 108, 138, 0, 6.8, "M_Blanco_Aislado")
    caja(pt, "CamPT_Muro_O_d", 38.0, 38.15, 148, 160, 0, 6.8, "M_Blanco_Aislado")
    for i, y in enumerate((63, 103, 143)):
        caja(pt, f"CamPT_Dintel_{i}", 38.0, 38.15, y - 5, y + 5, 4.2, 6.8, "M_Blanco_Aislado")
        caja(pt, f"CamPT_Cortina_{i}", 38.05, 38.1, y - 5, y + 5, 0.2, 4.2, "M_Policarbonato")
    cie = coleccion("F4_Camara_PT_Cielorraso", raiz)
    caja(cie, "CamPT_Cielorraso", 38.0, 75.0, 35.2, 160, 6.8, 6.95, "M_Blanco_Aislado")
    caja(pt, "CamPT_Escarcha_Piso", 38.2, 74.8, 35.3, 159.8, 0.0, 0.01, "M_Escarcha")
    nr = 0
    for xc in (44.0, 55.0, 66.0):
        for s in (-1, 1):
            for yi in range(13):
                ym = 40.5 + yi * 8.6
                if any(abs(ym - y) < 6 for y in (63, 103, 143)):
                    continue  # pasillos transversales frente a las cortinas
                poner("KIT_Rack", pt, (xc + s * 0.66, ym, 0), 0.0 if s < 0 else math.pi, f"Rack_PT_{nr:03d}")
                nr += 1
    for i, (x, y, r) in enumerate(((49.5, 63, 0.0), (60.5, 103, math.pi), (35.0, 83, math.pi / 2), (35.0, 123, -math.pi / 2))):
        poner("KIT_Autoelevador", pt, (x, y, 0), r, f"Autoelevador_PT_{i}")
        poner("KIT_Operario", pt, (x, y, 0.55), r, f"Op_Autoelevador_PT_{i}")
    for k in range(6):  # pallets terminados esperando al pie de cada estibado
        n = (1, 2, 3, 4, 5, 6)[k]
        poner("KIT_Pallet_PT", pt, (33.5, LINEAS[n][0] + 1.0, 0), 0.0, f"Pallet_PT_L{n}")
    texto(pt, "Rotulo_CamPT", "CÁMARA PT · SUPERCONGELADOS", 56, 37.5, 0.03, 0.8, "M_Blanco_Senda")
    for i, y in enumerate((63, 103, 143)):
        poner("KIT_Muelle", pt, (75.1, y, 0), 0.0, f"Elab_Muelle_{i}")
        poner("KIT_Camion", pt, (85.7, y, 0), 0.0, f"Elab_Camion_{i}")
    seg = coleccion("F4_Seguridad", raiz)
    n = 600
    for y in range(40, 158, 15):
        matafuegos(seg, -74.65, y, 0.0, n); n += 1
        matafuegos(seg, 37.6, y + 4, math.pi, n); n += 1
    objs = [o for o in raiz.all_objects if o.type == "MESH"]
    print("F4:", len(objs), "objetos,", sum(len(o.data.polygons) for o in objs), "caras dibujadas,",
          len({o.data.name for o in objs}), "mallas distintas; racks PT", nr)
