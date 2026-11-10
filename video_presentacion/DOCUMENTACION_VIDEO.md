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
| Materia prima | 16 pallets por turno, 72 t/día; tiempos entre arribos de la tabla empírica (Monte Carlo) | `SUPUESTOS_v2.md:12`, `iat_cdf.csv` | Parámetro oficial, arribos aleatorios desde el 10/11 |
| Lavado de mezcladora | 30 min por batch | `SUPUESTOS_v2.md:9` | Dato de planta |
| Etapas | Desencajado, picado, mezclado, formado, túnel, envasado, encajonado, estibado | `dashboard/web/public/e1/cuellos.json` | Modelo |
| **Cuello de botella E1** | **Mezcladoras: 65,2 t/día, 91 % ocupadas** (siguiente: desencajado, 74,2 t/día) | `datos_trazabilidad/e1_final/E1_FINAL.md`, `estocastico/`, `cuellos.json` | Simulación, 10 réplicas |
| Capacidad desencajado | 74,2 t/día (97 % ocupado), siguiente restricción | `cuellos.json` | Simulación |
| Capacidad formado | 87,2 t/día (64 % ocupado) | `cuellos.json` | Simulación |
| Formadora | 982 kg/h base, 1843 kg/h en E2 | `SUPUESTOS_v2.md:11` | Parámetros oficiales |
| Métrica oficial | Toneladas por día | `SUPUESTOS_v2.md:13`, `PENDIENTES.md:6` | Criterio de validación |
| Tablero real | 56,0 t/día, 64,9 pallets/día (L7 + L8) | `SUPUESTOS_v2.md:127` | Dato real Sep–Oct |
| E1 modelo | 54,8 t/día (−2,1 %), 63,2 ± 1,2 pallets/día (−2,6 % contra 64,9 reales) | `E1_FINAL.md` | Simulación |
| Réplicas e IC | 10 réplicas de 24 h, IC 95 %, t = 2,262 | `E1_FINAL.md:9,13` | Método |
| E2 | +12,0 pal/día (+19,0 %), IC [+10,8 ; +13,2]; cuello pasa al desencajado | `E1_FINAL.md` | Simulación |
| E3 (nuevo) | E2 + 24 pallets MP por turno: 75,7 pal/día, +0,5 contra E2 (IC [+0,1 ; +0,9], +0,7 %) | `E1_FINAL.md` | Simulación |
| E4 | 1200 contra 1500 kg con lavado: −4,0 [−4,6 ; −3,4] | `E1_FINAL.md:76` | Simulación |
| E5 (antes E3) | MTTR ×1,25: sin efecto; medido sin lavado | `PENDIENTES.md:22` | Simulación |

## 4. Correcciones aplicadas a `etapas/` y `guiones/`

Estos valores venían de la corrida histórica sin lavado y ya se corrigieron en los documentos (`guion_ia.md`, `guion_equipo.md`, `ACTO1-2`, `ACTO3`, `ACTO4`, `ACTO6`, `checklist.md`, `PROMPT_VIDEO_PATY.md`). El 89,4 y el +37,8 % siguen solo como relato de la primera corrida. Bondad de ajuste: K-S rechaza en arribos, paradas y pesos, al revés de lo que decía el Acto 6.

| Dónde | Dice | Vigente |
|---|---|---|
| ACTO3 y `guion_ia.md` | 89 pallets por día | 63,2 pal/día, 54,8 t/día. El 89,4 es sin lavado (y con pallet de 720 kg) |
| ACTO3 §1 | "formadora (cuello declarado)" | Mezcladoras. La formadora fue la hipótesis inicial |
| ACTO3, ACTO4 | +37,8 % vs tablero, como quiebre | Es real pero histórico: 89,4 contra 64,9 pallets, sin lavado. Con lavado, arribos y pallets aleatorios valida a −2,1 % en toneladas y −2,6 % en pallets |
| ACTO3, ACTO4 | Se valida gracias al MCP y luego hipótesis de lavado | Confirmar el relato: la validación cierra con el lavado de 30 min, dato de planta |
| ACTO6 §2 | E2 +2,5 pal/día (+2,8 %), cuello a recepción | +12,0 pal/día (+19,0 %), cuello al desencajado |
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

