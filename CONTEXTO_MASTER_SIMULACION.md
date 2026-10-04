# CONTEXTO MASTER — Proyecto de Simulación: Gemelo FlexSim de Planta Paty San Jorge

**Fecha:** 2026-10-03 · **Versión:** v1 · **Estado del proyecto:** piloto E4-L3 operativo en `planta_sanjorge_v1_8.fsm` (FlexSim 2026), gemelo visual L7/L8 en Blender planificado.

## Para qué es este archivo y cómo usarlo en NotebookLM

Subir a NotebookLM **este archivo + todos los apuntes de la cátedra** (carpeta `Simulacion/`: PDFs `2026 - E.T. 1..6 - Teoría`, TPs, tablas Chi²/K-S/Normal, `01 - Anexo introducción a software Flexsim.pdf`) **+ el video** (`02 - Introducción a Flexsim - Módulo 2 - Gráficas.mp4`). Este `.md` le da a la IA el contexto completo del proyecto real para que cruce con la teoría.

**Preguntas sugeridas para NotebookLM (copiar-pegar):**

1. `Según los apuntes E.T.1–E.T.6 y este proyecto, ¿qué temas de la materia evalúa cada parte del modelo (línea L3, almacenes, operarios, túnel)? ¿Qué le interesa al profesor: el modelo en sí, las distribuciones, las gráficas o la validación?`
2. `¿Qué distribuciones de probabilidad conviene usar en cada estación (llegadas MP, proceso manual, túnel de frío, formado) y con qué test de bondad (Chi² / Kolmogorov-Smirnov) se validan según E.T.2–E.T.3? Dame parámetros concretos partiendo de los supuestos S1–S15.`
3. `¿Qué gráficas y dashboards pediría un GERENTE de planta (throughput/turno, utilización, WIP, lead time, cuello de botella, backlog expedición) y cuáles pediría el PROFESOR para aprobar el TP (réplicas, intervalos de confianza, diseño de experimentos)? Armame la lista mínima de cada uno.`
4. `Detectá inconsistencias entre mis supuestos (SUPUESTOS.md), las preguntas pendientes y los datos de manuales. ¿Qué dato me falta para calibrar el cuello de botella?`
5. `Con el flujo L3 y los tiempos del modelo, ¿dónde está el cuello de botella teórico y qué experimento (qué escenarios, cuántas réplicas, qué semilla) lo demostraría según E.T.6?`

## Notas de consistencia (leer si algo parece contradecirse)

- **Cantidad de tools MCP:** el código (`flexsim_mcp.py`) define **73** (`async def flexsim_*`); los docs dicen 69/71/72 porque están desactualizados. Manda el código.
- **Licencia:** era Student-100 objetos; **actualmente sin límite**. El modelo (65 objetos) entraba igual.
- **Versiones FlexSim:** se probó 2019 (puente socket inviable en build 19.0.0), 2024 y 2022 (instaladas y desinstaladas); **la activa es 2026 26.0.2**. Los hallazgos 2019 valen como registro, no como vía de trabajo.
- **Disco/RAM:** el 2026-09 el disco C estaba al 98,5%; al 2026-10-03 hay 175 GB libres (18,5%) y RAM libre 3,47 GB (22%). Si NotebookLM ve números viejos en alguna sección, valen los de §7.
- **Regla firewall** `FlexSim 2019 sin internet` quedó huérfana (apunta a un exe inexistente); no afecta a 2026.
- **Blender:** solo hay autosaves en `%TEMP%`; el gemelo L7/L8 existe como `PLANTASJ.fsm` + `.glb`, el showcase visual está planificado, no materializado.

---

## 1. Proyecto y alcance

**Base:** `C:\Users\Asus\Desktop\Facultad\APUNTES CUARTO ANO\Simulacion\FabricaPaty_SanJorge`

### 1.1 Qué es el proyecto

- **Gemelo funcional en FlexSim de la planta San Jorge de Paty (hamburguesas),** construido por chat con el MCP `mcp_flexsim_opencode` (71 tools). Fuente circuito real: `C:\Users\Asus\Desktop\Facultad\APUNTES CUARTO ANO\Simulacion\FabricaPaty_SanJorge\CIRCUITO_PLANTA.md` (sistema `SistemaTrazabilidad-Elaborados`, relevado 2026-09-26).
- **Piloto: E4 L3 (69 g, cód. 270603, 91 caj/pallet, 6.62 kg/caja, formadora F26 + estuche + Camma/Fripack).** Alternativa considerada: PDC L1 simple sin estuche.
- **Bloque L3 propio (dato planta 2026-09-26):** 1 picadora → 2 mezcladoras → descarga DIRECTA por líneas transportadoras (sin carritos, distinto de L1/L2) → 2 formadoras + 2 estuchadoras (= sub-líneas L3A/L3B, cada una con su Fripack).
- **Planta completa:** T1/T2 (1 tren picado + 2 mixers c/u, compartiendo L1–L6) + cámaras/túnel cada 2 líneas + L1/L2/L4/L5/L6 + bloque L3 + recepción/almacenes/expedición.

