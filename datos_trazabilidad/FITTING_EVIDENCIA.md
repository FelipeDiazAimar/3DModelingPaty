# FITTING EVIDENCIA — datos reales trazabilidad (NotebookLM)
Generado 2026-10-03. Fuentes: `datos_trazabilidad/*.json` (API planta + tablero Sep–Oct 2026). Tests E.T.2: Chi² (bins equiprobables) y Kolmogorov–Smirnov (Dcrit=1.36/√n, α=0.05).

## A. IAT recepción (n=49, mañana 2026-10-03)
- media=2.62 min, mediana=1.03, CV=3.42 (CV≠1 ⇒ ráfagas, mejor empírica)
- Chi² exp: {'k': 8, 'gl': 6, 'chi2': 0.143, 'crit': 12.592, 'pasa': True, 'media': 2.617, 'obs': [6, 6, 6, 6, 6, 6, 6, 7]} | K-S exp: {'dist': 'exponencial(media=2.62)', 'n': 49, 'D': 0.4126, 'Dcrit': 0.1943, 'pasa': False}
- VEREDICTO: exponencial RECHAZADA por K-S (D=0.4126>0.1943) y CV=3.42>>1: llegadas en RAFAGAS. Usar tabla EMPIRICA por hora (9/10/11) o hiper-exponencial, NO exponencial simple.
- Propuesta FlexSim `SrcMP`: Empirical por hora del CSV `iat_recepcion_min.csv`. n=49 chico: re-ajustar con 125k paginados.

## B. Paros (n=1278 eventos tablero)
- Acuerdo minutos vs inicio/fin ±5min: 99.1% (si bajo, `minutos` es acumulado, no duración del intervalo).
- Duraciones: media=10.0 mediana=6.0 min. K-S lognormal: {'dist': 'lognormal', 'n': 1267, 'D': 0.1399, 'Dcrit': 0.0382, 'pasa': False} | K-S exponencial: {'dist': 'exponencial', 'n': 1267, 'D': 0.2097, 'Dcrit': 0.0382, 'pasa': False}
- MTBF/MTTR por equipo (min, ventana 33 dias Sep01-Oct03, MTBF bajo SUPUESTO 3 turnos continuo): {'': {'eventos': 13, 'min_total': 31.0, 'MTTR_media': 7.8, 'MTBF_sup3turnos': 3655.4}, 'AG': {'eventos': 3, 'min_total': 31.0, 'MTTR_media': 10.3, 'MTBF_sup3turnos': 15840.0}, 'ALM': {'eventos': 25, 'min_total': 159.0, 'MTTR_media': 6.4, 'MTBF_sup3turnos': 1900.8}, 'APS': {'eventos': 88, 'min_total': 659.0, 'MTTR_media': 7.5, 'MTBF_sup3turnos': 540.0}, 'CAL': {'eventos': 6, 'min_total': 66.0, 'MTTR_media': 11.0, 'MTBF_sup3turnos': 7920.0}, 'CAM': {'eventos': 18, 'min_total': 125.0, 'MTTR_media': 6.9, 'MTBF_sup3turnos': 2640.0}, 'CTA': {'eventos': 8, 'min_total': 81.0, 'MTTR_media': 10.1, 'MTBF_sup3turnos': 5940.0}, 'EE': {'eventos': 21, 'min_total': 245.0, 'MTTR_media': 11.7, 'MTBF_sup3turnos': 2262.9}, 'EMP': {'eventos': 8, 'min_total': 57.0, 'MTTR_media': 7.1, 'MTBF_sup3turnos': 5940.0}, 'ENC': {'eventos': 1, 'min_total': 5.0, 'MTTR_media': 5.0, 'MTBF_sup3turnos': 47520.0}, 'EST': {'eventos': 76, 'min_total': 938.0, 'MTTR_media': 12.3, 'MTBF_sup3turnos': 625.3}, 'EST BL': {'eventos': 45, 'min_total': 1143.0, 'MTTR_media': 25.4, 'MTBF_sup3turnos': 1056.0}, 'EST MB': {'eventos': 25, 'min_total': 298.0, 'MTTR_media': 11.9, 'MTBF_sup3turnos': 1900.8}, 'FLW': {'eventos': 295, 'min_total': 1969.0, 'MTTR_media': 6.7, 'MTBF_sup3turnos': 161.1}, 'FOR': {'eventos': 365, 'min_total': 3812.2, 'MTTR_media': 10.5, 'MTBF_sup3turnos': 130.2}, 'FRI': {'eventos': 65, 'min_total': 714.0, 'MTTR_media': 11.0, 'MTBF_sup3turnos': 731.1}, 'GTE': {'eventos': 6, 'min_total': 53.0, 'MTTR_media': 8.8, 'MTBF_sup3turnos': 7920.0}, 'P&D': {'eventos': 7, 'min_total': 79.0, 'MTTR_media': 11.3, 'MTBF_sup3turnos': 6788.6}, 'PER': {'eventos': 30, 'min_total': 298.0, 'MTTR_media': 9.9, 'MTBF_sup3turnos': 1584.0}, 'PIC': {'eventos': 55, 'min_total': 609.0, 'MTTR_media': 11.3, 'MTBF_sup3turnos': 864.0}, 'SER': {'eventos': 10, 'min_total': 73.0, 'MTTR_media': 7.3, 'MTBF_sup3turnos': 4752.0}, 'SSMA': {'eventos': 1, 'min_total': 100.0, 'MTTR_media': 100.0, 'MTBF_sup3turnos': 47520.0}, 'TUN': {'eventos': 107, 'min_total': 1065.0, 'MTTR_media': 10.0, 'MTBF_sup3turnos': 444.1}}
- L3 (min, ventana 33 dias Sep01-Oct03, MTBF bajo SUPUESTO 3 turnos continuo): {'AG': {'eventos': 1, 'min_total': 4.0, 'MTBF_sup3turnos': 47520.0}, 'ALM': {'eventos': 2, 'min_total': 13.0, 'MTBF_sup3turnos': 23760.0}, 'APS': {'eventos': 13, 'min_total': 155.0, 'MTBF_sup3turnos': 3655.4}, 'EE': {'eventos': 2, 'min_total': 13.0, 'MTBF_sup3turnos': 23760.0}, 'EST': {'eventos': 26, 'min_total': 338.0, 'MTBF_sup3turnos': 1827.7}, 'EST BL': {'eventos': 1, 'min_total': 60.0, 'MTBF_sup3turnos': 47520.0}, 'FLW': {'eventos': 10, 'min_total': 50.0, 'MTBF_sup3turnos': 4752.0}, 'FOR': {'eventos': 67, 'min_total': 412.0, 'MTBF_sup3turnos': 709.3}, 'FRI': {'eventos': 2, 'min_total': 7.0, 'MTBF_sup3turnos': 23760.0}, 'GTE': {'eventos': 1, 'min_total': 7.0, 'MTBF_sup3turnos': 47520.0}, 'P&D': {'eventos': 1, 'min_total': 3.0, 'MTBF_sup3turnos': 47520.0}, 'PER': {'eventos': 3, 'min_total': 27.0, 'MTBF_sup3turnos': 15840.0}, 'PIC': {'eventos': 1, 'min_total': 79.0, 'MTBF_sup3turnos': 47520.0}, 'SER': {'eventos': 2, 'min_total': 9.0, 'MTBF_sup3turnos': 23760.0}, 'TUN': {'eventos': 17, 'min_total': 147.0, 'MTBF_sup3turnos': 2795.3}}
- Propuesta FlexSim: MTTR lognormal por equipo; MTBF = minutos operativos del período/eventos (declarar supuesto 3 turnos continuo). Ver CSV `paros_eventos.csv`.

