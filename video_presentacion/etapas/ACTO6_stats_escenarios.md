# ACTO 6 — Stats web + 3 escenarios (voz del equipo, grabada sobre el video)

> Objetivo: mostrar que el modelo está validado y que los escenarios se comparan por intervalos, no por corridas sueltas. La IA calla. El video se entrega con esta parte muda y el karaoke; el equipo graba encima con el video terminado. Texto completo en `guiones/guion_equipo.md`.
>
> Corrida vigente: lavado de 30 min por batch (`datos_trazabilidad/e1_final/E1_FINAL.md`, última sección).

## 1. Gráficas a mostrar (orden)

| # | Gráfica | Ruta web | Qué dice | Encuadre |
|---|---|---|---|---|
| 1 | Histogramas y bondad de ajuste: Arribos, Paradas, Pesos | `/estadistica`, pestañas | K-S **rechaza** en los tres casos con α = 0,05: arribos no exponenciales (D = 0,4126 > 0,1943), paradas con cola pesada (D lognormal = 0,1399 > 0,0382), pesos no normales (D = 0,146 > 0,0608) | Zoom a la conclusión de cada pestaña |
| 2 | Welch / transitorio | `/estadistica` | Transitorio de ≈ 4 h según `E1_FINAL.md` | Zoom a la curva y a la línea del transitorio |
| 3 | E1 base y validación | `/escenarios`, botón E1 | 63,2 ± 1,2 pal/día; 54,8 t/día contra 56,0 reales (−2,1 %) y 64,9 pallets reales (−2,6 %) | Zoom a la tarjeta E1 |
| 4 | Cuello E1 | `/escenarios`, panel E1 | Mezcladoras: 65,2 t/día, 91 % ocupadas | Zoom a la capacidad |
| 5 | E2 | `/escenarios`, botón E2 | +12,0 pal/día (+19,0 %), IC [+10,8 ; +13,2]; cuello: desencajado | Zoom a la fila de diferencia |
| 6 | E3 | `/escenarios`, botón E3 | +0,5 contra E2, IC [+0,1 ; +0,9]: menos de 1 % | Zoom al IC contra E2 |
| 7 | E4 | `/escenarios`, botón E4, lavado 30 min | −3,7 pal/día, IC [−4,6 ; −3,4] | Zoom a la diferencia |

Componente común: `dashboard/web/components/Chart.tsx` (clic = pantalla completa, `Esc` = salir).

`/estadistica` ya muestra el transitorio de ≈ 4 h, la referencia real de 2,7 pal/h y el cuello vigente.

## 2. Escenarios sobre la base E1

Base (`E1_FINAL.md`, `public/e1/escenarios.json`): 10 réplicas de 24 h, arranque vacío, números aleatorios comunes (streams 60–87 desplazados), t(0,975; 9 gl) = 2,262.

| Esc | Qué cambia | Pal/día | t/día | Diferencia (IC 95 %) | Cuello |
|---|---|---|---|---|---|
| **E1 Base** | Formadoras 982 kg/h, 16 pallets MP por turno, lavado 30 min | 63,2 | 54,8 | — | Mezcladoras, 65,2 t/día |
| **E2 Formadoras rápidas** | Formadoras a 1843 kg/h (separación 3,27 → 1,554 m) | 75,2 | 65,1 | +12,0 [+10,8 ; +13,2] contra E1 | Desencajado, 74,2 t/día |
| **E3 Más MP + E2** | E2 y 24 pallets de MP por turno | 75,7 | 65,6 | +0,5 [+0,1 ; +0,9] contra E2 | Desencajado |
| **E4 Batch 1200 kg** | 1200 contra 1500 kg, con lavado de 30 min | — | — | −3,7 [−4,6 ; −3,4] contra 1500 kg | Mezcladoras |

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