### 1.2 Objetivos (de `README.md`)

1. Completar `PREGUNTAS_PENDIENTES.md` (datos de planta).
2. Elegir línea/producto piloto (recomendado: 1 línea, ej. E4 L3 o PDC L1).
3. Armar el modelo por chat con el MCP (crear→conectar→configurar→correr→medir).
4. Calibrar con números reales (rendimientos, capacidades, dotación).
5. Réplicas y escenarios (semillas, `run_experiments`, gráficos fuera).

### 1.3 Límites de alcance documentados

- Modelo vive como `lineaX_producto_vN.fsm`, nunca sobre plantilla `bridge/mcp_template.fsm` del repo MCP.
- Sin turnos ni paros (`Time Tables` pendiente mecanismo); 1 operario por formadora, sin turnos.
- Changeover 30–60 min **no modelado** (baja disponibilidad real ~5–10%).
- Carritos = flujo directo instantáneo (sin `TaskExecuter` + travel); distribución T1/T2 por links fijos, ruteo por carritos/turno futuro.
- Layout en grilla (espaciado 6 m, líneas en Y) solo visual; falta plano para gemelo fiel.
- Split batch→burgers del `Separator`: pendiente (`Split/Unpack Quantity` + picklist con código); define todas las tasas aguas abajo. Bisección verificada: colas multi-salida reparten 150/149/0.
- Cintas (7 en v1.2: L1/L2/L4/L5/L6/L3A/L3B) puestas y conectadas pero flujo medido usa links directos (`cinta.in = 0`); handshake completo de transfers SÍ mueve ítems (119>109 en prueba aislada), forzado determinístico abierto.
- `capacidad_bache_kg 1500 (1200 MCD)` en código figura como valor **inventado** — no usar sin confirmar.
- Formas 3D importadas: nunca `o.size` sobre ellas (rompe render); escalar ARCHIVO antes (`scale_stl` binario+ASCII+rotaciones x/y/z). Asignaciones por script son POR SESIÓN (tras guardar+reabrir se pierden); versionadas en `planta_sanjorge_v1_7.shapes.json`, aplicar con `flexsim_apply_shapes` / `OnModelOpen` recompila FlexScript.
- Límite 100 objetos (motivo por el que en `PLANTASJ.fsm` se quitaron cintas túnel→detector y rodillos peso→robot, y no se modelan operarios recepción/expedición documental/calidad).
- Tren de empanado (batter/breeder) NO va (solo milanesas/nuggets).

### 1.4 Supuestos — `SUPUESTOS.md` (Planta San Jorge v1.1)

Leyenda: ✅ confirmado · 🔶 razonable · 🔴 grueso (calibrar urgente).

| # | Supuesto | Estado | Si difiere |
|---|---|---|---|
| S1 | Molde F26: **4 cavidades** × 69 g = 276 g/golpe | 🔴 | Tasa formadora escala lineal (±50% si son 6) |
| S2 | Formadora **57 golpes/min** (rango manual 25–90) | 🔶 | Throughput línea ±60% |
| S3 | Batch mezcladora **1500 kg / 20 min**, 2 mixers por tren que **alternan** | 🔶 (usuario) | Modelado como 1 mixer PT 600 s = mismo throughput promedio; alternancia fina (pull) futura |
| S4 | Picadora PT **1,5 s/batch** (capacidad real desconocida) | 🔴 | Puede ser el cuello real |
| S5 | Túnel **300 s** por batch, capacidad infinita | 🔴 | Con receta (T°, t) se modela como conveyor con residencia |
| S6 | Estuchadora/envasadora **0,4 s** (150 paq/min ✅ manual) | ✅ | — |
| S7 | Orden L3: formar → túnel → estuchar → envasar | 🔶 (usuario: túnel tras formar) | Reordenar links si cambia |
| S8 | L1 directo a sink (granel, sin frío) | 🔴 | Agregar cámara si lleva |
| S9 | Distribución T1/T2 a líneas: directa por links fijos | 🔶 | Real es por carritos/turno (ruteo futuro) |
| S10 | Split batch→burgers del Separator: **pendiente** (picklist con código) | 🔴 | Define todas las tasas aguas abajo |
| S11 | IAT recepción **1 s/batch** (llegan más que suficiente) | 🔶 | Solo afecta stock inicial |
| S12 | 1 operario por formadora, sin turnos ni paros | 🔶 | Turnos = Time Tables (pendiente mecanismo) |
| S13 | Changeover 30–60 min: **no modelado** | 🔴 | Baja disponibilidad ~5–10% |
| S14 | Layout en grilla (espaciado 6 m, líneas en Y) | 🔶 | Solo visual; pedir plano |
| S15 | Carritos = flujo directo instantáneo (sin transporte) | 🔶 | Agregar TaskExecuter + travel si importa |

