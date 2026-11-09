# ACTO 1–2 — Portada + Blender (voz IA)

## 1. Título sistema + problemática (5 líneas)

- **Sistema:** Gemelo digital planta PATY San Jorge — Blender + FlexSim 2026 + web 3D.
- **Planta:** nave Elaborados 150×70 m, líneas L7/L8 (extensible a L1–L8 + Ciclos 1–2).
- **Problema:** ¿dónde está el cuello de botella y cuánto rinde cada línea por turno?
- **Enfoque:** modelo calibrado con datos reales + réplicas y escenarios (E.T.1–E.T.6).
- **Salida:** throughput/turno, utilización, WIP, lead time, dashboards en vivo.

## 2. Integrantes confirmados

- Jeremias Micheloud, Felipe Diaz Aimar y Matias Buffa.
- En pantalla van sin roles.

## 3. Resumen problema (ciclos, máquinas ciclo Elaborados)

- **Ciclo 1 faena:** corrales → noqueo → riel/noria → palco tipificación → spray chilling → cámaras oreo.
- **Ciclo 2 media→caja:** balanza riel → cuarteo (3 piezas) → desposte → encajado → túneles/cámaras → expedición.
- **Elaborados (foco L7/L8, piloto E4 L3):** recepción MP → picadora → 2 mezcladoras → carritos (L3 directo) → formadora → túnel/cámara → estuchadora → envasadora → encajado → pallet → expedición.
- **Máquinas Elaborados:** picadora Weiler, mezcladoras D&D 2500 L, formadoras F19/F26/TOMAHAWK, túneles Advantec/Scanico/FPF, estuchadoras Camma/Bradman Lake, envasadoras Fripack/Flow, apilador Torfresma, encintadora/envolvedora.
- **Piloto E4 L3 (69 g):** F26 4 cav × 57 golpes/min (supuesto) → 150 paq/min Fripack; batch mixer 1500 kg/20 min; changeover 30–60 min no modelado.

## 4. Modelado Blender con IA (scripts y modelos, solo nombres)

- Scripts `blender/`: `construir_planta.py`, `f1_masas.py`, `f2_ciclo1.py`, `f3_ciclo2.py`, `f4_elaborados.py`, `f5_ambiente.py`, `f5_calles.py`, `f5_servicios.py`, `kit.py`, `operario_worker.py`, `hornear_piso.py`, `exportar_glb.py`, `check_anclas.py`.
- Modelos: `PATY_Planta_Elaborados.blend`, `PATY_Planta_v9.glb`, `planta.glb` (web), `operario.glb` (62 huesos, 10 clips), `picadora_3m.stl`, `mezcladora_3m.stl`.

## 5. Ideas cinemáticas (solo ideas)

- Zoom orbital sobre planta que entra por techo a nave Elaborados L7/L8.
- Corte whip-pan Ciclo 1 → Ciclo 2 → Elaborados siguiendo el flujo de carne.
- Operario 3D que saluda y la cámara lo sigue hasta su puesto en línea.
- Fundido con flood naranja Paty al aterrizar en cada máquina clave.

## 6. Bullets guion voz IA

- "Esta es la planta PATY San Jorge: del campo a la hamburguesa, en un gemelo digital vivo."
- "Tres ciclos: faena, desposte y elaborados. Simulamos las líneas siete y ocho."
- "Modelamos cada máquina en Blender con IA: código que construye la planta pieza por pieza."
- "Y en FlexSim la ponemos a producir: ¿cuántos kilos por hora, dónde se traba, qué pasa si sumamos un turno?"
- "Acompáñennos: entramos a la planta."
