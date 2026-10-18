> **REEMPLAZADO:** este E1 se hizo sobre una copia vieja de la línea 3 (`planta_sanjorge_v1_8.fsm`). El E1 vigente, sobre el modelo final `PLANTASJ.fsm` y con 10 réplicas, está en `../e1_final/E1_FINAL.md`.

# E1 base 24 h — corrida real headless (1 réplica, semilla default)

Fecha: 2026-10-17. Modelo: copia de `planta_sanjorge_v1_8.fsm` (65 objetos).
Método: backend Python headless vía MCP (`flexsim_open_model` → `flexsim_reset` →
48× `flexsim_run_to_time` paso 1800 s → `flexsim_get_statistics`). Sin ventana
(el .fsm no trae comandos `mcp_agent/mcp_start`; ver §5). Evidencia:
`datos_trazabilidad/e1_run/live_24h.csv` (2160 filas) + `summary_24h.json`.

## Throughput L3 (terminante 24 h, Warmup 0 — ET6 p.31)

| Indicador | Real (tablero) | Sim (1 réplica) | Error % | ¿Real∈IC? |
|---|---|---|---|---|
| Pallets L3/día (SinkEXP in) | 36,0 (IC [31,2;40,8]) | **285** | **+691,7 %** | No (sin IC; n=1) |
| Atendidos/h | 1,50 | 11,88 | +691,7 % | No |
| Ref SUPUESTOS 24 h (100 PT) | 100 | 285 | +185 % | No |

**Veredicto: NO VALIDA.** Causas (coherentes con CONTEXTO "tasas en calibración"):
1. `SrcMP` genera 3843 u/24 h vs ref 60 MP (T1 determinístico sin calibrar; S11 IAT 1 s vs real 2,62/1,03 min).
2. `AlmMP` acumula sin cota: in 2843 / out 1307, `content.average` 1504 (planta nunca en régimen → warm-up global no aplica; E1 debe ser terminante).
3. `DesL3` solo toma 307 de 1307 disponibles; línea estable a 12,00 u/h desde t=1 h (Welch plano, MA10=12,0; sin transitorio a resolución 30 min porque no hay fallas cargadas).
4. `Split/Unpack Quantity` de Separators pendiente (batch→burgers) + rama B ociosa (`EnvL3B`=0, todo por `EnvL3A`).
5. Unidad sin definir: si 1 u = 1 pallet, sobra 7,9×; si 1 u = 1 caja, faltan 25× (7250 ref). Definir unidad antes de recalibrar.

## Conservación (ET5 p.15 / ET6 p.35)
- Línea: `DesL3.in` 307 ≈ `SinkEXP.in` 285 + WIP ~22 → cierra (content Des/Pic/Mix/Tun ≈1 c/u + colas).
- Planta: `SrcMP.out` 3843 ≠ `SinkEXP.in` 285 + `AlmMP.content` ~1536 + resto WIP → fuga aparente por splits no trazados + `QRecep` (no muestreada). Repetir con todas las colas muestreadas.

## Welch (tasa SinkEXP in por paso 30 min + MA10)
Plana en 12,00 u/h de t=1,0 h a 24,0 h. Sin período de calentamiento observable:
modelo determinístico sin paros → E1-C con warm-up 2,5 h no aporta; usar E1-T.

## Bloqueadores para 10 réplicas + IC95%
1. El .fsm no contiene `mcp_agent/mcp_start/mcp_exec` (verificado binario: 0 ocurrencias) → la ventana nunca se conecta → `flexsim_run_experiments` aborta ("needs the FlexSim window").
2. Backend Python ignora semillas → réplicas headless idénticas → IC=0 deshonesto.
3. Salida: trasplantar UserCommands del template (`bridge/mcp_template.fsm`) al modelo vía ventana FlexSim con el modelo abierto (una sesión GUI), o correr Experimenter nativo y exportar `summary.csv`. Etiquetas `Sin corrida` se mantienen hasta entonces.