Confirmados (no supuestos): clases, conexiones A/S, túnel Advantec/Scanico/FPF, Fripack 150/min, CAMA estuche, Torfresma fin automático, cámaras cada 2 líneas, T1/T2 comparten L1–L6, L3 líneas propias, 3 turnos, encajado automático.

### 1.5 Preguntas pendientes — `PREGUNTAS_PENDIENTES.md`

Respuestas 2026-09-26 (línea piloto E4 L3): Piloto **E4 L3**; encajado **automático**; turnos **3**; batch **1500 kg / 20 min**; layout L3 real 1 picadora → 2 mezcladoras → líneas DIRECTAS → 2 formadoras + 2 estuchadoras (L3A/L3B c/u Fripack); molde F26 cavidades por confirmar → supuesto **4**; túnel L3 receta por confirmar → supuesto inicial.

1. **Picadora:** ¿qué equipo es, capacidad (kg/h), va antes o después de mezcladora? ¿Uno por tren?
2. **Mezcladora:** capacidad/batch (kg), tiempo mezcla (min), ¿cuántas?, ¿carritos por batch?
3. **Formadora:** velocidad real (golpes/min o kg/h por producto F19/F26), tiempo cambio formato, mermas arranque/parada.
4. **Congelado:** ¿túnel o cámara? T° y residencia, capacidad.
5. **Encajado/palletizado:** ¿manual o automático? Puestos/línea, cajas/min, ¿film/estuchado dónde?
6. Distancias: recepción → cámaras → mezcladoras → líneas → PT.
7. Operarios por puesto y turno + horarios reales.
8. Puestos fijos: desencajado, pesado reaprovechamientos, aditivos, etiquetado PT (¿2 puestos: L1-6 y L7-8?), bocas mezcladora.
9. Reaprovechamiento/barrido: ¿a dónde reingresa y en qué %?
10. Muestreo FOS/microbiología: tablas y tiempos reales.
11. ¿Línea/producto piloto? (sugeridos **E4 L3** con estuche+Camma, o **PDC L1** simple sin estuche).

### 1.6 Circuito planta — `CIRCUITO_PLANTA.md`

- **A. Recepción MP cárnica:** camión → recepción documental (remito+sanitario+factura) → muestreo calidad por lote (**3–9 cajas**) → etiquetas pallet + calidad → cierre báscula (bruto-taras) → egreso camión → por T°: **<1 °C → almacén 1001 (congelado)** / **≥1 °C → 1000 (enfriado)** → muestreo FOS (**5–6 cajas/pallet**, tenor graso) → alta SAP → traslados internos.
- **B. Almacenaje + preparación:** stock `1000/1001` (centro 1239); almacén `22` = consumo/preparación; aditivos bolsas por fórmula (kg/bolsa fijo); consumo MP al pie de línea (pickeo, devoluciones, cierres).
- **C. Mezclado → formado → envasado:** mezcladora → batch (`peso_inicial`, descargas `intermedia|cierre`); **carritos** a líneas (asignada por supervisor); **tren (picado) → formadora (F19/F26/TOMAHAWK) → línea 1–8**; envasado `FLOW` / `ESTUCHE` / `Granel`; etiquetado PT → **pallet mono-SKU** (HU `T`+9 dígitos); **supercongelados** (programa semanal) → stock/expedición.
- **D. Cierre:** declaración producción + consumo a SAP.
- **Topología real:** T1 y T2 (1 tren + 2 mezcladoras c/u) → **L1–L6** compartidas; mezcladora→línea con **carritos**, EXCEPTO L3 **líneas transportadoras**; tras cada línea **cámara/túnel cada 2 líneas**, luego **1 estuchadora por línea**; L3 todo a estuche; cambio formato **30–60 min**.
- **Líneas/productos:** L1 F19 sin estuche PDC 271002 120 g 165 caj 5.76 kg; L2 F19 +Camma; L3 F26 +Camma E4 270603 69 g 91 caj 6.62 kg; L4 F19 +Bradman Lake E4; L5/L6 F26 M10 270775 44.9 g 56 caj 17.24 kg; L6/L7 F26 SUP 236213 125 g 144 caj 5.0 kg; L8 TOMAHAWK SUP.
- **Numéricos confirmados:** centros 1239 San Jorge A09 (1240 Baradero, 1241 Arroyo Seco, 1300 Pilar); rendimientos kg Lu–Ju/Vi ej. SUP L7 29620/31289, E4 L3 25114/26529; capacidad formadora kg/h: CLASICO/FINITAS/PATY CASA 982, EXPRESS/BARFY 921, PATYNESA 1062, MILANESA 892, TROCITOS 1068, MCD 909.
- **Laterales:** `cajas_calidad` (1 caja/pallet) + reincorporación mismo producto/lote; reaprovechamientos y barrido (reingreso a confirmar).

