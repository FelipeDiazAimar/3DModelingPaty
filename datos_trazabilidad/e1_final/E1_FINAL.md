# E1 base — modelo final PLANTASJ.fsm (L7 + L8), 10 réplicas

> **Vigente: la última sección ("Lavado de 30 min y cuello de botella por escenario").** Las secciones anteriores describen la corrida histórica sin lavado (89,4 pallets/día) y se conservan como referencia de sensibilidad. Desde el 7/11/2026 el lavado de 30 min por batch y el resto de los supuestos son oficiales (`SUPUESTOS_v2.md`).

Reemplaza a `../e1_run/E1_BASE_24H.md`, que se hizo sobre una copia vieja de la línea 3 (`planta_sanjorge_v1_8.fsm`).
Este informe es del **modelo final** (`PLANTASJ.fsm`, 96/100 objetos de licencia), corrido dentro de FlexSim sin copias.

## Método
- 10 réplicas independientes de **24 h** (terminante, arranca vacío), `PLANTASJ.fsm` sin cambios de lógica.
- **Fallas aleatorias** (módulo `Tools/Fallas`, sin objetos de licencia): tiempo a la falla exponencial con el MTBF del tablero, reparación lognormal (σ = 0,9) con el MTTR del tablero (ver `SUPUESTOS_v2.md`).
- Los streams de FlexSim son solo 0–99: se usaron los 60–87 y cada réplica salta `12·réplica` números de cada uno, así que las réplicas son independientes y se pueden repetir las mismas secuencias en otros escenarios (números aleatorios comunes).
- Medidas: pallets terminados por línea (entrada a `QPaletizado_Lx`), cajas por línea, minutos de paro por equipo y muestreo horario.
- IC 95 %: t(0,975; 9 gl) = 2,262. n necesario para h ≤ 2 %: n = (1,96·s / 0,02·media)².
- Datos: `raw_replicas.txt` (salida cruda de FlexSim), `replicas.csv`, `summary_e1.json`; se procesan con `analizar_e1.py`.

## Resultados (24 h)
| Medida | Media | s | IC 95 % | h/media |
|---|---|---|---|---|
| Pallets L7 | 44,6 | 0,52 | [44,23 ; 44,97] | 0,83 % |
| Pallets L8 | 44,8 | 0,42 | [44,50 ; 45,10] | 0,67 % |
| Pallets planta | 89,4 | 0,84 | [88,80 ; 90,00] | 0,67 % (P95 = 90) |
| Cajas L7 / L8 | 6535 / 6561 | 150 / 177 | — | 0,74 % / 0,86 % |

En régimen (horas 3–23) el modelo produce ≈ 50 pallets/día por línea; las 24 h arrancando vacío pierden unas 3 h de llenado.

## Validación contra el tablero (pallets/día medios por línea, Sep–Oct, FITTING §E)
| | Real | Sim | Error | ¿Real ∈ IC? |
|---|---|---|---|---|
| L7 | 25,8 | 44,6 | +72,9 % | No |
| L8 | 39,1 | 44,8 | +14,6 % | No |
| Planta | 64,9 | 89,4 | +37,8 % | No |
| Toneladas L7 | 22,3 | 32,7 | +46,6 % | — |
| Toneladas L8 | 33,7 | 32,8 | −2,7 % | — |

**El modelo no valida en pallets** (criterio TP-D p.4: revisar supuestos antes de recomendar). Causas identificadas:
1. **Unidad:** el modelo arma pallets de 144 cajas × 5 kg = 720 kg; el pallet real pesa 862,5 kg de media (FITTING §C). En toneladas la línea 8 queda a −2,7 %.
2. **Diferencia entre líneas del tablero:** las dos líneas trabajan por igual (dato del usuario), así que la brecha 25,8 contra 39,1 no la explica la planta; hay que revisar cómo se asignan los pallets por línea en el tablero. La comparación válida es contra las dos líneas juntas: 89,4 contra 64,9 pallets/día (+37,8 %) y, en toneladas, 65,5 contra 56,0 (+17 %).
3. **Las fallas casi no cambian la producción** (pérdida < 1 % diario): los acumuladores entre estaciones amortiguan paros de 5–15 min. El cuello real es la formadora a 982 kg/h; la brecha 982 contra 1843 kg/h sigue sin conciliarse (SUPUESTOS T5).

