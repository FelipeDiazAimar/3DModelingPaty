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
  El operario va sentado en el asiento (marcador `asiento` del vehículo = sus pies; sigue al cabeceo y balanceo) y el
  volante gira con la dirección; ver "Conductor" más abajo.
- **Pedir un vehículo** (botones "Pedir" o teclas F y G): el montacargas propio es una copia aparte, así los de la
  simulación siguen en sus rutas; el camión es el de la báscula. Aparecen alineados con la mirada, en el primer
  lado libre (adelante, a los costados o atrás, comprobado con rayos). Si el camión no entra en ningún lado, se lo
  maneja donde está. El montacargas propio desaparece al salir del modo a pie.
- **Sonido:** bocina (H) y pitido de marcha atrás, sintetizados con Web Audio (sin archivos).
- **Camión:** el articulado del modelo (`Camion_Carga_PT_1`: tractor y acoplado), estacionado donde el modelo tiene el
  que espera la báscula. Mide 18 m y su cola se alinea con la del modelo fundido. En 1ª persona la cámara va en el
  asiento del conductor, dentro de la cabina: como la cabina del modelo es maciza, al manejar se oculta
  y aparece una cabina hueca con interior (ver "Conductor").
- **Interfaz:** minimapa girado según el rumbo (máquinas por estado, rutas, montacargas, camión, norte), nombre
  de la zona, velocímetro con marcha D/N/R, aviso "Hacé clic para jugar", teclas dibujadas.
  Ideas tomadas de Teleoperator (minimapa, velocímetro) y de los ejemplos de three.js (`misc_controls_pointerlock`,
  `webgl_animation_skinning_blending`, `webgl_animation_skinning_morph`).
- **Dinámica visual (`lib/vehicleFx.ts`, la usan `Scene3D` y `Walk`):** las ruedas giran según la distancia recorrida
  y su radio. El camión dirige con las ruedas delanteras y el montacargas con las traseras; el volante gira con la
  dirección. Al acelerar o frenar cabecea, y en la curva se inclina, con un resorte amortiguado y topes chicos (1,4°
  en el camión, 2,6° en el montacargas). El camión tiene acoplado articulado: el semirremolque gira sobre la quinta
  rueda (tope de 57°) y sigue al tractor con un atraso. Todo sale de cuánto se movió cada vehículo entre cuadros, así que no cambia
  la simulación. Los saltos de más de 8 m (teletransporte o reloj muy acelerado) se ignoran. Los 4 camiones animados
  de MP y PT usan el mismo articulado.

## Conductor (montacargas y camión)

- **Asiento y pies:** el montacargas (`ForkliftModel` en `Scene3D.tsx`) tiene el asiento a 1,25 m (unidades del modelo) y el camión a
  2,08 m sobre un piso a 1,7 m. Medido con la malla animada, los pies quedan a 1 cm del piso/chasis y ningún vértice entra en el
  tablero, el asiento ni las puertas. Cabeza a 2,74 m en el montacargas (techo a 3,06 m) y a 3,13 m en el camión.
- **Manos:** `agarrarVolante` (`lib/vehicleFx.ts`) es una IK analítica de dos huesos (`UpperArm`, `LowerArm`; la muñeca llega a 9 cm
  del agarre, codo hacia abajo y afuera) que corre cada cuadro después del mixer. Los agarres son dos puntos del aro a las 10 y las 2,
  en el marco del volante, así que rotan con él. Con el volante a 0, 1,5 y 2,4 rad la mano alcanza el agarre (el peor caso, el montacargas a
  2,4 rad, queda a 3,5 cm). El peso de la IK sube en 0,25 s al subirse. Se ve en 3ª persona (en 1ª el cuerpo se oculta).
- **Volante:** 0,34 m en el camión (antes 0,44, llenaba la vista en 1ª persona) y con columna de dirección. Gira hasta 2,4 rad
  (antes 3,2) para que las manos no se crucen; ratio del camión 4.