### 1.7 Fichas equipos E4 L3 — `FICHAS_EQUIPOS_E4L3.md`

Extraído de manuales por 7 agentes (2026-09-26); `.txt` en `%TEMP%\opencode\`.

| Equipo | Parámetros clave |
|---|---|
| **Formadora F26 PLC (E4 L3)** | 25–90 carreras/min; a 69 g/cav: 103.5–372.6 kg/h por cav (media 238); tolva 454 kg (~18 min a máx 4 cav); molde plato 482.6×152.4 mm, espesor 4.8–25.4 mm; cambio molde sin tiempo oficial (~20 pasos, 2 personas + espuma 10–15 min → supuesto FlexSim 30–60 min); 20–32 kVA trifásico, aire 6.9 bar/140 l/min, agua ~3.8 l/min, 77–81 dB(A), ~3.4–3.6 t, despeje 0.914 m; dotación 1 op (+1 cambios) |
| **Tren picado (Weiler 1612 grueso → 1109 fino → mezcla)** | 1612: 3277 kg, 1109: 1751 kg; placas 19–32 mm; cinta 24BC 1 bloque/vez; **kg/h no consta**; mezclador D&D 2500 L (22.5 CV), M360A 32.5 HP; batch/tiempo no constan; carros limitados por izaje 181 kg/viaje; orden sugerido picado→mezclado→descarga |
| **Estuchadora CAMA CL156 (E4 L3)** | 400 V, 6 bar (cola 2–3), 1 operador + cambio por recetas OP7; **velocidad estuches/min no está en texto**; dimensiones en plano imagen |
| **Envasadora FRIPACK HP 3S (L3 = 18160/18162)** | **150 paq/min máx** (70–400 largo, 5–70 alto, 10–130 ancho mm); 220 VCA 2.2 kW ~500 kg, 5 recetas, empalme sin parar; cinta salida 420×9240 mm, entrada 150×3280 mm; "Camma"=leva, L3 usa FRIPACK |
| **Túnel Advantec L3/L4 (impingement)** | Correa 1250/1800 mm, v 1.2–24 m/min, **t=L/v**; receta planta no en manual (T_aire, T_evap, kg/h); R717, 1 op HMI; ej. 3 módulos ~15 m a 3 m/min → ~5 min |
| **Fin línea (Torfresma + envelopadora/encintadora/envolvedora)** | Apilador sincronizado 1 op, cambio disco+receta; DG900L / DG240 (plato 1500 mm); ref L7/L8: 69 g → 485/min, rechazo con retardo+candado, split granel/estuche manual, cajas manuales en rodillos |

### 1.8 Inventario archivos

Modelos: `linea3_E4_v1/v2.fsm` (pilotos L3, 14/17 obj) → `planta_sanjorge_v1..v1_7.fsm` (planta completa T1/T2+L1–L6+L3, hasta 62 obj) → `planta_sanjorge_v1_8.fsm` (~7.2 MB, L3 + geometría 3D) → `PLANTASJ.fsm` (Blender L7+L8) → `Ordenado.fsm` (~13.9 MB). HTML: `diagrama_flujo_l3.html` (estático), `editor_flujo_l3.html` (drag-drop + export JSON, clave `l3_layout_v2`). Python: `build_e4l3_v1/v2.py`, `build_planta_v1/v12/v17.py`, `apply_items3d.py`, `paint_items.py`, `recuento_objetos.py`. STL top-level: `caja_1m`, `carne_1m5`, `mezcladora_3m*` (×6, 6.7 MB c/u), `picadora_3m*` (×6, 12–47 MB). `shell/` (piso+muros v1/v3/v4), `truck/` (OBJ+MTL+PNG), `planta_sanjorge_v1_7.shapes.json`, `assets_v2/`, `manifests_v2/`. Ver §5 para detalle fino de assets.

---

## 2. Modelo FlexSim v1_8 en detalle

Fuentes: `respaldo_2026_pre2019\manifests\{conexiones_v1_8.txt, bbox_v1_8.txt, onmodelopen_v1_8.txt}`.

### 2.1 Cadena de flujo end-to-end

`SrcMP[Source] → QRecep[Queue] → AlmMP[Rack] → QPalL3[Queue] → DesL3[Processor] → BeltDL31 → PicL3[Processor] → BeltPL3 → MixL3/MixL3B[Processor] → BeltM1/BeltM2 → FormL3B/FormL3A[Processor] → BeltL3A/BeltL3B → Tunel3[Processor] → BeltE13A1/BeltE13B1 → EstL3A/EstL3B[Processor] → BeltE13A/BeltE13B → EnvL3A/EnvL3B[Processor] → AlmPT[Rack] → SinkEXP[Sink]`

Patrón invariable en las 10 piernas: `Processor → EntryTransfer → StraightConveyor (10×0.5×1 m) → ExitTransfer → Processor`. Bifurcaciones: `ExitTransfer2 → MixL3#1 + MixL3B#2`; cruce M1→FormL3B, M2→FormL3A; `Tunel3` con 2 puertos IN y 2 OUT; `AlmPT` con 4 puertos IN.

