# Documentación del video PATY San Jorge

Registro vivo del video: decisiones, escenas construidas y procedencia de cada dato.
Regla: **ningún número entra al video sin una fuente del proyecto en la tabla de datos verificados.**

## 1. Decisiones de producción

| Tema | Decisión |
|---|---|
| Motor | Hyperframes en `film/`, 1920×1080, 30 fps. After Effects solo si hace falta en tomas reales de FlexSim o la web. |
| Ritmo | 128 BPM, `frame = round(beat × 14,0625)`. Todo corte cae en beat y todo impacto fuerte coincide con un corte. |
| Estilo | Agresivo y espectacular, fondos que cambian entre escenas, SF Pro Display, rojo `#ff1f3d`, también en el karaoke (reemplaza al naranja `#e08a1a` del super-prompt). |
| Recursos | Catálogo de Hyperframes primero, adaptado a la paleta y al grid (`npx hyperframes catalog` / `add`). |
| Voz | IA en actos 1-5 y 7. Acto 6: pista muda con karaoke; el equipo graba encima con el video terminado. |
| Integrantes | Jeremias Micheloud, Felipe Diaz Aimar, Matias Buffa (sin roles en pantalla). |
| FlexSim | Antes de arrancar el Acto 3 se frena y se decide con el equipo cómo hacerlo. |
| Audio | Música y voz van en una pasada aparte al terminar los actos 1 y 2. |

## 2. Escenas construidas

| # | Archivo | Beats | Frames | Contenido | Catálogo |
|---|---|---|---|---|---|
| 1 | `s01-chispa.html` | 0–8 | 0–112 | Orbe, haz, modelo de colas SVG (Llegada, Cola, Proceso, Salida), pill descifrada, flood a seda roja | Propio (shader WebGL) |
| 2 | `s02-portada.html` | 8–24 | 113–337 | Título, Planta San Jorge, pills Eventos discretos / 10 réplicas / IC 95 %, punto que crece a negro | Propio |
| 3 | `s03-integrantes.html` + muro | 24–39 | 338–547 | Tres nombres que chocan desde los bordes, muro SIMULACIÓN | `char-slam-explode`, `beat-accent`, `mk-clone-wall-transition` |
| 4a | `headline-slam` | 39–49 | 548–688 | ¿Dónde está el cuello de botella? | `headline-slam` |
| 4b | `s04-sistema.html` | 49–65 | 689–913 | Las 8 etapas, L7 + L8 | `perspective-marquee` |
| 4c | `s04-cifras.html` | 65–97 | 914–1363 | Escala de la planta, 8 beats por cifra | `slot-machine-roll`, `mk-emphasis-type` |
| 4d | `s04-hipotesis.html` | 97–137 | 1364–1926 | Ocho tiempos de proceso, zoom a la formadora, evidencia 982 contra 1843 kg/h, cómo se prueba | `parallax-zoom`, `marker-highlight` |
| 4e | `s04-variable.html` + tablero + `s04-real.html` | 137–161 | 1927–2263 | Variable de respuesta y referencia real | `rgb-glitch-text`, `grid-pixelate-wipe`, `split-flap-board` |

`s04-veredicto.html` (Formadora tachada, Mezcladoras, barras de capacidad, `strikethrough-replace`) está construido y reservado para el Acto 4; no se monta en la escena 4.

## 3. Datos verificados (en pantalla o previstos)

Rutas relativas a `FabricaPaty_SanJorge/`. Corrida vigente: lavado de 30 min, 7/11/2026.