Desencajado 3500 s por pallet, picado 900 s por batch, mezclado 1200 s por batch, formado 18,33 s por bandeja, túnel 5 min de pasada, envasado 150 paquetes por minuto, encajonado 5 s por caja llena, estibado de ≈173 cajas por pallet (peso real ÷ 5 kg; `SUPUESTOS_v2.md` T2–T11). El lavado no se muestra a propósito: se revela en el Acto 4.

## 12. Operario

El saludo del operario (`assets/renders/operario.mp4`) se reserva para la diapositiva final del video.

## 13. FlexSim en vivo (D21–D22)

D21 es la grabación real de pantalla de PLANTASJ.fsm con el tablero (ilm/assets/flexsim/corrida.mp4, 3:00, recorte desde 4,5 s; la maneja el equipo y la locución va en guion_ia.md, 0:00–2:28). D22 es la primera corrida (89,4 contra 64,9 pallets/día, +37,8 %, E1_FINAL.md:31). Duración total del video: 5:17,5.


Karaoke de la toma de FlexSim (s06-karaoke.html): 17 frases con barrido rojo, una por vista. Datos: 96/100 objetos (PENDIENTES.md), notas del propio tablero (meta 36 pal/día/línea; formadora 982 y estándar 1843 kg/h; 1 pallet MP = 1 batch de 1500 kg, 1 pallet PT ≈ 173 cajas), 4 montacargas (SUPUESTOS_v2.md P4) y transitorio ≈ 4 h (E1_FINAL.md). Tiempos de cada hoja medidos sobre la grabación.


## 14. Diapositivas del MCP (D23–D30)

`film/compositions/s07-mcp.html` y `s04-veredicto.html`. Catálogo adaptado: `strikethrough-replace`, `chat-message`, `headline-slam`, `tracing-beam`, `code-terminal-run`, `slot-machine-roll`.

| Dato | Valor | Fuente |
|---|---|---|
| Herramientas | 73 | `@mcp.tool` y `async def flexsim_` en `mcp_server/flexsim_mcp.py` (ambos 73) |
| Categorías | 8: 14, 12, 11, 10, 7, 6, 7, 6 | `etapas/ACTO4_mcp_propio.md` |
| Salidas de D28 | End: 8.00h, Time: 8.00h | Llamadas reales al MCP durante la producción del video |
| Validación | 54,8 contra 56,0 t/día (−2,1 %); 63,2 contra 64,9 pallets/día (−2,6 %) | `E1_FINAL.md` |

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

## 21. Vista móvil en D31

Antes de la PC, tres celulares en abanico (mecánica del bloque `app-showcase`) con capturas reales de la web en diseño móvil (`assets/web/st/m1-m3.png`). Dura 17 s.

## 22. Web sin subtítulos

En la diapositiva de la web habla la IA, así que se quitó el karaoke de toda esa diapositiva. Las etiquetas con el dato de cada gráfica siguen.

## 23. Consigna de la cátedra

Agregados: rubro y actividad (`s03b-rubro`), escenario base con turnos, recursos y capacidades (`s04b-base`, datos de `SUPUESTOS_v2.md`), marcado de la cola en la corrida y tabla comparativa de E1 a E4 (Acto 6). Elaborados se acortó de 44 a 20 s. PATY se mantiene porque es una marca y no el nombre de la empresa. La ejecución de E2, E3 y E4 se agregó el 9/11/2026 (sección 24).

## 24. Tomas de FlexSim de E2, E3 y E4

