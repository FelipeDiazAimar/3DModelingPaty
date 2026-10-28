# Recorrido a pie y vehículos

Botón **"Recorrer a pie"** (arriba de la columna izquierda; solo en pantallas de escritorio). Funciona con la
simulación corriendo. Se arranca en el pasillo central entre L7 y L8, fuera de las rutas de los montacargas.

## Controles

| Tecla | A pie | Manejando |
|---|---|---|
| Clic en la planta | toma el mouse para mirar | igual |
| W A S D / flechas | moverse | acelerar, frenar, doblar |
| Shift | correr | turbo |
| Espacio | saltar | — |
| E | ver la ficha de la máquina cercana; subir a un vehículo | bajarse |
| C o V | 1ª / 3ª persona | igual |
| M | vista de plano | igual |
| 1 2 3 4 | saludar, sí, no, bailar | — |
| Esc | suelta el mouse; otro Esc vuelve a la vista orbital (o cierra el plano) | igual |

## Cómo está hecho (`components/Walk.tsx`)

- **Colisiones:** rayos contra la planta acelerados con BVH (`three-mesh-bvh`). El BVH se arma a demanda solo
  para lo que está a menos de 30 m, así no se traba al entrar con las ~7.000 mallas. Dos rayos por eje a 0,6 y
  1,4 m (deslizamiento contra paredes) y uno hacia abajo para el piso (sube escalones de hasta 50 cm).
- **Independiente de los cuadros por segundo:** el paso de tiempo admite hasta 0,25 s (los rayos cubren el paso
  entero), el salto usa la fórmula exacta de caída y el piso se busca desde la altura previa del cuadro.
- **Teclas de un toque** (E, Espacio, gestos) se guardan y se atienden en el próximo cuadro aunque se suelten antes.
- **Montacargas:** los mismos de la simulación (`lib/live3d.ts → forklifts`). Mientras se maneja uno, `Scene3D`
  deja de moverlo desde los datos; al bajarse vuelve solo por la red de rutas a su posición simulada.
  El operario va sentado al volante.
- **Camión:** una copia del camión del modelo (`Camion_Bascula_Ingreso`), estacionada donde el modelo tiene el
  que espera la báscula. En 1ª persona el ojo va delante del parabrisas (la cabina del modelo es maciza).
- **Interfaz:** minimapa girado según el rumbo (máquinas por estado, rutas, montacargas, camión, norte), nombre
  de la zona, velocímetro con marcha D/N/R, aviso "Hacé clic para jugar", teclas dibujadas.
  Ideas tomadas de Teleoperator (minimapa, velocímetro) y de los ejemplos de three.js (`misc_controls_pointerlock`,
  `webgl_animation_skinning_blending`, `webgl_animation_skinning_morph`).

## Límites conocidos

- Los montacargas de la simulación y el camión animado no chocan con el operario (lo atraviesan).
- No hay controles táctiles: en celular no se puede caminar.
- Manejar un montacargas es solo visual: no cambia la simulación.
