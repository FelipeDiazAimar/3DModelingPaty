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

Rutas relativas a `FabricaPaty_SanJorge/`. Corrida vigente (10/11/2026): camiones reales remuestreados, batch de 1050 kg, lavado de 30 min. **No se compara contra valores de la planta.**

| Dato | Valor | Fuente | Naturaleza |
|---|---|---|---|
| Nave | 150 × 70 m | `README.md:3` | Planta |
| Líneas modeladas | L7 y L8 | `README.md:3`, `SUPUESTOS_v2.md` | Alcance del modelo |
| Batch | 1050 kg (7 cargas de 150 kg: MP + aditivos de la lista técnica) | `SUPUESTOS_v2.md`, `gen_arribos.fls` | Parámetro oficial |
| Materia prima | Camiones reales remuestreados de la base de producción (cantidad por día, tamaño, hora del primer camión, gaps); 8 a 80 batches por día, ≈ 55 de media; L7 + L8 reciben 0,5 de cada camión (supuesto declarado); peso de cada pallet de MP remuestreado de 11.882 pallets reales (media 934 kg) | `SUPUESTOS_v2.md`, `dashboard/flexsim/gen_arribos.fls`, `fitting_series/` | Parámetro oficial desde el 10/11 |
| Lavado de mezcladora | 30 min por batch | `SUPUESTOS_v2.md:9` | Dato de planta |
| Etapas | Desencajado, picado, mezclado, formado, túnel, envasado, encajonado, estibado | `dashboard/web/public/e1/cuellos.json` | Modelo |
| **Cuello de botella E1** | **Mezcladoras: 60,5 t/día, 75 % ocupadas** (siguiente: desencajado, 74,7 t/día) | `datos_trazabilidad/e1_final/E1_FINAL.md`, `estocastico_camiones/analisis.json` | Simulación, 10 réplicas |
| Capacidad desencajado | 74,7 t/día (72 % ocupado), siguiente restricción | `analisis.json` | Simulación |
| Capacidad formado | 87,0 t/día | `analisis.json` | Simulación |
| Formadora | 982 kg/h base, 1843 kg/h en E2 | `SUPUESTOS_v2.md:11` | Parámetros oficiales |
| Métrica oficial | Toneladas por día | `SUPUESTOS_v2.md:13`, `PENDIENTES.md:6` | Criterio de validación |
| Ritmo de formado | Multiplicador diario por línea remuestreado de 246 corridas reales de L7/L8 (sd ≈ 9 %) | `fitting_series/ritmo_formado_L7L8.csv` | Parámetro oficial |
| E1 modelo | 49,1 ± 14,9 pallets/día, 42,5 ± 12,6 t/día, 879 kg por pallet de PT (IC anchos: la entrada varía de 8 a 80 batches/día) | `E1_FINAL.md`, `analisis.json` | Simulación |
| Réplicas e IC | 10 réplicas de 24 h, IC 95 %, t = 2,262 | `E1_FINAL.md:9,13` | Método |
| E2 | 58,4 ± 18,7 pal/día; +9,3 pal/día contra E1 (+18,9 %), IC [+4,5 ; +14,1]; cuello pasa al desencajado (74,7 t/día) | `E1_FINAL.md` | Simulación |
| E3 | E2 + 1,5× la materia prima: 62,0 ± 17,8 pal/día, +3,6 contra E2 (IC [−0,3 ; +7,5]: incluye el cero); cámaras de MP 19,4 → 30,3 pallets | `E1_FINAL.md` | Simulación |
| E4 | Batch 1200 kg (8 cargas) contra 1050 kg (7 cargas): 49,7 ± 14,7 pal/día, +0,6 contra E1 (IC [−0,0 ; +1,2]: incluye el cero) | `E1_FINAL.md` | Simulación |
| E5 (antes E3) | MTTR ×1,25: sin efecto; medido sin lavado | `PENDIENTES.md:22` | Simulación |

## 4. Correcciones aplicadas a `etapas/` y `guiones/`

Estos valores venían de la corrida histórica sin lavado y ya se corrigieron en los documentos (`guion_ia.md`, `guion_equipo.md`, `ACTO1-2`, `ACTO3`, `ACTO4`, `ACTO6`, `checklist.md`, `PROMPT_VIDEO_PATY.md`). El 89,4 pallets/día sigue solo como relato de la primera corrida (todo constante, sin lavado); ya no se compara contra el tablero. Bondad de ajuste: K-S rechaza en arribos, paradas y pesos, al revés de lo que decía el Acto 6.

| Dónde | Dice | Vigente |
|---|---|---|
| ACTO3 y `guion_ia.md` | 89 pallets por día | 49,1 ± 14,9 pal/día, 42,5 t/día. El 89,4 es la primera corrida (sin lavado, entradas fijas, pallet de 720 kg) |
| ACTO3 §1 | "formadora (cuello declarado)" | Mezcladoras. La formadora fue la hipótesis inicial |
| ACTO3, ACTO4 | Quiebre con la comparación contra el tablero | Se quitó la comparación: el quiebre es el número suelto de la primera corrida (89,4 pallets/día) y la necesidad de réplicas e intervalos |
| ACTO3, ACTO4 | Se valida gracias al MCP y luego hipótesis de lavado | El relato ya no valida contra la planta: con el MCP se corren 10 réplicas por escenario y se leen intervalos |
| ACTO6 §2 | E2 +2,5 pal/día (+2,8 %), cuello a recepción | +9,3 pal/día (+18,9 %), cuello al desencajado |
| ACTO6 §2 | E3 es MTTR ×1,25 | E3 es más MP + E2. El MTTR pasó a E5 |
| ACTO6 §2 | E2 "Más dotación" | Lo que cambia es la velocidad de formadoras a 1843 kg/h |
| ACTO6 §1 | Warmup 2,5 h; ~36 pal/día/línea | `E1_FINAL.md` indica transitorio ≈ 4 h; revisar antes del Acto 6 |
| ACTO5 y checklist | Ciclo L1–L8 | Son 8 etapas, de desencajado a estibado |
| ACTO1-2 | Meta 3 pal/h como referencia | Es constante del tablero web (36 pal/día por línea); no se usa como validación |
| CONTEXTO | MCP con 71 tools | 73 según conteo de ACTO4 |

