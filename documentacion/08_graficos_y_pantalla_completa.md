# Gráficos, encabezado y pantalla completa

Cambios sobre la interfaz de la web (no sobre la simulación): pantalla completa de los gráficos, kg/h de la
sección Velocidad y el encabezado con los KPI y el botón de demo.

## Pantalla completa de los gráficos (`components/Chart.tsx`)

- Cada gráfico tiene arriba a la derecha un botón **⛶** ("Pantalla completa").
- No abre otra pestaña: el gráfico pasa a un overlay que ocupa toda la pantalla, dentro de la misma pestaña, con
  los mismos datos (sigue actualizándose en vivo o al reproducir el historial).
- Se cierra con **×** (arriba a la derecha) o con **Esc**. El overlay se dibuja sobre el resto de la página, así
  que el menú y el encabezado quedan tapados mientras está abierto.

## kg/h en Velocidad (`app/velocidad/page.tsx`)

- Antes, kg/h era todo lo producido desde el inicio dividido por las horas desde el inicio.
- Ahora es una **ventana móvil de 1 h simulada**, igual que el tablero de FlexSim: cajas producidas en la última
  hora simulada × kg por caja, dividido por las horas de esa ventana.
- El gráfico usa la misma ventana para cada punto. Al principio, cuando todavía no hay 1 h de datos, la ventana
  arranca en el primer dato.
- Por eso el valor de la última hora puede ser distinto del promedio desde el inicio.

## Encabezado (`components/Shell.tsx`)

- **KPI chips:** solo hay una instancia montada a la vez, según el ancho de la pantalla (se detecta con una media
  query):
  - teléfono (menos de 768 px): versión compacta, a la izquierda de la hamburguesa;
  - entre 768 px y 1600 px: versión compacta en fila;
  - desde 1600 px: versión completa.
  Solo aparecen en la vista de inicio.
- **Chip de estado** (punto de color, "Conectado" o "Esperando FlexSim" y la hora simulada): se oculta en el modo
  demo, porque ahí el estado no corresponde. Antes el teléfono mostraba "DEMO" en su pastilla; ahora esa pastilla
  no se muestra en demo.
- **Botón de demo:** en escritorio dice **"Ver demo"** o **"Salir del demo"** (antes decía "Demo"). En teléfono
  está al final del menú lateral, con el mismo texto y ocupando todo el ancho.
- El encabezado puede envolverse en pantallas angostas en lugar de cortar los elementos.

## Estadística: utilización por etapa (`app/estadistica/page.tsx`)

- Antes, las barras del perfil de utilización eran porcentajes fijos (68 %, 52 %, 89 %…) marcados como
  "Estimación estática". Ahora se calculan de la simulación en curso y ya no hay valores fijos.
- Utilización de una máquina = % de muestras en estado **procesando**, acumuladas desde el inicio de la corrida.
- Utilización de una etapa = promedio de las máquinas de esa etapa. Con el filtro de línea promedia solo las
  máquinas de esa línea; con "Todas", las de las dos líneas.
- Incluye el warm-up: no se descartan las primeras muestras. El subtítulo indica la línea y cuántas muestras hay.
- Si una etapa no tiene datos, la barra no tiene valor y se muestra **"—"**.
- La etapa con mayor utilización se marca en rojo con la etiqueta **MAYOR UTILIZACIÓN** (antes decía "CUELLO DE
  BOTELLA"). Es la candidata a cuello de botella: hay que contrastarla con Distribución de Estados.
- Lint de la web: 0 errores (`npx eslint`). Los efectos con `setState` de `NavMenu`, `RouteBar` y `Produccion` se
  reemplazaron.
