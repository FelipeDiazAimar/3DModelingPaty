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
- Karaoke con barrido horizontal y letra chica en la toma de FlexSim, en la web y en el Acto 6, donde el equipo graba su voz encima.
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