## 5. Decisiones de relato

- "UTN" en la portada, confirmado por el equipo.
- Escena 4 solo plantea la hipótesis (¿Formadora?). El veredicto de mezcladoras se revela en el Acto 4. No hay validación contra datos de la planta.
- Reparto del Acto 6: Jeremias (validación), Felipe (E1 y E2), Matias (E3, E4 y cierre).

## 6. Cambios en la web

Con autorización del equipo se actualizó `dashboard/web/app/estadistica/page.tsx`: transitorio de ≈ 4 h y panel "Efecto Restricción" con el cuello vigente (la referencia real de 2,7 pal/h de esa página ya no se usa para comparar).

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
| Primera corrida, sin lavado | 89,4 pallets/día (histórico; sin comparación con la planta) | `E1_FINAL.md` (secciones de modelos anteriores) |

## 10. Datos de las diapositivas de Blender

| Dato | Valor | Fuente |
|---|---|---|
| Objetos 3D | 17.334 mallas | Importación de `planta_v10.glb` en Blender |
| Scripts | 13 de Python, 3440 líneas no vacías | `blender/*.py` |
| Operario | 62 huesos, 10 clips | `documentacion/03_operario_blender.md` |
| Luz | Cycles, 8192 × 2524 px, 15 cm por píxel | `documentacion/05_iluminacion_y_rendimiento.md:8-11` |

## 7. Tiempos de proceso mostrados en la hipótesis

Desencajado 2450 s por batch (≈ 41 min), picado 630 s por batch (10,5 min), mezclado 840 s por batch (14 min), formado 18,33 s por bandeja, túnel 5 min de pasada, envasado 150 paquetes por minuto, encajonado 5 s por caja llena, estibado de ≈173 cajas por pallet (peso real ÷ 5 kg; `SUPUESTOS_v2.md` T2–T11). El lavado de 30 min se muestra solo como "+ 30 de lavado" en el mezclado.

## 12. Operario

El saludo del operario (`assets/renders/operario.mp4`) se reserva para la diapositiva final del video.

## 13. FlexSim en vivo (D21–D22)

D21 es la grabación real de pantalla de PLANTASJ.fsm con el tablero (ilm/assets/flexsim/corrida.mp4, 3:00, recorte desde 4,5 s; la maneja el equipo y la locución va en guion_ia.md, 0:00–2:28). D22 es la primera corrida (89,4 pallets/día, histórico). Duración total del video: 5:17,5.


Karaoke de la toma de FlexSim (s06-karaoke.html): 17 frases con barrido rojo, una por vista. Datos: 96/100 objetos (PENDIENTES.md), notas del propio tablero (meta 36 pal/día/línea; formadora 982 y estándar 1843 kg/h; 1 batch de 1050 kg, 1 pallet PT ≈ 173 cajas), 4 montacargas (SUPUESTOS_v2.md P4) y transitorio ≈ 4 h (E1_FINAL.md). Tiempos de cada hoja medidos sobre la grabación.


## 14. Diapositivas del MCP (D23–D30)

`film/compositions/s07-mcp.html` y `s04-veredicto.html`. Catálogo adaptado: `strikethrough-replace`, `chat-message`, `headline-slam`, `tracing-beam`, `code-terminal-run`, `slot-machine-roll`.

| Dato | Valor | Fuente |
|---|---|---|
| Herramientas | 73 | `@mcp.tool` y `async def flexsim_` en `mcp_server/flexsim_mcp.py` (ambos 73) |
| Categorías | 8: 14, 12, 11, 10, 7, 6, 7, 6 | `etapas/ACTO4_mcp_propio.md` |
| Salidas de D28 | End: 8.00h, Time: 8.00h | Llamadas reales al MCP durante la producción del video |
| Resultado del modelo | 49,1 ± 14,9 pal/día y 42,5 ± 12,6 t/día (sin comparación con la planta) | `E1_FINAL.md` |

## 15. Presupuesto de 15 minutos

Apertura, problema y Blender 2:14; FlexSim 2:00 (toma desde el segundo 24 a 1,4x); MCP 1:49; web 2:30; Acto 6 5:30; cierre 0:30. Web: cinemáticas Elaborados y Seguir un lote.

## 16. Web (D31)

Tomas de `localhost:3000` conectada a FlexSim (no Vercel, que no recibe datos del modelo): `assets/web/web.mp4` (Elaborados), `lote.mp4` (Seguir un lote, con 24 h simuladas) y `secciones.mp4` (8 apartados). Elaborados y Lote van a 1,5x; cada apartado dura 9 s. Corrección de la web en `lib/cine.ts`: `tiempoEnEtapa` usaba entradas y contenido en unidades distintas en mezcladoras, formadoras, envasadoras y encajonadoras; ahora usa salidas. Resultado de la toma: un lote tarda 2,26 h de punta a punta (desencajado 57,6 min, picado 15,2 min, mezclado 52 min, formado 5 min, túnel 5,3 min). Reparto final: web 2:52, Acto 6 5:00, cierre 0:30.

