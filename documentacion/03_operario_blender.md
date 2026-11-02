# Operario 3D (Blender)

Archivo: `dashboard/web/public/models/operario.glb` (1,1 MB). Se genera con `blender/operario_worker.py`
(Blender 5.2, headless) a partir de `operario_worker.glb` del proyecto de Tecnologías para la Automatización
(modelo "Worker", CC0). El operario anterior (11 huesos, procedural) fue reemplazado; su `.blend` queda en
`blender/operario.blend` sin uso.

```
blender -b --python blender/operario_worker.py -- <operario_worker.glb> dashboard/web/public/models/operario.glb [salida.blend]
```

## Qué hace el script

- **Base:** malla y rig del Worker (62 huesos con dedos, 4 mallas con esqueleto): cabeza de proporción natural,
  hombros, manos con dedos y calzado con suela, rodilleras. Se quitan el bigote y los clips de combate.
- **Ropa por material (cambia la paleta, no la malla):** mameluco azul (`Op_Mameluco`, rodilleras `Op_Mameluco_Rodilla`),
  chaleco verde reflectivo (`Op_Chaleco`, `Op_Reflectivo`), casco naranja, guantes de nitrilo azules (`Op_Guante`),
  botas blancas de PVC (`Op_Bota`, `Op_Suela`), barbijo celeste (`Op_Barbijo`) y cofia blanca (`Op_Cofia`).
  Cofia y barbijo son caras de la cabeza recoloreadas; la cofia deja las orejas libres.
- **Clips (10), nombres sin prefijo:** `Idle`, `Walk`, `Run`, `Interact`, `Wave` vienen del rig (renombrados de
  `CharacterArmature|X`); `Jump`, `Sit` (manejar: muslos horizontales y rodillas a 90 grados; las manos las lleva a la IK de `Walk.tsx` hasta el volante), `Yes`, `No` y `Dance` se
  arman en el script por poses (FK por dirección de hueso) y se hornean a 24 fps.

## Correcciones del rig (pie "gigante" y clips rotos)

El Worker original trae los pies como objetivos de IK (`Foot.L/R`, hijos de `Root`) y el glTF no conserva el IK. Medido con la
malla evaluada, la suela de las botas debe medir 0,28 m (pose de reposo):

- **Idle, Interact y Wave** tenían las piernas abiertas y el pie fijo en el piso: una bota se estiraba a 0,35-0,42 m y la otra se
  achicaba a 0,18-0,20 m (el "pie muy grande y todo roto"). El script les quita los canales de `Body` y de las piernas
  (`UpperLeg`, `LowerLeg`): quedan las piernas rectas del rig, que llegan justo al pie. Ahora la suela mide 0,279 m en los tres clips.
- **Run** no cerraba el ciclo (el pie izquierdo saltaba 0,32 rad al volver al cuadro 0): los últimos 5 cuadros se mezclan
  (smoothstep) hacia el primero y el salto queda en 0,001 rad. Walk, Idle, Dance, etc. ya cerraban (su último cuadro repite el
  primero, que es lo correcto con la reproducción por tiempo de three.js).
- **Jump, Sit y Dance:** el pie va al tobillo real (rodilla + 0,51 m en la dirección de la pierna baja; antes forzaba la x de
  reposo), `Sit` abre un poco las rodillas (la columna de dirección pasa entre ellas) y en `Dance` el brazo levantado sube la
  clavícula (si no el hombro se hundía en el cuello) y los brazos bajos van más hacia afuera.
- Las botas no se reescalaron: miden 0,28 m de largo en un modelo de 1,86 m, proporción normal.

Verificación: Blender headless con la malla evaluada (largo de suela por clip), three.js en node (estiramiento de aristas por
cuadro, diferencia entre primer y último cuadro, transiciones Walk/Run a Idle) y renders Workbench de Idle, Walk, Run, Sit, Jump y Dance.

## Velocidad de reproducción

