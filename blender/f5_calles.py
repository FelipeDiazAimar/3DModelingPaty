"""Calles realistas y báscula de camiones (PLAN_MODELO_3D.md, F5).

    R = r"<repo>/blender/"
    for f in ("f1_masas.py", "kit.py", "f2_ciclo1.py", "f5_ambiente.py", "f5_calles.py"): exec(open(R + f, encoding="utf-8").read())
    f5_calles()      # después de f1(), f5() y antes de f5_exterior() (el césped se recorta con lo que se agrega acá)

Idempotente: rehace solo F5_CALLES_REALES.
- Un solo ingreso de camiones (portón norte x = -130) con PLAYA DE BÁSCULA: dos puentes de pesaje
  (ingreso hacia el sur y egreso hacia el norte: el camión se pesa al entrar y al salir), casilla con operador,
  barreras, semáforos y visor de peso. Los portones sur y este quedan cerrados (salidas de emergencia).
- Patios de maniobra de hormigón con juntas; cordones en los bordes contra el césped (cortados en cada cruce);
  bordes amarillos, líneas de PARE, flechas, sendas peatonales, señales; cunetas en la ruta; parada de colectivo
  con sendero peatonal y molinete hasta la puerta norte de vestuarios.
- Saca de la escena (ZZ_RETIRADO) los árboles originales que quedaron dentro de los patios nuevos.
"""
import math
import random

import bpy
import bmesh
from mathutils import Vector

PLAZA = (-162, -135, 118, 165)           # playa de báscula (se une a la calle norte y a la calle C2-Elaborados)
PUENTES = {"Ingreso": -154.0, "Egreso": -142.0}   # eje x de cada puente (18 × 3,2 m, y 132 a 150)
PATIOS_HORMIGON = ("Patio_Sur_Oeste", "Patio_Ampliacion_Este", "Patio_Ampliacion_Oeste", "Playa_Jaulas", "Patio_Norte_Oeste")


def _bb(o):
    ws = [o.matrix_world @ Vector(v) for v in o.bound_box]
    return min(w.x for w in ws), max(w.x for w in ws), min(w.y for w in ws), max(w.y for w in ws)


def texto_malla(txt, size, mat):
    """Texto convertido a malla (para meterlo dentro de un kit)."""
    cu = bpy.data.curves.new("tmp_txt", "FONT")
    cu.body = txt
    cu.size = size
    cu.align_x = "CENTER"
    cu.align_y = "CENTER"
    cu.extrude = 0.005
    cu.resolution_u = 2
    o = bpy.data.objects.new("tmp_txt", cu)
    bpy.context.scene.collection.objects.link(o)
    dg = bpy.context.evaluated_depsgraph_get()
    me = bpy.data.meshes.new_from_object(o.evaluated_get(dg))
    bpy.data.objects.remove(o)
    bpy.data.curves.remove(cu)
    me.materials.clear()
    me.materials.append(bpy.data.materials[mat])
    return me


def _kit_con_texto(name, fn_bm, mats, textos):
    """fn_bm arma la base; textos = [(txt, size, mat, (dx,dy,dz), rot_x)] se agregan como malla."""
    from mathutils import Matrix
    bm = bmesh.new()
    fn_bm(bm)
    allm = list(mats)
    for txt, size, mat, d, rx in textos:
        me = texto_malla(txt, size, mat)
        me.transform(Matrix.Translation(d) @ Matrix.Rotation(rx, 4, "X"))
        if mat not in allm:
            allm.append(mat)
        for p in me.polygons:
            p.material_index = allm.index(mat)
        bm.from_mesh(me)
        bpy.data.meshes.remove(me)
    o = _nuevo(name, bm, allm)
    for p in o.data.polygons:
        p.use_smooth = False
    return o


