# Documentación de los cambios de la web 3D (octubre 2026)

Cambios hechos sobre el dashboard web (`dashboard/web`) y sus assets de Blender, en la rama
`web-3d-recorrido` (no en `main`). Todo es solo web: no cambia la simulación de FlexSim ni sus datos,
salvo el publicador (ver [FlexSim](07_flexsim_mcp.md)).

| # | Tema | Qué agrega |
|---|------|-----------|
| 1 | [Cómo iniciar](01_como_iniciar.md) | `iniciar_web.bat` y el acceso directo del escritorio |
| 2 | [Recorrido a pie y vehículos](02_recorrido_a_pie.md) | Operario en 1ª/3ª persona, correr, saltar, gestos, manejar montacargas y camión, colisiones |
| 3 | [Operario 3D (Blender)](03_operario_blender.md) | Personaje riggeado con 10 animaciones, hecho con el MCP de Blender |
| 4 | [Plano y puntos de interés](04_plano_y_puntos_de_interes.md) | Vista desde arriba, ir a un lugar con un clic, barra "Ir a" por etapa |
| 5 | [Iluminación horneada y modo rendimiento](05_iluminacion_y_rendimiento.md) | Sombras horneadas en Blender (interruptor) y planta fundida para PCs lentas |
| 6 | [Análisis en 3D](06_analisis_3d.md) | Operarios de FlexSim, mapa de calor, seguir un lote (Little), comparar escenarios |
| 7 | [FlexSim y su MCP](07_flexsim_mcp.md) | Límite de 100 objetos, instalación del MCP, pendientes |

## Archivos tocados

| Archivo | Qué es |
|---|---|
| `dashboard/web/components/Walk.tsx` | **Nuevo.** Recorrido a pie: operario, vehículos, colisiones, cámara, plano, puntos de interés, interfaz (minimapa, velocímetro) |
| `dashboard/web/components/Controles3D.tsx` | **Nuevo.** Desplegable "Opciones de vista": rendimiento, iluminación, mapa de calor, escenarios |
| `dashboard/web/components/Scene3D.tsx` | Luz horneada en los pisos, planta fundida, operarios de FlexSim, mapa de calor, comparación de escenarios; los montacargas se pueden manejar |
| `dashboard/web/app/page.tsx` | Columna izquierda: "Recorrer a pie" primero y el desplegable de opciones |
| `dashboard/web/lib/store.ts` | Estado nuevo: `mode`, `view`, `driving`, `hint`, `plan`, `luz`, `rend`, `calor`, `escenario` |
| `dashboard/web/lib/cine.ts` | Cinemática "Seguir un lote" y `tiempoEnEtapa` (Little) |
| `dashboard/web/lib/layout.ts` | `OPERARIOS` (los 4 operarios del modelo de FlexSim) |
| `dashboard/web/lib/live3d.ts` | `forklifts`: grupos 3D de los montacargas compartidos con el recorrido a pie |
| `dashboard/web/lib/network.ts` | Exporta `EDGES` (rutas de los montacargas, para el minimapa) |
| `dashboard/web/package.json` | Declara `three-mesh-bvh` (ya venía con drei; se importa directo) |
| `dashboard/web/public/models/operario.glb` | **Nuevo.** Operario 3D con esqueleto y animaciones |
| `dashboard/web/public/models/planta_luz.jpg` / `.json` | **Nuevos.** Luz horneada sobre los pisos y su rectángulo |
| `blender/hornear_piso.py` | **Nuevo.** Hornea `planta_luz.jpg` con Blender en segundo plano |
| `dashboard/flexsim/publicador.fls` | El publicador también manda los 4 operarios (falta cargarlo en `PLANTASJ.fsm`) |
| `iniciar_web.bat` | **Nuevo.** Arranca la web y abre el navegador |

`planta_v10.glb` **no se modificó**: todo lo visual nuevo va en archivos aparte o se aplica en el navegador.

## Verificación

- `npx tsc --noEmit` sin errores; `npx eslint` sin errores nuevos (los 10 problemas que marca ya estaban en archivos no tocados).
- `npx next build` pasa.
- Probado en Chrome con los datos de ejemplo: caminar, correr, saltar, gestos, subir y bajar del montacargas y del
  camión, 1ª/3ª persona, máquinas con la tecla E, plano, puntos de interés, iluminación, modo rendimiento, mapa de
  calor, seguir un lote y comparación de escenarios.
- No hay tests automáticos de la web 3D: todo se verificó a mano en el navegador.
