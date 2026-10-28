# Iluminación horneada y modo rendimiento

Los dos se prenden en **"Opciones de vista"** (columna izquierda) y se recuerdan en el navegador
(`localStorage`: `paty.luz`, `paty.rend`, `paty.calor`). Apagados, la web se ve y funciona como antes.

## Iluminación realista (horneada en Blender)

- `blender/hornear_piso.py` importa `planta_v10.glb` tal como lo dibuja la web (sin los camiones fijos que la web
  oculta), pone un plano blanco apenas sobre el suelo que cubre la zona construida (1.253 × 386 m) y le hornea la
  luz difusa con Cycles: sol (mismo rumbo que la luz de la web, más bajo, a ~38°, para que las sombras se vean) y
  cielo. Resultado: `public/models/planta_luz.jpg` (8192 × 2524, 15 cm por píxel) y `planta_luz.json`
  (rectángulo en coordenadas de three).
- Los pisos (mallas chatas de menos de 60 cm, el mismo criterio en Blender y en la web) reciben la luz y no tapan
  al receptor. El mínimo es 45 %, para que lo techado no quede negro al recorrerlo (la escena no tiene luces interiores).
- En la web (`Scene3D.tsx → conLuz`), los pisos usan **una copia** de su material con un retoque de shader que
  toma la luz según su posición en planta (x, z). Así no hace falta una segunda capa de UV en el GLB y no se
  oscurecen paredes ni tarimas que comparten material con el piso.
- El efecto es suave: penumbra al pie de los muros, entre los racks y sombras de muros y máquinas.

Para regenerarlo (tarda ~5 minutos con GPU NVIDIA; OptiX):

```
"C:\Program Files\Blender Foundation\Blender 5.2\blender.exe" -b --python blender/hornear_piso.py -- --px 8192 --muestras 256
```

`--probar` solo mide la zona construida. Hay que volver a hornear si cambia `planta_v10.glb`.

## Modo rendimiento

Medido en la vista orbital general:

| | Sin modo | Con modo |
|---|---|---|
| Dibujos por cuadro | 10.543 | 227 |
| Tiempo para preparar cada cuadro | 66,6 ms (picos de 118) | 14,7 ms (picos de 21) |
| Resolución interna | densidad hasta 1,5 | densidad 1 |

- El cuello de botella eran los ~17.000 pedidos de dibujo (CPU), no los triángulos (781 mil).
- `Scene3D.tsx → PlantaFundida` funde las piezas estáticas de la planta en una malla por material
  (`BufferGeometryUtils.mergeGeometries`). Las piezas originales pasan a la capa 1: la cámara no las dibuja, pero
  los rayos del recorrido a pie sí las ven (colisiones intactas). La luz horneada sigue funcionando.
- La primera vez que se prende tarda un par de segundos en armar la versión fundida.
