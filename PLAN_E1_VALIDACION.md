# Plan E1 — Validación L3 vs tablero (ET6 p.25-38)

## 1. Marcos (ET6 p.26-27,31)
| Marco | Stop | Warmup | Uso |
|---|---|---|---|
| **E1-T primario (terminante)** | 24 h = 86400 s | **0** (arranque vacío real, admite cola final) | Comparar vs tablero pallets L3/día |
| **E1-C robustez (no terminante)** | 48 h = 172800 s | **9000 s (2,5 h)** a verificar por Welch | Medir tasa estable post-transitorio |

Traza Welch exigible: 5-10 pilotos, WIP/espera cada 30 min + media móvil; marcar 2,5 h solo si la curva se aplana.

## 2. KPIs por réplica (post-warmup en E1-C)
- `pallets L3/día = SinkEXP.input / días_medidos` (meta tablero: **36,0** pal/día L3, IC real [31,2;40,8])
- `cajas/línea/día = EnvL3A/B.output`
- `espera media Wq = staytime.average (QRecep+QPalL3)`, **`P95`** (Statistics Collector; media sola oculta picos, ET6 p.36)
- `utilización formadora = busy/(Stop−Warmup)` (conciliar nominal 982 vs estándar 1843 kg/h como nominal vs techo, no recalibrar)
- `L = content.average total, Lq = content.average colas, λ = throughput/h` → verificar `L=λW`, `L=Lq+ρ` por dos vías (ET5 p.15)

## 3. Piloto 10 réplicas + IC95% (ET6 p.25,27-29; TP Parte C)
- Experimenter: `Replications per Scenario = 10`, `Seeds 1..10` documentadas.
- Independencia intra-escenario (streams desvinculados) + **CRN inter-escenarios** (misma semilla k en base/sensibilidad, ET6 p.30).
- Por KPI: `X̄=ΣXi/n`, `S`, `H0=t0.975,9·S/√10` (t=2,262), `h_rel=H0/X̄`. Exigencia informe `h_rel≤2%` (más dura que 15% ET6 p.28).
- Si no cumple: `n≈10·(H0/h_abs)²` total. Ej: S=3,5 pal/día → H0=2,50 → n≈121: avisar que 2% en throughput es caro; pactar `h≤5%` o reportar n requerido.
- Apagar `[SIN CORRIDA]` solo con `export_results summary.csv + manifest + live.csv` existentes.

## 4. Campo vs modelo (ET6 p.32-36; TP Partes B,D)
| Indicador | Campo L3 | Modelo E1 X̄±H0 (n=10) | Error % | ¿Real∈IC? |
|---|---|---|---|---|
| Atendidos/h (pal/h) | 1,50 (=36/24) | … | … | … |
| Pallets L3/día | 36,0 (IC [31,2;40,8]) | … | … | … |
| Espera media cola (min) | [SIN DATO] — medir | … | — | — |
| P95 espera (min) | [SIN DATO] — si modelo P95<<campo, no representa picos | … | — | — |
| Utilización formadora | ref 78% TP / nominal — conciliar 982 vs 1843 | … | … | … |
| Lq / L / λ (Little) | — | …/…/… | check `L≈λW` | — |

Regla TP-D: si medida principal cae fuera del IC y error >5-10%, **no avanzar** sin revisar (ET6 p.36, checklist p.38).

## 5. Sensibilidad (ET6 p.36-37; TP Parte E) — T1/T2/T3 fijos
- **S0 base E1** (paros empíricos L3 tal cual)
- **S1 estrés Pareto** +25% MTTR FOR+TUN (FOR 10,5→13,1 min; TUN 8,6→10,8 min)
- **S2 changeover** 30 min y 60 min/día L3 (2,1% y 4,2% disponibilidad menos)
- CRN (mismas 10 semillas), Stop/Warmup idénticos; comparar **intervalos, no corridas**; tornado Δ pallets/día y Δ espera vs S0.
