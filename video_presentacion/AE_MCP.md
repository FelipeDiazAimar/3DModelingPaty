# AE MCP — referencia completa para Claude

> MCP `aftereffects` (Dakkshin/after-effects-mcp, MIT). Instalado en `Simulacion/after-effects-mcp/`, registrado en `opencode.jsonc` global. Requiere AE 2026 abierto con panel bridge. ESTADO 2026-11-07: bridge instalado, panel SIN abrir (test `getProjectInfo` → `waiting`). Sin panel no hay comunicación.

## Setup (una vez)

1. `npm run install-bridge` en `Simulacion/after-effects-mcp/` (ya hecho, con admin).
2. AE > Edit > Preferences > Scripting & Expressions > tildar "Allow Scripts to Write Files and Access Network". Reiniciar AE.
3. Window > `mcp-bridge-auto.jsx`, tildar "Auto-run commands". Dejar panel abierto siempre al operar.
4. Verificar: `run-script(getProjectInfo)` → `get-results` debe devolver proyecto, no `waiting`.

## Cómo opera (importante)

- Patrón async en 2 pasos: `run-script` encola comando → panel lo ejecuta en segundos → `get-results` trae resultado. Nunca asumir ejecución inmediata; si `waiting`, el panel está cerrado.
- `create-composition`, `setLayerKeyframe`, `setLayerExpression`, `apply-effect`, `apply-effect-template`, `test-animation`, `run-bridge-test` son DIRECTAS (no pasan por cola).
- Índices 1-based: `compIndex` = posición en panel proyecto, `layerIndex` = posición en comp. Verificar con `listCompositions` / `getLayerInfo` antes de animar.
- Scripts fuente: `Simulacion/after-effects-mcp/src/scripts/*.jsx`. `src/index.ts` = server.

## Tools

| Tool | Qué hace | Notas |
|------|----------|-------|
| `create-composition` | Crea comp (nombre, w, h, pixelAspect, duration, fps, bg RGB) | Base 1920×1080, 30fps, dur = acto |
| `run-script` | Encola script predefinido (`script`, `parameters?`) | Ver lista abajo; luego `get-results` |
| `get-results` | Trae resultado último script | `waiting` = panel cerrado |
| `setLayerKeyframe` | Keyframe (`compIndex`, `layerIndex`, `propertyName`, `timeInSeconds`, `value?`) | Position `[x,y]`, Scale `[w,h]`, Rotation ángulo, Opacity % |
| `setLayerExpression` | Expresión JS en propiedad (`""` la quita) | Solo físicas/transparencia, nunca en texto/UI contadores |
| `apply-effect` | Efecto por `effectMatchName` (fiable) o `effectName` + `effectSettings` | Ver match names abajo |
| `apply-effect-template` | Template listo (`gaussian-blur`, `directional-blur`, `color-balance`, `brightness-contrast`, `curves`, `glow`, `drop-shadow`, `cinematic-look`, `text-pop`) | Atajo sin settings |
| `test-animation` | Prueba `keyframe`/`expression` en capa | Solo test, no producción |
| `run-bridge-test` | Test comunicación + efectos prueba | Ojo: modifica proyecto, solo diagnóstico |
| `get-help` / `get_effects_help` | Ayuda integrada | Fuente de esta doc |

## Scripts `run-script`

`getProjectInfo`, `listCompositions`, `getLayerInfo`, `createComposition`, `createTextLayer`, `createShapeLayer`, `createSolidLayer`, `setLayerProperties`, `setLayerKeyframe`, `setLayerExpression`, `applyEffect`, `applyEffectTemplate`.

## Effect match names útiles

Blur: `ADBE Gaussian Blur 2`, `ADBE Directional Blur`, `ADBE Radial Blur`. Color: `ADBE Brightness & Contrast 2`, `ADBE Color Balance (HLS)`, `ADBE CurvesCustom`, `ADBE Exposure2`, `ADBE HUE SATURATION`, `ADBE Vibrance`. Estilo: `ADBE Glow`, `ADBE Drop Shadow`, `ADBE Noise`, `ADBE Fractal Noise`, `CC Particle World`, `CC Light Sweep`. Ej: `{compIndex:1, layerIndex:1, effectMatchName:"ADBE Gaussian Blur 2", effectSettings:{Blurriness:25}}`.

## Mapeo a motion.md (regla dura del video)

- Llegadas: keyframes con ease largo; títulos aterrizan QUIETOS (nunca bounce en texto/UI).
- Overlap 30-50% = keyframes encadenados, no secuenciales. Stagger listas 40-80ms.
- Beat grid BPM 128: `frames = 30×60/128`. Cortes en frame más rápido del move.
- Transiciones con causa (3-5 tipos): zoom-through, objeto-que-crece-a-mundo, flood color, whip 0.13-0.3s. Máx 1/3 hard cuts entre beats.
- Templates por acto: portada `cinematic-look`+`glow`, stats `curves`+`brightness-contrast`, quiebre `drop-shadow`+`glow`.

## Límites

- Sin máscaras/cámaras/nulls/duplicar/borrar por tool directa (pedir vía `run-script` si el .jsx lo soporta, sino a mano en AE).
- Sin render por MCP: el MP4 final sale de AE (Composition > Add to Render Queue) o Hyperframes según acto.
- `film/` (Hyperframes) sigue siendo el master del video; AE es etapa de motion/finishing por acto, clips a `tomas/`, log en `progreso.log`.
