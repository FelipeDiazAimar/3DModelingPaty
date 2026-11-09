# SUPER-PROMPT VIDEO PATY SAN JORGE — para Claude (Opus 3.5 / Code)

> Pegar esto en OpenCode/Claude dentro de `FabricaPaty_SanJorge/video_presentacion/`.
> Regla dura: el video NO se genera con IA generativa de video. Lo genera CÓDIGO que escribe la IA (HTML+CSS+JS determinístico → MP4). Ver `motion.md`.

## 0. Setup obligatorio antes de animar nada

1. Skills ya instaladas en `video_presentacion/.agents/skills/`:
   - `hyperframes`, `hyperframes-cli`, `hyperframes-registry`, `media-use`, `slideshow` (core, Apache-2.0, gratis, local, sin cuenta)
   - `explainer-high-energy`, `explainer-default`, `explainer-engaging`, `motion-broll`, `sound-effects`, `object-separation` (Barty-Bart, MIT, gratis)
2. ANTES de diseñar, generar o animar cualquier cosa, LEER:
   - `.agents/skills/hyperframes/references/motion.md` (toda, es la biblia: moves 0.3-0.6s, ease por rol, overlap 30-50%, títulos quietos al aterrizar, transiciones con causa, beat grid)
   - `.agents/skills/hyperframes/references/story.md` + `sound.md` + `review.md`
   - `.agents/skills/explainer-high-energy/SKILL.md` (estructura hype 12-20s, beat-locked)
   - `.agents/skills/motion-broll/SKILL.md` + `.agents/skills/sound-effects/SKILL.md`
   - Docs: https://hyperframes.heygen.com/prompting/motion + https://hyperframes.heygen.com/guides/motion-graphics
3. Contrato de página (Hyperframes): un HTML autocontenido, `window.VIDEO={w,h,duration}` + `window.seek(t)` función pura del tiempo. Sin CSS animations/transitions, sin setTimeout, sin Math.random (seeded sí). Fuentes embebidas base64. Con `?render` sin controles, stage exacto w×h.
4. Validar siempre: `npx hyperframes check`, `npx hyperframes snapshot`, `npx hyperframes keyframes --json`. Render local con ffmpeg/puppeteer, gratis.

## 1. Regla musical — cada golpe cae en un corte

- Fijar BPM (default 128) y grid: `frames_por_beat = fps × 60 / BPM`. Calcular cada beat desde índice y redondear, nunca sumar beats redondeados (deriva).
- Cambios grandes en beats, tipografía en 1/8 o 1/16. Cortes en el frame más rápido del move, con misma dirección/velocidad a ambos lados.
- Sintetizar música (kick en cada beat, clap 2 y 4, riser antes de slam, boom en cada flood, whoosh en cada transición llevada). Ver `sound-effects/SKILL.md`. Mezclar música bajo los hits.
- Ritmo: showreel 1-4s por idea, demo sostiene 7-10s un encuadre mientras la UI actúa. Shots promedio 1.8-3s.

## 2. Por qué NO After Effects MCP

- `Dakkshin/after-effects-mcp` (https://github.com/Dakkshin/after-effects-mcp) es código gratis (MIT), pero exige Adobe After Effects 2022+ con LICENCIA PAGA. Sin licencia no rinde, y pide panel `mcp-bridge-auto.jsx` + Node. No lo usamos.
- Usamos Hyperframes + motion-graphics: 100% gratis, open source, render local sin cuenta. Studio app de HeyGen es opcional (cuenta free) solo si se quiere preview con agente al lado.

## 3. Estructura del video (7 actos, 17 pasos, sin límite de duración)

Reglas globales: voz IA en intro/desarrollo/transiciones, se CALLA en stats web (hablan compañeros en vivo). Teleprompter karaoke al pie: blanco que se barre en rojo al ritmo de lectura; anti-duplicación (si el texto ya está en diapositiva/pantalla, sin subtítulo). Transiciones cool y smooth, 3-5 tipos con causa (whip-pan, cinematic-zoom, morph, flood color, objeto-que-se-vuelve-mundo). 1920×1080, 30fps.

- ACTO 1 Apertura (IA): 1 portada (Línea hamburguesas Paty, planta San Jorge, problemática + integrantes) / 2 diapo problema general.
- ACTO 2 Blender (IA): 3 viaje cinemático a Blender / 4 cómo modelamos con IA (operario.glb 62 huesos 10 clips, planta_luz horneado, scripts blender/).
- ACTO 3 FlexSim (IA): 5 viaje a FlexSim (PLANTASJ.fsm) / 6 recorrido 3D breve / 7 stats nativas por encima con zoom in/out por solapa.
- ACTO 4 Quiebre+MCP (IA): 8 diapo "no nos quedamos con HTML básico, vara alta" / 9 diapo qué-es-un-MCP + ingeniería propia (puerto + terminal Python, no existía oficial) / 10 demo 73 tools reales (telemetría tiempo real + crear objetos/conexiones/dashboards).
- ACTO 5 Web inmersiva (IA): 11 presentación dashboard web (replica FlexSim en vivo, localhost:3000) / 12 camión que llega manejado por IA + primera persona a pie (F/G, bocina) / 13 ciclo elaborados, 8 etapas de cerca.
- ACTO 6 Stats+escenarios (EQUIPO en vivo, IA callada): 14 gráficas cátedra con zoom (kg/h ventana 1h, utilización, histogramas Paros/Pesos, MTBF Pareto, etc.) / 15 tres escenarios sobre base con cinemáticas + relato compañeros.
- ACTO 7 Cierre: 16 saludo operario 3D / 17 diapo final (gracias, preguntas, repos MCP+proyecto, archivos clave para profesor).

## 4. Qué debe hacer Claude

1. Documentar cada etapa en `video_presentacion/etapas/ACTO{1..7}_*.md` (qué se muestra, quién habla, timestamps/beats, archivos fuente con ruta:línea).
2. Decidir él cómo usar las skills (nuestras ideas de cinemáticas son ideas, él elige bloques del registry: `npx hyperframes catalog --tag transition --json`, `--tag camera`, `code-typing`, `data-chart`, `apple-money-count`, etc.).
3. Armar beat sheet primero (escena, tiempo en grid, qué entra/sale, qué acarrea la transición, sonido), después construir.
4. Guion doble: `guion_ia.md` (locución) + `guion_equipo.md` (3 compañeros, reparto por bloques, timing karaoke). Teleprompter con `performance.now()` por palabra, rojo #ff1f3d, máx 2 líneas, drift <300ms.
5. Loguear progreso en `video_presentacion/progreso.log` formato `ACTO|SKILL|OK/FAIL|path`. Gate: no avanza de acto sin clip+audio+timing.
6. Salida: `video_presentacion/tomas/`, `audio/`, `edit/`, `video_final.mp4` 1080p + checklist 17/17.

Fuentes proyecto: `README.md`, `CONTEXTO_MASTER_SIMULACION.md`, `SUPUESTOS*.md`, `dashboard/web/components/Scene3D.tsx`, `Walk.tsx`, `OperariosPlanta.tsx`, `Chart.tsx`, `lib/cine.ts`, `vehicleFx.ts`, `documentacion/02..08_*.md`, `datos_trazabilidad/e1_final/`, `PLANTASJ.fsm`, `iniciar_web.bat`.