### 2.2 Operadores (S-links, todos simples verificados)

`OpDesL3↔DesL3` (doble), `OpL3A↔FormL3B` y `OpL3B↔FormL3A` (nombres cruzados), `OpL4Env1↔EnvL3A`, `OpL4Env2↔EnvL3B`, `MONT1↔DSP1` (transporte), `MONT2↔OpMont`.

### 2.3 Limpieza aplicada

24 vínculos S fantasma eliminados (Tunel3↔BeltE13A1/BeltE13B1, EstL3A↔BeltE13A1, EstL3B↔BeltE13B1, en baterías de 6) + 2 atajos A directos (EstL3A→EnvL3A, EstL3B→EnvL3B). Flujo válido restante vía BeltE13A/BeltE13B.

### 2.4 Shell y OnModelOpen

Piso 198×42×0.1 en (47,-7,0); muros 198×0.2×3 (N y=14, S y=-28) y 0.2×42×3 (O x=-52, E x=146), z=0. VisualTools con `setsize(1,1,1)` obligatorio (default 10,6,0.5 deforma). OnModelOpen: `mcp_start();` + `loadthreedobject` mezcladora (MixL3/MixL3B), picadora (PicL3), camión OBJ + `loadimage` textura (SrcMP, renderiza gris = issue conocido).

### 2.5 Posiciones y tamaños (bbox, metros)

DesL3 (12.4,-12.2) 5×4×2 · PicL3 (27.4,-13.6,+0.65) · MixL3/MixL3B (40.3,-11.6/-13.3) 1.78×3×2.78 · FormL3A/B (53,-14/-10) 5×4×2 · Tunel3 (68,-12) · EstL3A/B (82.8,-13.8/-10.3) · EnvL3A/B (97.6,-13.8/-10.2) · AlmPT rack (104,-0.8) 20×1.5×8.4 · SinkEXP (127,-14.3) 29×4.5×6.2 · SrcMP camión (-34,-7) 29×4.5×6.2 · COUNT=60 + 5 shell = **65 objetos**.

### 2.6 Distribuciones que el tooling soporta

`flexsim_set_distribution`: exponential/uniform/normal/constant **solo mismo-molde** (cambio de familia rechazado: cuelga FlexSim). Sin soporte dedicado para setup/downtime/MTBF/MTTR/breakdown/staffing (solo `setProperty` genérico; ArrivalStyle/FlowItemClass bloqueados).

---

## 3. Servidor MCP y herramientas