## 17. Acto 6 (D32–D38)

Diapositivas propias en `compositions/s09-acto6.html`, 5:00, con karaoke para que el equipo grabe encima. Fuentes: `E1_FINAL.md`, `summary_escenarios_v2.json` y `app/estadistica/page.tsx`. Texto completo con tiempos en `guiones/guion_equipo.md`.

## 18. Cierre (D39)

`compositions/s10-cierre.html`, 30 s. Operario de Blender (`operario.mp4`) a velocidad normal: dos saludos al inicio, pose quieta (`operario_pose.png`) y un saludo final. Repositorios de `ACTO7_cierre_repos.md`. Duración total del video: 14:24,6.

## 19. Revisión completa del 8/11/2026

Cambios pedidos diapositiva por diapositiva. Portada sin "San Jorge"; integrantes por apellido; D7 y D8 invertidas (primero el proceso, después el problema); nave D9 con cuadro fijo para quitar el parpadeo del render; camiones de D12 andando; nueva diapositiva "por qué la formadora" (53 % = 982/1843); nueva "por dónde arrancamos a simular"; D24 pasa a conclusiones de la corrida vigente (`E1_FINAL.md`), no se tocó el modelo; se quitaron la validación y el veredicto del bloque MCP; definición formal de MCP; captura real del repositorio; D31 con zoom y subtítulos; nueva diapositiva de distribuciones (`SUPUESTOS_v2.md:12,15,120`); D34 sin la comparación con la planta; conclusiones finales; operario a la derecha con baile (`renders/baile.mp4`, clip Dance); cierre con el bloque `logo-outro`.

## 20. Idea de la web, zooms y animaciones

Nueva diapositiva D31 (idea de la web, mecánica de `parallax-device-dive`). En la web, cada apartado usa cuadros reales de `secciones.mp4` (`assets/web/st/`) con zoom exacto a cada gráfica o tabla, dato resaltado y etiqueta; los valores salen de esos mismos cuadros. Acto 6: barras que crecen, sellos, tarjetas 3D, ruedas de números (`number-wheel`) e intervalos animados. E1 aclara que se sospechaba de la formadora y la simulación marcó las mezcladoras. Cierre con confeti (`confetti`). Logo PATY también en la web.

## 21. Vista móvil en D31

Antes de la PC, tres celulares en abanico (mecánica del bloque `app-showcase`) con capturas reales de la web en diseño móvil (`assets/web/st/m1-m3.png`). Dura 17 s.

## 22. Web sin subtítulos

En la diapositiva de la web habla la IA, así que se quitó el karaoke de toda esa diapositiva. Las etiquetas con el dato de cada gráfica siguen.

## 23. Consigna de la cátedra

Agregados: rubro y actividad (`s03b-rubro`), escenario base con turnos, recursos y capacidades (`s04b-base`, datos de `SUPUESTOS_v2.md`), marcado de la cola en la corrida y tabla comparativa de E1 a E4 (Acto 6). Elaborados se acortó de 44 a 20 s. PATY se mantiene porque es una marca y no el nombre de la empresa. La ejecución de E2, E3 y E4 se agregó el 9/11/2026 (sección 24).

## 24. Tomas de FlexSim de E2, E3 y E4

Tomas reales de la corrida de cada escenario alternativo, sumadas a sus diapositivas del Acto 6 (`compositions/s09-acto6.html`, `#s4`, `#s5` y `#s6`) sin cambiar ninguna duración.

- **Modelo:** copia de `PLANTASJ.fsm` en una carpeta temporal (el original no se modificó), abierta en FlexSim 2026. Base: E1 con lavado de 30 min (`SetupTime` 1800 s en `MezA/B_L7/L8`). *(Las tomas son del modelo previo, con 10 cargas y 16 pallets por turno; las de E2 a E4 se regrabaron el 10/11 con el modelo de arribos aleatorios, y con el de camiones reales todavía no.)* Fuentes de la configuración: `SUPUESTOS_v2.md` (líneas 124 y 125) y `datos_trazabilidad/e1_final/E1_FINAL.md`.
- **E2:** `entrySpacePadding` de `CintaFormA/B_L7/L8` de 3,27 a 1,554 m.
- **E3:** E2 más más materia prima (en las tomas, 24 pallets por turno del modelo previo; en el modelo actual E3 es 1,5× la entrada de camiones).
- **E4:** (toma del modelo previo: de 10 a 8 cargas, desencajado 2800 s, picadora 720 s). En el modelo actual: `splitquantity` de las 4 mezcladoras de 7 a 8 cargas (8 × 150 kg = 1200 kg por batch) y tiempos por batch ×8/7 (desencajado 2450 → 2800 s, picadora 630 → 720 s, mezclado 840 → 960 s). El lavado de 30 min se mantiene.
- **Corrida:** réplica 1 (`repId` = 1, fallas encendidas), publicador apagado (`pubOff` = 1). Cada escenario se corrió hasta las 4 h simuladas (fin del transitorio) a velocidad 4000 y se grabaron 15 s a velocidad 12, es decir de las 4:00 a las 4:05 h simuladas, con el tablero `PATY_Tablero` a la vista.
- **Grabación:** `ffmpeg` de FlexSim con `gdigrab` del escritorio recortado sin la barra de tareas (2418 × 1360 desde x = 142), escalado a 1920 × 1080, 30 fps, `-draw_mouse 0`, H.264 (`h264_nvenc`, 8 Mb/s). Archivos: `assets/flexsim/e2.mp4` (1,2 MB), `e3.mp4` (1,2 MB) y `e4.mp4` (1,3 MB). No se versionan (`.gitignore`).
- **En la diapositiva:** cada toma va de fondo a pantalla completa, en cámara lenta para cubrir la diapositiva sin repetirse (velocidad 0,24 en E2, 0,32 en E3 y 0,36 en E4), con opacidad 0,3 en las diapositivas oscuras y 0,24 en la clara (E4), entrada con acercamiento lento y el rótulo "Toma real · FlexSim · Ex a las 4 h simuladas" arriba a la izquierda. Títulos, intervalo, sello y karaoke quedan encima, sin cambios de posición ni de tiempos.
- **Validación:** `npx hyperframes check --json` sin errores nuevos (solo avisos `nested_media_start_basis_ambiguous`, iguales a los de los otros videos del proyecto). Para que el chequeo no fallara se copiaron a `assets/` las tomas que no se versionan (`flexsim/corrida.mp4`, `web/web.mp4` y `web/lote.mp4`, desde la carpeta compartida "Videos Simulación"). Snapshots en 674,8, 710,8, 738,8, 760,8, 790,8 y 812,8 s: la toma se ve detrás y el texto se lee.