## Welch
Con la producción de cajas por hora (promedio de las 10 réplicas, ventana 3) el transitorio dura ≈ 4 h: es el llenado de la línea desde vacía. Como E1 es terminante de 24 h arrancando vacío, ese transitorio queda dentro de las medidas.

## Verificación del módulo de fallas
Paros simulados contra lo que implican las entradas (min/día, media de 10 réplicas): formadoras 37,7 (esperado 49,5), túneles 16,6 (8,9), envasadoras 6,7 (6,1), estibadores 17,1 (20,3), picadoras 26,1 (36,5). La dispersión entre réplicas es grande (pocos eventos por día), así que las diferencias están dentro del ruido.

## Escenarios E2 y E3 (mismas 10 réplicas, diferencias pareadas; `analizar_escenarios.py`, `summary_escenarios.json`)
| Escenario | Cambio | Pallets/día planta | Diferencia contra E1 (IC 95 %) |
|---|---|---|---|
| E1 base | — | 89,4 ± 0,6 | — |
| E2 más dotación | Formadoras a 1843 kg/h (separación entre bandejas 3,27 → 1,554 m) | 91,9 ± 0,2 | **+2,5** [+1,9 ; +3,1] (+2,8 %) |
| E3 estrés por fallas | MTTR ×1,25 en formadoras y túneles (`Tools/mttrK` = 1,25) | 89,4 ± 0,6 | 0,0 (cajas −6,5 [−15,2 ; +2,2]) → sin efecto |

- **E2:** la mejora es real pero chica porque el techo pasa a ser la materia prima: entran 16 pallets de 1500 kg cada 8 h = 72 t/día = 14.400 cajas/día y las cámaras de MP quedan en cero. Para aprovechar una formadora más rápida hay que traer más materia prima.
- **E3:** el sistema resiste reparaciones 25 % más largas porque los acumuladores absorben paros de 10–20 min.
- **E4 (batch 1200 contra 1500 kg, `analizar_e4.py`, `summary_e4.json`):** 1200 kg = 8 cargas por batch, desencajado y picadora al 80 % del tiempo y 20 pallets de 1200 kg por turno de recepción (mismas 72 t/día). El lavado de la mezcladora por batch entra como tiempo de preparación (`setuptime`); **no hay dato**, así que se prueba con 0, 15 y 30 min.

| Lavado | Cajas/día 1500 kg | Cajas/día 1200 kg | 1200 contra 1500 |
|---|---|---|---|
| 0 min | 13.196 | 13.361 | +1,3 % |
| 15 min | 12.476 | 12.004 | −3,8 % |
| 30 min | 11.140 | 10.501 | −5,7 % |

  Con lavado, el batch grande rinde más (menos lavados por tonelada). Con 15 min las 10 réplicas dan el mismo valor en ambas variantes: el cuello son las mezcladoras y las fallas no pasan por ahí. Con 0 y 30 min es una réplica. La ventaja del 1200 kg sin lavado es un efecto del arranque desde vacío.
- Antes de correr los escenarios se comprobó que con `mttrK = 1` el modelo reproduce exactamente la réplica 1 de E1 (mismas fallas y 6594/6602 cajas). En esa verificación apareció y se corrigió un arranque duplicado de las fallas cuando el modelo se reabría (el relay quedaba registrado dos veces); las corridas E1 no estaban afectadas.

