# E1 base — modelo final PLANTASJ.fsm (L7 + L8), 10 réplicas

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
2. **Línea 7:** el tablero muestra una línea 7 mucho menos cargada que la 8 (25,8 contra 39,1); el modelo trabaja a capacidad en las dos. Hay que modelar la demanda/disponibilidad de la línea 7 o confirmar en planta por qué produce menos.
3. **Las fallas casi no cambian la producción** (pérdida < 1 % diario): los acumuladores entre estaciones amortiguan paros de 5–15 min. El cuello real es la formadora a 982 kg/h; la brecha 982 contra 1843 kg/h sigue sin conciliarse (SUPUESTOS T5).

## Welch
Con la producción de cajas por hora (promedio de las 10 réplicas, ventana 3) el transitorio dura ≈ 4 h: es el llenado de la línea desde vacía. Como E1 es terminante de 24 h arrancando vacío, ese transitorio queda dentro de las medidas.

## Verificación del módulo de fallas
Paros simulados contra lo que implican las entradas (min/día, media de 10 réplicas): formadoras 37,7 (esperado 49,5), túneles 16,6 (8,9), envasadoras 6,7 (6,1), estibadores 17,1 (20,3), picadoras 26,1 (36,5). La dispersión entre réplicas es grande (pocos eventos por día), así que las diferencias están dentro del ruido.

## Pendiente
- E2, E3 y E4 con los mismos números aleatorios (el módulo ya lo permite: `Tools/repId` y `Tools/fallOn`).
- Conciliar el tamaño de pallet (144 contra ~172 cajas de 5 kg) y la demanda de la línea 7 con planta.
- Llegadas de materia prima por hora (hoy 16 pallets cada 8 h con descarga fija) y ruido en los tiempos de máquina: hoy el modelo es determinista salvo las fallas.