| Dato | Valor | Fuente | Naturaleza |
|---|---|---|---|
| Nave | 150 × 70 m | `README.md:3` | Planta |
| Líneas modeladas | L7 y L8 | `README.md:3`, `SUPUESTOS_v2.md` | Alcance del modelo |
| Batch | 1500 kg | `SUPUESTOS_v2.md:12,22` | Dato del equipo |
| Materia prima | 16 pallets por turno, 72 t/día | `SUPUESTOS_v2.md:12` | Parámetro oficial, llegadas fijas |
| Lavado de mezcladora | 30 min por batch | `SUPUESTOS_v2.md:9` | Dato de planta |
| Etapas | Desencajado, picado, mezclado, formado, túnel, envasado, encajonado, estibado | `dashboard/web/public/e1/cuellos.json` | Modelo |
| **Cuello de botella E1** | **Mezcladoras: 65,3 t/día, 91 % ocupadas, cola de 3,5 lotes** | `datos_trazabilidad/e1_final/E1_FINAL.md:73`, `cuellos.json` | Simulación, 10 réplicas |
| Capacidad desencajado | 74,1 t/día (97 % ocupado), siguiente restricción | `cuellos.json` | Simulación |
| Capacidad formado | 87,2 t/día (64 % ocupado) | `cuellos.json` | Simulación |
| Formadora | 982 kg/h base, 1843 kg/h en E2 | `SUPUESTOS_v2.md:11` | Parámetros oficiales |
| Métrica oficial | Toneladas por día | `SUPUESTOS_v2.md:13`, `PENDIENTES.md:6` | Criterio de validación |
| Tablero real | 56,0 t/día, 64,9 pallets/día (L7 + L8) | `SUPUESTOS_v2.md:127` | Dato real Sep–Oct |
| E1 modelo | 54,9 t/día (−1,9 %), 75,3 ± 0,7 pallets/día | `E1_FINAL.md:72` | Simulación |
| Réplicas e IC | 10 réplicas de 24 h, IC 95 %, t = 2,262 | `E1_FINAL.md:9,13` | Método |
| E2 | +14,4 pal/día (+19,1 %), IC [+13,8 ; +15,0]; cuello pasa al desencajado | `E1_FINAL.md:74` | Simulación |
| E3 (nuevo) | E2 + 24 pallets MP por turno: 89,6 pal/día, −0,1 contra E2 | `E1_FINAL.md:75` | Simulación |
| E4 | 1200 contra 1500 kg con lavado: −4,0 [−4,6 ; −3,4] | `E1_FINAL.md:76` | Simulación |
| E5 (antes E3) | MTTR ×1,25: sin efecto; medido sin lavado | `PENDIENTES.md:22` | Simulación |

## 4. Correcciones aplicadas a `etapas/` y `guiones/`

Estos valores venían de la corrida histórica sin lavado y ya se corrigieron en los documentos (`guion_ia.md`, `guion_equipo.md`, `ACTO1-2`, `ACTO3`, `ACTO4`, `ACTO6`, `checklist.md`, `PROMPT_VIDEO_PATY.md`). El 89,4 y el +37,8 % siguen solo como relato de la primera corrida. Bondad de ajuste: K-S rechaza en arribos, paradas y pesos, al revés de lo que decía el Acto 6.

| Dónde | Dice | Vigente |
|---|---|---|
| ACTO3 y `guion_ia.md` | 89 pallets por día | 75,3 pal/día, 54,9 t/día. El 89,4 es sin lavado |
| ACTO3 §1 | "formadora (cuello declarado)" | Mezcladoras. La formadora fue la hipótesis inicial |
| ACTO3, ACTO4 | +37,8 % vs tablero, como quiebre | Es real pero histórico: 89,4 contra 64,9 pallets, sin lavado. Con lavado valida a −1,9 % en toneladas |
| ACTO3, ACTO4 | Se valida gracias al MCP y luego hipótesis de lavado | Confirmar el relato: la validación cierra con el lavado de 30 min, dato de planta |
| ACTO6 §2 | E2 +2,5 pal/día (+2,8 %), cuello a recepción | +14,4 pal/día (+19,1 %), cuello al desencajado |
| ACTO6 §2 | E3 es MTTR ×1,25 | E3 es más MP + E2. El MTTR pasó a E5 |
| ACTO6 §2 | E2 "Más dotación" | Lo que cambia es la velocidad de formadoras a 1843 kg/h |
| ACTO6 §1 | Warmup 2,5 h; ~36 pal/día/línea | `E1_FINAL.md` indica transitorio ≈ 4 h; revisar antes del Acto 6 |
| ACTO5 y checklist | Ciclo L1–L8 | Son 8 etapas, de desencajado a estibado |
| ACTO1-2 | Meta 3 pal/h como referencia | Es constante del tablero web (36 pal/día por línea). Se prefiere la referencia real: 56,0 t/día |
| CONTEXTO | MCP con 71 tools | 73 según conteo de ACTO4 |

## 5. Decisiones de relato

- "UTN" en la portada, confirmado por el equipo.
- Escena 4 solo plantea la hipótesis (¿Formadora?). El veredicto de mezcladoras se revela en el Acto 4, después de la validación con lavado.
- Reparto del Acto 6: Jeremias (validación), Felipe (E1 y E2), Matias (E3, E4 y cierre).

## 6. Cambios en la web

Con autorización del equipo se actualizó `dashboard/web/app/estadistica/page.tsx`: transitorio de ≈ 4 h, referencia real de 2,7 pal/h (64,9 / 24) y panel "Efecto Restricción" con el cuello vigente.

