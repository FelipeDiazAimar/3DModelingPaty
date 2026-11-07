# ACTO 6 — Stats web + 3 escenarios (voz equipo en vivo)

> Objetivo: mostrar que el modelo está validado estadísticamente y que los escenarios se comparan por intervalos, no por corridas sueltas. Todo lo dice el equipo en vivo; Claude callado.

## 1. Gráficas a explicar en vivo (orden)

| # | Gráfica | Ruta web | Qué dice (1 frase) | Zoom en vivo |
|---|---|---|---|---|
| 1 | Tasa estable post-warmup + meta planta | `/estadistica` (arriba; `WARMUP_H=2,5h`, `META 3 pal/h`) | Tras 2,5 h la tasa se aplana y sostiene ~36 pal/día/línea | Zoom eje T en 0–5 h para mostrar transitorio vs plano; fullscreen con click (Chart.tsx: `thin()` diezma a ~700 pts, `Esc` sale del fullscreen) |
| 2 | Utilización + estados máquina | `/estadistica` (medio; `MACHINE_STATES: proc/blocked/starved/down/idle`) | Formadora ~alta pero no 100 %; `starved` avisa que el cuello migra a recepción en E2 | Hover tooltip oscuro por eje; señalar `starved` vs `blocked` con paleta `PALETTE` (rojo/azul/verde) |
| 3 | ECDF / Boxplot / tests ajuste (KS, Chi²) | `/estadistica` (abajo; `lib/stats.ts: ecdf, boxplotStats, ksTable, chi2Table`) | La variabilidad entre réplicas es chica y el IC95 % con t=2,262 (9 gl) es angosto | Abrir tabla KS/Chi², leer solo p-valor y conclusión "no se rechaza" — no derivar fórmulas en vivo |
| 4 | Tabla comparativa E1/E2/E3 + IC diferencia pareada | `/escenarios` (tabla `Stat {media, desv, h, ic_inf, ic_sup}`) | E2 suma poco y E3 no mueve la aguja (ver punto 2); la gracia es el IC del **delta**, no el valor puntual | Zoom fila `dif_pallets` / `dif_cajas`: mostrar si el IC incluye el cero o no |
| 5 | Tope MP (texto fijo) | `/escenarios` (`tope_mp.texto`) | 16 pal × 1500 kg c/8 h = 72 t/día: techo que explica por qué E2 rinde poco | Leer el tag tal cual, sin improvisar números |

Componente común: `dashboard/web/components/Chart.tsx` (ECharts, `thin()` + `PALETTE`, click = fullscreen, `Esc` = salir).

## 2. 3 escenarios sobre base E1

Base E1 (`PLAN_E1_VALIDACION.md` §5 + `analizar_escenarios.py:22-26`): 10 réplicas, CRN (streams 60-87 desplazados), Stop/Warmup idénticos, t(0,975;9 gl)=2,262.

| Esc | Qué cambia | Resultado | Archivos |
|---|---|---|---|
| **E1 Base** | Fallas tablero, formadoras a 982 kg/h (nominal vs techo 1843) | Referencia: ~X pal/día, IC95 % angosto | `datos_trazabilidad/e1_final/raw_replicas.txt`, `replicas.csv`, `summary_e1.json`, `E1_FINAL.md` |
| **E2 Más dotación** | Formadoras a 1843 kg/h (gap bandejas 3,27 → 1,554 m) | **+2,5 pal/día (+2,8 %), IC sin cero = real pero chico**; cámaras MP vacías → cuello pasa a recepción, falta MP | `raw_e2.txt` → `analizar_escenarios.py` → `summary_escenarios.json` (+ copia `dashboard/web/public/e1/`) |
| **E3 Estrés fallas** | MTTR ×1,25 en formadoras y túneles (FOR 10,5→13,1 min; TUN 8,6→10,8 min) | **−6,5 cajas/día sobre ~13.100, IC incluye cero = sin cambio**; acumuladores absorben paros 10-20 min | `raw_e3.txt` → mismo pipeline; texto de lectura en `dashboard/web/app/escenarios/page.tsx:17-20 (LECTURA)` |

Regla de lectura (ET6 p.36): comparar **intervalos, no corridas**; si IC del delta incluye cero → "no significativo".

## 3. Reparto 3 compañeros + tiempos (total ~6-7 min)

| Bloque | Quién | Tiempo | Guion |
|---|---|---|---|
| A. Stats web | Compa 1 | 2:00 | Abre `/estadistica`, muestra warmup 2,5 h + meta 3 pal/h + estados. Cierra con "modelo estable y validado". |
| B. Escenarios E1/E2 | Compa 2 | 2:00 | Abre `/escenarios`, lee fila E2 y `tope_mp`. Cierra con "más velocidad sin más MP no rinde". |
| C. Escenario E3 + cierre | Compa 3 | 2:00-2:30 | Lee fila E3 + `LECTURA.E3`. Cierra con "sistema robusto a peor mantenimiento; intervalos, no corridas". |
| Colchón preguntas | — | 0:30 | Solo si el docente pregunta; si no, corte seco al Acto 7. |

Cada uno maneja su propio mouse/scroll. Nadie lee párrafos: 1 gráfica = 2 frases máx.

## 4. Teleprompter karaoke — regla

- **Cuándo se activa:** solo si alguien se traba >3 s o se salta una cifra (ej. "+2,5", "72 t/día", "IC incluye cero"). El operador muestra **máx 1 línea** (la frase de "Qué dice" de la tabla §1 o `LECTURA.E2/E3`).
- **Anti-dup:** una sola pantalla con teleprompter a la vez; los otros dos miran cámara/web, nunca leen en voz alta lo mismo. Prohibido repetir la línea del compañero: si ya se dijo, seguir a la gráfica siguiente.
- **Formato línea:** `GRÁFICA → FRASE → SIGUIENTE` (ej. `E2 → +2,8 % real pero techo MP → pasar a E3`). Sin párrafos, sin código.

## 5. Cuándo se calla Claude

- **Durante todo el Acto 6:** voz 100 % equipo en vivo. Claude no narra, no lee cifras, no explica stats.
- **Claude solo aparece:** si la web no carga (plan B: abrir `summary_escenarios.json` / `E1_FINAL.md` local) o si el docente pide un dato fuera de guion → el operador lo busca en silencio y lo pasa por teleprompter (1 línea), sin voz sintética.
- **Fuera de eso:** micrófono Claude muteado; su texto nunca se graba en el video.
