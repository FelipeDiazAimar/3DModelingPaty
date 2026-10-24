# Dashboard en vivo — Gemelo digital PATY San Jorge

Web local (Next.js + React + three.js) que muestra la simulación de FlexSim en tiempo real.

## Cómo levantarlo
1. `cd dashboard/web` y `npm install` (la primera vez), luego `npm run dev`.
2. Abrir http://localhost:3000.
3. Abrir `PLANTASJ.fsm` en FlexSim y apretar Run: el nodo `Tools/Publicar` envía un JSON cada 60 s simulados a `POST /api/ingest`.
   Sin FlexSim, el botón **Ver demo** carga datos sintéticos (marcados como DEMO).

## Piezas
- `web/` — la web. Home = planta 3D completa (`public/models/planta_v10.glb`, la exporta `blender/exportar_glb.py`: Ciclo 1, Ciclo 2 y Elaborados L1–L8; ver `PLAN_MODELO_3D.md`) con pines por máquina; clic en un pin abre el panel con estadísticas. Secciones: Producción, Paradas, Colas y WIP, Velocidad, Balance de masa, Montacargas, Estadística, Escenarios.
- `web/app/api/ingest` recibe de FlexSim; `/api/stream` (SSE) y `/api/state` entregan al navegador.
- `web/lib/layout.json` — posiciones de cada máquina (generado de `manifests_v2/logicos_v2.json`, coordenadas Blender).
- `flexsim/publicador.fls` y `flexsim/arranca_publicador.fls` — código de los nodos `Tools/Publicar` y `Tools/ArrancaPublicador` del modelo (se cargan con `fileopen/filereadline`; `Tools/OnOpenDashboard` los compila y registra el listener al abrir).

## Camiones
`lib/trucks.ts` mueve en el 3D los camiones de **materia prima** (muelles oeste de la nave original) y de **expedición de PT** (muelles este). No usan objetos de FlexSim: los horarios salen de los datos que ya publica (`kpi.palletsMP` y `kpi.palletsPT`).
- **Cuándo:** un camión llega cuando termina la tanda anterior y se va 5 min simulados después de que FlexSim registró el último pallet de la suya. Las tandas son de 8 pallets para MP y de 24 para PT. Usa los dos muelles de cada lado en forma alternada, así que el que llega y el que se va se cruzan. El de PT sale 150 s después del de MP para no superponerse en la báscula.
- **Recorrido** (mano derecha, esquinas redondeadas, cabina hacia donde avanza):
  1. ruta norte, portón norte y báscula de ingreso (45 s);
  2. calle C2–Elaborados; los de PT siguen por la calle sur y la este;
  3. pasa el muelle y entra marcha atrás describiendo un arco;
  4. sale por la mano contraria y pasa por la báscula de egreso (45 s) hasta la ruta.
- El 3D oculta los camiones fijos de esos muelles y de la báscula, y clona el mismo camión del modelo.
- Funciona igual en vivo, reproduciendo el historial y en el demo.

## Reproductor
Barra inferior: play/pausa, volver al inicio, línea de tiempo y velocidad (×10 a ×3600 segundos simulados por segundo real). "En vivo" sigue la última muestra de FlexSim; al pausar o mover la barra se reproduce el historial (3D, montacargas, indicadores y gráficos siguen al cabezal). Controla la reproducción en la web, no la ejecución de FlexSim.
FlexSim publica cada 10 s simulados (JSON compacto); el puente guarda hasta 40.000 muestras.

## Componentes propios
Scrollbar (`CScroll`), selector de sección (`NavMenu`), íconos (`Icons`), tablas (`Table`, `StatePill`, `MiniBar`) y reproductor (`Player`). Sin librerías de UI externas.

## Puerto
FlexSim publica en el puerto de `Tools/pubPort` (3000 por defecto). Si el 3000 está ocupado: `npm run dev -- -p 3010` y en FlexSim `model().find("Tools/pubPort").value = 3010;`.

## Notas
- Si cambia el visual de Blender, correr `exportar()` de `blender/exportar_glb.py`: escribe `web/public/models/planta_v10.glb` (mallas compartidas, colores lineales). El `planta.glb` viejo (solo L7/L8) ya no se usa.
- Las partes sin dato en el modelo (fallas MTBF/MTTR, mermas, IC 95 %, escenarios) se muestran como `Supuesto` o `Sin corrida`, como pide el informe.
- Puerto/host del puente: constantes `req.host/req.port` en `publicador.fls`.