Tomas reales de la corrida de cada escenario alternativo, sumadas a sus diapositivas del Acto 6 (`compositions/s09-acto6.html`, `#s4`, `#s5` y `#s6`) sin cambiar ninguna duración.

- **Modelo:** copia de `PLANTASJ.fsm` en una carpeta temporal (el original no se modificó), abierta en FlexSim 2026. Base: E1 con lavado de 30 min (`SetupTime` 1800 s en `MezA/B_L7/L8`), 10 cargas por batch y 16 pallets por turno. Fuentes de la configuración: `SUPUESTOS_v2.md` (líneas 124 y 125) y `datos_trazabilidad/e1_final/E1_FINAL.md`.
- **E2:** `entrySpacePadding` de `CintaFormA/B_L7/L8` de 3,27 a 1,554 m.
- **E3:** E2 más 24 pallets de materia prima por turno: en el calendario de `SrcCamionesMP`, cantidad 2 en las filas pares (2 a 16). Verificado: 24 pallets recibidos a las 4 h simuladas.
- **E4:** desde E1 (separación 3,27 m), `splitquantity` de las 4 mezcladoras de 10 a 8 cargas (8 × 150 kg = 1200 kg por batch), tiempo de ciclo de `Desencajado_L7/L8` de 3500 a 2800 s y de `Picadora_L7/L8` de 900 a 720 s (×0,8), y 20 pallets por turno (cantidad 2 en las filas 4, 8, 12 y 16). Verificado: 20 pallets recibidos a las 4 h. El lavado de 30 min se mantiene.
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
**s09-acto6 #s3 (E1, abs 654,10 a 657,05 s, local 118,3).** `cursor-annotate` (mount ann-s09-e1, z-index 45): bucle rojo alrededor de "91 %" de Ocupación de las mezcladoras, cuando el karaoke dice "noventa y uno por ciento".
**s09-acto6 #s7 (Comparación, local 280,5 a 290; abs 816,3 a 826,3 s).** `data-chart` (adaptado, no montado: el bloque instalado es una demo clara con datos propios): ejes y líneas de guía verticales en 0, 25, 50, 75 y 100 pallets por día, a la misma escala que las barras de la diapositiva (5,325 px por pallet), que ahora valen: E1 63,2; E2 75,2; E3 75,7; E4 59,5. Aparecen en local 281,1 a 282,3 s. Los valores 0 a 100 son solo la escala del eje.
**s09-acto6 #s8 (Conclusión, local 290 a 315; abs 825,8 a 850,8 s).** `caption-kinetic-slam` (adaptado, no montado: trae un texto fijo en inglés): cada palabra de "1.º Formadoras", "2.º Desencajado" (local 290,7 y 291,5 s, paso 0,28 s) e "Intervalos, no corridas sueltas" (local 304,3 s, paso 0,22 s) entra desde un lado distinto (arriba con rebote, izquierda, derecha, escala), con SF Pro Display como el resto.

Validación: `npx hyperframes check --json` sin errores (solo avisos previos) y snapshots revisados en 152,2, 194,6, 309,5, 313,5, 460,5, 655,3, 818,8, 827,8 y 841,3 s.

Ajuste del 9/11/2026: en la toma de FlexSim se quitaron los recuadros rojos (`q-ring`) y quedó solo el trazo a mano de `cursor-annotate`, que ahora se mantiene hasta que se va el rótulo (193,5 a 210,5 s); en E1 el trazo sobre el 91 % queda hasta el final de la diapositiva (654,1 a 670,8 s). La lapicera se retira apenas termina de dibujar (cambio local en `compositions/components/cursor-annotate.html`).


## Actualización 10/11/2026: modelo con arribos y pallets aleatorios
El modelo oficial (`PLANTASJ.fsm`) ahora sortea los tiempos entre arribos de MP con la tabla empírica y el peso de cada pallet de PT con los 500 pesos reales. Se re-corrieron E1 a E4 (10 réplicas, mismos streams) y cambiaron las cifras del Acto 6, del Acto 4 (validación y veredicto) y del cierre:

