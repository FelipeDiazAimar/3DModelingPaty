# Pendientes del gemelo digital (PLANTASJ.fsm, L7 + L8)

Estado al 7/11/2026: **no quedan pendientes abiertos.** Todo está en `main`; el modelo base guardado tiene 96/100 objetos, lavado de 30 min, 10 cargas por batch y 16 pallets de materia prima por turno, **con arribos de MP y pallets de PT aleatorios** (tabla empírica de tiempos entre arribos y 500 pesos reales de pallet).

## 1. Validación (cerrada)
Con lavado de 30 min por batch, arribos de MP aleatorios y pallets de PT con peso real, el modelo da **63,2 ± 1,2 pallets/día y 54,8 t/día contra 64,9 pallets y 56,0 t/día del tablero (−2,6 % y −2,1 %)** (10 réplicas, `datos_trazabilidad/e1_final/estocastico/`). Antes, con pallets fijos de 720 kg, validaba solo en toneladas (54,9 contra 56,0) y daba +16 % en pallets; ahora valida en las dos unidades. Las líneas 7 y 8 trabajan por igual y se comparan contra la planta completa. Los 64,9 y 56,0 caen apenas fuera del IC 95 % angosto (la variación del modelo es chica), con error menor a 3 %.

## 2. Decisiones de modelado (cerradas, oficiales desde el 10/11/2026)
Se adoptaron como oficiales todos los supuestos de `SUPUESTOS_v2.md`; el detalle está arriba de ese documento. Lo que antes figuraba como pendiente queda así:
- **Datos de planta que faltaban** (días y turnos por línea, formadoras reales por línea, asignación de pallets en el tablero, paros por línea, tiempo real de desencajado): se cierran con los parámetros oficiales actuales. Si más adelante se mide alguno, se cambia el parámetro y se repiten las corridas (sección 4).
- **Variación del modelo (nuevo):** los tiempos entre arribos de MP salen de la tabla empírica de 49 puntos (`iat_cdf.csv`, Monte Carlo con interpolación lineal; 16 pallets por turno) y el tamaño de cada pallet de PT sale de los 500 pesos reales (`pesos_PT_kg.csv`, media 862,5 kg; cajas = peso ÷ 5 kg). Los tiempos de máquina siguen constantes; las fallas siguen exponencial + lognormal. Esto reemplaza al alcance anterior (llegadas fijas y pallet de 720 kg).
- **Cuello de botella:** con lavado de 30 min son las mezcladoras (65,2 t/día, 91 % ocupadas); después de E2 pasa al desencajado (74,2 t/día). Las formadoras de 982 kg/h (base) y 1843 kg/h (E2) son ambas oficiales. La hipótesis inicial (formadora) queda refutada.
- **Little por estación:** chequeo hecho por dos vías (área contra λ·W de FlexSim) sobre el modelo anterior; cierra en 10 de 12 estaciones (Colas y WIP).

## 3. Resultados de escenarios (todos con las mismas 10 réplicas y los mismos streams)
| Escenario | Resultado |
|---|---|
| E1 base (lavado 30 min) | 63,2 ± 1,2 pallets/día, 54,8 t/día: valida (−2,6 % pallets, −2,1 % toneladas). El cuello son las mezcladoras (65 t/día) |
| E2 formadoras a 1843 kg/h | +12,0 pallets/día (+19,0 %, IC [+10,8 ; +13,2]): libera las mezcladoras y el cuello pasa al desencajado (74 t/día) |
| E3 más MP (24 pallets/turno) + E2 | 75,7 pallets/día, +0,5 contra E2 (+0,7 %, IC [+0,1 ; +0,9]): casi no suma; el desencajado es el techo y la MP se acumula en cámaras (6,4 → 21,7 pallets) |
| E5 MTTR ×1,25 en formadoras y túneles (antes E3) | sin efecto; medido con el modelo anterior (llegadas fijas, sin lavado) |
| E4 batch 1200 contra 1500 kg (lavado 30 min) | 1200 kg rinde −3,7 pallets/día (−5,9 %, IC [−4,4 ; −3,0]); con 15 min −2,4 y sin lavado +1,8 (sensibilidad del modelo anterior, 5 réplicas) |

Las corridas del modelo anterior (llegadas fijas, pallet de 720 kg: 75,3 pallets/día, 54,9 t/día, E2 +14,4, E3 −0,1, E4 −4,0) se conservan en `datos_trazabilidad/e1_final/` (`E1_FINAL.md`, `raw_cuellos/`) como referencia.

