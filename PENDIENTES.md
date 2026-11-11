# Pendientes del gemelo digital (PLANTASJ.fsm, L7 + L8)

Estado al 10/11/2026: **no quedan pendientes abiertos.** El modelo base guardado tiene 96/100 objetos, lavado de 30 min y **batch de 7 cargas de 150 kg = 1050 kg**, con **entrada de materia prima a partir de camiones reales remuestreados** (cantidad por día, tamaño, hora del primer camión y gaps), peso de cada pallet de MP remuestreado de 11.882 pallets reales y ritmo de formado diario remuestreado de 246 corridas reales de L7/L8.

## 1. Resultados vigentes (sin comparar contra la planta)
Los resultados se leen como mediciones del modelo con su intervalo de confianza; **no se comparan contra el tablero ni contra valores reales de la planta.** E1 base da **49,1 ± 14,9 pallets/día y 42,5 ± 12,6 t/día** (10 réplicas de 24 h, `datos_trazabilidad/e1_final/estocastico_camiones/`). Los intervalos son anchos porque la entrada de MP varía de 8 a 80 batches por día (≈ 55 de media); las diferencias entre escenarios se comparan de a pares con los mismos días de entrada.

## 2. Decisiones de modelado (cerradas, oficiales desde el 10/11/2026)
Se adoptaron como oficiales todos los supuestos de `SUPUESTOS_v2.md`; el detalle está arriba de ese documento.
- **Entrada de MP (nuevo):** camiones remuestreados de la base de producción (jul–nov 2026). L7 + L8 reciben **0,5 de cada camión** (no 2/8 = 0,25): fracción ajustada para que las dos líneas reciban aproximadamente lo que consumen; es un **supuesto declarado**. El reloj 0 equivale a las 8:00 y el día arranca con la planta vacía.
- **Batch (nuevo):** MP + aditivos de la lista técnica = 7 cargas de 150 kg = 1050 kg (antes 1500 kg y 10 cargas). Tiempos por batch: desencajado 2450 s, picadora 630 s, mezclado 840 s (+ 1800 s de lavado).
- **Peso del pallet de MP:** remuestreado de 11.882 pallets reales (media 934 kg).
- **Ritmo de formado:** multiplicador diario por línea remuestreado de 246 corridas reales (sd ≈ 9 %); formadoras de 982 kg/h (base) y 1843 kg/h (E2) siguen siendo ambas oficiales.
- **Siguen aleatorios:** fallas (exponencial + lognormal), tiempos entre pallets dentro del camión (tabla empírica de 49 puntos) y peso de los pallets de PT (500 reales, cajas = peso ÷ 5 kg).
- **Cuello de botella:** las mezcladoras (60,5 t/día); siguiente el desencajado (74,7). Con formadoras de 1843 kg/h (E2) el cuello pasa al desencajado y le sigue el mezclado (77,9). La hipótesis inicial (formadora) queda refutada.
- **Datos de planta que faltaban** (días y turnos por línea, formadoras reales por línea, paros por línea, tiempo real de desencajado): se cierran con los parámetros oficiales. Si más adelante se mide alguno, se cambia el parámetro y se repiten las corridas (sección 4).
- **Little por estación:** chequeo hecho sobre un modelo anterior (cierra en 10 de 12 estaciones); no se repitió con las entradas nuevas.

## 3. Resultados de escenarios (mismas 10 réplicas y mismos streams)
| Escenario | Resultado |
|---|---|
| E1 base | 49,1 ± 14,9 pallets/día, 42,5 ± 12,6 t/día, 879 kg por pallet de PT. Cuello: mezcladoras (60,5 t/día); siguiente desencajado (74,7). Cámara de MP: 19,4 pallets en promedio (máx 54) |
| E2 formadoras a 1843 kg/h | 58,4 ± 18,7 pallets/día, 50,4 t/día; **+9,3 pallets/día contra E1** (IC [+4,5 ; +14,1], +18,9 %). El cuello pasa al desencajado (74,7 t/día) |
| E3 E2 + 1,5× materia prima | 62,0 ± 17,8 pallets/día, 53,5 t/día; +12,9 contra E1 (IC [+9,4 ; +16,4]); **+3,6 contra E2 (IC [−0,3 ; +7,5]: no distinguible de cero)**. Cuello desencajado (75,2); cámaras de MP 19,4 → 30,3 pallets (máx 68) |
| E4 batch 1200 kg (8 cargas) contra base 1050 kg (7 cargas) | 49,7 ± 14,7 pallets/día, 42,9 t/día; **+0,6 contra E1 (IC [−0,0 ; +1,2]: no distinguible de cero)**. Cuello mezcladoras (61,6) |
| E5 MTTR ×1,25 en formadoras y túneles | sin efecto; medido con un modelo anterior (llegadas fijas, sin lavado), no comparable |

Las corridas de modelos anteriores (llegadas fijas con pallet de 720 kg; arribos de tabla empírica con batch de 1500 kg) se conservan en `datos_trazabilidad/e1_final/` (`E1_FINAL.md`, `raw_cuellos/`, `estocastico/`) como referencia; sus números ya no son los vigentes.