def kits_calles():
    material("M_Hormigon_Patio", (0.62, 0.62, 0.6), 0.85)
    material("M_Junta_Hormigon", (0.32, 0.32, 0.32), 0.9)
    material("M_Linea_Amarilla", (0.95, 0.75, 0.05), 0.6)
    material("M_Cuneta", (0.14, 0.33, 0.09), 0.95)
    material("M_Senal_Azul", (0.05, 0.25, 0.7), 0.5)
    poste = lambda bm: cil_bm(bm, 0, 0, 0, 2.6, 0.04, 8, 0)
    _kit_con_texto("KIT_Senal_Vel20", lambda bm: (poste(bm), cil_bm(bm, 0, 2.3, -0.02, 0.0, 0.32, 16, 1, eje="y"),
                   cil_bm(bm, 0, 2.3, -0.025, -0.02, 0.26, 16, 2, eje="y")),
                   ["M_Metal_Estructura", "M_Rojo_PATY", "M_Blanco_Senda"], [("20", 0.28, "M_Negro_Cinta", (0, -0.03, 2.3), math.pi / 2)])
    _kit_con_texto("KIT_Senal_Vel60", lambda bm: (poste(bm), cil_bm(bm, 0, 2.3, -0.02, 0.0, 0.32, 16, 1, eje="y"),
                   cil_bm(bm, 0, 2.3, -0.025, -0.02, 0.26, 16, 2, eje="y")),
                   ["M_Metal_Estructura", "M_Rojo_PATY", "M_Blanco_Senda"], [("60", 0.28, "M_Negro_Cinta", (0, -0.03, 2.3), math.pi / 2)])
    _kit_con_texto("KIT_Senal_Pare", lambda bm: (poste(bm), cil_bm(bm, 0, 2.3, -0.02, 0.0, 0.32, 8, 1, eje="y")),
                   ["M_Metal_Estructura", "M_Rojo_PATY"], [("PARE", 0.16, "M_Blanco_Senda", (0, -0.03, 2.3), math.pi / 2)])
    _kit_con_texto("KIT_Senal_Bascula", lambda bm: (poste(bm), caja_bm(bm, -0.6, 0.6, -0.02, 0.0, 2.0, 2.6, 1)),
                   ["M_Metal_Estructura", "M_Senal_Azul"],
                   [("BÁSCULA", 0.17, "M_Blanco_Senda", (0, -0.03, 2.38), math.pi / 2),
                    ("INGRESO · EGRESO", 0.09, "M_Blanco_Senda", (0, -0.03, 2.16), math.pi / 2)])
    bm = bmesh.new()                                   # barrera vehicular (pilar + brazo a rayas)
    caja_bm(bm, -0.2, 0.2, -0.2, 0.2, 0, 1.1, 0)
    for i in range(8):
        caja_bm(bm, 0.2 + i * 0.45, 0.65 + i * 0.45, -0.04, 0.04, 0.95, 1.03, 1 + i % 2)
    _nuevo("KIT_Barrera", bm, ["M_Amarillo_Seg", "M_Rojo_PATY", "M_Blanco_Senda"])
    bm = bmesh.new()                                   # semáforo de báscula
    caja_bm(bm, -0.05, 0.05, -0.05, 0.05, 0, 2.4, 0)
    caja_bm(bm, -0.18, 0.18, -0.12, 0.12, 2.4, 3.1, 1)
    cil_bm(bm, 0, 2.92, -0.14, -0.12, 0.11, 10, 2, eje="y")
    cil_bm(bm, 0, 2.58, -0.14, -0.12, 0.11, 10, 3, eje="y")
    _nuevo("KIT_Semaforo", bm, ["M_Metal_Estructura", "M_Negro_Cinta", "M_Baliza_Roja", "M_Baliza_Verde"])


# --------------------------------------------------------------------------- utilidades de calle
def _pavimentos():
    """Rectángulos pavimentados: (nombre, x0, x1, y0, y1)."""
    out = []
    for o in bpy.data.collections["F1_PATIOS_Y_CALLES"].objects:
        if o.type == "MESH" and not o.name.startswith("Senda"):
            out.append((o.name, *_bb(o)))
    for nm, a in CALLES_EXT.items():
        out.append((nm, *a))
    out.append(("Plaza_Bascula", *PLAZA))
    return out


def _bloqueos():
    """Lo que corta un cordón: otros pavimentos, banquinas, pisos de edificios, corrales y el predio original."""
    b = [r[1:] for r in _pavimentos()]
    b += [v for k, v in VEREDAS.items() if k.startswith("Banquina")]
    for o in bpy.data.collections["F1_PLANTA_COMPLETA"].all_objects:
        if o.type == "MESH" and o.name.endswith("_Piso"):
            b.append(_bb(o))
    b.append((-136, 130, -90, 90))
    return b