`mcp_flexsim_opencode/mcp_server/flexsim_mcp.py` (7598 líneas, **73 tools** `flexsim_*`, FastMCP **stdio** — el endpoint HTTP del config no se usa). Clientes: `opencode.json`/`.mcp.json` (`uv run mcp_server/flexsim_mcp.py`). Backends: ventana GUI (crea/conecta, Student) + FlexSimPy headless (corre/mide). Agente ventana en `127.0.0.1:8765` (`GET /next` hold 20 s, `POST /result`); plantilla `bridge/mcp_template.fsm` (no sobrescribir); comandos `mcp_exec` (=`executestring`), `mcp_agent` (loop con `seq` anti-duplicados), `mcp_start` (seq=100 + primer poll); trigger On Model Open; reconexión manual con `mcp_start();`. Guards que bloquean: ArrivalStyle, FlowItemClass, PerformanceMeasureTables-addRow, plantilla.

Familias: inspección (inspect/list_tree/library/screenshot/read_console/set_view/time/gui_status), construcción (execute_script/create_objects/create_any/connect/disconnect Q-W/layout_line/attach_resource/distribution), corrida+medición (reset/run/stop/run_to_time/statistics/performance/table/export_results/dashboard/collector/chart), shapes (import_shape/apply_shapes/paint_meat), conveyor+AGV (leg/loop/connect/deliver), Experimenter (status/plan/run_experiments), ProcessFlow, people, fluid, save/clone/open/close. Receta típica: gui_status → prepare_gui_model → execute_script → reset → run_to_time → get_statistics + inspect + screenshot → save_model; réplicas con run_experiments → export_results → `utility/plot_results.py`. Config: FlexSim 2026 en `C:\Program Files\FlexSim 2026\program`, Python 3.12, `uv`, MSBuild 2022.

---

## 4. FlexScript verificado y gotchas 2019 vs 2026

**Verificado 2026:** loop `model().subnodes` desde `i=2`; `inObjects/outObjects/centerObjects` (+`.length`, 1-based); `Object.create()` (incl. `VisualTool`; `Box` NO existe); `setLocation/setloc/setsize`; `o.color = Color(r,g,b)`; `loadthreedobject/setobjectshapeindex/loadimage/setobjecttextureindex` (.stl/.obj/.fbx/.glb); `numtostring` para concatenar; `applicationcommand("save")`; `destroyobject(Model.find())`; `repaintall()`; `executestring` (tolera `{}`); `objectconnect` + `contextdragconnection(A/S/Q/W)` (Q rompe flujo, W rompe recurso). **NO usar:** `noutport/outobject/ncp/cpobject`, `getpath` 1-arg, `num2str`, `setScale`, `setobjectcolor`, `setcameradirection`, `applicationcommand("resetview")`, `objectdisconnect`.
**2019 (build 19.0.0.441):** sin API Http; `serverreceive` nunca entrega datos (puente socket inviable, verificado); `VisualTool` nace 10,6,0.5; los connects acumulan (limpiar en loop); `sv()` no fiable. Sockets cliente+servidor existen en el manual pero el receive está roto en este build.

---

## 5. Assets 3D y editores HTML

STL máquinas a medida real (sufijos `x90/xm90` = rotación X CAD→Z-up FlexSim, `n` = normales): mezcladora 3 m (6.7 MB ×6 variantes, elegida `xm90n`), picadora (ASCII 47 MB base; binaria 12 MB `x90n` elegida), `caja_1m` (cubo 2×2×2→1 m, 272 tris), `carne_1m5` (2252 tris). `shell/`: v1/v3 = cubos 12-tris degenerados (684 B; bug histórico header 75 B); **solo `*_v4.stl` sirven** (272 tris, 13.7 KB, header 80 B `scaled by scale_stl`). Pipeline: `utility/scale_stl.py` (escala+rota+bbox). `truck/`: OBJ triangle/quad + MTL grises sin `map_Kd` → camión gris (issue). HTML: `diagrama_flujo_l3.html` (estático) y `editor_flujo_l3.html` (drag-drop, `localStorage l3_layout_v2`, export JSON, 36 objetos). Issues visuales: blancos lavados (ajustar color, no size), grilla `Visual Display Plane` → poner `Visual Display: None`.

---

## 6. Bitácora técnica de sesiones

Puente: HTTP long-poll (`fs_daemon.py` persistente en :8765; los one-shot matan el loop); protocolo 2019 crudo (`fs_tcp.py` + mutex `FS_TCP_DAEMON_SINGLETON`) abandonado por `serverreceive` roto; GUI por `SendInput` (`gui_auto.py`) como último recurso. Diagnóstico: dumps de conexiones/bbox verificados; bisecciones (`content/rank` en model sí, en objetos no). Limpieza: 24 S + 2 A con loops verificados. Shapes: header STL 80 B, colores por objeto, `VisualTool` 1,1,1, OnModelOpen pegado a mano (FlexSim bloquea escritura de code-nodes por script). Ventana/cámara: `sv()` vacío hasta en ventana; la vista del usuario manda. Licencias/instaladores: peleas OPC 106 vs 107 (`.msi` no trae OPC), LIBEAY32 crashes en 2019, procesos colgados kernel (reboot), firewall 80/443 no afecta loopback :8765/:8766. strconv: string+int no compila (usar `numtostring`).