## Pendiente (cerrado el 7/11/2026)
Sin pendientes abiertos. El lavado de 30 min por batch es dato de planta y quedó en el modelo; la asignación de pallets por línea del tablero, la variación de llegadas y tiempos de máquina y el tiempo de desencajado se cerraron como parámetros oficiales (ver `SUPUESTOS_v2.md`).

## Lavado de 30 min y cuello de botella por escenario (corrida del 7/11/2026; `analizar_cuellos.py`, `actualizar_summary_e1.py`, `raw_cuellos/`)
**El lavado de 30 min por batch es dato de planta** y pasa a ser parte del modelo base (`SetupTime` 1800 s en las 4 mezcladoras). Todo lo anterior de este informe (89,4 pallets/día, brecha +17 % en toneladas, E2/E3/E4 con lavado 0) corresponde al modelo sin lavado; las corridas sin lavado quedan en `raw_cuellos/sin_lavado/` como sensibilidad. Se repitieron E1, E2 y E3 (10 réplicas cada uno, mismos streams) y E4 (1500 y 1200 kg con lavado de 30 min, 10 réplicas; 0 y 15 min, 5 réplicas), guardando por estación el tiempo en cada estado, el contenido, la estadía y las colas. **E3 pasa a ser "más materia prima + E2"**; el antiguo E3 (MTTR ×1,25) queda como E5 (medido sin lavado).
- **Capacidad implícita** = entradas por día ÷ ocupación (procesando + bloqueada) × kg por entrada. El cuello es la etapa de menor capacidad. Túnel y estibado no compiten: su "procesando" solo indica que tienen algo adentro.
- **E1 (validación):** 75,3 ± 0,7 pallets/día y 54,9 t/día contra 56,0 del tablero (−1,9 %): valida en toneladas. En pallets +16 % por el tamaño del pallet (720 contra 862,5 kg). El IC es muy angosto (tiempos constantes), así que el real queda ≈ 0,6 t fuera.
- **E1 (cuello):** las mezcladoras (65,3 t/día, 91 % ocupadas, cola de 3,5 lotes); siguiente: desencajado (74,1 t/día).
- **E2:** +14,4 pallets/día (+19,1 %, IC [+13,8 ; +15,0]). Mezclado 91 → 80 % y formado 64 → 44 % de ocupación; el cuello pasa al desencajado.
- **E3 (E2 + 24 pallets de MP por turno):** 89,6 pallets/día; −0,1 contra E2 (no distinguible de cero). Las cámaras de MP pasan de 6,3 a 21,8 pallets promedio: el desencajado impide aprovechar la MP extra.
- **E4 (diferencia 1200 − 1500 kg, IC pareado):** lavado 30 min −4,0 [−4,6 ; −3,4] (10 réplicas); 15 min −2,4 [−3,1 ; −1,7]; sin lavado +1,8 [+1,2 ; +2,4] (latencia, 5 réplicas).
- Limitaciones: horizonte terminante de 24 h arrancando vacío; tiempos de máquina constantes; la serie horaria (Welch) y los paros de la web son de la corrida sin lavado.
- **Serie horaria y paros con lavado** (mismas 10 réplicas, `raw_replicas.txt`): el transitorio sigue en ≈ 4 h y los paros no cambian (las fallas usan los mismos streams y no dependen del lavado): formadoras 37,7 min/día (esperado 49,5), túneles 16,6 (8,9), envasadoras 6,7 (6,1), estibadores 17,1 (20,3), picadoras 26,1 (36,5); la corrida sin lavado queda en `raw_cuellos/sin_lavado/raw_replicas_sin_lavado.txt`.
- **Ley de Little por estación** (`summary_little.json`): λ·W / L entre 0,94 y 1,04 en 10 de las 12 estaciones; en formadoras +7 % y en mezcladoras +14–18 %, porque el ítem se divide dentro de la estación (batch → cargas → bandejas) y FlexSim mide la estadía por ítem que sale.