## 4. Cómo repetir las corridas
Las réplicas se corren dentro de FlexSim con el MCP (modelo `PLANTASJ.fsm` abierto y `mcp_start();` ejecutado; si FlexSim no conecta solo, abrir con `flexsim_prepare_gui_model` y desde ahí `flexsim_open_model`):
1. Apagar el publicador: `Tools/pubOff = 1`. Fallas encendidas: `Tools/fallOn = 1`. Factor de la prueba de fallas (E5): `Tools/mttrK` (1 = base).
2. Por cada réplica `k` de 1 a 10: `Tools/repId = k`, `Tools/palLast = Tools/fallLast = 1e9`, `resetmodel()`, **`executestring(getnodestr(Tools/GenArribos))`** (sortea los camiones del día, el peso de cada pallet de MP, el horario de llegada y el ritmo de formado de cada línea; devuelve la cantidad de batches del día), `resetmodel()` otra vez (deshace el consumo de números aleatorios del sorteo), correr a 86400 s (`flexsim_run_to_time` con `run_speed` 7400) y leer pallets (entrada de `QPaletizado_L7/L8`), cajas (salidas de `EncA/EncB`), tiempos por estado (`Tools/indEst`) y la cámara de MP (`Tools/indHist`) con `Tools/codCollect`. El tamaño de cada pallet de PT lo sortea solo el modelo (`Tools/TamPallet_L7/L8`, relay en `OnExit` de `EstA_Lx`).
3. `GenArribos` usa los streams **90** (tiempos entre pallets dentro del camión), **94** (camiones del día), **95** (tamaño de camión), **96** (gap entre camiones), **97** (hora del primer camión), **98** (peso de cada pallet de MP) y **99** (ritmo de formado de L7 y L8); las fallas usan 60–87 y el peso de los pallets de PT 91–92. Cada réplica salta números según `repId` (80·k del 90, 14·k de los 95 y 96, 250·k del 98, k de los 94 y 97 y 2·k del 99; ver el encabezado de `dashboard/flexsim/gen_arribos.fls`), así que la misma réplica con el mismo `repId` reproduce exactamente los mismos resultados.
4. Al terminar restaurar: `pubOff = 0`, `fallLast = 1e9`, `pubLast = 1e9`, `repId = 1`, `mttrK = 1`, y guardar.
5. Procesar con `datos_trazabilidad/e1_final/estocastico_camiones/analizar_estocastico.py` (E1 a E4: pallets, toneladas, IC, diferencias pareadas, cuellos) y `actualizar_web_estocastico.py` (JSON de `dashboard/web/public/e1/`). Los scripts `analizar_e1.py`, `analizar_cuellos.py`, `actualizar_summary_e1.py`, `analizar_escenarios.py` y `analizar_e4.py` son de modelos anteriores.

**Parámetros de los escenarios (se cambian por script y se restauran):**
- E2: `entrySpacePadding` de `CintaFormA/B_L7/L8`, 3,27 → 1,554 m. Ojo: `GenArribos` reescribe `entrySpacePadding` cada día con el ritmo de formado remuestreado (`padBase` es la base de esa fórmula), así que el valor base de E2 va en `Tools/padBase` (fórmula `pad = (0,403 + padBase) / multiplicador − 0,403`) y no a mano después del sorteo.
- E3: E2 más 1,5× la materia prima que entra (la entrada la arma `GenArribos`; el detalle de cómo se escaló está en el script de la corrida).
- E4 (1200 kg, 8 cargas): `splitquantity` de las mezcladoras 7 → 8, y los tiempos por batch escalados ×8/7: `cycletime` de desencajado 2450 → 2800 s, de picadora 630 → 720 s y de mezclado 840 → 960 s; el lavado queda en 1800 s. Antes de empezar, dejar el modelo base: lavado 1800 s, 7 cargas, separación de cintas base. (`batchKg` de `GenArribos` define cuánta MP vale un batch.)

## 5. Cosas técnicas a tener presentes
- **Puerto.** El publicador de FlexSim usa el puerto de `Tools/pubPort` (3000 por defecto). Si el 3000 está ocupado: `npm run dev -- -p 3010` y `model().find("Tools/pubPort").value = 3010;`.
- **Conexión del MCP.** Al abrir el modelo, FlexSim se conecta solo. Si otro servidor MCP quedó escuchando en el 8765 (por ejemplo uno de opencode), FlexSim se conecta a ese: cerrar el sobrante y volver a ejecutar `mcp_start();` en la consola Script.
- **Calendario de MP.** `SrcCamionesMP` tiene 80 filas; `GenArribos` ordena los tiempos y deja con cantidad 0 las filas que sobran.
- **Web.** Las páginas compilan y sirven los datos nuevos. Falta una pasada visual de maquetación (tablas anchas y textos largos) abriendo `npm run dev`.
- **Datos de la planta.** Los JSON crudos de `datos_trazabilidad/` no se suben al repositorio (ver `.gitignore`); los resultados agregados sí. Los CSV de camiones se borraron; quedan los percentiles de pesos, el ritmo de formado y las consultas `consulta_*.cjs` en `datos_trazabilidad/fitting_series/`.
