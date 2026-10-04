# Dashboard en vivo — Gemelo digital PATY San Jorge

Web local (Next.js + React + three.js) que muestra la simulación de FlexSim en tiempo real.

## Cómo levantarlo
1. `cd dashboard/web` y `npm install` (la primera vez), luego `npm run dev`.
2. Abrir http://localhost:3000.
3. Abrir `PLANTASJ.fsm` en FlexSim y apretar Run: el nodo `Tools/Publicar` envía un JSON cada 60 s simulados a `POST /api/ingest`.
   Sin FlexSim, el botón **Ver demo** carga datos sintéticos (marcados como DEMO).

## Piezas
- `web/` — la web. Home = planta 3D (`public/models/planta.glb`, copia de `assets_v2/PATY_Planta_v5.glb`) con pines por máquina; clic en un pin abre el panel con estadísticas. Secciones: Producción, Paradas, Colas y WIP, Velocidad, Balance de masa, Montacargas, Estadística, Escenarios.
- `web/app/api/ingest` recibe de FlexSim; `/api/stream` (SSE) y `/api/state` entregan al navegador.
- `web/lib/layout.json` — posiciones de cada máquina (generado de `manifests_v2/logicos_v2.json`, coordenadas Blender).
- `flexsim/publicador.fls` y `flexsim/arranca_publicador.fls` — código de los nodos `Tools/Publicar` y `Tools/ArrancaPublicador` del modelo (se cargan con `fileopen/filereadline`; `Tools/OnOpenDashboard` los compila y registra el listener al abrir).

## Reproductor
Barra inferior: play/pausa, volver al inicio, línea de tiempo y velocidad (×10 a ×3600 segundos simulados por segundo real). "En vivo" sigue la última muestra de FlexSim; al pausar o mover la barra se reproduce el historial (3D, montacargas, indicadores y gráficos siguen al cabezal). Controla la reproducción en la web, no la ejecución de FlexSim.
FlexSim publica cada 10 s simulados (JSON compacto); el puente guarda hasta 40.000 muestras.

## Componentes propios
Scrollbar (`CScroll`), selector de sección (`NavMenu`), íconos (`Icons`), tablas (`Table`, `StatePill`, `MiniBar`) y reproductor (`Player`). Sin librerías de UI externas.

## Notas
- Si cambia el visual de Blender, copiar el nuevo .glb a `web/public/models/planta.glb`.
- Las partes sin dato en el modelo (fallas MTBF/MTTR, mermas, IC 95 %, escenarios) se muestran como `Supuesto` o `Sin corrida`, como pide el informe.
- Puerto/host del puente: constantes `req.host/req.port` en `publicador.fls`.