def _restar(intervalo, cortes):
    segs = [intervalo]
    for c0, c1 in cortes:
        nuevos = []
        for s0, s1 in segs:
            if c1 <= s0 or c0 >= s1:
                nuevos.append((s0, s1))
                continue
            if c0 > s0:
                nuevos.append((s0, c0))
            if c1 < s1:
                nuevos.append((c1, s1))
        segs = nuevos
    return [s for s in segs if s[1] - s[0] > 0.6]


def cordones(col):
    """Cordón de hormigón (0,15 × 0,15 m) en cada borde de pavimento que da al césped."""
    pav = _pavimentos()
    bloq = _bloqueos()
    n = 0
    for nm, x0, x1, y0, y1 in pav:
        if nm.startswith(("Acceso",)):
            continue
        bordes = {"S": ("x", y0, x0, x1, -1), "N": ("x", y1, x0, x1, 1), "O": ("y", x0, y0, y1, -1), "E": ("y", x1, y0, y1, 1)}
        for lado, (eje, fijo, a0, a1, s) in bordes.items():
            cortes = []
            for (b0, b1, c0, c1) in bloq:
                if (b0, b1, c0, c1) == (x0, x1, y0, y1):
                    continue
                if eje == "x" and c0 - 0.6 <= fijo <= c1 + 0.6 and b1 > a0 and b0 < a1:
                    cortes.append((b0 - 0.4, b1 + 0.4))
                if eje == "y" and b0 - 0.6 <= fijo <= b1 + 0.6 and c1 > a0 and c0 < a1:
                    cortes.append((c0 - 0.4, c1 + 0.4))
            for k, (u0, u1) in enumerate(_restar((a0, a1), cortes)):
                if eje == "x":
                    caja(col, f"Cordon_{nm}_{lado}_{k}", u0, u1, fijo + (0 if s > 0 else -0.15), fijo + (0.15 if s > 0 else 0), -0.1, 0.15, "M_Cordon")
                else:
                    caja(col, f"Cordon_{nm}_{lado}_{k}", fijo + (0 if s > 0 else -0.15), fijo + (0.15 if s > 0 else 0), u0, u1, -0.1, 0.15, "M_Cordon")
                n += 1
    print("cordones:", n)