## 25. Componentes del catálogo de HyperFrames (9/11/2026)

Instalados con `npx hyperframes add`: `data-chart`, `cursor-annotate`, `caption-kinetic-slam`, `screen-flow-carousel` y `claude-exchange` (`ui-3d-reveal` ya estaba). `cursor-annotate` va montado desde `index.html`; el resto se adaptó dentro de cada composición porque los originales traen marca, textos en inglés o formato vertical. Ninguna duración ni `data-start` cambió y no hay números nuevos.

**D24 Qué es un MCP (`s07-mcp.html`, 299,96-314,96 s; intercambio en 305,96-311,6 s).** Mecánica adaptada de `claude-exchange`: en la columna "Un MCP: la IA opera" el equipo pide "Armá el modelo y corré los experimentos", aparece "Claude está pensando…" y se tildan tres herramientas reales del MCP (`flexsim_create_objects`, `flexsim_connect_objects`, `flexsim_run_experiments`, de `MCP_Flexsim/mcp_server/flexsim_mcp.py`), con cierre "Listo: corrió y trae los datos". Reemplaza las cuatro píldoras de texto. Título, columna del chat y definición formal quedan intactos.
**D21 Blender (`s05-blender.html`, 145,77-153,27 s; tarjeta de 150,57 a 153,27 s).** Mecánica adaptada de `ui-3d-reveal`: tarjeta con perspectiva (rotación en Y y X) que se endereza con el render real `assets/renders/planta_luz.jpg`, rótulo "Render de Blender", abajo a la derecha, bajo el subtítulo y fuera del título.
**D32 Web (`s08-web.html`, 457,26-463,56 s; carrusel de 61,8 a 68,1 s locales).** Mecánica adaptada de `screen-flow-carousel`: riel horizontal con lanzamiento y asentado, cinco capturas reales (`assets/web/st/prod_6.5, par_6.5, col_6.5, vel_6.5, esc_6.5.png`), rótulos Producción, Paradas, Colas y WIP, Velocidad, Escenarios y título "Los apartados de la web". Tapa los últimos 6 s de la toma de "Seguir un lote" y termina antes del primer apartado (68,33 s).
Decisión: no se montaron los blocks en `index.html` (traen marca Figma/HeyGen y formato vertical); se adaptó la mecánica dentro de cada composición. Ninguna duración ni `data-start` cambió. Sin números nuevos.

**s06-flexsim (abs 193,53 a 196,5 s, local 29,0).** `cursor-annotate` (instalado, montado dos veces en index.html con data-variable-values, ids ann-s06-a y ann-s06-b, tracks 6 y 7): lápiz que traza a mano alzada un bucle blanco alrededor de cada mezcladora (mismas zonas que los anillos q-1 y q-2), a las 193,53 s y 193,71 s. Los anillos y el rótulo "Acá se forma la cola: las mezcladoras" se mantienen (el trazo los acompaña).
**s09-acto6 #s3 (E1, abs 654,10 a 657,05 s, local 118,3).** `cursor-annotate` (mount ann-s09-e1, z-index 45): bucle rojo alrededor del valor de Ocupación de las mezcladoras (ahora "75 %"), cuando el karaoke dice "setenta y cinco por ciento".
**s09-acto6 #s7 (Comparación, local 280,5 a 290; abs 816,3 a 826,3 s).** `data-chart` (adaptado, no montado: el bloque instalado es una demo clara con datos propios): ejes y líneas de guía verticales en 0, 25, 50, 75 y 100 pallets por día, a la misma escala que las barras de la diapositiva (5,325 px por pallet), que ahora valen: E1 49,1; E2 58,4; E3 62,0; E4 49,7 (mismo ancho por pallet; ver la actualización del 10/11 con camiones reales). Aparecen en local 281,1 a 282,3 s. Los valores 0 a 100 son solo la escala del eje.
**s09-acto6 #s8 (Conclusión, local 290 a 315; abs 825,8 a 850,8 s).** `caption-kinetic-slam` (adaptado, no montado: trae un texto fijo en inglés): cada palabra de "1.º Formadoras", "2.º Desencajado" (local 290,7 y 291,5 s, paso 0,28 s) e "Intervalos, no corridas sueltas" (local 304,3 s, paso 0,22 s) entra desde un lado distinto (arriba con rebote, izquierda, derecha, escala), con SF Pro Display como el resto.

Validación: `npx hyperframes check --json` sin errores (solo avisos previos) y snapshots revisados en 152,2, 194,6, 309,5, 313,5, 460,5, 655,3, 818,8, 827,8 y 841,3 s.