## C. Pesos PT (n=500)
- media=862.5 sd=153.4. Chi² normal: {'k': 8, 'gl': 5, 'chi2': 243.465, 'crit': 11.07, 'pasa': False, 'mu': 862.452, 'sd': 153.448, 'obs': [63, 39, 71, 77, 56, 68, 57, 69], 'esp': [115.8, 51.7, 36.1, 24.4, 21.7, 77.1, 64.5, 105.9]} | K-S normal: {'dist': 'normal', 'n': 500, 'D': 0.146, 'Dcrit': 0.0608, 'pasa': False}
- VEREDICTO: normal RECHAZADA (mezcla por SKU, ver obs bimodal). Usar tabla EMPIRICA `cajas_PT_pmf.csv` + pesos por familia/SKU (`mezcla_pesos` de otro análisis), NO normal única.
- Cajas/pallet PMF empírica: {8: 0.002, 12: 0.002, 17: 0.026, 18: 0.002, 19: 0.002, 20: 0.002, 22: 0.004, 25: 0.004} (usar tabla Empirical en FlexSim, NO normal: discreta multimodal).

## D. Capacidades estándar kg/h máx por línea: {1: 1260.0, 2: 1613.0, 3: 1843.0, 4: 1664.0, 5: 1786.0, 6: 1786.0, 7: 1875.0, 8: 1875.0}
## E. Pallets/día medios por línea: {1: 18.5, 2: 23.2, 3: 36.0, 4: 36.8, 5: 20.4, 6: 19.5, 7: 25.8, 8: 39.1}
Validación modelo: correr 1 día simulado y comparar pallets L3 vs este benchmark + paradas vs tablero.

## F. Notas metodológicas cátedra (ET2 p.20 / ET6 p.15-16,21-24)
- Chi²: `χ²₀=Σ(Oi-Ei)²/Ei`, `gl=k-1-p` cuando λ,μ,σ se estiman de la muestra (ET6 p.16). ET2 puro usa `gl=k-1`.
  IAT exp: k=8 p=1 gl=6 crit=12.592 (fila ET2 pura: gl=7 crit=14.067, χ²₀=0.143 pasa igual).
  Pesos normal: k=8 p=2 gl=5 crit=11.07 (fila ET2 pura: gl=7 crit=14.067, χ²₀=243.465 rechaza igual).
- Regla E≥5 por clase (ET2 p.20, ET6 p.16): si falla, agrupar. Los 6 cortes del dashboard son SOLO visualización;
  el test validado usa k=8 equiprobables. IAT teo=1.1<5 en display no es prueba Chi².
- K-S bilateral ET6 p.15 (máx de i/n−F y F−(i−1)/n) vs simplificada ET2 p.24. Dcrit=1.36/√n (α=0.05).
- Muestra IAT chica: n=49 (50 pallets de total:125810, mañana 2026-10-03 09:11–11:19Z). Estratos hora
  (9h n=25 media 1.46 / 10h n=11 media 6.56 / 11h n=13 media 1.51): re-estratificar y paginar 125k antes de Empirical definitiva.
- Independencia (Corridas ET2 p.24-25, |Z₀|<1.96): IAT vs media Z₀=0.16 no rechaza (n1=4 débil por outliers);
  pesos vs media Z rechaza por orden agrupado SKU (no temporal) → refuerza mezcla estratificada, pendiente re-test temporal.
- Fichas ET6 p.24: IAT→empírica por hora (iat_empirica_hora.csv); paros→MTTR lognormal por equipo + MTBF=min operativos/eventos
  (supuesto 3 turnos continuo 33d=47520min); pesos→empírica cajas_PT_pmf + mezcla mezcla_pesos_sku (NO normal única).
