# E1 base — modelo final PLANTASJ.fsm (L7 + L8), 10 réplicas

> **Vigente: la sección "Modelo con camiones reales remuestreados (10/11/2026)".** Las secciones de más abajo describen corridas de modelos anteriores (llegadas fijas, pallet de 720 kg, lavado de 0 min) y se conservan como referencia del método; sus números ya no son los del modelo.
> No se compara contra los valores de planta: los resultados se leen como mediciones del modelo, con sus intervalos de confianza.

## Modelo con camiones reales remuestreados (10/11/2026; `estocastico_camiones/`)
**Qué cambió en el modelo** (código en `dashboard/flexsim/gen_arribos.fls`, datos en `datos_trazabilidad/fitting_series/`):
1. **Entrada de materia prima = camiones reales remuestreados** de la base de producción (jul–nov 2026, pallets agrupados por remito): cantidad de camiones por día (66 días), tamaño de cada camión (306 camiones), hora del primer camión (8 a 10 h) y gap entre camiones (240 valores). L7 + L8 reciben **0,5 de cada camión** (no 2/8 = 0,25): fracción ajustada para que las dos líneas reciban aproximadamente lo que consumen; es un **supuesto declarado**. El reloj 0 del modelo equivale a las 8:00.
2. **Peso de cada pallet de MP** remuestreado de 11.882 pallets reales (media 934 kg; percentiles en `pesos_mp_percentiles.csv`). Un **batch = MP + aditivos** de la lista técnica = **7 cargas de 150 kg = 1050 kg** (antes 1500 kg y 10 cargas). Tiempos por batch: desencajado 2450 s, picadora 630 s, mezclado 840 s (más 1800 s de lavado).
3. **Ritmo de formado de cada línea cada día**, remuestreado de 246 corridas reales de L7/L8 (multiplicador sobre la mediana, sd ≈ 9 %; `ritmo_formado_L7L8.csv`); modifica la separación de las cintas de formado de esa línea.
4. **Siguen aleatorios:** las fallas (exponencial + lognormal), los tiempos entre pallets dentro del camión (tabla empírica de 49 puntos) y el peso de los pallets de PT (500 reales).
5. **El día arranca con la planta vacía** (así se inicializa una simulación).
6. **La entrada varía de 8 a 80 batches por día (≈ 55 de media)**, y por eso los intervalos de confianza son anchos.

**Método:** 10 réplicas de 24 h por escenario, mismos streams (fallas 60–87; arribos 90 y 94–99; pallets de PT 91–92), diferencias pareadas con t(0,975; 9 gl) = 2,262. Datos crudos `E1.txt`…`E4.txt`; análisis `analizar_estocastico.py` → `analisis.json`; web `actualizar_web_estocastico.py`.

| Escenario | Pallets/día | t/día | Cambio (pallets, IC 95 %) | Cuello |
|---|---|---|---|---|
| E1 base | 49,1 ± 14,9 | 42,5 ± 12,6 | — | mezcladoras (60,5 t/día); siguiente desencajado (74,7) |
| E2 formadoras a 1843 kg/h | 58,4 ± 18,7 | 50,4 | **+9,3** [+4,5 ; +14,1] contra E1 (+18,9 %) | desencajado (74,7 t/día); le sigue mezclado (77,9) |
| E3 E2 + 1,5× materia prima | 62,0 ± 17,8 | 53,5 | +12,9 [+9,4 ; +16,4] contra E1; **+3,6 [−0,3 ; +7,5] contra E2** (no distinguible de cero) | desencajado (75,2 t/día); cámaras de MP 19,4 → 30,3 pallets (máx 68) |
| E4 batch 1200 kg (8 cargas) contra base 1050 kg (7 cargas) | 49,7 ± 14,7 | 42,9 | **+0,6 [−0,0 ; +1,2]** contra E1 (no distinguible de cero) | mezcladoras (61,6 t/día) |

- **E1:** 879 kg por pallet de PT; cámara de MP en promedio 19,4 pallets (máx 54). Capacidad implícita (entradas por día ÷ ocupación × kg por entrada): mezclado 60,5 < desencajado 74,7 < formado 87,0 t/día. La hipótesis inicial (formadora) queda refutada.
- **E2:** la mejora es real pero con intervalo ancho (±4,8 pallets en la diferencia); el cuello pasa al desencajado.
- **E3:** 1,5× materia prima sobre E2 no suma de forma clara (IC contra E2 incluye el cero); la MP se acumula en cámaras y el desencajado es el techo.
- **E4:** pasar de 7 a 8 cargas por batch (1050 → 1200 kg; desencajado 2800 s, picadora 720 s, mezclado 960 s: ×8/7) no cambia el resultado de forma distinguible de cero.
- **Por qué los IC son anchos:** la entrada de MP cambia mucho de un día a otro (de 8 a 80 batches), y esa variación domina la de las réplicas (s ≈ 21 pallets/día en E1). Las diferencias pareadas la cancelan en parte, porque todos los escenarios usan los mismos días de entrada.
- Limitaciones: horizonte terminante de 24 h arrancando vacío; fracción 0,5 del camión supuesta; tiempos de máquina constantes; el transitorio de ≈ 4 h se midió con el modelo anterior y no se repitió con éste.