Ajuste del 9/11/2026: en la toma de FlexSim se quitaron los recuadros rojos (`q-ring`) y quedó solo el trazo a mano de `cursor-annotate`, que ahora se mantiene hasta que se va el rótulo (193,5 a 210,5 s); en E1 el trazo sobre el 91 % queda hasta el final de la diapositiva (654,1 a 670,8 s). La lapicera se retira apenas termina de dibujar (cambio local en `compositions/components/cursor-annotate.html`).


## Actualización 10/11/2026 (versión intermedia, superada por la de camiones reales): modelo con arribos y pallets aleatorios
El modelo oficial (`PLANTASJ.fsm`) ahora sortea los tiempos entre arribos de MP con la tabla empírica y el peso de cada pallet de PT con los 500 pesos reales. Se re-corrieron E1 a E4 (10 réplicas, mismos streams) y cambiaron las cifras del Acto 6, del Acto 4 (validación y veredicto) y del cierre:

| Cifra | Antes (llegadas fijas, pallet de 720 kg) | Ahora |
|---|---|---|
| E1 pallets/día · t/día | 75,3 · 54,9 | 63,2 ± 1,2 · 54,8 |
| (se quitó la fila de validación contra el tablero) | — | — |
| E2 contra E1 | +14,4 pal/día (+19,1 %), IC [+13,8 ; +15,0] | +12,0 pal/día (+19,0 %), IC [+10,8 ; +13,2] |
| E3 contra E2 | −0,1 [−0,3 ; +0,1] (incluye el cero) | +0,5 [+0,1 ; +0,9] (+0,7 %: casi no suma) |
| E4 1200 contra 1500 kg | −4,0 [−4,6 ; −3,4] | −3,7 [−4,4 ; −3,0] (−5,9 %) |
| Cuello E1 | mezcladoras 65,3 t/día, cola 3,5 lotes | mezcladoras 65,2 t/día, 91 % (siguiente: desencajado 74,2); la cola de entrada no se midió en la corrida nueva |
| Comparación (pallets/día) | 75,3 · 89,7 · 89,6 · 71,3 | 63,2 · 75,2 · 75,7 · 59,5 |
| Cámaras de MP en E3 | 6,3 → 21,8 | 6,4 → 21,7 |

Escenas modificadas (HyperFrames): `s09-acto6` (cifras, ruedas de dígitos, intervalos, barras a 5,325 px por pallet, texto del karaoke), `s04-veredicto` (65,2 y 74,2 t), `s06-flexsim`, `s08-web`, `s10-cierre`, `s04-hipotesis`, `s04b-base`, `s06-karaoke` (≈173 cajas por pallet). Guiones: `guion_equipo.md` (D32 a D40) y `guion_ia.md` (D21). **El equipo tiene que volver a grabar la narración del Acto 6 con el guion nuevo**; los tiempos del karaoke no se tocaron y el video ya se re-renderizó con el texto nuevo. Las tomas de fondo de FlexSim de E2, E3 y E4 (`assets/flexsim/e2.mp4`, `e3.mp4`, `e4.mp4`, que no se versionan y solo estaban en la PC de Jeremías) **se regrabaron el 10/11/2026 con el modelo nuevo** (receta de la sección anterior más `Tools/GenArribos` después de `resetmodel()`; réplica 1, de las 4:00 a las 4:05 h simuladas a velocidad 20), capturando la ventana de FlexSim 2027 con `PrintWindow` (la pantalla estaba bloqueada) a ≈5 cuadros por segundo, interpolados a 30 fps con `ffmpeg` (1920 × 1080, H.264). Siguen sin versionarse. El MP4 renderizado con las cifras nuevas queda en `film/renders/Video_TPI_actualizado.mp4` (HyperFrames 0.9.20, `-q looks`, FFmpeg instalado con winget).

**Narración provisional del Acto 6 (10/11/2026).** Para que el video no quede mudo en el Acto 6 se generó una narración sintética con la voz es-AR-TomasNeural (Edge TTS, la misma familia de voces de `assets/voz`), una frase por segmento del karaoke de `s09-acto6.html` (34 frases con el texto nuevo de `guion_equipo.md`), ubicada en el segundo exacto de cada una (film 536,3 a 850,3 s) y acelerada hasta 1,6x solo cuando la frase no entraba en su ventana. Archivo: `film/renders/Video_TPI_actualizado_voz_acto6.mp4` (el MP4 sin audio, `Video_TPI_actualizado.mp4`, queda como base). **Es una voz de reserva: el plan original es que los integrantes graben el Acto 6 siguiendo el karaoke**; cuando lo hagan, se reemplaza esa pista. El resto del video no tiene audio en el proyecto (la voz de la IA se agrega en edición).

## Actualización 10/11/2026 (tarde): modelo con camiones reales remuestreados
Se rehízo la entrada del modelo y se volvieron a correr E1 a E4 (10 réplicas de 24 h; `datos_trazabilidad/e1_final/estocastico_camiones/`). Cambios del modelo: camiones reales remuestreados de la base de producción (cantidad por día, tamaño, hora del primer camión de 8 a 10 h, gaps; L7 + L8 reciben 0,5 de cada camión, supuesto declarado), peso de cada pallet de MP remuestreado de 11.882 pallets reales (media 934 kg), batch de 7 cargas de 150 kg = 1050 kg (tiempos 2450 s, 630 s y 840 s), ritmo de formado diario remuestreado de 246 corridas reales de L7/L8, planta vacía al inicio y entrada de 8 a 80 batches por día (≈ 55 de media; por eso los IC son anchos). Siguen aleatorios las fallas, los tiempos entre pallets dentro del camión y el peso de los pallets de PT.
**Regla del equipo: no se compara contra el tablero ni contra los valores reales de la planta**; se quitaron del video y de los documentos las comparaciones y las frases de validación.

