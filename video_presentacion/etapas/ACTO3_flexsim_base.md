# ACTO 3 — FlexSim base (voz IA)

Duración sugerida: 70–90 s. Ritmo: mostrar que el modelo corre y mide, sin explicar validación (eso es Acto 4).

## 1. Qué mostrar del 3D en FlexSim (recorrido ~60 s)

Modelo `PLANTASJ.fsm`: planta completa como 1 solo GLB visual (`assets_v2/PATY_Planta_v10u.glb`) + 32 fijos, 8 cintas y 8 móviles lógicos de L7/L8. 96/100 objetos licencia.

Recorrido sugerido (vista orbital alta → baja, Run a ~7400x):

1. **0–10 s — Plano general:** nave Elaborados 150×70 m con L7/L8 en paralelo. Decir: mismo GLB de Blender, ahora con lógica.
2. **10–25 s — Recepción MP (oeste):** `SrcCamionesMP` → `QRecep` (16 pallets/turno cada 8 h). Zoom a cola recepción: acá nace el WIP.
3. **25–40 s — Línea (seguir flujo L7):** Picadora → `MezA/B` (batch 1500 kg, 10 cargas) → carritos → Formadora → Túnel → Estuchadora → Envasadora → `EncA/EncB` → `QPaletizado_L7/L8` → expedición (muelles este, tandas 24 pal PT). Pausar 2 s en mezcladoras (ahí se forma la cola); no anticipar el veredicto, que se revela en el Acto 4.
4. **40–50 s — Móviles:** montacargas + `OpDesencajado/Envasado_L7/L8` moviendo pallets/cajas. Vista cenital corta: se ve el ida y vuelta a muelles y básculas.
5. **50–60 s — Cierre:** abrir Dashboard `PATY_Tablero` sobre el 3D corriendo. Gancho: "mientras produce, ya está midiendo".

No abrir: Experimenter, Script console, propiedades crudas.

## 2. Solapas estadísticas nativas (dashboard `PATY_Tablero`, 1 widget HTML, 7 hojas)

Muestreo cada 10 s simulados (`Tools/Indicadores` → `Tools/indHist` + `Tools/indEst`). KPIs arriba siempre visibles.

| Hoja | Qué significa | Zoom sugerido |
|---|---|---|
| **Producción** | PT acumulado L7+L8 + Meta punteada 3 pal/h (72/día); KPI pal/h PT ventana 4 h | Zoom a curva vs meta al final de 24 h |
| **Colas y WIP** | `content.average` en `QRecep`, `QPalL3/QPaletizado`; L, Lq | Zoom a pico de `QRecep` tras llegada de camión |
| **Paradas** | Estado 20 (`STATE_DOWN`) por máquina, MTBF/MTTR FOR+TUN; `Tools/fallLog` | Zoom a barra FOR/TUN (las que más paran) |
| **Velocidad** | kg/h L7/L8 ventana móvil 1 h: `(cajas ahora − cajas 1 h antes) × 5` | Zoom a la meseta de la corrida con lavado, sin citar un valor en voz |
| **Balance de masa** | MP in vs PT out + mermas; batch 1500 kg trazable | Zoom a diferencia in/out de un batch |
| **Montacargas** | Estados fleet por categoría/color (tabla abajo) | Zoom a torta de estados en hora pico |
| **Estadística** | `staytime.average` + P95 esperas, `busy/(Stop−Warmup)` formadora, check Little `L≈λW` | Zoom a P95 (la media sola oculta picos) |

Colores/categorías (web = FlexSim): Inactiva `#8b97a8`, Procesando `#16a37f`, Bloqueada `#e08a1e`, Sin material `#d6a21a`, En falla `#d5334b` (solo estado 20; el 12 no se cuenta).

## 3. Archivos .fls/.fsm relevantes (solo rutas)

- `PLANTASJ.fsm` (raíz repo, binario — no abrir fuera de FlexSim)
- `dashboard/flexsim/publicador.fls` (nodo `Tools/Publicar`)
- `dashboard/flexsim/arranca_publicador.fls` (nodo `Tools/ArrancaPublicador`)
- `dashboard/flexsim/indicadores.fls` (nodo `Tools/Indicadores`)
- `dashboard/flexsim/arranca_indicadores.fls`
- `dashboard/flexsim/tablero.fls` (nodo `Tools/TableroHTML`)
- `dashboard/flexsim/svg_lineas.fls`, `dashboard/flexsim/svg_barras.fls`, `dashboard/flexsim/svg_estados.fls`
- `dashboard/flexsim/fallas.fls`, `dashboard/flexsim/arranca_fallas.fls` (nodos fallas, `Tools/mttrK`, `Tools/fallLog`)
- Historial/resultado: `datos_trazabilidad/e1_final/` (ver `E1_FINAL.md`; raws no se abren en video)

## 4. Bullets guion voz IA (leer directo)

- "Este es el mismo 3D de Blender, pero ahora produce: cada cinta, cada máquina y cada montacargas simulan L7 y L8."
- "Por el oeste entra la materia prima, dieciséis pallets por turno; por el este salen los pallets de hamburguesas."
- "La mezcla va en tandas de mil quinientos kilos: picadora, mezcladoras, formadora, túnel de frío y envasado."
- "Mientras corre, el tablero mide solo: producción contra la meta, colas, paradas, kilos por hora y cada montacargas."
- "La primera corrida dio ochenta y nueve pallets por día. El tablero real, sesenta y cinco. Ahí empezó el problema."

## 5. Transiciones

- **Blender → FlexSim (match-cut):** congelar frame orbital del GLB en Blender, corte seco al mismo encuadre en FlexSim parado; al hacer Run, leve push-in + sonido de arranque de línea. El truco vende "mismo modelo, ahora vivo" porque el GLB es literalmente el mismo.
- **FlexSim → quiebre (Acto 4 validación):** cerrar sobre el tablero corriendo, corte seco a negro + placa histórica "Primera corrida: 89,4 contra 64,9 pallets/día, +37,8 %". No congelar el KPI en pantalla: el modelo actual, con lavado y arribos y pallets aleatorios, marca 63,2. De ahí se entra al Acto 4 (MCP, réplicas, lavado de 30 min y veredicto).
