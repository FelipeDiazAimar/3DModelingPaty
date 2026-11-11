# ACTO 4 — Quiebre + MCP propio (voz IA)

Duración sugerida: 60–80 s. Ritmo: golpe de quiebre (primera corrida, número suelto) → ingeniería → demo en vivo. La IA habla todo el acto.

> Conteo verificado 2026-11-07: **73 `@mcp.tool`** en `mcp_server/flexsim_mcp.py` (grep `@mcp.tool` + `async def flexsim_`, ambos dan 73).
> Ojo: el PROMPT dice "82 tools" y `AGENTE_FLEXSIM.md` dice 69 — ambos desactualizados. En diapositiva usar **73**.

## 0. Qué es un MCP (explicación para la cátedra, va en diapositiva)

- **Definición simple (1 línea):** un MCP (*Model Context Protocol*) es un estándar abierto que le da a la IA *manos*: herramientas tipadas para leer y operar un programa externo en vivo, en vez de solo hablar de él.
- **Analogía para decir en voz alta:** "Si el chat es la IA hablando, el MCP es la IA con las manos dentro de FlexSim: abre, toca, mide y construye."
- **Por qué importa acá:** FlexSim no tenía MCP oficial ni comunitario. Sin puente, la IA solo podía *opinar* sobre capturas. Con el nuestro, *opera* el modelo: corre réplicas, lee sensores, crea objetos y arma dashboards, todo verificable en pantalla.
- **En diapositiva:** 3 bloques animados por beat — 1) "IA que habla" (chat, gris) vs "IA que opera" (brazo/herramientas, naranja); 2) sigla MCP + "estándar abierto"; 3) "0 MCP de FlexSim existían → construimos el primero".

## 1. Historia del quiebre (4 bullets)

- El tablero HTML nativo de FlexSim (`Tools/TableroHTML`, 107 KB) ya medía solo: producción vs meta, colas, paradas, kg/h. Para *mostrar* alcanzaba; para *validar* no.
- La primera corrida, sin lavado y con todo constante, dio **89,4 pallets/día**: un solo número. Un HTML estático no puede repreguntar, re-correr réplicas ni medir intervalos.
- No existía un MCP oficial de FlexSim que dejara a la IA operar el modelo. Decisión de vara alta: no quedarse con el HTML básico y construir el puente propio.
- Nace el MCP del equipo (fork/base `github.com/FelipeDiazAimar/MCP_Flexsim`): la IA crea, corre, mide y corrige FlexSim en vivo. Con él se corrieron las 10 réplicas por escenario. Con el lavado de 30 min por batch (dato de planta), camiones reales remuestreados, peso de pallets y ritmo de formado aleatorios, E1 da 49,1 ± 14,9 pallets/día y 42,5 ± 12,6 t/día (los IC son anchos porque la entrada varía de 8 a 80 batches por día), y el cuello resulta ser las mezcladoras (60,5 t/día), no la formadora. No se compara contra valores de la planta.

## 2. Ingeniería del MCP (cómo funciona)

- **Protocolo agente ↔ servidor:** MCP por **stdio** (JSON-RPC por stdin/stdout). Comando: `uv --directory <repo> run mcp_server/flexsim_mcp.py`. Clientes: `.mcp.json` (Claude Code) y `opencode.json` (OpenCode, timeout 180 s).
- **Conexión servidor ↔ FlexSim:** la ventana ejecuta `mcp_start()` al abrir la plantilla y habla por **`127.0.0.1:8765`**. Solo un servidor puede atender ese puerto (ver problema "dos servidores en el puerto" en doc 07).
- **Cadena completa:** agente → stdio → `flexsim_mcp.py` (FastMCP) → FlexSimPy (SDK Python, requiere compilación C++ VS2022) → COM/IPC → ventana FlexSim, que ejecuta FlexScript y devuelve texto.
- **Regla de oro:** nunca guardar sobre `bridge/mcp_template.fsm`; siempre trabajar sobre copia (`flexsim_prepare_gui_model`).

## Archivos clave (solo rutas)

- `Simulacion/mcp_flexsim/mcp_server/flexsim_mcp.py` — servidor FastMCP, las 73 tools
- `Simulacion/mcp_flexsim/bridge/mcp_template.fsm` — plantilla con `mcp_start()` (no pisar)
- `Simulacion/mcp_flexsim/opencode.json` + `Simulacion/mcp_flexsim_opencode/opencode.json` — config cliente OpenCode
- `Simulacion/mcp_flexsim/AGENTE_FLEXSIM.md` — guía verificada del agente (v3)
- `Simulacion/mcp_flexsim/depends/FlexSimPy/` — submódulo SDK (compilar con `utility/build_automation.py --install`)
- `Simulacion/mcp_flexsim/utility/doctor.py` — verifica entorno (`--live`)
- `Simulacion/mcp_flexsim/tests/integration/test_mcp_client.py` — smoke tests de tools
- `FabricaPaty_SanJorge/documentacion/07_flexsim_mcp.md` — estado MCP en este proyecto
- `FabricaPaty_SanJorge/dashboard/flexsim/*.fls` — código FlexScript que el MCP puede inyectar en el modelo

