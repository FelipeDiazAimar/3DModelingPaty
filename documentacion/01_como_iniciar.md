# Cómo iniciar la web

## Con doble clic

- **`iniciar_web.bat`** (raíz del repo): entra a `dashboard/web`, instala las dependencias la primera vez
  (`npm install`), levanta la web (`npm run dev`) y abre el navegador en <http://localhost:3000> apenas responde.
  Si la web ya estaba corriendo, solo abre el navegador. Para apagarla, cerrar su ventana.
- **Acceso directo en el escritorio** (`Iniciar PATY 3D.bat`): llama al de arriba. Si el repo se mueve de carpeta,
  hay que corregir la ruta adentro de ese archivo.

Requisito: Node.js (<https://nodejs.org>). Si falta, el `.bat` lo avisa.

## A mano

```
cd 3DModelingPaty/dashboard/web
npm install      # solo la primera vez
npm run dev      # http://localhost:3000
```

## Con datos

- **De ejemplo:** botón "Ver con datos de ejemplo" en la pantalla de inicio.
- **De FlexSim:** abrir `PLANTASJ.fsm` y darle Run; el publicador manda los datos a la web solo.

Ojo con la velocidad de reproducción: a ×1200 o ×3600 los montacargas no alcanzan a seguir la simulación y las
cintas parpadean. Para mirar o recorrer la planta, ×5.
