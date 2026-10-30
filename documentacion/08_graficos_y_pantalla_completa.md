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
