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
| F | pedir el montacargas propio (aparece al lado y te sube) | igual |
| G | pedir el camión | igual |
| H | — | bocina |
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
  El operario va sentado al volante, y el volante gira con la dirección.
- **Pedir un vehículo** (botones "Pedir" o teclas F y G): el montacargas propio es una copia aparte, así los de la
  simulación siguen en sus rutas; el camión es el de la báscula. Aparecen alineados con la mirada, en el primer
  lado libre (adelante, a los costados o atrás, comprobado con rayos). Si el camión no entra en ningún lado, se lo
  maneja donde está. El montacargas propio desaparece al salir del modo a pie.
- **Sonido:** bocina (H) y pitido de marcha atrás, sintetizados con Web Audio (sin archivos).
- **Camión:** el articulado del modelo (`Camion_Carga_PT_1`: tractor y acoplado), estacionado donde el modelo tiene el
  que espera la báscula. Mide 20 m y su cola se alinea con la del modelo fundido. En 1ª persona la cámara va en el
  asiento del conductor, dentro de la cabina: como la cabina del modelo es maciza, al manejar en 1ª persona se oculta
  y aparece un interior simple (piso, techo, tablero, asiento, puertas y volante).
- **Interfaz:** minimapa girado según el rumbo (máquinas por estado, rutas, montacargas, camión, norte), nombre
  de la zona, velocímetro con marcha D/N/R, aviso "Hacé clic para jugar", teclas dibujadas.
  Ideas tomadas de Teleoperator (minimapa, velocímetro) y de los ejemplos de three.js (`misc_controls_pointerlock`,
  `webgl_animation_skinning_blending`, `webgl_animation_skinning_morph`).
- **Dinámica visual (`lib/vehicleFx.ts`, la usan `Scene3D` y `Walk`):** las ruedas giran según la distancia recorrida
  y su radio. El camión dirige con las ruedas delanteras y el montacargas con las traseras; el volante gira con la
  dirección. Al acelerar o frenar cabecea, y en la curva se inclina, con un resorte amortiguado y topes chicos (1,4°
  en el camión, 2,6° en el montacargas). El camión tiene acoplado articulado: el semirremolque gira sobre la quinta
  rueda y sigue al tractor con un atraso. Todo sale de cuánto se movió cada vehículo entre cuadros, así que no cambia
  la simulación. Los saltos de más de 8 m (teletransporte o reloj muy acelerado) se ignoran. Los 4 camiones animados
  de MP y PT usan el mismo articulado.

## Límites conocidos

- Los montacargas de la simulación y el camión animado no chocan con el operario (lo atraviesan).
- No hay controles táctiles: en celular no se puede caminar.
- Manejar un montacargas es solo visual: no cambia la simulación.
- Ruedas, dirección y suspensión son solo visuales: los vehículos no se ajustan a la altura del piso.