| Cifra | Antes (arribos de tabla, batch 1500 kg) | Ahora |
|---|---|---|
| E1 pallets/día · t/día | 63,2 ± 1,2 · 54,8 | 49,1 ± 14,9 · 42,5 ± 12,6 |
| E2 contra E1 | +12,0 [+10,8 ; +13,2] | +9,3 [+4,5 ; +14,1] (+18,9 %) |
| E3 | +0,5 contra E2 [+0,1 ; +0,9] (E3 = 24 pallets/turno) | +3,6 contra E2 [−0,3 ; +7,5], incluye el cero (E3 = 1,5× la MP) |
| E4 | −3,7 [−4,4 ; −3,0] (1200 contra 1500 kg) | +0,6 [−0,0 ; +1,2], incluye el cero (1200 contra 1050 kg, 8 contra 7 cargas) |
| Cuello E1 | mezcladoras 65,2 t/día, 91 % | mezcladoras 60,5 t/día, 75 %; siguiente desencajado 74,7 (formado 87,0) |
| Cuello E2 | desencajado 74,2 | desencajado 74,7; le sigue mezclado 77,9 |
| Cámaras de MP en E3 | 6,4 → 21,7 | 19,4 → 30,3 (máx 68) |
| Comparación (pallets/día) | 63,2 · 75,2 · 75,7 · 59,5 | 49,1 · 58,4 · 62,0 · 49,7 |
| Tiempos de la hipótesis | 58 min · 15 min · 20 + 30 min | 41 min por batch · 10,5 min · 14 + 30 min |

Composiciones HyperFrames modificadas (sin re-renderizar; no cambió ninguna duración ni `data-start`): `s04-cifras` (1050 kg, 55 batches por día, 58 t de mezcla), `s04-real` (se quitó "Tablero real: 56,0 t/día" y "¿El modelo es válido?": ahora "Producción de la planta" y "¿Dónde se frena?"), `s04-veredicto` (barras 60,5 / 74,7 / 87,0 t a 12 px por tonelada, línea de referencia en ≈58 t/día, pills "75 % ocupadas" y "Entrada: 8 a 80 batches/día"), `s04b-base`, `s04-hipotesis` (tiempos por batch), `s06-flexsim` (42,5 t, 49,1 pallets, 75 %), `s06-karaoke` (batch de 1050 kg, siete cargas), `s08-web` (rótulos de E2 y cuello), `s10-cierre` (conclusiones sin "válido", +9 pallets) y `s09-acto6` (ruedas de dígitos, tarjeta de entrada de MP en lugar de la validación, intervalos de E2, E3 y E4 con la escala de cada eje recalculada, barras a 5,325 px por pallet para 49,1 · 58,4 · 62,0 · 49,7, IC de la tabla, texto del karaoke). Guiones: `guion_equipo.md` (D32 a D40) y `guion_ia.md`.
**Pendiente de rodaje:** (1) hay que volver a grabar la narración del Acto 6 con el guion nuevo, y la voz sintética `Video_TPI_actualizado_voz_acto6.mp4` y el render `Video_TPI_actualizado.mp4` quedaron con las cifras anteriores hasta que se re-renderice; (2) los cuadros de la web de `s08-web` (`assets/web/st/*.png`) y el rótulo de cajas, fallas y kg del balance (ca1 a ca18) vienen de la corrida anterior y no coinciden con el modelo nuevo; hay que re-capturar la web; (3) las tomas de FlexSim de E2, E3 y E4 son del modelo previo; (4) el transitorio de ≈ 4 h se midió con el modelo anterior y no se repitió.

## Acto 3: toma nueva del tablero y acortamiento (11/11/2026)

- **Toma:** `film/assets/flexsim/e1_tablero_ciclo.mp4` (no se sube: los `.mp4` están en `.gitignore`). Sale de una grabación de pantalla de 106 s de una corrida real del modelo nuevo; se recortó de 39,4 a 95,4 s, que es un ciclo completo de las 7 hojas del tablero (8 s cada una: Producción, Colas y WIP, Paradas, Velocidad, Balance de masa, Montacargas, Estadística). Se quitaron el tiempo muerto inicial (0 a 39,4 s) y las hojas repetidas del segundo recorrido (95,4 a 106 s). Fundido de 0,4 s al inicio y al final.
- **Escena `s06-flexsim`:** pasó de 123,4 a 68 s (56 s de toma + 12 s de conclusiones). `s06-karaoke` pasó de 111,4 a 56 s, con una frase por hoja (7 frases, tiempos en segundos de la toma). Se quitaron los remarcados `ann-s06-a/b` (apuntaban a la toma vieja) y la etiqueta "Acá se forma la cola" quedó solo mientras se ve la hoja de Colas y WIP (8,6 a 15,4 s de la toma).
- **Desplazamiento:** todo lo posterior se movió 55,428571 s hacia adelante en el tiempo. Nuevos inicios: `s07-mcp` 232,533; `s07b-idea-web` 323,033; `s08-web` 340,033; `s09-acto6` 480,367 (`HOST` de su karaoke actualizado); `ann-s09-e1` 598,667; `s10-cierre` 795,367; `logo-outro` 832,367. Duración total: 839,367 s (13:59,4). `s99-subs` (numeración de diapositivas) reajustado.
- **Narración que hay que grabar de nuevo:** Acto 3 (las 7 frases de `s06-karaoke.html`) y Acto 6 (el desplazamiento de 55,43 s invalida los audios sintéticos ya generados, que usaban `adelay=536295`; el nuevo es `adelay=480367`).
- **Render:** `film/renders/Video_TPI_actualizado.mp4` se volvió a renderizar con esta línea de tiempo (sin voz).