## 4. Cómo repetir las corridas
Las réplicas se corren dentro de FlexSim con el MCP (modelo `PLANTASJ.fsm` abierto y `mcp_start();` ejecutado; si FlexSim no conecta solo, abrir con `flexsim_prepare_gui_model` y desde ahí `flexsim_open_model`):
1. Apagar el publicador: `Tools/pubOff = 1`. Fallas encendidas: `Tools/fallOn = 1`. Factor de la prueba de fallas (E5): `Tools/mttrK` (1 = base).
2. Por cada réplica `k` de 1 a 10: `Tools/repId = k`, `Tools/palLast = Tools/fallLast = 1e9`, `resetmodel()`, **`executestring(getnodestr(Tools/GenArribos))`** (sortea los 48 arribos del día con la tabla empírica), `resetmodel()` otra vez (deshace el consumo de números aleatorios del sorteo), correr a 86400 s (`flexsim_run_to_time` con `run_speed` 7400) y leer pallets (entrada de `QPaletizado_L7/L8`), cajas (salidas de `EncA/EncB`), tiempos por estado (`Tools/indEst`) y la cámara de MP (`Tools/indHist`) con `Tools/codCollect`. El tamaño de cada pallet lo sortea solo el modelo (`Tools/TamPallet_L7/L8`, relay en `OnExit` de `EstA_Lx`).
3. Los streams de FlexSim van de 0 a 99: se usan 60–87 y cada réplica salta `12·k` números (`Tools/ArrancaFallas`). La misma réplica con el mismo `repId` reproduce exactamente los mismos resultados (ya verificado).
4. Al terminar restaurar: `pubOff = 0`, `fallLast = 1e9`, `pubLast = 1e9`, `repId = 1`, `mttrK = 1`, y guardar.
5. Procesar con `datos_trazabilidad/e1_final/estocastico/analizar_estocastico.py` (E1 a E4: pallets, toneladas, IC, diferencias pareadas, cuellos) y `actualizar_web_estocastico.py` (JSON de `dashboard/web/public/e1/`). Los scripts `analizar_e1.py`, `analizar_cuellos.py`, `actualizar_summary_e1.py`, `analizar_escenarios.py` y `analizar_e4.py` son del modelo con llegadas fijas.

**Parámetros de los escenarios (se cambian por script y se restauran):**
- E2: `entrySpacePadding` de `CintaFormA/B_L7/L8`, 3,27 → 1,554 m.
- E4 (1200 kg): `splitquantity` de las mezcladoras 10 → 8, `cycletime` de desencajado 3500 → 2800 s y de picadora 900 → 720 s, calendario de `SrcCamionesMP` con 20 pallets por turno (filas 4, 8, 12 y 16 de cada turno con cantidad 2; el calendario ahora tiene 48 filas), y `setuptime` de las mezcladoras como lavado (base 1800 s; 0 y 900 s solo sensibilidad). Antes de empezar, dejar el modelo base: lavado 1800 s, 10 cargas, 16 pallets por turno, separación de cintas 3,27 m. E3 usa además 24 pallets por turno (cantidad 2 en las filas pares de las 48 del calendario).

## 5. Cosas técnicas a tener presentes
- **Puerto.** El publicador de FlexSim usa el puerto de `Tools/pubPort` (3000 por defecto). Si el 3000 está ocupado: `npm run dev -- -p 3010` y `model().find("Tools/pubPort").value = 3010;`.
- **Conexión del MCP.** Al abrir el modelo, FlexSim se conecta solo. Si otro servidor MCP quedó escuchando en el 8765 (por ejemplo uno de opencode), FlexSim se conecta a ese: cerrar el sobrante y volver a ejecutar `mcp_start();` en la consola Script.
- **Primera corrida tras cambiar la configuración.** Una vez, la primera corrida tras restaurar el modelo dio 4 cajas de diferencia en la línea 8 (6606 en vez de 6602); al repetirla coincidió con la original. Causa no identificada; no afecta los resultados de los escenarios.
- **Web.** Las páginas compilan y sirven los datos nuevos. Falta una pasada visual de maquetación (tablas anchas y textos largos) abriendo `npm run dev`: la extensión de Chrome no estaba conectada cuando se hicieron los cambios.
- **Datos de la planta.** Los JSON crudos de `datos_trazabilidad/` no se suben al repositorio (ver `.gitignore`); los resultados agregados sí.