| Cifra | Antes (llegadas fijas, pallet de 720 kg) | Ahora |
|---|---|---|
| E1 pallets/día · t/día | 75,3 · 54,9 | 63,2 ± 1,2 · 54,8 |
| Validación contra el tablero | −1,9 % en toneladas (+16 % en pallets) | −2,1 % en toneladas y −2,6 % en pallets |
| E2 contra E1 | +14,4 pal/día (+19,1 %), IC [+13,8 ; +15,0] | +12,0 pal/día (+19,0 %), IC [+10,8 ; +13,2] |
| E3 contra E2 | −0,1 [−0,3 ; +0,1] (incluye el cero) | +0,5 [+0,1 ; +0,9] (+0,7 %: casi no suma) |
| E4 1200 contra 1500 kg | −4,0 [−4,6 ; −3,4] | −3,7 [−4,4 ; −3,0] (−5,9 %) |
| Cuello E1 | mezcladoras 65,3 t/día, cola 3,5 lotes | mezcladoras 65,2 t/día, 91 % (siguiente: desencajado 74,2); la cola de entrada no se midió en la corrida nueva |
| Comparación (pallets/día) | 75,3 · 89,7 · 89,6 · 71,3 | 63,2 · 75,2 · 75,7 · 59,5 |
| Cámaras de MP en E3 | 6,3 → 21,8 | 6,4 → 21,7 |

Escenas modificadas (HyperFrames): `s09-acto6` (cifras, ruedas de dígitos, intervalos, barras a 5,325 px por pallet, texto del karaoke), `s04-veredicto` (65,2 y 74,2 t), `s06-flexsim`, `s08-web`, `s10-cierre`, `s04-hipotesis`, `s04b-base`, `s06-karaoke` (≈173 cajas por pallet). Guiones: `guion_equipo.md` (D32 a D40) y `guion_ia.md` (D21). **El equipo tiene que volver a grabar la narración del Acto 6 con el guion nuevo**; los tiempos del karaoke no se tocaron y el video ya se re-renderizó con el texto nuevo. Las tomas de fondo de FlexSim de E2, E3 y E4 (`assets/flexsim/e2.mp4`, `e3.mp4`, `e4.mp4`, que no se versionan y solo estaban en la PC de Jeremías) **se regrabaron el 10/11/2026 con el modelo nuevo** (receta de la sección anterior más `Tools/GenArribos` después de `resetmodel()`; réplica 1, de las 4:00 a las 4:05 h simuladas a velocidad 20), capturando la ventana de FlexSim 2027 con `PrintWindow` (la pantalla estaba bloqueada) a ≈5 cuadros por segundo, interpolados a 30 fps con `ffmpeg` (1920 × 1080, H.264). Siguen sin versionarse. El MP4 renderizado con las cifras nuevas queda en `film/renders/Video_TPI_actualizado.mp4` (HyperFrames 0.9.20, `-q looks`, FFmpeg instalado con winget).

**Narración provisional del Acto 6 (10/11/2026).** Para que el video no quede mudo en el Acto 6 se generó una narración sintética con la voz es-AR-TomasNeural (Edge TTS, la misma familia de voces de `assets/voz`), una frase por segmento del karaoke de `s09-acto6.html` (34 frases con el texto nuevo de `guion_equipo.md`), ubicada en el segundo exacto de cada una (film 536,3 a 850,3 s) y acelerada hasta 1,6x solo cuando la frase no entraba en su ventana. Archivo: `film/renders/Video_TPI_actualizado_voz_acto6.mp4` (el MP4 sin audio, `Video_TPI_actualizado.mp4`, queda como base). **Es una voz de reserva: el plan original es que los integrantes graben el Acto 6 siguiendo el karaoke**; cuando lo hagan, se reemplaza esa pista. El resto del video no tiene audio en el proyecto (la voz de la IA se agrega en edición).