## Correcciones del 11/11/2026 (segunda tanda)

- **Diapo 1:** logo P que se arma con cinco piezas (caída, rodado y subida) y estallido final (`s01-chispa.html`).
- **Diapo 18, 30, 33, 43:** flechas separadas, frase del pie más profesional, capturas de los celulares centradas con datos relevantes, y la conclusión del Acto 6 sin hablar del desencajado.
- **Diapo 28:** dos ventanas de escritorio al estilo de la app de Claude (no celular), armadas a mano porque el catálogo solo trae `claude-exchange` en vertical.
- **Diapo 29:** `ui-3d-reveal` adaptado (`compositions/ui-3d-mcp.html`): la P reemplaza el logo de Figma y el editor lista las herramientas del MCP.
- **Diapo 34:** cinemática nueva "Pallet a la caja + gráficas" (`assets/web/cine_resumen.mp4`, grabada con reloj virtual) y 22 paradas con capturas nuevas, zoom in/out y `cursor-annotate` en 8 de ellas. Las capturas salen de la reproducción a media corrida: los textos solo llevan cifras fijas.
- **Diapo 42:** `data-chart` (`data-chart-esc.html`) con pallets y toneladas por día de E1 a E4.
- **Nuevas diapos 44 a 46 (`s09c-casos.html`):** una cinemática de la web por caso (E2, E3 y E4) con problema, propuesta, corrida, cambio y conclusión. Las tomas de problema usan el modelo base en vivo; los paneles de barras son resultados del estudio (10 réplicas de 24 h, IC 95 %), no datos en vivo. Se grabaron en `assets/web/ce2.mp4`, `ce3.mp4` y `ce4.mp4` (ignorados por git). Cierre y logo final quedaron como diapos 47 a 49; el video pasó de 839 a 964 s.
- **Efecto global:** viñeta estática suave sobre todo el video.
- **Efectos del catálogo que no se usaron, con motivo:** los de fondo animado con shader (aurora, plasma, nebula, etc.) restan legibilidad a las capturas de la planta; los de redes sociales (x-post, instagram, tiktok, spotify, reddit) no corresponden al rubro; los mapas (us-map, world-map, spain-map) no tienen relación con la planta; `grain-overlay` se animaba por CSS, que no es seek-determinista en el render; el resto de transiciones se evaluaron contra las ya usadas (shutter, wipe, glitch, shatter) para no saturar.

### Escenarios E2 a E4 corridos en vivo (11/11/2026)
Las diapos 44 a 46 usan grabaciones de la web con FlexSim corriendo de verdad (réplica 1, 24 h simuladas, publicador a la web): `Tools/padBase` 1,554 para E2; E2 más `Tools/camFrac` 0,75 (1,5× la materia prima) para E3; `splitquantity` 8 en las cuatro mezcladoras y ciclos ×8/7 (desencajado 2800 s, picadora 720 s, mezclado 960 s) para E4. "Problema" y "propuesta" se grabaron con el modelo base cargado; "corrida", "cambio" y "conclusión" con la corrida del escenario (cinemáticas `e2r`, `e3r`, `e4r` de la web). Los paneles de barras siguen siendo el promedio de 10 réplicas del estudio. Después se restauró el modelo base y `pubPort` en 3000. Diapo 34: vista general de cada hoja, zoom al dato y `cursor-annotate` sobre el dato, con subtítulos propios; el resto sin subtítulos.

### Reordenamiento de escenarios (11/11/2026, noche)
- **Diapo 35:** distribuciones en términos de la cátedra: llegadas de MP empírica (datos reales remuestreados; K-S rechaza la exponencial), tiempos de proceso determinísticos (salvo el ritmo diario de formado, empírico), tiempo entre fallas (MTBF) exponencial y reparación (MTTR) lognormal.
- **Diapos 39 a 41:** antes de la conclusión de cada escenario se inserta el video web de la corrida que hicimos con FlexSim (`ce2.mp4`, `ce3.mp4`, `ce4.mp4`; problema, propuesta, corrida, cambio y conclusión), a 1,25×, con subtítulos propios por toma. El hueco se abre con `tl.shiftChildren` en `s09-acto6.html` (163,0 s +49,6; 210,1 s +51,2; 251,2 s +43,2). El Acto 6 pasa de 315 a 459 s.
- Se eliminaron las diapos 44 a 46 que repetían esos videos (`s09c-casos.html` ya no está montado) y las tomas viejas de fondo. Los subtítulos solo existen en la diapo 34 y en estos videos. Cierre y logo: diapos 44 a 46. El video dura 983,4 s.

