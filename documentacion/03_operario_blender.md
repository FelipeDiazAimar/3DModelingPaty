# Operario 3D (Blender)

Archivo: `dashboard/web/public/models/operario.glb` (774 KB). Fuente: `blender/operario.blend`, que **no se
versiona** (los `.blend` están en `.gitignore`); solo existe en la PC donde se hizo.

## Cómo se hizo

Con el MCP de Blender (Blender 5.2), en una escena aparte llamada "Operario":

- **Cuerpo:** el torso es un "loft" de anillos superelípticos con perfil humano (cadera, cintura, pecho, hombros,
  cuello). Brazos y piernas usan el modificador Skin sobre un grafo de articulaciones (hombro, codo, muñeca,
  cadera, rodilla, tobillo) con radios uniformes calibrados y subdivisión. El Skin no sirvió para el tronco porque
  cruza los radios X/Y según la orientación de cada articulación.
- **Cabeza:** cráneo y mandíbula, nariz, orejas, ojos, barbijo celeste y casco de seguridad.
- **Ropa por zonas de material:** mameluco azul, chaleco verde reflectivo con dos cintas, cinturón, guantes y botas
  blancas de PVC (planta de alimentos).
- **Esqueleto:** 11 huesos (`hips`, `spine`, `head`, `upper_arm.L/R`, `forearm.L/R`, `thigh.L/R`, `shin.L/R`),
  pesos automáticos; todo lo que está por encima del cuello va 100 % con `head`.
- **Animaciones (10):** `Idle`, `Walk`, `Run`, `Jump`, `Sit` (manejar), `Interact`, `Wave`, `Yes`, `No`, `Dance`.
  Cada acción anima todos los huesos (los que no usa, en reposo) para que no herede poses de otra.

Exportado como GLB con animaciones en modo `ACTIONS`, eje Y arriba, frente hacia +Z de three.

## Dónde se usa

- El operario que maneja el usuario (`Walk.tsx`).
- Los 4 operarios de FlexSim (`Scene3D.tsx → Operarios`), clonados con `SkeletonUtils.clone`.

## Para cambiarlo

Abrir `blender/operario.blend`, escena "Operario", editar y volver a exportar con las mismas opciones
(`export_animation_mode="ACTIONS"`, `export_yup=True`, selección: `Operario` + `Operario_Cuerpo`). Si se cambian
nombres de huesos o de acciones, hay que actualizar `Walk.tsx` (nombres de los clips) y `GESTOS`.
