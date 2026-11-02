# Documentación de los cambios de la web 3D (octubre 2026)

Cambios hechos sobre el dashboard web (`dashboard/web`) y sus assets de Blender, en la rama
`web-3d-realismo` (no en `main`). Todo es solo web: no cambia la simulación de FlexSim ni sus datos,
salvo el publicador (ver [FlexSim](07_flexsim_mcp.md)).

| # | Tema | Qué agrega |
|---|------|-----------|
| 1 | [Cómo iniciar](01_como_iniciar.md) | `iniciar_web.bat` y el acceso directo del escritorio |
| 2 | [Recorrido a pie y vehículos](02_recorrido_a_pie.md) | Operario en 1ª/3ª persona, correr, saltar, gestos, manejar montacargas y camión (articulado, con cámara en la cabina), ruedas, dirección y suspensión, colisiones |
| 3 | [Operario 3D (Blender)](03_operario_blender.md) | Personaje riggeado con 10 animaciones, hecho con el MCP de Blender |
| 4 | [Plano y puntos de interés](04_plano_y_puntos_de_interes.md) | Vista desde arriba, ir a un lugar con un clic, barra "Ir a" por etapa |
| 5 | [Iluminación horneada y modo rendimiento](05_iluminacion_y_rendimiento.md) | Sombras horneadas en Blender (interruptor) y planta fundida para PCs lentas |
| 6 | [Análisis en 3D](06_analisis_3d.md) | Operarios de FlexSim, mapa de calor, seguir un lote (Little), comparar escenarios |
| 7 | [FlexSim y su MCP](07_flexsim_mcp.md) | Límite de 100 objetos, instalación del MCP, pendientes |
| 8 | [Gráficos y pantalla completa](08_graficos_y_pantalla_completa.md) | Botón ⛶ en los gráficos, kg/h con ventana móvil de 1 h, encabezado con KPI y botón de demo |

## Archivos tocados

| Archivo | Qué es |
|---|---|
| `dashboard/web/components/Walk.tsx` | **Nuevo.** Recorrido a pie: operario, vehículos, colisiones, cámara, plano, puntos de interés, interfaz (minimapa, velocímetro) |
| `dashboard/web/components/Controles3D.tsx` | **Nuevo.** Desplegable "Opciones de vista": rendimiento, iluminación, mapa de calor, escenarios |
| `dashboard/web/components/Scene3D.tsx` | Luz horneada en los pisos, planta fundida, operarios de FlexSim, mapa de calor, comparación de escenarios; los montacargas se pueden manejar; camiones animados con el articulado `Camion_Carga_PT_1` |
| `dashboard/web/components/Chart.tsx` | Botón ⛶ y overlay de pantalla completa (× y Esc) en cada gráfico |
| `dashboard/web/components/Shell.tsx` | KPI chips montados según el ancho; chip de estado oculto en demo; botón "Ver demo" / "Salir del demo" |
| `dashboard/web/app/velocidad/page.tsx` | kg/h con ventana móvil de 1 h simulada |
| `dashboard/web/app/estadistica/page.tsx` | Utilización por etapa calculada de la simulación en curso (promedio de máquinas, filtro de línea, "MAYOR UTILIZACIÓN") |
| `dashboard/web/app/produccion/page.tsx` | Lectura de `?m=` con `useSyncExternalStore` en vez de `setState` en un efecto (lint en 0 errores) |
| `dashboard/web/components/NavMenu.tsx` | Menú de secciones sin `setState` en efectos (lint en 0 errores) |
| `dashboard/web/lib/vehicleFx.ts` | **Nuevo.** Dinámica visual de camiones y montacargas: ruedas, dirección, suspensión y acoplado |
| `blender/operario_worker.py` | **Nuevo, sin commit y en curso.** Pipeline del operario desde `operario_worker.glb` (ver [Operario 3D](03_operario_blender.md)) |
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
| `dashboard/flexsim/indicadores.fls`, `arranca_indicadores.fls`, `tablero.fls`, `svg_estados.fls`, `svg_lineas.fls` | Tablero de FlexSim alineado con la web (falla solo estado 20, muestreo cada 10 s, meta 3 pal/h, KPI de 4 h). Cargados y probados en FlexSim el 02/11/2026 (el tablero se arma; falta comparar kg/h con la web) |
| `iniciar_web.bat` | **Nuevo.** Arranca la web y abre el navegador |

`planta_v10.glb` **no se modificó**: todo lo visual nuevo va en archivos aparte o se aplica en el navegador.

## Verificación

- `npx tsc --noEmit` sin errores; `npx eslint` con 0 errores (quedan 6 warnings que ya estaban).
- `npx next build` pasa.
- Lo de la verificación de arriba es anterior a la tanda de vehículos y gráficos (ruedas, camión articulado, 1ª persona en cabina, pantalla completa, kg/h y encabezado). Esa tanda no tiene verificación documentada.
- Probado en Chrome con los datos de ejemplo: caminar, correr, saltar, gestos, subir y bajar del montacargas y del
  camión, 1ª/3ª persona, máquinas con la tecla E, plano, puntos de interés, iluminación, modo rendimiento, mapa de
  calor, seguir un lote y comparación de escenarios.
- No hay tests automáticos de la web 3D: todo se verificó a mano en el navegador.
