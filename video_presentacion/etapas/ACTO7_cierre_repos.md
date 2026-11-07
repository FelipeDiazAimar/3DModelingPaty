# ACTO 7 — Cierre: despedida + repos para cátedra

## 1. Saludo personaje 3D (despedida en recorrido)

- **Dónde:** pasillo central entre L7 y L8, punto de arranque del modo "Recorrer a pie" (`Walk.tsx`, `puntosDeInteres`).
  Cerrar ahí el arco: se empezó a pie entre líneas (ACTO 5) y se termina en el mismo lugar.
- **Qué hace:** operario 3D (`public/models/operario.glb`, riggeado, 10 animaciones — ver `documentacion/03_operario_blender.md`).
  Teclas en modo a pie: **Q = saludar, B = bailar**, C cambia 1ª/3ª persona para encuadrar.
- **Toma sugerida:** 3ª persona (C), cámara al frente del operario, planta fundida + luz horneada activas,
  minimapa visible. Q (saludo) → frase de cierre voz IA → B (baile 3 s) → fundido a diapositiva final.
- **Componente:** `dashboard/web/components/OperariosPlanta.tsx` existe (47 operarios animados en planta);
  el avatar del recorrido lo gestiona `Walk.tsx` + `operario.glb`.

## 2. Diapositiva final (textos, links, archivos para el profesor)

**Texto en pantalla (3 líneas):**
> Gemelo digital PATY San Jorge — Blender + FlexSim 2026 + Web 3D en vivo
> Simulación · Facultad — noviembre 2026
> Gracias por recorrer la planta con nosotros

**Links repos:**
- Principal (modelo + web + docs): https://github.com/FelipeDiazAimar/3DModelingPaty
- MCP FlexSim (control por asistente): https://github.com/FelipeDiazAimar/MCP_Flexsim

**Archivos clave para el profesor (orden de revisión):**
1. `PLANTASJ.fsm` — modelo vigente (96/100 objetos, publicador auto al abrir).
2. `SUPUESTOS_v2.md` — supuestos, tiempos, reglas de licencia.
3. `dashboard/web/` — web Next.js+three.js (Root Directory en Vercel, `NEXT_PUBLIC_DEMO=1`).
4. `iniciar_web.bat` — arranque local → http://localhost:3000.
5. `documentacion/` (01–08) — cómo iniciar, recorrido, operario, plano, luz, análisis 3D, FlexSim/MCP.
6. `dashboard/flexsim/publicador.fls` + `indicadores.fls` + `tablero.fls` — puente FlexSim↔web y tablero interno.
7. `assets_v2/` + `blender/` + `manifests_v2/` — visual GLB, fuente .blend, posiciones máquinas.
8. `datos_trazabilidad/` — evidencia estadística (sin JSON crudos, ver `.gitignore`).

## 3. Checklist entrega (probar en este orden)

1. `git status` limpio en rama `web-3d-realismo`; `PLANTASJ.fsm` abre y corre sin errores.
2. `npx tsc --noEmit` 0 errores; `npx eslint` 0 errores; `npx next build` pasa (`dashboard/web`).
3. Doble clic `iniciar_web.bat` → http://localhost:3000 abre, chip estado visible.
4. Botón **Ver demo** sin FlexSim: planta, KPIs, gráficos, camiones y operarios se mueven.
5. Con FlexSim Run: chip "Conectado", hora simulada avanza, `POST /api/ingest` cada 10 s sim.
6. Recorrido a pie: WASD, Shift, Espacio, E (ficha), C, F/G (vehículos), Q/B (saludo/baile), Esc sale.
7. "Ir a" teclas 1–8 + minimapa + mapa de calor + "Seguir un lote" + tarjeta E2/E3/E4.
8. Diapositiva final con links clicables; Vercel en modo demo (`NEXT_PUBLIC_DEMO=1`) si se entrega URL.

## 4. Ideas transición web → cierre

- Del lote a la persona: "Seguimos un lote de punta a punta… y quien lo despide es quien lo hace." Corte a operario en pasillo L7/L8.
- Zoom out humano: del mapa de calor (piso rojo→verde) fundido al avatar que saluda (Q) — del dato a la gente.
- Baile como punto final: veredicto E2/E3/E4 en tarjeta 3D → "y con este baile, cerramos" (B 3 s) → placa repos.
- Voz + gesto sincronizados: la frase "gracias" cae justo en el saludo Q; el silencio, en el baile.
- Fundido a blanco sobre luz horneada (no a negro): la planta queda "encendida" detrás de la diapositiva final.
