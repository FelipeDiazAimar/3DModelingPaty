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

## Para cambiarlo

Editar `blender/operario_worker.py` (colores, poses de los clips nuevos) y volver a correrlo. Si se cambian los
nombres de clips, actualizar `Walk.tsx` y `GESTOS`. Los operarios de autoelevador y de cámaras dentro de
`planta_v10.glb` (`Operario_Autoelevador_*`, `Operario_Camara_*`) son mallas estáticas armadas en
`blender/construir_planta.py`, sin este rig: no usan este archivo.
