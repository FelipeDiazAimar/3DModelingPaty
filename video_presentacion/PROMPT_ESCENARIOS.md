# Prompt para grabar la ejecución de los escenarios alternativos

Pegar esto en Claude Code, abierto en la carpeta `FabricaPaty_SanJorge` de la rama `video-presentacion`, con FlexSim 2026 instalado.

---

Necesito agregar al video la ejecución de los escenarios E2, E3 y E4 del modelo `PLANTASJ.fsm`, porque la consigna pide ver la corrida de cada escenario alternativo.

Antes de empezar leé `video_presentacion/COMO_TRABAJAMOS.md`, `SUPUESTOS_v2.md` (sobre todo las líneas 124 y 125) y `datos_trazabilidad/e1_final/E1_FINAL.md`.

**Configuración de cada escenario, partiendo de E1 (lavado de 30 min ya incluido):**
- **E2, formadoras rápidas:** `entrySpacePadding` de `CintaFormA_Lx` y `CintaFormB_Lx` de 3,27 a 1,554 m (formadoras a 1843 kg/h).
- **E3, más materia prima:** E2 más 24 pallets de materia prima por turno, en lugar de 16.
- **E4, batch de 1200 kg:** `splitquantity` de las mezcladoras de 10 a 8 cargas; `cycletime` de desencajado y picadora ×0,8; 20 pallets de 1200 kg por turno de recepción.

No inventes valores: si algo no coincide con esos documentos, avisame. No guardes los cambios en `PLANTASJ.fsm`: trabajá sobre una copia o restaurá los valores al terminar, y comprobá que E1 quede igual.

**Grabación:**
1. Corré cada escenario hasta pasar el transitorio de unas 4 horas simuladas y después a velocidad baja, para que se vea el movimiento.
2. Grabá unos 15 segundos de cada uno con `ffmpeg gdigrab`, a 1920×1080, 30 fps y sin cursor (`-draw_mouse 0`), con el tablero visible en la hoja que muestre el resultado.
3. Guardalos como `video_presentacion/film/assets/flexsim/e2.mp4`, `e3.mp4` y `e4.mp4`, cada uno de menos de 100 MB.

**Integración en el video (HyperFrames, en `video_presentacion/film`):**
1. Las diapositivas de E2, E3 y E4 están en `compositions/s09-acto6.html`. Sumá cada toma en la diapositiva de su escenario **sin cambiar la duración**: el video dura casi 15 minutos y ese es el máximo.
2. Mantené visibles los títulos, el intervalo de confianza y el karaoke.
3. Validá con `npx hyperframes check --json` y `npx hyperframes snapshot --at <segundos>`, mirá los cuadros y corregí lo que falle.
4. Documentá en `video_presentacion/DOCUMENTACION_VIDEO.md`, hacé commit en `video-presentacion` y subilo.

Si no se llega a instalar FlexSim o la licencia no alcanza, frená y avisame antes de seguir.
