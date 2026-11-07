# ACTO 5 — Web inmersiva (gemelo digital)

## 1. Qué es la web

- Gemelo digital en Next.js: réplica viva de la planta San Jorge en `http://localhost:3000`.
- Muestra lo mismo que FlexSim en 3D: planta (`planta_v10.glb`, ~7.000 mallas), estados de máquinas L7/L8,
  montacargas y camiones animados, 47 operarios, mapa de calor por utilización, gráficos y KPIs.
- **Datos de ejemplo:** botón "Ver demo" / "Ver con datos de ejemplo" en el inicio. Sirve sin FlexSim.
- **Datos reales:** abrir `PLANTASJ.fsm`, darle Run; el publicador (`Tools/Publicar`, código en
  `dashboard/flexsim/publicador.fls`) manda estados a la web. Chip "Conectado / Esperando FlexSim" + hora simulada.
- **Arranque:** doble clic en `iniciar_web.bat` (raíz del repo) → instala deps la primera vez,
  corre `npm run dev` en `dashboard/web` y abre el navegador. Requisito: Node.js.
  A mano: `cd dashboard/web; npm install; npm run dev`.
- Ojo velocidad: para mirar o recorrer, ×5. A ×1200/×3600 los montacargas no siguen y las cintas parpadean.

## 2. Recorrido sugerido (orden para el video)

1. **Camión (llegada):** arrancar en vista orbital general con planta fundida + luz horneada.
   Tecla G = pedir el camión (el de la báscula, 18 m articulado tractor + acoplado).
   Manejar en 1ª persona desde la cabina (WASD, Shift turbo, H bocina), mostrar cabeceo en curva y
   acoplado articulado (tope 57°). Cámara 3ª persona para ver la cabina hueca con interior.
2. **A pie (planta):** botón "Recorrer a pie" → se arranca en el pasillo central entre L7 y L8.
   Clic para mirar, WASD moverse, Shift correr, Espacio saltar, E ficha de máquina cercana / subir a vehículo,
   C 1ª/3ª persona, F pedir montacargas propio, Q/B saludar y bailar, Esc salir.
   Mostrar minimapa con rumbo, velocímetro D/N/R y nombre de zona.
3. **Ciclo elaborados (8 etapas):** menú "Ir a" (derecha) → etapas 1–8 con teclas 1–8
   (desencajado → estibado), viaje en arco de ~1 s, deja mirando la máquina con ficha abierta.
   Cerrar con mapa de calor (verde libre → rojo saturada), "Seguir un lote" (tiempos por ley de Little,
   W = L / λ) y tarjeta comparar E2/E3/E4 (ilumina máquinas que cambian + veredicto por IC 95 %).

## 3. Componentes / archivos clave

- `dashboard/web/app/page.tsx` — inicio: `Scene3D` + `SidePanel`, `BottomTable`, `WalkHud`, `CineOverlay`.
- `dashboard/web/components/Scene3D.tsx` — escena 3D, planta fundida (`PlantaFundida`), luz horneada (`conLuz`),
  `ForkliftModel`, cabina hueca del camión.
- `dashboard/web/components/Walk.tsx` — modo a pie y vehículos: colisiones BVH, `frenteDe`, `irA`,
  `puntosDeInteres`, `IrA`, `dibujarMapa` (minimapa).
- `dashboard/web/components/Console.tsx` — `SidePanel`, `BottomTable`, `BatchTrack` (fichas y tablas en vivo).
- `dashboard/web/components/Cinematics.tsx` + `dashboard/web/lib/cine.ts` — "Seguir un lote" (`tiempoEnEtapa`).
- `dashboard/web/components/OperariosPlanta.tsx` — 47 operarios animados (cajas 5 kg, paneles, IK brazos).
- `dashboard/web/components/Chart.tsx` — gráficos con pantalla completa (⛶, overlay, Esc cierra).
- `dashboard/web/components/Shell.tsx` — encabezado, KPI chips, botón demo.
- `dashboard/web/components/Controles3D.tsx` — "Opciones de vista" (luz, rendimiento, calor, E2/E3/E4).
- `dashboard/web/lib/live3d.ts` — montacargas/camiones en vivo (`forklifts`, `huellaUsuario`).
- `dashboard/web/lib/vehicleFx.ts` — ruedas, dirección, cabeceo, `agarrarVolante` (IK 2 huesos).
- `dashboard/web/lib/derive.ts` — `utilization`, `timeAverages`, `lambdaArrivals`.
- `dashboard/web/lib/store.ts` — estado global (`mode`, `setDemo`); `lib/layout.ts` (`OPERARIOS`).
- `dashboard/web/app/velocidad/page.tsx` — kg/h en ventana móvil 1 h; `app/estadistica/page.tsx` — utilización por etapa.
- `iniciar_web.bat` — arranque con doble clic. Docs: `documentacion/01_como_iniciar.md`,
  `02_recorrido_a_pie.md`, `04_plano_y_puntos_de_interes.md`, `05_iluminacion_y_rendimiento.md`,
  `06_analisis_3d.md`, `08_graficos_y_pantalla_completa.md`.

## 4. Guion voz IA (bullets)

- "Esto no es un render: es la planta corriendo en vivo, conectada a FlexSim."
- "Entramos manejando el camión, como llega la materia prima a la báscula."
- "Nos bajamos y la recorremos a pie, entre las líneas 7 y 8."
- "Cada máquina muestra su ficha: estado, velocidad, lo que está procesando."
- "Viajamos por las 8 etapas del ciclo de elaborados, del desencajado al estibado."
- "El piso se pinta solo: verde libre, rojo saturado. Ahí está el cuello de botella."
- "Y seguimos un lote de punta a punta, con sus tiempos etapa por etapa."

## 5. Ideas de transición MCP → web

- Del código al vivo: "El MCP movió el modelo; ahora lo vemos respirar en la web." Fundido consola → 3D.
- Pantalla partida: a la izquierda el script FlexSim corriendo, a la derecha la planta que reacciona.
- El camión como puente: el MCP lo posiciona en la báscula, corte y ya estamos arriba manejándolo (G).
- Zoom continuo: del plano orbital con luz horneada se baja al pasillo central L7/L8 y aparece el HUD a pie.
- Cierre del arco: la tarjeta E2/E3/E4 en 3D remite a la página Escenarios → gancho al acto de resultados.