`WARMUP_H = 2.5` sigue en `dashboard/web/lib/derive.ts` para los promedios de la página Colas: cambiarlo altera cálculos, no solo texto.

## 8. Formato de presentación lineal

- La voz es un relato y no lee la diapositiva. D1 sin voz; en D2 solo dice "Simulación de líneas de hamburguesas Paty".
- Sin subtítulos en la voz IA. `film/compositions/s99-subs.html` solo pone el número de diapositiva (temporal; quitar antes del render final). El karaoke queda para el Acto 6.
- Orden de diapositivas: problema (D7–D17), Blender (D18–D21), FlexSim, MCP, web, y recién después escenarios. Los escenarios no se mencionan antes.
- Los tres ciclos (faena, desposte, elaborados) salieron del guion: el modelo cubre Elaborados L7 y L8.
- Renders reales con Blender (`film/tools/render_glb.py`, Workbench): `assets/renders/nave.mp4` (`planta_v10.glb`, D9) y `operario.mp4` (`operario.glb`, clip Wave, D20). `planta_luz.jpg` es el horneado real (D21).

## 9. Vocabulario de proceso (corregido por el equipo)

- La **formadora** le da forma a las hamburguesas; no hace cajas. En pantalla: 5 kg de hamburguesas cada 18,33 s (no decir "bandejas").
- En la cátedra se dice **medida de desempeño**, no "variable de respuesta".
- D9 y D18 usan el plano real `Elaborados.pdf` (recortes invertidos en `film/assets/planos/`), solicitado a la planta para el modelo 3D. D21 antes era la luz horneada, y se quitó.
- La **envasadora** envasa y encaja en cajas chicas (150 paquetes por minuto).
- La **encajonadora** arma las cajas completas de hamburguesas (5 s por caja).

## 11. Diapositivas de FlexSim (D22–D26)

Capturas reales de `PLANTASJ.fsm` por el MCP (`film/assets/flexsim/`): a 0 h y a 8 h simuladas. El modelo se reseteó al terminar y no se guardó.

| Dato | Valor | Fuente |
|---|---|---|
| Objetos por clase | 14 procesadores, 8 separadores, 14 cintas, 10 operarios, 4 montacargas, 4 racks, 4 colas, 2 estibadores | `flexsim_inspect_model` |
| Licencia | 96 de 100 objetos | `PENDIENTES.md:3` |
| Hojas del tablero | 7 | Captura de `PATY_Tablero` |
| Primera corrida, sin lavado | 89,4 contra 64,9 pallets/día, +37,8 % | `E1_FINAL.md:31` |

## 10. Datos de las diapositivas de Blender

| Dato | Valor | Fuente |
|---|---|---|
| Objetos 3D | 17.334 mallas | Importación de `planta_v10.glb` en Blender |
| Scripts | 13 de Python, 3440 líneas no vacías | `blender/*.py` |
| Operario | 62 huesos, 10 clips | `documentacion/03_operario_blender.md` |
| Luz | Cycles, 8192 × 2524 px, 15 cm por píxel | `documentacion/05_iluminacion_y_rendimiento.md:8-11` |

## 7. Tiempos de proceso mostrados en la hipótesis

Desencajado 3500 s por pallet, picado 900 s por batch, mezclado 1200 s por batch, formado 18,33 s por bandeja, túnel 5 min de pasada, envasado 150 paquetes por minuto, encajonado 5 s por caja llena, estibado 144 cajas por pallet (`SUPUESTOS_v2.md` T2–T11). El lavado no se muestra a propósito: se revela en el Acto 4.

## 12. Operario

El saludo del operario (`assets/renders/operario.mp4`) se reserva para la diapositiva final del video.

## 13. FlexSim en vivo (D21–D22)

D21 es la grabación real de pantalla de PLANTASJ.fsm con el tablero (ilm/assets/flexsim/corrida.mp4, 3:00, recorte desde 4,5 s; la maneja el equipo y la locución va en guion_ia.md, 0:00–2:28). D22 es la primera corrida (89,4 contra 64,9 pallets/día, +37,8 %, E1_FINAL.md:31). Duración total del video: 5:17,5.


Karaoke de la toma de FlexSim (s06-karaoke.html): 17 frases con barrido rojo, una por vista. Datos: 96/100 objetos (PENDIENTES.md), notas del propio tablero (meta 36 pal/día/línea; formadora 982 y estándar 1843 kg/h; 1 pallet MP = 1 batch de 1500 kg, 1 pallet PT = 144 cajas), 4 montacargas (SUPUESTOS_v2.md P4) y transitorio ≈ 4 h (E1_FINAL.md). Tiempos de cada hoja medidos sobre la grabación.