---

## 7. Hardware y entorno

PC: i7-13620H (10C/16T), 16 GB RAM (3.5 libre), RTX 4060 Laptop + Intel UHD, Win 11 Pro build 26300, disco 952 GB (175 libre, 18.5%), Python 3.12.10 (sistema + venvs), `uv 0.12.22`, sin MSBuild/flexsimpy compilable (solo runtimes VC++). Instalado: FlexSim 2026 26.0.2 + Version Selector, sin OPC. Puertos 8765/8766/8088 libres. `%TEMP%\opencode` 2.5 GB (bloat incluído). Regla firewall huérfana de 2019 (no afecta 2026).

---

## 8. Material de cátedra disponible

`APUNTES CUARTO ANO/`: 8 materias; `Simulacion/` trae E.T.1–E.T.6 Teoría+TP, tablas Chi²/K-S/Normal, autoevaluación pre-parcial, `01-Anexo FlexSim.pdf` y video `02-Módulo 2-Gráficas.mp4` (441 MB). `Downloads/MANUALES/`: 229 archivos (212 PDF) de equipos reales (formadoras 41, envasadoras 48, túneles 13, etc.). Mapeo a programa estándar: E.T.1 modelado ✅ (los .fsm), E.T.2 aleatorios/tests ⚠️ parcial (falta GNA en repo), E.T.3 entradas/distribuciones ✅ (fichas+supuestos, falta fitting), E.T.4 colas ⚠️ débil (sin M/M/c explícito), E.T.5 V&V ⚠️ parcial (falta protocolo), E.T.6 experimentos ✅ infra (falta réplicas+IC), dashboards 🎥 parcial (video + HTML, falta dashboard final).

---

## 9. Métricas y dashboards para gerencia

Stats válidos FlexSim: `input/output/content/staytime` × `value/average/maximum/minimum/count/rate` (sin `state/downtime`). KPIs: throughput (`SinkEXP.input.value`/turno), utilización (`content.average`, cuello = máx), WIP (colas avg/max), staytime/lead time, cuello (content+staytime+output.rate), what-if de paros (escenarios base vs falla), OEE proxy (sin `state`: output real/teórico), pallets in/out, backlog (`AlmPT.content` vs `SinkEXP.input.rate`). Herramientas: `export_results` (snapshot.csv), `run_experiments` (summary.csv + manifest), `live_monitor` (live.csv temporal), `plot_results` (report.html). 6 paneles: salida/turno, utilización por estación, WIP en vivo, lead time apilado, cuello+backlog, pérdida por paro. Distribuciones: llegadas MP exponencial→Erlang→empírica (trazabilidad); manual normal→lognormal→empírica por turno; máquina/frío constante+ruido→triangular→empírica por receta/peso. Fuente de datos reales: `SistemaTrazabilidad-Elaborados` (existe en `Desktop/Trabajo/`).

---

## 10. Gemelo visual en Blender y líneas 7-8

Showcase L7/L8 planificado (no materializado): ruta completa, 2 muelles entrada + 2 salida, 4 almacenes (MP congelado/enfriado, PT congelado/enfriado), entorno (pasto/cielo/nubes/sol/sombras), props free (matafuegos, puertas, luces), rótulos ES en piso (Recepción MP, Cámaras 1001/1000, Mesada, Picado, Mezclado, Formado L7/L8, Túnel, Detector, Envasado, Encajonado, Peso, Paletizado Robot, PT, Expedición), empleados/autos/calles/vegetación. En disco solo autosaves `.blend` en `%TEMP%`. FlexSim = gemelo funcional, Blender = showcase (referencia 24 h: 60 pallets MP, ~7250 cajas/línea, 100 pallets PT).

---

*Generado 2026-10-03 con 10 subagentes de mapeo (código, docs, assets, hard, cátedra, métricas). Para NotebookLM: adjuntar además los PDFs E.T.1–E.T.6 + TPs + video Módulo 2 + (opcional) `CIRCUITO_PLANTA.md`, `SUPUESTOS.md`, `FICHAS_EQUIPOS_E4L3.md` sueltos para cita directa.*

## 11. Datos reales de trazabilidad (fuente para distribuciones empíricas)

