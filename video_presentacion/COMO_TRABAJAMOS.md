# Cómo armamos el video

Video de presentación de la simulación de Elaborados (líneas 7 y 8). Se hace con código, en HyperFrames (HTML + GSAP), a 1920×1080 y 30 fps. Duración máxima: 15 minutos.

## Forma de trabajo

1. **Una diapositiva por vez.** Cada una se muestra en la vista previa (`http://localhost:3002/#project/film`), se revisa y se corrige por número.
2. **El número de abajo a la derecha es temporal.** Sale de `compositions/s99-subs.html` y se quita antes del render final.
3. **Todo dato tiene fuente.** Ningún número entra sin estar en `DOCUMENTACION_VIDEO.md`, con su archivo de origen.
4. **Validación.** Tras cada cambio: `npx hyperframes check --json` y `npx hyperframes snapshot --at <segundos>`, y se miran los cuadros.
5. **Las tomas reales las graba un agente (Haiku)** con guiones de PowerShell y `ffmpeg gdigrab`, sin cursor. La web grabada es la local (`localhost:3000`) conectada a FlexSim: la de Vercel corre en modo demo y no recibe datos del modelo.
6. **Git.** Se trabaja en la rama `video-presentacion`. Los videos pesados no se versionan (ver `.gitignore`): GitHub rechaza archivos de más de 100 MB.

## Criterios del video

- Estilo React Bits: agresivo, fondos que cambian, rojo `#ff1f3d`, SF Pro Display. Catálogo de HyperFrames en cada diapositiva, sin repetir siempre los mismos efectos.
- La voz cuenta un relato y no lee la diapositiva, en lenguaje común y con los términos de la cátedra (por ejemplo, "medida de desempeño"). Sin siglas sin explicar.
- Karaoke con barrido horizontal y letra chica en la toma de FlexSim y en el Acto 6, donde el equipo graba su voz encima.
- Primero se cuenta qué se hace en Elaborados, después el problema. El relato va de la sospecha (la formadora) al hallazgo (las mezcladoras).

## Archivos

| Dónde | Qué hay |
|---|---|
| `film/index.html` | Línea de tiempo: orden e inicio de cada composición |
| `film/compositions/` | Una composición por bloque |
| `guiones/guion_ia.md` | Texto de la voz de IA |
| `guiones/guion_equipo.md` | Texto del Acto 6, con tiempos y quién lee |
| `DOCUMENTACION_VIDEO.md` | Datos verificados, decisiones y cambios |
| `etapas/` | Planificación original por acto |

## Ficha de diapositivas

Efecto: mecánica del catálogo de HyperFrames usada o adaptada. La voz y los tiempos están en `guiones/`; las fuentes de los datos, en `DOCUMENTACION_VIDEO.md`.

| # | Muestra | Efecto |
|---|---|---|
| 1 | Chispa inicial y rótulo PATY | Shader WebGL propio |
| 2 | Portada, Planta Elaborados | Revelado por palabras |
| 3–5 | Integrantes por apellido | Letras desde los bordes |
| 6 | Transición | `mk-clone-wall-transition` |
| 7 | Las 8 etapas | Trazado de línea en SVG |
| 8 | ¿Dónde está el cuello de botella? | `headline-slam` |
| 9 | Nave y plano de Elaborados | `scan-band` |
| 10–12 | 1500 kg, 16 pallets, 72 t, camiones andando | `slot-machine-roll` |
| 13 | Tiempos de las 8 etapas | `parallax-zoom` |
| 14 | ¿Formadora? 982 contra 1843 kg/h | Barras y sacudida |
| 15 | Por qué la formadora: 53 % | `rgb-glitch-text` |
| 16 | Tres pasos para probar la sospecha | `marker-highlight`, `velocity-throw-snap` |
| 17 | Medida de desempeño | Indicador animado, letras 3D y cámara orbital |
| 18 | Tablero real: 56,0 t/día, ¿es válido? | `split-flap-board` |
| 19 | Por dónde arrancamos a simular | `grid-pixelate-wipe` |
| 20 | Planos de la planta | Paneo del plano y `chromatic-aberration-wipe` de salida |
| 21 | Blender | La planta pasa de alambre a sólida mientras baja la cámara |
| 22 | Código que construye la planta | `code-terminal-run` |
| 23 | FlexSim en vivo con karaoke | Toma real |
| 24 | Conclusiones de la simulación | `rgb-glitch-text` |
| 25 | Por qué hacía falta el MCP | `strikethrough-replace` |
| 26 | Qué es un MCP | `chat-message` |
| 27 | De 0 a 1, captura de GitHub | `headline-slam` y rueda de dígitos |
| 28 | Cómo funciona el puente | `tracing-beam` |
| 29 | 73 herramientas del MCP | `slot-machine-roll` |
| 30 | Herramientas de creación y conexión | `perspective-marquee` |
| 31 | Idea de la web: celular y PC | `app-showcase`, `parallax-device-dive` |
| 32 | Web: cinemáticas y gráficas con dato resaltado | Zoom con foco y dato resaltado |
| 33 | Distribuciones de la simulación | `shutter-slam` |
| 34 | Pruebas de ajuste | Barras, sellos y barrido |
| 35 | Cómo corrimos la simulación | Tarjetas 3D, `number-wheel` |
| 36 | E1, de la formadora a las mezcladoras | `number-wheel` |
| 37–39 | E2, E3 y E4 | Intervalos animados y sellos, sobre la toma real de FlexSim de cada escenario |
| 40 | Conclusión de los escenarios | Tarjetas 3D y pallets que caen y se apilan |
| 41 | Conclusiones generales | Filas 3D, `shutter-slam` |
| 42 | Agradecimiento, operario que saluda y baila | Renders reales de Blender |
| 43 | Cierre con logo | `logo-outro`, `confetti` |

Transiciones entre diapositivas (cubo 3D, zoom a través, empuje y barrido) en cifras, MCP y Acto 6.
