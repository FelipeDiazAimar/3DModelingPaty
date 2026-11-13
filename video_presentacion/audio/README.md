# Audio del video (efectos, música y locución con Fish Audio)

Tres pistas independientes, de 983,37 s como el video, montadas en `film/index.html` (`#aud-musica`, `#aud-sfx`, `#aud-voz`):

| Pista | Archivo | Quién la genera |
|---|---|---|
| Música de fondo a 128 BPM (el grid del video), con energía distinta por acto | `film/assets/audio/musica.mp3` | `generar_efectos.py` (síntesis con numpy/scipy, sin librerías ni licencias de terceros) |
| Efectos: golpes, barridos en cada corte, tablero de letras, glitch, vidrio, marcador de las anotaciones, destello del logo | `film/assets/audio/sfx.mp3` | `generar_efectos.py` (lee `cues_sfx.json`) con 12 muestras de ElevenLabs en `sfx_eleven/` (`generar_sfx_elevenlabs.py`); sin muestras usa la síntesis local |
| Locución IA (actos 1-5 y 7) | `film/assets/audio/voz.mp3` | `generar_voz.py` (Fish Audio). Mientras no se genere, es un silencio para que el render funcione |

Las pistas generadas no se versionan (`.gitignore`); se regeneran con los scripts. La música y los efectos bajan solos cuando suena la voz (ducking calculado de `voz.wav`).

## Efectos por animación y ambiente (11-12/11/2026)
`sfx_animaciones.py` convierte cada aparición, movimiento, barrido, dibujo y contador de cada escena en un efecto, en el instante en que ocurre
(`harvest.json` sale de `harvest.js`, que mide los tweens en el estudio; instrucciones en el encabezado de ese archivo). Son unos 380 efectos
automáticos más los de corte (golpes, barridos de cada diapositiva, vidrio, glitch, marcador). Con muestras de ElevenLabs: pop, swipe, slide,
textin, grow, draw, tick y 6 más (`generar_sfx_elevenlabs.py`, 42 muestras). Bajo las tomas de la planta (Blender, tablero de FlexSim, web y los
videos de las corridas) hay además un ambiente de planta en bucle (`ambiente_1/2`). Los tramos donde el video es una diapositiva quieta
(por ejemplo los textos del Acto 6) no tienen animaciones que sonorizar: ahí suena solo la música baja y la voz.
Orden completo tras cualquier cambio del video: `python cues.py` → (re-medir con `harvest.js` si cambió alguna animación) → `python sfx_animaciones.py` → `python generar_voz.py` → `python generar_efectos.py`.

## Pasos
1. `python cues.py` arma `cues_voz.json` y `cues_sfx.json` leyendo el proyecto real (diapositivas de `s99-subs.html`, `guiones/guion_ia.md`, karaoke de `s06-karaoke`, rótulos de `s08-web`, clips de `index.html`). Repetirlo si cambia el video o un guion.
2. `python generar_voz.py --seco` estima si cada texto entra en su ventana, sin gastar créditos (`informe_voz_seco.txt`).
3. Crear `audio/.env` (git lo ignora; ya está creado en la PC de Jeremías) con:
   ```
   FISH_API_KEY=...
   FISH_VOICE_ID=bbb58201ae334cbab97922c9158b0fa8   # voz "Farid dieck" (es) de la biblioteca de Fish, la más usada
   FISH_MODEL=s2.1-pro-free  # la cuenta no tiene crédito de API: los modelos pagos (s2.1-pro, s2-pro, s1) dan 402
   ELEVENLABS_API_KEY=...    # para los efectos (plan free: 10.000 créditos)
   FISH_SPEED=1.0           # opcional
   ```
4. `python generar_voz.py` genera la locución (45 cues, uno por frase; caché en `voz_cache/`, repetir no gasta). Escribe `informe_voz.txt` con el tiempo real de cada frase contra su ventana, y `film/assets/audio/voz.mp3`.
   `--solo "D26 qué es un MCP"` regenera una frase; `--acto6` agrega una voz de reserva del Acto 6 (la oficial es la del equipo, que graba sobre el karaoke).
5. `python generar_efectos.py` vuelve a calcular música y efectos con el ducking de la voz real y escribe `preview_mezcla.mp3` para escuchar todo junto sin renderizar.
6. `cd ../film && npm run render`.

## Ventanas y textos
Cada frase entra entre el inicio de su diapositiva (+0,25 s) y el inicio de la siguiente (−0,25 s). Si la voz dura más, se acelera hasta x1,30 (más suena artificial) y, si aun así no entra, queda como `LARGO` en el informe: acortar el texto o alargar la diapositiva.
`ajustes_texto.json` reemplaza cinco textos de `guion_ia.md` que no entraban ni a x1,3 (Rubro, D7, Escenario base, D19, D24); el guion original no se tocó. Para volver al original, borrar la entrada y correr `cues.py`.

## Pendientes y límites
- Los rótulos de 1,5 a 2,7 s de cada apartado de la web (`s08-web`) son subtítulos, no locución: la voz de ese tramo sale de las filas "D31 …" del guion, ubicadas en la ventana de cada chip. Las filas D32 Elaborados y D31 Seguir un lote (52 s y 48 s) quedaron sin usar: la web ahora tiene una sola cinemática de 50 s con sus propias 4 frases.
- Los efectos y la música son sintéticos y funcionales; si se quiere un acabado de estudio, se pueden reemplazar los `.mp3` por otros con el mismo nombre (o generar efectos sueltos con ElevenLabs, ver la nota de abajo) sin tocar el video.
- `s99-subs.html` pone el número de diapositiva (temporal): quitarlo antes del render final.

## Nota: efectos con Fish Audio o ElevenLabs
- **ElevenLabs** tiene API de efectos por texto: `POST https://api.elevenlabs.io/v1/sound-generation` (`xi-api-key`; `text`, `duration_seconds` 0,5 a 30, `prompt_influence`, `loop`; modelos `eleven_text_to_sound_v2`/`v3`). Sirve para reemplazar un efecto puntual (por ejemplo, el golpe de la portada) guardando el mp3 y reemplazando el evento.
- **Fish Audio** tiene generador de efectos en su web, pero no encontré endpoint público de efectos en su API: la API documentada es de voz (`/v1/tts`).

## Voces del equipo (13/11/2026)
Los integrantes grabaron su parte (`audio/equipo/*.m4a`: tablero de FlexSim, conclusión de la simulación, web, E3 y E4, conclusiones finales).
`equipo_clips.json` dice qué tramo de cada audio va en qué segundo del video; `generar_voz.py` los mezcla en `voz.wav` (con filtro pasa-altos y nivel igualado a la voz de la IA) para que el ducking de la música y los efectos también los respete.
Las diapositivas que dice la IA y las que dice el equipo se definen en `cues.py` (`del_equipo`). Con el audio de E2 y E3 (`escenarios_E2_E3.m4a`) están todas las voces del equipo.
Los tiempos de las diapositivas 26 (conclusión), 34 (web), 35 a 43 y 44 se ajustaron al largo de cada frase (video final de 14:20, máximo 15:00).
