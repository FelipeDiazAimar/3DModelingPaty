# Pendientes del gemelo digital (PLANTASJ.fsm, L7 + L8)

Estado al 7/11/2026: **no quedan pendientes abiertos.** Todo está en `main`; el modelo base guardado tiene 96/100 objetos, lavado de 30 min, 10 cargas por batch y 16 pallets de materia prima por turno.

## 1. Validación (cerrada)
Con el lavado de 30 min por batch el modelo da **54,9 t/día contra 56,0 del tablero (−1,9 %)** y 75,3 pallets/día (10 réplicas, `datos_trazabilidad/e1_final/E1_FINAL.md`). La métrica oficial de validación es toneladas por día. Los pallets del modelo pesan 720 kg y los del tablero 862,5 kg, por eso en pallets da +16 %. Las líneas 7 y 8 trabajan por igual y se comparan contra la planta completa. La serie horaria (calentamiento) y los paros se rehicieron con el lavado (mismas 10 réplicas).

## 2. Decisiones de modelado (cerradas, oficiales desde el 7/11/2026)
Se adoptaron como oficiales todos los supuestos de `SUPUESTOS_v2.md`; el detalle está arriba de ese documento. Lo que antes figuraba como pendiente queda así:
- **Datos de planta que faltaban** (días y turnos por línea, formadoras reales por línea, asignación de pallets en el tablero, paros por línea, tiempo real de desencajado): se cierran con los parámetros oficiales actuales. Si más adelante se mide alguno, se cambia el parámetro y se repiten las corridas (sección 4).
- **Tamaño del pallet:** 720 kg oficial; la validación es en toneladas.
- **Variación del modelo:** tiempos de máquina constantes y llegadas de MP fijas; la única variación son las fallas. Es el alcance oficial y explica los IC angostos.
- **Cuello de botella:** con lavado de 30 min son las mezcladoras (65,3 t/día); después de E2 pasa al desencajado (74,1 t/día). Las formadoras de 982 kg/h (base) y 1843 kg/h (E2) son ambas oficiales.
- **Little por estación:** chequeo hecho por dos vías (área contra λ·W de FlexSim); cierra en 10 de 12 estaciones (Colas y WIP).

## 3. Resultados de escenarios (todos con las mismas 10 réplicas)
| Escenario | Resultado |
|---|---|
| E1 base (lavado 30 min) | 75,3 ± 0,7 pallets/día, 54,9 t/día: valida en toneladas (−1,9 %). El cuello son las mezcladoras (65 t/día) |
| E2 formadoras a 1843 kg/h | +14,4 pallets/día (+19 %): libera las mezcladoras y el cuello pasa al desencajado (74 t/día) |
| E3 más MP (24 pallets/turno) + E2 | 89,6 pallets/día, igual que E2 (−0,1 contra E2): el desencajado es el techo y la MP se acumula en cámaras (6 → 22 pallets) |
| E5 MTTR ×1,25 en formadoras y túneles (antes E3) | sin efecto; medido con el modelo anterior, sin lavado |
| E4 batch 1200 contra 1500 kg (lavado 30 min, 10 réplicas) | 1500 kg rinde 4,0 pallets/día más (−5,3 % para 1200); con 15 min 2,4; sin lavado 1200 kg gana 1,8 por latencia |

## 4. Cómo repetir las corridas
Las réplicas se corren dentro de FlexSim con el MCP (modelo `PLANTASJ.fsm` abierto y `mcp_start();` ejecutado):
1. Apagar el publicador: `Tools/pubOff = 1`. Fallas encendidas: `Tools/fallOn = 1`. Factor de la prueba de fallas (E5): `Tools/mttrK` (1 = base).
2. Por cada réplica `k` de 1 a 10: `Tools/repId = k`, `resetmodel()`, correr a 86400 s y leer pallets (entrada de `QPaletizado_L7/L8`), cajas (salidas de `EncA/EncB`) y `Tools/fallLog`.
3. Los streams de FlexSim van de 0 a 99: se usan 60–87 y cada réplica salta `12·k` números (`Tools/ArrancaFallas`). La misma réplica con el mismo `repId` reproduce exactamente los mismos resultados (ya verificado).
4. Al terminar restaurar: `pubOff = 0`, `fallLast = 1e9`, `pubLast = 1e9`, `repId = 1`, `mttrK = 1`, y guardar.
5. Procesar con `datos_trazabilidad/e1_final/analizar_e1.py` (E1, calentamiento y paros), `analizar_cuellos.py` (escenarios, cuellos y Little; lee `raw_cuellos/`) y `actualizar_summary_e1.py` (intervalos en toneladas). Generan los JSON de `dashboard/web/public/e1/`. `analizar_escenarios.py` y `analizar_e4.py` quedaron del modelo sin lavado.

**Parámetros de los escenarios (se cambian por script y se restauran):**
- E2: `entrySpacePadding` de `CintaFormA/B_L7/L8`, 3,27 → 1,554 m.
- E4 (1200 kg): `splitquantity` de las mezcladoras 10 → 8, `cycletime` de desencajado 3500 → 2800 s y de picadora 900 → 720 s, calendario de `SrcCamionesMP` con 20 pallets por turno (filas 4, 8, 12 y 16 con cantidad 2), y `setuptime` de las mezcladoras como lavado (base 1800 s; 0 y 900 s solo sensibilidad). Antes de empezar, dejar el modelo base: lavado 1800 s, 10 cargas, 16 pallets por turno, separación de cintas 3,27 m. E3 usa además 24 pallets por turno (cantidad 2 en las filas pares del calendario).

## 5. Cosas técnicas a tener presentes
- **Puerto.** El publicador de FlexSim usa el puerto de `Tools/pubPort` (3000 por defecto). Si el 3000 está ocupado: `npm run dev -- -p 3010` y `model().find("Tools/pubPort").value = 3010;`.
- **Conexión del MCP.** Al abrir el modelo, FlexSim se conecta solo. Si otro servidor MCP quedó escuchando en el 8765 (por ejemplo uno de opencode), FlexSim se conecta a ese: cerrar el sobrante y volver a ejecutar `mcp_start();` en la consola Script.
- **Primera corrida tras cambiar la configuración.** Una vez, la primera corrida tras restaurar el modelo dio 4 cajas de diferencia en la línea 8 (6606 en vez de 6602); al repetirla coincidió con la original. Causa no identificada; no afecta los resultados de los escenarios.
- **Web.** Las páginas compilan y sirven los datos nuevos. Falta una pasada visual de maquetación (tablas anchas y textos largos) abriendo `npm run dev`: la extensión de Chrome no estaba conectada cuando se hicieron los cambios.
- **Datos de la planta.** Los JSON crudos de `datos_trazabilidad/` no se suben al repositorio (ver `.gitignore`); los resultados agregados sí.