## 3. Capacidades / tools (73 verificadas, por categoría)

| Categoría | Cant. | Tools `flexsim_*` |
|---|---|---|
| Ciclo de vida y corrida | 14 | `open_model`, `gui_status`, `prepare_gui_model`, `reset`, `run`, `run_to_time`, `stop`, `get_time`, `step`, `new_model`, `save_model`, `save_model_as`, `close_model`, `clone_model` |
| FlexScript y árbol de nodos | 12 | `get_parameter`, `set_parameter`, `ensure_parameter`, `get_performance_measure`, `evaluate_node`, `bridge_status`, `execute_script`, `read_console`, `get_node_value`, `set_node_value`, `list_tree`, `inspect_model` |
| Construcción del modelo | 11 | `create_objects`, `connect_objects`, `disconnect_objects`, `layout_line`, `add_conveyor_leg`, `create_any`, `library_list`, `import_shape`, `apply_shapes`, `attach_resource`, `set_distribution` |
| Tablas, stats y experimentos | 10 | `table_write`, `table_read`, `table_from_snapshot`, `get_statistics`, `diagnose`, `export_results`, `run_experiments`, `experimenter_status`, `experimenter_run`, `experiment_plan` |
| Dashboards, charts y cámara | 7 | `dashboard_create`, `dashboard_list`, `chart_inspect`, `chart_bind_stat`, `chart_snapshot`, `set_view`, `screenshot` |
| ProcessFlow y lógica | 6 | `processflow_ping`, `processflow_inventory`, `pf_add_activity`, `pf_connect`, `pf_attach`, `pf_run_tokens` |
| AGV y transporte | 7 | `add_agv_loop`, `link_transporter`, `agv_connect`, `agv_link_path`, `agv_route`, `agv_deliver`, `run_transport` |
| Fluidos, personas y dominio | 6 | `fluid_tank`, `fluid_level`, `person_create`, `collector_create`, `collector_record`, `paint_meat` |
| **Total** | **73** | |

## 4. Qué mostrar en diapositiva animada

1. **Placa de quiebre (5 s):** corte seco desde Acto 3, fondo negro + "Primera corrida: 89,4 pallets/día" en rojo (histórico: todo constante, sin lavado). Boom en el beat.
2. **"No nos quedamos con el HTML básico" (5 s):** captura del tablero HTML achicándose / tachado visual, texto vara alta.
3. **Diagrama ingeniería (15 s, build por capas):** `Agente IA → stdio → flexsim_mcp.py → FlexSimPy → FlexSim (127.0.0.1:8765)`. Cada capa entra en un beat; resaltar puerto al final. Terminal con `uv run mcp_server/flexsim_mcp.py` tipeándose (bloque `code-typing` del registry).
4. **Demo 73 tools (25–30 s, captura real o mock):** tres viñetas en secuencia — a) telemetría en vivo (`run_to_time` + `get_statistics`, curva que crece); b) crear+conectar objetos en el 3D (`create_objects`, `connect_objects`); c) dashboard creado por la IA (`dashboard_create`). Contador animado 0→73 (`apple-money-count`-style).
5. **Resultado del modelo (12 s):** lavado de 30 min, camiones, pesos y ritmo de formado aleatorios → 49,1 ± 14,9 pallets/día y 42,5 ± 12,6 t/día, con intervalos. Sin comparación contra la planta.
6. **Veredicto (8 s):** `film/compositions/s04-veredicto.html`: se tacha "Formadora", entra "Mezcladoras" con las barras 60,5 / 74,7 / 87,0 t/día.
7. **Cierre-gancho (3 s):** whip-pan al Acto 5 (web inmersiva).

## 5. Bullets guion voz IA (leer directo)

- "Ochenta y nueve pallets por día, un solo número. Un HTML lindo no te dice cuánto varía."
- "No nos quedamos con el HTML básico. La vara era alta: queríamos preguntarle al modelo, no solo mirarlo."
- "No existía un puente oficial. Así que construimos el nuestro: un servidor MCP que le da a la IA setenta y tres herramientas dentro de FlexSim."
- "La IA abre el modelo, lo corre, lee cada máquina, crea objetos, conecta cintas y arma dashboards. Todo en vivo, todo verificable."
- "Con ese puente corrimos diez réplicas por escenario. Faltaba un dato de planta: treinta minutos de lavado por batch. Con el lavado y la entrada de camiones reales, el modelo da cuarenta y dos coma cinco toneladas por día, con intervalos de confianza anchos."
- "Y el cuello no era la formadora. Eran las mezcladoras."
- "Con el modelo validado, lo llevamos a la web. Miren."