- **Camión en 3ª persona:** al manejar se oculta la cabina maciza y se ve una hueca (frente, techo, puertas hasta 2,3 m, pilares, piso,
  tablero, asiento, pedales y volante) con las ventanas abiertas. La cámara va 6,5 m atrás, 4,5 m a la izquierda y 3,4 m arriba del
  conductor y lo mira (el mouse la gira alrededor de él). En 1ª persona se ocultan además parabrisas, espejos y parrilla, y las
  puertas son más bajas (la caja oscura de la izquierda era la puerta, a 65 cm de los ojos).

## Camión: acoplado y articulación

Medido en `planta_v10.glb`: el chasis del acoplado empezaba 1 m *detrás* del pivote (quinta rueda en x = -4,6, chasis desde -3,6): quedaba
un hueco de 40 cm y el plato de la quinta suelto. Ahora el acoplado se corre 2 m hacia la cabina (su borde queda 1 m delante del pivote,
como en un acoplado real) y 22 cm hacia arriba (su chasis pasa sobre el del tractor, que llega a 1,1 m, y apoya en la quinta, que llega a
1,22 m). El pivote del semirremolque es exactamente la quinta (mismo x, comprobado). Las patas de apoyo van recogidas bajo el chasis
(de 0,42 a 1,12 m), entre las ruedas. El camión mide 18,08 m, con la cola donde estaba la del modelo fundido. La distancia del pivote a los ejes
del acoplado pasó de 11,5 a 9,5 m. La articulación tiene tope de 1 rad (57°): en un círculo de 5 m llega justo a ese tope y la holgura
mínima entre acoplado y cabina es 1,26 m (el borde delantero del acoplado barre un radio de 1,6 m y la cabina está a 2,95 m del pivote).
El signo es correcto: al girar a la izquierda el acoplado queda con ángulo negativo.

## Colisiones

- **A pie:** el operario (radio 0,4 m) avanza en sub-pasos de 25 cm y después de cada uno se aparta de las paredes con rayos radiales
  en 8 direcciones a 0,55, 1,0 y 1,6 m de altura (el de rodillas pasa por encima de los escalones que sube). Así desliza por paredes y
  esquinas en vez de frenar en seco. Parado, también lo empuja un vehículo que se le acerca.
- **Vehículos:** cada uno tiene huella rectangular (el camión, dos: tractor y acoplado, que gira). Cada cuadro se prueba la pose nueva con
  rayos desde el centro de cada cuerpo a puntos del borde cada ~1,2 m (esquinas, medios laterales e intermedios) a 0,6 y 1,4 m de altura, y
  con el teorema del eje separador contra los demás vehículos (flota, montacargas propio y camión). Si choca prueba avanzar sin girar,
  deslizar por la pared (se descuenta de la marcha lo que empuja contra ella; 15 % menos de velocidad) y girar sin avanzar; recién ahí
  frena. Si ya estaba apoyado en algo (recién pedido junto a una pared) no se traba.
- **Operario y vehículos:** no se puede entrar a la huella de un vehículo (se lo aparta hasta 0,4 m del borde). Al bajarse se lo ubica
  en el primer lugar libre (costado izquierdo a la altura del conductor, después el derecho, desplazados, atrás y adelante),
  comprobado con rayos y contra los demás vehículos.
- **Flota de la simulación:** los montacargas que sigue la simulación esperan antes de entrar a la huella del vehículo que maneja el operario
  (`huellaUsuario` en `lib/live3d.ts`, margen 1,3 m). No esquivan al operario a pie ni a los camiones animados.
- **Qué se probó:** las funciones de empuje y el teorema del eje separador, en node contra paredes simuladas (desliza por la pared y por
  la esquina; el operario dentro de un montacargas sale a 0,40 m del borde; una separación de 5 cm cuenta como choque por el margen de
  10 cm). No se probó a mano en el navegador.

## Límites conocidos

- Los camiones animados de la simulación no chocan con el operario ni con el vehículo que maneja (lo atraviesan); los montacargas de la simulación esperan al vehículo que maneja el operario, pero no esquivan al operario a pie.
- No hay controles táctiles: en celular no se puede caminar.
- Manejar un montacargas es solo visual: no cambia la simulación.
- Ruedas, dirección y suspensión son solo visuales: los vehículos no se ajustan a la altura del piso.
