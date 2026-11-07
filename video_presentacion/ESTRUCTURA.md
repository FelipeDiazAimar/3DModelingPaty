# ESTRUCTURA video_presentacion/ — leer antes de codear

## Dónde está cada cosa

- `PROMPT_VIDEO_PATY.md` — super-prompt del video (7 actos, reglas). Ya corregido: MCP tiene **73 tools reales**, no 82.
- `etapas/ACTO*.md` — documentación de cada acto (6 archivos, listos). Fuente de verdad del contenido.
- `film/` — proyecto Hyperframes (único lugar con código de video). Scaffold blank ya creado (`index.html`, `hyperframes.json`). Escenas nuevas van en `film/compositions/`, media y fuentes en `film/assets/`. NO codear video fuera de `film/`.
- `guiones/guion_ia.md` — locución IA (actos 1-5, 7). `guiones/guion_equipo.md` — texto en vivo compañeros (acto 6 + escenarios).
- `tomas/` — clips grabados de FlexSim/web/Blender (`AXX_fuente_vN.mp4` + `AXX_meta.json`).
- `audio/` — voz TTS + música (`AXX_voz.wav`, `AXX_mute.json` con rangos CALLA).
- `teleprompter/` — overlay karaoke + `AXX_timing.json` por acto.
- `edit/` — transiciones entre actos (`AXX_AYY_trans.mp4`).
- `progreso.log` — append `ACTO|SKILL|OK/FAIL|path`. `checklist.md` — 17 pasos tildados.
- `AE_MCP.md` — referencia completa del MCP After Effects (tools, scripts, templates, mapeo a motion.md). Leer antes de cualquier paso en AE.
- `.agents/skills/` — hyperframes core + motion-graphics. Regla dura: leer `.agents/skills/hyperframes/references/motion.md` ANTES de animar.

## Orden de trabajo para Claude

1. Leer `etapas/` + `guiones/` + `motion.md` + `explainer-high-energy/SKILL.md`.
2. `cd film` → `npx hyperframes timeline --json` (si existe algo) + `history begin`.
3. Beat sheet primero (escena, tiempo en grid BPM 128, qué acarrea, sonido). Recién después construir.
4. Por acto: escena en `film/compositions/` → `npx hyperframes lint` → `check --json` (0 errores) → `snapshot --review` + mirar PNGs → `REVIEW.md`.
5. Preview (`npm run dev` en film/) y esperar aprobación. Render solo al final: `npm run render` (draft iterando, delivery final).
6. Loguear cada acto en `progreso.log`, no avanzar sin clip+audio+timing. No tocar `dashboard/`, `*.fsm`, ni `.agents/`.

## Convenciones

- 1920×1080, 30fps. Cortes en beats (`frames = 30×60/BPM`). 3-5 transiciones con causa, nunca dissolve entre mundos.
- Contrato Hyperframes: `window.seek(t)` pura, sin CSS animations, sin Math.random sin seed, fuentes embebidas, clips con `class="clip" data-start data-duration`.
