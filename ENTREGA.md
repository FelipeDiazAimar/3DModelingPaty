# Entrega final — Simulación (TPI 2026)

Grupo: Buffa Matías, Diaz Aimar Felipe, Micheloud Jeremías Iván. Docente: Sergio Revilla.
Simulación de las líneas L7 y L8 de una planta de elaboración de hamburguesas (FlexSim 2026).

## Qué hay en esta carpeta
| Qué | Dónde |
|---|---|
| **Documento PDF de la entrega** (editable en `.docx`) | `entrega/Buffa-DiazAimar-Micheloud.pdf` y `.docx` |
| Informe de coincidencias entre documento, repositorio y video | `entrega/Informe_coincidencias_TP.md` |
| **Modelo de simulación** (FlexSim 2026) | `PLANTASJ.fsm` + carpeta `assets_v2/` (hace falta para ver la planta en 3D) |
| Supuestos y parámetros del modelo | `SUPUESTOS_v2.md`, `PENDIENTES.md` |
| Resultados de las réplicas (E1 a E4) | `datos_trazabilidad/e1_final/` (`E1_FINAL.md`, `estocastico_camiones/analisis.json`) |
| Datos de ajuste (planillas CSV) y evidencia estadística | `datos_trazabilidad/fitting_series/`, `datos_trazabilidad/FITTING_EVIDENCIA.md` |
| Scripts de FlexScript (arribos, fallas, publicador) | `dashboard/flexsim/` |
| Web en tiempo real (Next.js, Three.js, ECharts) | `dashboard/web/` (ver `README.md`) |
| Modelo 3D (scripts de Blender y visual `.glb`) | `blender/`, `assets_v2/` |
| Video (proyecto HyperFrames, guiones y audio) | `video_presentacion/` |
| Servidor MCP de FlexSim (repositorio aparte) | https://github.com/FelipeDiazAimar/MCP_Flexsim |

## No está en el repositorio (GitHub rechaza archivos de más de 100 MB)
- **`VIDEO SIMULACION.mp4`** (14:52): copiarlo a la carpeta compartida junto con el repositorio.
- Las pistas de audio generadas y las tomas de pantalla (`.mp4`): se regeneran con los scripts de `video_presentacion/audio/` y `video_presentacion/film/`. Ver `video_presentacion/audio/README.md`.
- Los JSON crudos de la planta (confidenciales, ver `.gitignore`). Los resultados agregados y los CSV de ajuste sí están.

## Cómo abrir el modelo
1. Abrir `PLANTASJ.fsm` con FlexSim 2026. Mantener `assets_v2/` al lado del archivo.
2. Para correr réplicas: ver la sección 4 de `PENDIENTES.md`.
3. La web se levanta con `iniciar_web.bat` o `cd dashboard/web && npm install && npm run dev`.

## Pendientes conocidos
- Falta el audio del equipo para E2 y el arranque de E3 (en el video habla la IA en ese tramo).
- Los textos de la cinemática de la web (`dashboard/web/lib/cine.ts`, `components/Console.tsx`, `app/masa/page.tsx`, `app/escenarios/page.tsx`, `components/E1.tsx`) conservan referencias al modelo anterior (batch de 1500 kg, pallet de 144 cajas). El detalle está en `entrega/Informe_coincidencias_TP.md`.
- `PLANTASJ_1.fsm` no se versiona: es una copia de trabajo distinta de `PLANTASJ.fsm`. El modelo de la entrega es `PLANTASJ.fsm`.
- Enlace de descarga: completar en la sección 5 del documento al subir la carpeta.