## Método (común a todas las corridas)
- 10 réplicas independientes de **24 h** (terminante, arranca vacío), `PLANTASJ.fsm` sin cambios de lógica entre réplicas.
- **Fallas aleatorias** (módulo `Tools/Fallas`, sin objetos de licencia): tiempo a la falla exponencial con el MTBF del tablero de paros, reparación lognormal (σ = 0,9) con el MTTR (ver `SUPUESTOS_v2.md`).
- Los streams de FlexSim son solo 0–99: cada réplica salta cantidades fijas de números de cada stream, así que las réplicas son independientes y se pueden repetir las mismas secuencias en otros escenarios (números aleatorios comunes).
- Medidas: pallets terminados por línea (entrada a `QPaletizado_Lx`), cajas por línea, tiempo por estado de cada estación y cámara de MP.
- IC 95 %: t(0,975; 9 gl) = 2,262. n necesario para h ≤ 2 %: n = (1,96·s / 0,02·media)².

## Welch (modelo anterior)
Con la producción de cajas por hora (promedio de las 10 réplicas, ventana 3) el transitorio duraba ≈ 4 h: es el llenado de la línea desde vacía. Como la corrida es terminante de 24 h arrancando vacía, ese transitorio queda dentro de las medidas.

## Verificación del módulo de fallas (modelo anterior)
Paros simulados contra lo que implican las entradas (min/día, media de 10 réplicas): formadoras 37,7 (esperado 49,5), túneles 16,6 (8,9), envasadoras 6,7 (6,1), estibadores 17,1 (20,3), picadoras 26,1 (36,5). La dispersión entre réplicas es grande (pocos eventos por día), así que las diferencias están dentro del ruido.

## Modelo con arribos y pallets aleatorios (10/11/2026, versión intermedia; `estocastico/`)
Antes de los camiones reales, los 16 arribos de MP de cada turno se sorteaban con la tabla empírica de tiempos entre arribos y el pallet de PT con los 500 pesos reales (batch 1500 kg, 10 cargas, desencajado 3500 s, picadora 900 s, mezclado 1200 s). Resultados de esa versión: E1 63,2 ± 1,2 pallets/día y 54,8 t/día; E2 75,2; E3 75,7; E4 (1200 contra 1500 kg) 59,5; cuello mezcladoras 65,2 t/día. Quedan en `estocastico/` como referencia; no son comparables con los de arriba porque la entrada era fija (48 arribos por día, 72 t/día) y de ahí sus IC angostos.

## Escenarios con llegadas fijas (historial, `summary_escenarios.json`)
- E2 (formadoras a 1843 kg/h): +2,5 pallets/día sin lavado, porque el techo era la materia prima (16 pallets de 1500 kg cada 8 h).
- E3 (MTTR ×1,25 en formadoras y túneles; hoy E5): sin efecto, los acumuladores absorben paros de 10–20 min.
- E4 con lavado de 0, 15 y 30 min: con lavado, el batch grande rendía más (menos lavados por tonelada); sin lavado, +1,3 % por el arranque desde vacío. El lavado de 30 min por batch es dato de planta y quedó en el modelo base.
- Se comprobó que con `mttrK = 1` el modelo reproduce exactamente la réplica 1 (mismas fallas y mismas cajas); en esa verificación se corrigió un arranque duplicado de las fallas al reabrir el modelo.

## Lavado de 30 min y cuello de botella (corrida del 7/11/2026 con llegadas fijas; `analizar_cuellos.py`, `raw_cuellos/`)
**El lavado de 30 min por batch es dato de planta** y es parte del modelo base (`SetupTime` 1800 s en las 4 mezcladoras). Las corridas sin lavado quedan en `raw_cuellos/sin_lavado/` como sensibilidad.
- **Capacidad implícita** = entradas por día ÷ ocupación (procesando + bloqueada) × kg por entrada. El cuello es la etapa de menor capacidad. Túnel y estibado no compiten: su "procesando" solo indica que tienen algo adentro.
- En ese modelo (llegadas fijas, pallet de 720 kg): E1 75,3 pallets/día y 54,9 t/día con cuello en mezcladoras (65,3 t/día) y siguiente el desencajado (74,1); E2 +14,4 pallets/día; E3 (E2 + más MP) −0,1; E4 −4,0 con lavado 30 min.
- **Ley de Little por estación** (`summary_little.json`): λ·W / L entre 0,94 y 1,04 en 10 de las 12 estaciones; en formadoras +7 % y en mezcladoras +14–18 %, porque el ítem se divide dentro de la estación (batch → cargas → bandejas) y FlexSim mide la estadía por ítem que sale.
- Limitaciones de esa corrida: horizonte terminante de 24 h arrancando vacío; tiempos de máquina constantes.