`Walk.tsx` ajusta el `timeScale` de `Walk` y `Run` a la velocidad horizontal real del operario (suavizada, entre 0,6x y 2,2x): a velocidad 1
el cuerpo avanza 1,35 m/s con `Walk` y 2,8 m/s con `Run` (pendiente del pie durante la pisada, medida en el GLB), así que a 1,8 y 4,5 m/s
van a 1,33x y 1,6x. Si choca con una pared el paso se frena y no patina.

## Dónde se usa

- El operario que maneja el usuario (`Walk.tsx`).
- Los operarios de FlexSim (`Scene3D.tsx → Operarios`), clonados con `SkeletonUtils.clone`.
- Los empleados de la planta (`components/OperariosPlanta.tsx`): 47 personas, una por cada malla `Torso` de `Operario_*` en `planta_v10.glb`
  (49 posiciones distintas menos las 2 envasadoras que ya cubren los operarios de FlexSim). `Plant` oculta las ~660 mallas estáticas
  (`TRUCK_HIDE` incluye `Operario_`) y cada persona es un clon con su `AnimationMixer`, en la posición y orientación de la malla
  (la malla estática mira a +X; `operario.glb`, a +Z). De pie la base es `Idle` (fase inicial al azar) y los brazos van por IK después del mixer, con peso 0 -> 1 -> 0 suave:
  `alcanzar(op, lado, punto, w)` y `mirar(op, punto, w)` en `lib/vehicleFx.ts` (IK de 2 huesos `brazoA`, la misma del volante; el objetivo se
  acerca a 0,65 m del hombro, el operario no se mueve). Los puntos de trabajo se buscan al iniciar en la geometría de `planta_v10.glb`
  (`HMI_Pantalla`, cuerpos de máquina, `Cinta_*_Banda`, `Mesada_*_Tapa`, `Cartones_Planos`, `Envasadora_*_Base`, `Pallet*_Pallet`) y el
  operario se orienta hacia ellos; sin objeto a menos de 1 m se usa un punto delante a la cintura. Tareas: **caja** (envasado, encajonado,
  desencajado, estibado): toma una caja de 5 kg (`BoxGeometry` con `M_Carton`) con las dos manos, la caja pasa a ser hija del hueso `WristR`,
  la lleva ~0,5 m y la apoya; **maq** (picadora, mezcladora, formadora): pulsa el panel HMI (vaivén de 1 cm, 1-2 s) y revisa la máquina con
  la cabeza. Si su máquina (`Operario_L7_Picadora` -> `Picadora_L7`, etc.) no está en `proc` en el snapshot, la tarea se congela (sin
  máquina o sin snapshot trabajan). IK y cajas solo a menos de 25 m. También reemplazan a los 121 humanoides "kit" fundidos de la planta (nodos `Op_*`, todos instancias de la malla `KIT_Operario`; `TRUCK_HIDE` incluye `Op_`).
  Se ponen con el origen en los pies y la orientación del nodo; `Op_Autoelevador_*` van en `Sit`; los que tienen una superficie a menos de 1 m
  (`Carrito_Pasillo` para carritos, `Aditivos_Mesa` para aditivos, cintas, mesadas, pallets) hacen la tarea de caja; el resto (oficina, comedor,
  vestuario, faena sin superficie detectada) queda en `Idle` sin IK. Carritos y aditivos solo toman y apoyan una caja: no hay mezcladora a su alcance para volcar. Los de los dos montacargas parados van en `Sit`. Solo se dibujan y animan los que están a menos de 50 m de la cámara.
  No tienen colisión (no están en la planta que recorre `Walk.tsx`).

## Para cambiarlo

Editar `blender/operario_worker.py` (colores, poses de los clips nuevos) y volver a correrlo. Si se cambian los
nombres de clips, actualizar `Walk.tsx` y `GESTOS`. Las mallas `Operario_*` dentro de `planta_v10.glb` siguen en el archivo
(sin este rig) pero la web las oculta y las reemplaza por clones de este modelo. Los operarios armados con el kit
(`Op_Carritos_*`, `Op_Aditivos_*`, `Op_Autoelevador_PT_*`) son mallas fundidas y siguen estáticos.
