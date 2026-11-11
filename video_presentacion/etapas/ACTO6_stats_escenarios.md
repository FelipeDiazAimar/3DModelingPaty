# ACTO 6 — Stats web + 3 escenarios (voz del equipo, grabada sobre el video)

> Objetivo: mostrar cómo se mide con el modelo y que los escenarios se comparan por intervalos, no por corridas sueltas. No se compara contra valores de la planta. La IA calla. El video se entrega con esta parte muda y el karaoke; el equipo graba encima con el video terminado. Texto completo en `guiones/guion_equipo.md`.
>
> Corrida vigente: camiones reales remuestreados, batch de 1050 kg, lavado de 30 min (`datos_trazabilidad/e1_final/E1_FINAL.md`, primera sección; `estocastico_camiones/`).

## 1. Gráficas a mostrar (orden)

| # | Gráfica | Ruta web | Qué dice | Encuadre |
|---|---|---|---|---|
| 1 | Histogramas y bondad de ajuste: Arribos, Paradas, Pesos | `/estadistica`, pestañas | K-S **rechaza** en los tres casos con α = 0,05: arribos no exponenciales (D = 0,4126 > 0,1943), paradas con cola pesada (D lognormal = 0,1399 > 0,0382), pesos no normales (D = 0,146 > 0,0608) | Zoom a la conclusión de cada pestaña |
| 2 | Welch / transitorio | `/estadistica` | Transitorio de ≈ 4 h según `E1_FINAL.md` | Zoom a la curva y a la línea del transitorio |
| 3 | E1 base | `/escenarios`, botón E1 | 49,1 ± 14,9 pal/día; 42,5 ± 12,6 t/día (IC anchos: la entrada varía de 8 a 80 batches/día) | Zoom a la tarjeta E1 |
| 4 | Cuello E1 | `/escenarios`, panel E1 | Mezcladoras: 60,5 t/día, 75 % ocupadas | Zoom a la capacidad |
| 5 | E2 | `/escenarios`, botón E2 | +9,3 pal/día (+18,9 %), IC [+4,5 ; +14,1]; cuello: desencajado | Zoom a la fila de diferencia |
| 6 | E3 | `/escenarios`, botón E3 | +3,6 contra E2, IC [−0,3 ; +7,5]: incluye el cero | Zoom al IC contra E2 |
| 7 | E4 | `/escenarios`, botón E4 | +0,6 pal/día, IC [−0,0 ; +1,2]: incluye el cero | Zoom a la diferencia |

Componente común: `dashboard/web/components/Chart.tsx` (clic = pantalla completa, `Esc` = salir).

`/estadistica` ya muestra el transitorio de ≈ 4 h, la referencia real de 2,7 pal/h y el cuello vigente.

## 2. Escenarios sobre la base E1

Base (`E1_FINAL.md`, `public/e1/escenarios.json`): 10 réplicas de 24 h, arranque vacío, números aleatorios comunes (streams 60–87 de fallas, 90 y 94–99 de entrada, desplazados por réplica), t(0,975; 9 gl) = 2,262. Los IC son anchos porque la entrada de MP varía de 8 a 80 batches por día; la diferencia pareada cancela parte de esa variación.

| Esc | Qué cambia | Pal/día | t/día | Diferencia (IC 95 %) | Cuello |
|---|---|---|---|---|---|
| **E1 Base** | Formadoras 982 kg/h, camiones reales (≈ 55 batches/día), batch 1050 kg, lavado 30 min | 49,1 | 42,5 | — | Mezcladoras, 60,5 t/día |
| **E2 Formadoras rápidas** | Formadoras a 1843 kg/h (separación 3,27 → 1,554 m) | 58,4 | 50,4 | +9,3 [+4,5 ; +14,1] contra E1 | Desencajado, 74,7 t/día |
| **E3 Más MP + E2** | E2 y 1,5× la materia prima | 62,0 | 53,5 | +3,6 [−0,3 ; +7,5] contra E2 (incluye el cero) | Desencajado, 75,2 t/día |
| **E4 Batch 1200 kg** | 8 cargas (1200 kg) contra 7 cargas (1050 kg), lavado de 30 min | 49,7 | 42,9 | +0,6 [−0,0 ; +1,2] contra E1 (incluye el cero) | Mezcladoras, 61,6 t/día |

Regla de lectura (ET6 p.36): comparar **intervalos, no corridas**. Si el IC de la diferencia incluye el cero, no es significativo.

E5 (MTTR ×1,25) no entra al video: se midió con el modelo sin lavado y no es comparable con E1.

## 3. Reparto (total 5:00)

| Bloque | Quién | Tiempo | Diapositivas |
|---|---|---|---|
| A. Validación estadística | Jeremias Micheloud | 1:30 | D32–D33 |
| B. Base y E2 | Felipe Diaz Aimar | 1:30 | D34–D35 |
| C. E3, E4 y cierre | Matias Buffa | 2:00 | D36–D38 |

## 4. Karaoke

- Pista muda con el texto de `guion_equipo.md`, blanco que se barre en rojo `#ff1f3d`, máximo 2 líneas.
- Sincronizado con la grabación de pantalla de cada bloque; drift menor a 300 ms.
- Sin subtítulo cuando la frase ya está escrita en la pantalla de la web.

## 5. Voz IA

Muteada durante todo el acto. Ningún texto de IA se graba en este tramo.