def juntas(col, nm, x0, x1, y0, y1, paso=5.0):
    for k in range(1, int((x1 - x0) // paso)):
        x = x0 + k * paso
        caja(col, f"Junta_{nm}_X_{k:03d}", x - 0.015, x + 0.015, y0, y1, 0.012, 0.016, "M_Junta_Hormigon")
    for k in range(1, int((y1 - y0) // paso)):
        y = y0 + k * paso
        caja(col, f"Junta_{nm}_Y_{k:03d}", x0, x1, y - 0.015, y + 0.015, 0.012, 0.016, "M_Junta_Hormigon")


def flecha(col, name, x, y, rz, largo=4.0, mat="M_Blanco_Senda"):
    o = obj_bm(col, name, [mat], lambda bm: (
        caja_bm(bm, -largo / 2, largo / 2 - 1.0, -0.15, 0.15, 0.012, 0.022, 0),
        loft(bm, [[(largo / 2 - 1.0, -0.55, 0.012), (largo / 2, 0.0, 0.012), (largo / 2 - 1.0, 0.55, 0.012)],
                  [(largo / 2 - 1.0, -0.55, 0.022), (largo / 2, 0.0, 0.022), (largo / 2 - 1.0, 0.55, 0.022)]], 0)))
    o.location = (x, y, 0)
    o.rotation_euler = (0, 0, rz)
    return o


# --------------------------------------------------------------------------- báscula
def bascula(col):
    x0, x1, y0, y1 = PLAZA
    caja(col, "Plaza_Bascula", x0, x1, y0, y1, -0.45, 0.012, "M_Hormigon_Patio")
    juntas(col, "Plaza_Bascula", x0, x1, y0, y1)
    for lado, xc in PUENTES.items():
        # foso con marco de hormigón, tablero de acero y cubiertas de celdas de carga; topes laterales amarillos
        obj_bm(col, f"Bascula_{lado}", ["M_Metal_Estructura", "M_Hormigon_Piso", "M_Amarillo_Seg", "M_Gris_Puerta"], lambda bm, xc=xc: (
            caja_bm(bm, xc - 1.85, xc + 1.85, 131.6, 150.4, -0.3, 0.03, 1),
            caja_bm(bm, xc - 1.6, xc + 1.6, 132.0, 150.0, 0.03, 0.09, 0),
            *[caja_bm(bm, xc - 1.6 + 0.02, xc + 1.6 - 0.02, 132.0 + k * 2.25, 132.06 + k * 2.25, 0.09, 0.1, 3) for k in range(9)],
            *[caja_bm(bm, xc + s * 1.75 - 0.15, xc + s * 1.75 + 0.15, y - 0.25, y + 0.25, 0.03, 0.12, 3)
              for s in (-1, 1) for y in (133, 141, 149)],
            *[caja_bm(bm, xc + s * 1.95 - 0.08, xc + s * 1.95 + 0.08, 132.0, 150.0, 0.03, 0.45, 2) for s in (-1, 1)]))
        sur = lado == "Ingreso"   # el ingreso circula hacia el sur, el egreso hacia el norte
        for k, y in enumerate((153.0, 129.0) if sur else (129.0, 153.0)):
            yb = y
            poner("KIT_Barrera", col, (xc + 2.2, yb, 0), math.pi, f"Barrera_{lado}_{k}")
            o = poner("KIT_Semaforo", col, (xc - 2.3, yb + (1.0 if sur else -1.0), 0), 0.0 if sur else math.pi, f"Semaforo_{lado}_{k}")
        caja(col, f"Linea_Pare_{lado}", xc - 1.6, xc + 1.6, (154.0 if sur else 128.0) - 0.25, (154.0 if sur else 128.0) + 0.25,
             0.012, 0.022, "M_Blanco_Senda")
        for k, y in enumerate((160.0, 124.0) if sur else (124.0, 160.0)):
            flecha(col, f"Flecha_{lado}_{k}", xc, y, -math.pi / 2 if sur else math.pi / 2)
        texto(col, f"Rotulo_{lado}", lado.upper(), xc, 157.0 if sur else 125.5, 0.025, 0.7, "M_Blanco_Senda", 0)
    # isla central con la casilla del operador (ventanas a los dos puentes)
    caja(col, "Isla_Bascula", -149.6, -146.4, 130.0, 152.0, -0.1, 0.18, "M_Cordon")
    obj_bm(col, "Casilla_Bascula", ["M_Panel_Sandwich", "M_Vidrio", "M_Gris_Puerta", "M_Rojo_PATY", "M_Blanco_Aislado"], lambda bm: (
        caja_bm(bm, -149.3, -146.7, 138.0, 138.1, 0.18, 2.9, 0), caja_bm(bm, -149.3, -146.7, 143.9, 144.0, 0.18, 2.9, 0),
        caja_bm(bm, -149.3, -149.2, 138.0, 144.0, 0.18, 1.1, 0), caja_bm(bm, -146.8, -146.7, 138.0, 144.0, 0.18, 1.1, 0),
        caja_bm(bm, -149.32, -149.28, 138.1, 143.9, 1.1, 2.6, 1), caja_bm(bm, -146.72, -146.68, 138.1, 143.9, 1.1, 2.6, 1),
        caja_bm(bm, -149.3, -149.2, 138.0, 144.0, 2.6, 2.9, 0), caja_bm(bm, -146.8, -146.7, 138.0, 144.0, 2.6, 2.9, 0),
        caja_bm(bm, -148.6, -147.4, 137.95, 138.0, 0.18, 2.2, 2),
        caja_bm(bm, -149.45, -146.55, 137.85, 144.15, 2.9, 3.05, 4), caja_bm(bm, -149.45, -146.55, 137.8, 137.85, 2.7, 3.05, 3),
        caja_bm(bm, -148.6, -147.4, 144.0, 144.5, 2.2, 2.7, 4)))                         # equipo de aire
    caja(col, "Casilla_Mostrador_O", -149.1, -148.6, 139.0, 143.0, 0.18, 1.0, "M_Madera_Mueble")
    caja(col, "Casilla_Mostrador_E", -147.4, -146.9, 139.0, 143.0, 0.18, 1.0, "M_Madera_Mueble")
    caja(col, "Casilla_PC", -148.9, -148.85, 140.5, 141.3, 1.0, 1.45, "M_Pantalla")
    caja(col, "Casilla_Impresora_Tickets", -147.3, -147.0, 141.6, 142.0, 1.0, 1.2, "M_Blanco_Senda")
    poner("KIT_Operario", col, (-148.0, 141.0, 0.18), math.pi / 2, "Op_Bascula")
    # visores de peso (LED) mirando a cada camión
    for lado, xc in PUENTES.items():
        sur = lado == "Ingreso"
        xv = xc + (2.4 if sur else -2.4)
        yv = 128.0 if sur else 154.0
        caja(col, f"Visor_Peso_{lado}_Poste", xv - 0.06, xv + 0.06, yv - 0.06, yv + 0.06, 0, 2.6, "M_Metal_Estructura")
        caja(col, f"Visor_Peso_{lado}", xv - 0.9, xv + 0.9, yv - 0.1, yv + 0.1, 2.6, 3.2, "M_Pantalla")
        o = texto(col, f"Visor_Peso_{lado}_Txt", "38.420 kg" if sur else "14.960 kg", xv, yv + (0.12 if sur else -0.12), 2.9, 0.3, "M_LED_Blanco")
        o.rotation_euler = (math.pi / 2, 0, math.pi if sur else 0.0)
    # camiones: uno pesándose al entrar, otro al salir y uno esperando en la calle norte
    poner("KIT_Camion", col, (PUENTES["Ingreso"], 141.0, 0.09), -math.pi / 2, "Camion_Bascula_Ingreso")
    poner("KIT_Camion", col, (PUENTES["Egreso"], 141.0, 0.09), math.pi / 2, "Camion_Bascula_Egreso")
    poner("KIT_Camion", col, (-112.0, 172.5, 0), math.pi, "Camion_Espera_Bascula")
    poner("KIT_Senal_Bascula", col, (-137.5, 166.0, 0), 0.0, "Senal_Bascula")
    poner("KIT_Senal_Vel20", col, (-124.0, 183.0, 0), 0.0, "Senal_Vel20_Ingreso")
    # garita de vigilancia en el portón de ingreso
    obj_bm(col, "Garita_Ingreso", ["M_Panel_Sandwich", "M_Vidrio", "M_Rojo_PATY", "M_Gris_Puerta"], lambda bm: (
        caja_bm(bm, -122.5, -119.5, 181.0, 181.1, 0, 2.7, 0), caja_bm(bm, -122.5, -119.5, 183.9, 184.0, 0, 2.7, 0),
        caja_bm(bm, -122.5, -122.4, 181.0, 184.0, 0, 1.0, 0), caja_bm(bm, -119.6, -119.5, 181.0, 184.0, 0, 2.7, 0),
        caja_bm(bm, -122.52, -122.48, 181.1, 183.9, 1.0, 2.4, 1), caja_bm(bm, -122.5, -122.4, 181.0, 184.0, 2.4, 2.7, 0),
        caja_bm(bm, -121.6, -120.4, 180.95, 181.0, 0, 2.1, 3),
        caja_bm(bm, -122.65, -119.35, 180.85, 184.15, 2.7, 2.85, 2)))
    poner("KIT_Operario", col, (-121.0, 182.6, 0), -math.pi / 2, "Op_Vigilancia")
    poner("KIT_Barrera", col, (-125.2, 184.2, 0), math.pi, "Barrera_Porton_Ingreso")


# --------------------------------------------------------------------------- calles
def demarcacion_interna(col):
    """Bordes amarillos y línea central en las calles internas; PARE en los cruces; sendas peatonales."""
    calles = {"Calle_Norte": (-460, 130, 165, 180), "Calle_C2_Elab": (-135, -125, -82.5, 165), "Calle_Faena": (-370, -355, -65, 85)}
    for nm, (x0, x1, y0, y1) in calles.items():
        en_x = (x1 - x0) > (y1 - y0)
        for s, k in (("a", 0.35), ("b", -0.5)):
            if en_x:
                yy = y0 + k if k > 0 else y1 + k
                caja(col, f"Borde_Amarillo_{nm}_{s}", x0, x1, yy, yy + 0.15, 0.012, 0.022, "M_Linea_Amarilla")
            else:
                xx = x0 + k if k > 0 else x1 + k
                caja(col, f"Borde_Amarillo_{nm}_{s}", xx, xx + 0.15, y0, y1, 0.012, 0.022, "M_Linea_Amarilla")
        if not en_x:
            _demarcacion(col, nm + "_Central", x0, x1, y0, y1)
    # PARE: calle C2-Elaborados al llegar a la calle norte y a la playa sur; calle de faena al patio norte
    for nm, (x0, x1, y), rz in (("C2_Norte", (-135, -130, 164.3), 0.0), ("C2_Sur", (-130, -125, -81.8), math.pi),
                                ("Faena_Norte", (-370, -362.5, 84.3), 0.0)):
        caja(col, f"Linea_Pare_{nm}", x0, x1, y - 0.25, y + 0.25, 0.012, 0.022, "M_Blanco_Senda")
        texto(col, f"Pare_Piso_{nm}", "PARE", (x0 + x1) / 2, y - 2.0 if rz == 0 else y + 2.0, 0.022, 0.9, "M_Blanco_Senda", rz)
        poner("KIT_Senal_Pare", col, (x0 - 0.6 if rz == 0 else x1 + 0.6, y - 0.6 if rz == 0 else y + 0.6, 0), rz, f"Senal_Pare_{nm}")
    # flechas de sentido en la calle norte (doble mano) y en la C2-Elaborados
    for k, x in enumerate(range(-440, 120, 60)):
        flecha(col, f"Flecha_Norte_O_{k}", x, 169.0, math.pi)
        flecha(col, f"Flecha_Norte_E_{k}", x + 30, 176.0, 0.0)
    for k, y in enumerate(range(-60, 160, 45)):
        flecha(col, f"Flecha_C2_S_{k}", -132.5, y, -math.pi / 2)
        flecha(col, f"Flecha_C2_N_{k}", -127.5, y + 20, math.pi / 2)
    # sendas peatonales: vestuarios ↔ desposte/cámaras (cruzan la calle C2) y sendero de la parada
    for i in range(7):
        caja(col, f"Cebra_Sendero_Norte_{i}", -181.2, -178.8, 165.6 + i * 2.0, 166.6 + i * 2.0, 0.012, 0.022, "M_Blanco_Senda")
    for i in range(5):
        caja(col, f"Cebra_C2_{i}", -134.6 + i * 2.0, -133.6 + i * 2.0, 18.0, 21.0, 0.012, 0.022, "M_Blanco_Senda")
    for k, (x, y, rz) in enumerate(((-136.8, -70.0, 0.0), (-371.5, 60.0, math.pi / 2), (-300.0, 181.2, 0.0), (60.0, 163.6, math.pi))):
        poner("KIT_Senal_Vel20", col, (x, y, 0), rz, f"Senal_Vel20_{k}")


def peatonal_y_parada(col):
    """Sendero peatonal desde la parada de colectivo (ruta) por el molinete del cerco hasta la puerta norte de vestuarios."""
    caja(col, "Sendero_Vestuarios_S", -181.2, -178.8, 115.0, 165.0, -0.1, 0.1, "M_Vereda")
    caja(col, "Sendero_Vestuarios_N", -181.2, -178.8, 180.0, 185.0, -0.1, 0.1, "M_Vereda")
    caja(col, "Sendero_Banquina", -181.2, -178.8, 185.0, 194.0, -0.3, 0.1, "M_Vereda")
    # refugio de colectivo sobre la banquina sur de la ruta
    obj_bm(col, "Refugio_Colectivo", ["M_Metal_Estructura", "M_Policarbonato", "M_Madera_Mueble", "M_Rojo_PATY"], lambda bm: (
        caja_bm(bm, -194.0, -186.0, 186.0, 189.0, -0.2, 0.1, 0),
        *[caja_bm(bm, x - 0.05, x + 0.05, y - 0.05, y + 0.05, 0.1, 2.6, 0) for x in (-193.8, -186.2) for y in (186.2, 188.8)],
        caja_bm(bm, -194.1, -185.9, 185.9, 189.1, 2.6, 2.7, 1),
        caja_bm(bm, -193.8, -186.2, 186.15, 186.2, 0.4, 2.5, 1),
        caja_bm(bm, -193.0, -187.0, 186.4, 186.8, 0.45, 0.5, 2),
        caja_bm(bm, -194.1, -185.9, 188.95, 189.0, 2.45, 2.6, 3)))
    o = texto(col, "Refugio_Cartel", "PARADA · PLANTA SAN JORGE", -190.0, 189.05, 2.52, 0.12, "M_Blanco_Senda")
    o.rotation_euler = (math.pi / 2, 0, math.pi)
    for k in range(3):
        poner("KIT_Operario", col, (-191.5 + k * 1.4, 187.2, 0.1), math.pi / 2, f"Op_Parada_{k}")


def ruta_realista(col):
    """Cunetas a los dos lados de la ruta, señales de velocidad y de ingreso."""
    for nm, (y0, y1) in (("S", (189.6, 193.6)), ("N", (208.4, 212.4))):
        caja(col, f"Cuneta_Ruta_{nm}", -620, 620, y0, y1, -0.6, -0.2, "M_Cuneta")
    poner("KIT_Senal_Vel60", col, (-60.0, 193.0, 0), 0.0, "Senal_Vel60_Ruta_E")
    poner("KIT_Senal_Vel60", col, (-200.0, 209.0, 0), math.pi, "Senal_Vel60_Ruta_O")
    poner("KIT_Senal_Bascula", col, (-100.0, 193.2, 0), 0.0, "Senal_Ingreso_Camiones_Ruta")


def limpiar_arboles():
    """Los árboles originales del predio que quedaron dentro de patios o calles nuevos pasan a ZZ_RETIRADO."""
    pav = [r[1:] for r in _pavimentos()]
    ret = coleccion("ZZ_RETIRADO")
    veg = bpy.data.collections["08_VEGETACION"]
    n = 0
    for o in list(veg.objects):
        if not any(k in o.name for k in ("Arbol", "Pino", "Arbusto")):
            continue
        x, y = o.matrix_world.translation.x, o.matrix_world.translation.y
        if o.type == "MESH" and (x, y) == (0.0, 0.0):  # piezas con el origen en 0: usar su caja
            x0, x1, y0, y1 = _bb(o)
            x, y = (x0 + x1) / 2, (y0 + y1) / 2
        if any(a - 1.0 < x < b + 1.0 and c - 1.0 < y < d + 1.0 for a, b, c, d in pav):
            veg.objects.unlink(o)
            ret.objects.link(o)
            n += 1
    lc = bpy.context.view_layer.layer_collection.children.get("ZZ_RETIRADO")
    if lc:
        lc.exclude = True
    print("árboles originales retirados de patios y calles:", n)


def nivelar_camiones_muelles():
    """Los 4 camiones fijos de los muelles originales (MP oeste, PT este) estaban a -1,12 m sin foso debajo:
    quedaban hundidos en el pasto. Se suben a nivel 0, como los camiones de los muelles nuevos (una sola vez)."""
    from mathutils import Vector
    n = 0
    for o in bpy.data.collections["07_VEHICULOS"].all_objects:
        if not o.name.startswith(("Camion_Descarga_MP_", "Camion_Carga_PT_")) or o.get("nivelado"):
            continue
        if o.parent is not None:  # las piezas cuelgan de un objeto raíz por camión: se mueve solo la raíz
            continue
        o.location.z += 1.12
        o["nivelado"] = True
        n += 1
    print("piezas de camión niveladas:", n)


def f5_calles():
    raiz = coleccion("F5_CALLES_REALES")
    vaciar(raiz)
    kits_calles()
    limpiar_arboles()
    nivelar_camiones_muelles()
    # patios de maniobra de hormigón con juntas (antes asfalto)
    pa = coleccion("F5_Patios_Hormigon", raiz)
    for o in bpy.data.collections["F1_PATIOS_Y_CALLES"].objects:
        if o.name in PATIOS_HORMIGON:
            o.data.materials[0] = bpy.data.materials["M_Hormigon_Patio"]
            juntas(pa, o.name, *_bb(o))
    bascula(coleccion("F5_Bascula", raiz))
    cordones(coleccion("F5_Cordones", raiz))
    demarcacion_interna(coleccion("F5_Demarcacion", raiz))
    peatonal_y_parada(coleccion("F5_Peatonal", raiz))
    ruta_realista(coleccion("F5_Ruta", raiz))
    objs = [o for o in raiz.all_objects if o.type == "MESH"]
    print("F5 calles:", len(objs), "objetos,", sum(len(o.data.polygons) for o in objs), "caras dibujadas")