## 14. Diapositivas del MCP (D23–D30)

`film/compositions/s07-mcp.html` y `s04-veredicto.html`. Catálogo adaptado: `strikethrough-replace`, `chat-message`, `headline-slam`, `tracing-beam`, `code-terminal-run`, `slot-machine-roll`.

| Dato | Valor | Fuente |
|---|---|---|
| Herramientas | 73 | `@mcp.tool` y `async def flexsim_` en `mcp_server/flexsim_mcp.py` (ambos 73) |
| Categorías | 8: 14, 12, 11, 10, 7, 6, 7, 6 | `etapas/ACTO4_mcp_propio.md` |
| Salidas de D28 | End: 8.00h, Time: 8.00h | Llamadas reales al MCP durante la producción del video |
| Validación | 54,9 contra 56,0 t/día, −1,9 % | `E1_FINAL.md:72` |

## 15. Presupuesto de 15 minutos

Apertura, problema y Blender 2:14; FlexSim 2:00 (toma desde el segundo 24 a 1,4x); MCP 1:49; web 2:30; Acto 6 5:30; cierre 0:30. Web: cinemáticas Elaborados y Seguir un lote.

## 16. Web (D31)

Tomas de `localhost:3000` conectada a FlexSim (no Vercel, que no recibe datos del modelo): `assets/web/web.mp4` (Elaborados), `lote.mp4` (Seguir un lote, con 24 h simuladas) y `secciones.mp4` (8 apartados). Elaborados y Lote van a 1,5x; cada apartado dura 9 s. Corrección de la web en `lib/cine.ts`: `tiempoEnEtapa` usaba entradas y contenido en unidades distintas en mezcladoras, formadoras, envasadoras y encajonadoras; ahora usa salidas. Resultado de la toma: un lote tarda 2,26 h de punta a punta (desencajado 57,6 min, picado 15,2 min, mezclado 52 min, formado 5 min, túnel 5,3 min). Reparto final: web 2:52, Acto 6 5:00, cierre 0:30.

## 17. Acto 6 (D32–D38)

Diapositivas propias en `compositions/s09-acto6.html`, 5:00, con karaoke para que el equipo grabe encima. Fuentes: `E1_FINAL.md`, `summary_escenarios_v2.json` y `app/estadistica/page.tsx`. Texto completo con tiempos en `guiones/guion_equipo.md`.

## 18. Cierre (D39)

`compositions/s10-cierre.html`, 30 s. Operario de Blender (`operario.mp4`) a velocidad normal: dos saludos al inicio, pose quieta (`operario_pose.png`) y un saludo final. Repositorios de `ACTO7_cierre_repos.md`. Duración total del video: 14:24,6.

## 19. Revisión completa del 8/11/2026

Cambios pedidos diapositiva por diapositiva. Portada sin "San Jorge"; integrantes por apellido; D7 y D8 invertidas (primero el proceso, después el problema); nave D9 con cuadro fijo para quitar el parpadeo del render; camiones de D12 andando; nueva diapositiva "por qué la formadora" (53 % = 982/1843); nueva "por dónde arrancamos a simular"; D24 pasa a conclusiones de la corrida vigente (`E1_FINAL.md:72-73`), no se tocó el modelo; se quitaron la validación y el veredicto del bloque MCP; definición formal de MCP; captura real del repositorio; D31 con zoom y subtítulos; nueva diapositiva de distribuciones (`SUPUESTOS_v2.md:12,15,120`); D34 sin la comparación con la planta; conclusiones finales; operario a la derecha con baile (`renders/baile.mp4`, clip Dance); cierre con el bloque `logo-outro`.

## 20. Idea de la web, zooms y animaciones

Nueva diapositiva D31 (idea de la web, mecánica de `parallax-device-dive`). En la web, cada apartado usa cuadros reales de `secciones.mp4` (`assets/web/st/`) con zoom exacto a cada gráfica o tabla, dato resaltado y etiqueta; los valores salen de esos mismos cuadros. Acto 6: barras que crecen, sellos, tarjetas 3D, ruedas de números (`number-wheel`) e intervalos animados. E1 aclara que se sospechaba de la formadora y la simulación marcó las mezcladoras. Cierre con confeti (`confetti`). Logo PATY también en la web.