Sistema: `C:\Users\Asus\Desktop\Trabajo\SistemaTrazabilidad-Elaborados` (Marfrig: API Express + WEBBAPP React + legacy + **PostgreSQL `dbelaborados`** + SAP OData + colector WebSocket de **balanzas**). Tabla gold: `public.recepcion_camion` (`docs/sql_recepcion_camion.sql`): por recepción guarda OC, proveedor, peso bruto, taras, `cantidad_pallets`, `cantidad_cajas`, `peso_neto` y **`created_at`** → con eso se ajusta IAT empírico de camiones (por hora/proveedor), distribución pallets/camión, cajas/pallet y pesos netos para `SrcMP`, escenarios de `run_experiments` y los 6 paneles de §9. Estado de acceso (2026-10-03): postgres local corriendo pero **sin credencial sancionada** (no hay `.env` vivo; `test_export.xlsx` es un JSON de `Token inválido o expirado`, no datos). Vías de acceso válidas: token API vigente, credencial de solo-lectura, o CSV exportado con columnas `[timestamp, proveedor, pallets, cajas, peso_neto]` (+ ideal: pesajes de línea y declaraciones de producción).

### 11.1 Primer pull real (2026-10-03, API planta 10.1.2.237)

Archivos en `FabricaPaty_SanJorge/datos_trazabilidad/` (+ subcarpeta `fitting_series/` con 15 CSVs/SVGs y `FITTING_EVIDENCIA.md` con veredictos Chi²/K-S verificados contra tablas de cátedra): `productopaletsall` (500 PT, hoy), `palets` (50 de 125.810 totales en servidor), `productos` (4173 master), `proveedores` (319). Hallazgos: PT mean **862.5 kg (sd 153)** / **39.9 cajas (modas 45/40/35)**; recepción de esta mañana 09:11–11:19 UTC, **IAT media 2.6 min / mediana 1.0 min** (oleadas), pallet recepción **829.5 kg (sd 19.8) / 44.7 cajas**, **50/50 congelado** (temp −12..−2 °C → cámara 1001, valida regla <1 °C), 1 proveedor dominante (48/50), estados `Pendiente de alta`. Contraste con supuestos: S11 (IAT 1 s) queda corto vs real (~1–3 min/pallet en pico mañana); batch 1500 kg (S3) vs pallet real ~830 kg ⇒ ~2 pallets por batch. Para fitting serio hace falta paginar los 125.810 (`page/limit` del endpoint) + declaraciones de producción por línea/turno.

### 11.2 Tablero de gestión (repo Gitea interno, rama 05f3e6df 2026-10-02, San Jorge planta_id=1)

Fuente: `http://10.1.2.209:3001` = Gitea (repo privado `Marfrig/SistemaTrazabilidad-Elaborados`); endpoint `GET /api/elaborados/tablero/datos?desde&hasta` (montado en `API/Routes/elaborados.routes.js` → `/tablero`); archivo `datos_trazabilidad/tablero_datos_20261003.json` (4 MB, Sep–Oct 2026). Vistas frontend (18): AnalisisParadas/SkuLinea, Archivos, Auditoria, Calidad, Evolucion, Horaria, Lineas, Maestros, Metas, Paradas, Pedido, Perdidas, Personal, Picado, Placas, Programa, Remanejos (+). Paneles: Capacidad (kg/h estándares), FormadorasLineas, MezcladorasTrenes, Prioridades x línea, PlaneamientoBD, TrenesFormadoras, Combinaciones, Grasa, micro. Tablas: `tablero_datos` (entidades: paradas, capacidades, rendimiento, desperdicios, scrapFlow/scrapEstuches, ausentismo, programas, metas, lineas, picado, grasa, repret, remanejos…) + `tablero_auditoria`.
Números Sep–Oct: **paradas 12.610 min** (FOR 3.812, FLW 1.969, EST BL 1.143, TUN 1.065, EST 938; L3 = 1.324; tipos PT 7.002 / PO 3.915 / PAM 1.060) ⇒ MTBF/MTTR y disponibilidad por equipo/linea/turno; **pallets/día por línea** (L3 = 36,0; L8 = 39,1; L4 = 36,8; total 4.093 en 292 registros) ⇒ validación throughput; **kg/h estándar máx por línea** (L3 = 1.843; L7/L8 = 1.875) ⇒ contrasta con manual formadora (982 kg/h: estándar vs nominal a conciliar); **rendimiento 2.619.909 kg** carne real 01/09–02/10 (sobrepeso/barrido/reproceso incluidos).
