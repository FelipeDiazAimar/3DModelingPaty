"""Reconstruye la planta completa en orden (PLAN_MODELO_3D.md). Correr dentro de Blender con
blender/PATY_Planta_Completa.blend abierto:

    exec(open(r"<repo>/blender/construir_planta.py", encoding="utf-8").read())

No toca L7, L8, almacenes ni muelles (lo comprueba check_anclas al final) y deja los techos excluidos.
"""
import os

import bpy

R = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(bpy.data.filepath))), "blender")
for _f in ("f1_masas.py", "kit.py", "f2_ciclo1.py", "f3_ciclo2.py", "f4_elaborados.py", "f5_ambiente.py",
           "f5_servicios.py", "f5_calles.py", "check_anclas.py"):
    exec(open(os.path.join(R, _f), encoding="utf-8").read())

f1()                 # edificios, calles, patios, cerco
armar_kit()          # piezas repetidas de Ciclo 1
kit_ciclo2()         # piezas de Ciclo 2 (y tomadas de la escena)
f2()                 # faena, cámaras de oreo, subproductos, corrales
f3()                 # cuarteo, desposte, encajado, charqueo, túneles y cámara de cajas, abasto
f4()                 # Elaborados L1–L6, trenes, aditivos, cámara PT
f5()                 # apliques, salidas, alumbrado, árboles del cerco, estacionamiento, camiones jaula
f5_servicios()       # vestuarios/comedor/oficinas, calderas, sala de máquinas
f5_calles()          # báscula, cordones, hormigón, demarcación, señales, parada
f5_exterior()        # pasto, lotes, calles exteriores, árboles (al final: recorta con todo lo anterior)
_cc = coleccion("F5_CAMION_CINE")   # camión de la cinemática de la web (bajo tierra)
vaciar(_cc)
camion_cine(_cc)
quitar_techos()
for _cu in bpy.data.curves:          # letras con 2 pasos por curva (con 12 los rótulos eran el 14 % de lo dibujado)
    if _cu.bl_rna.identifier == "TextCurve":
        _cu.resolution_u = 2
for _c in list(bpy.data.curves):
    if _c.users == 0:
        bpy.data.curves.remove(_c)
for _m in list(bpy.data.meshes):
    if _m.users == 0:
        bpy.data.meshes.remove(_m)
print("problemas de anclas:", controlar())