## Audio y revisión del 11/11/2026 (tarde)
- **Videos de la PC de Felipe** (`OneDrive_1_11-11-2026`, no versionables): `ce2/ce3/ce4.mp4`, `cine_resumen.mp4` y `e1_tablero_ciclo.mp4` se copiaron a `film/assets/web` y `film/assets/flexsim`; `Video Flexsim.mp4` (2560×1368, 231 s) quedó respaldado en `Desktop/Videos Simulación`. Con eso no falta ningún asset referenciado por el film (39 rutas verificadas).
- **Audio:** se armó `video_presentacion/audio/` (ver su `README.md`): música a 128 BPM, efectos por corte/golpe/anotación y la cadena de locución con Fish Audio, ya montados como tres `<audio>` en `index.html`. La voz IA queda en silencio hasta cargar la clave y la voz de Fish. 45 frases de IA, ubicadas con los tiempos reales del film; 5 textos se acortaron en `audio/ajustes_texto.json` porque no entraban en su diapositiva.
- **Error corregido:** el `data-chart` de la diapo 42 (`dc-esc`) quedó en 760,6 s cuando se insertaron los videos de E2 a E4 en el Acto 6 (+144 s); tapaba el video de E3. Ahora empieza en 904,6 s (verificado con `hyperframes snapshot`).
- **Revisión:** `hyperframes lint` da 0 errores y 23 avisos (media local/global anidada en `s09c-casos` y `s10-cierre`, tweens solapados en `ui-3d-*`, z-index negativo en `vfx-shatter`; `s09c-casos.html` ya no está montado). El karaoke del Acto 6 está oculto a propósito (`#k-box { display:none }`); sus tiempos ya no se corrigieron por el hueco de los videos, así que si se vuelve a mostrar hay que sumar los GAPS (`audio/cues.py` ya lo hace para la voz de reserva).
- **Voz y efectos generados (11/11/2026, tarde):** locución de 45 frases con Fish Audio (voz "Farid dieck", id `bbb58201ae334cbab97922c9158b0fa8`, modelo `s2.1-pro-free`; el crédito de API es 0, los modelos pagos responden 402). Todas entran en su ventana (el informe real, `audio/informe_voz.txt`, da x1,00 a x1,15); se volvió al texto original del guion en Rubro, D7 y Escenario base, y solo quedan acortados D19 y D24 (`audio/ajustes_texto.json`). Efectos: 12 muestras de ElevenLabs (`/v1/sound-generation`, plan free) sobre los 110 eventos de `cues_sfx.json`; la música sigue siendo sintética. Mezcla con ducking: voz −16,3 LUFS, mezcla completa −18,5 LUFS (`audio/preview_mezcla.mp3`). Volúmenes en `index.html`: música ×1,5, efectos ×0,55, voz ×1.

### Recorte a 14:45 (12/11/2026)
El video pasó de 983,4 s (16:23) a 885,2 s (**14:45**, tope pedido: 15:00). Recortes (−98,2 s) y su motivo:
- **Diapo 32 (D30 "en uso") fuera, −15 s:** repetía lo que dice D29 (herramientas del MCP). `s07-mcp` termina en 75,5 s y su última transición se quitó.
- **Web (`s08-web`): fuera los apartados Colas y WIP, Balance de masa y Montacargas, −31,6 s:** ya se vieron en el tablero de FlexSim (Acto 3, `s06-flexsim`). Quedan Producción, Paradas, Velocidad, Estadística y Escenarios. Se sacaron también 8 anotaciones `ann-s08-*` (9, 10, 11, 16, 17, 18, 20, 21) y las filas D31 de esos tres apartados.
- **Videos de las corridas E2 a E4 (`s09-acto6`), −42,9 s:** arrancan en "la propuesta"; se quitó el repaso del problema (lo dice la narración del equipo justo antes: 16,7 s en E2, 17,1 s en E3, 9,1 s en E4). `data-media-start` 20,875 / 21,375 / 11,375 s a 1,25×; gaps 32,9 / 34,1 / 34,1 s.
- **Cierre (`s10-cierre`), −8,7 s:** el baile del final empieza a los 22,3 s (antes 28 s), sin los 6 s sin movimiento.
Todos los `data-start`, `data-duration`, la numeración de diapositivas (`s99-subs`) y los tiempos de la voz y los efectos se recalcularon con el mismo mapa de recortes. Los respaldos del estado anterior no se versionaron: el proyecto original sigue en `origin/main` (`b1a177c`).
**Para volver a un video más largo** hay que revertir esas cuatro escenas (git) y correr `audio/cues.py` de nuevo (las constantes de tiempo de ese script y las de `generar_efectos.py` están en 885,17 s).
**Efectos de sonido:** ahora hay un efecto por cada aparición, movimiento y transición de las escenas animadas (≈ 490 eventos) y un ambiente de planta bajo las tomas de Blender, FlexSim y la web. Las diapositivas quietas del Acto 6 no tienen animaciones que sonorizar. Revisión del montaje: `hyperframes check` sin errores (lint, runtime, layout, motion, contraste, audio).


## 13/11/2026 · Audios del equipo y tiempos
- Se incorporaron las grabaciones del equipo (`audio/equipo/`, ver `audio/README.md`). La IA habla en las diapositivas que no son de las corridas; el equipo, en la toma de FlexSim, la web, E3, E4 y las conclusiones.
- Duración final: 14:20 (860,4 s). El video se ajusta a la voz: cada frase tiene una ventana igual a lo que dura la voz más 0,8 s, el barrido karaoke dura lo que dura la voz y ninguna voz va acelerada. Se ocultó el número de diapositiva. Diapositiva 26 (conclusión de la simulación): 20,3 s, antes 12. Diapositiva 44 (conclusiones): 17,5 s, antes 12.
- Web (diapositiva 34): la caminata por la planta va a 2,2x y el tramo de gráficos a 1x, para poder leerlos; los apartados duran lo que dura cada frase (60 s, antes 55).
- Tiempos muertos recortados: diapositivas 36, 37, 38 y 43 ahora duran la voz de cada frase más 0,8 s.
- Subtítulos de la web y de las corridas E2 a E4 con barrido karaoke. Con el audio de E2 y E3 (`escenarios_E2_E3.m4a`) están todas las voces del equipo.
