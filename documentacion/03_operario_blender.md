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
  `CharacterArmature|X`); `Jump`, `Sit` (manejar, muslos horizontales, manos al volante), `Yes`, `No` y `Dance` se
  arman en el script por poses (FK por dirección de hueso) y se hornean a 24 fps.

## Dónde se usa

- El operario que maneja el usuario (`Walk.tsx`).
- Los operarios de FlexSim (`Scene3D.tsx → Operarios`), clonados con `SkeletonUtils.clone`.

## Para cambiarlo

Editar `blender/operario_worker.py` (colores, poses de los clips nuevos) y volver a correrlo. Si se cambian los
nombres de clips, actualizar `Walk.tsx` y `GESTOS`. Los operarios de autoelevador y de cámaras dentro de
`planta_v10.glb` (`Operario_Autoelevador_*`, `Operario_Camara_*`) son mallas estáticas armadas en
`blender/construir_planta.py`, sin este rig: no usan este archivo.
