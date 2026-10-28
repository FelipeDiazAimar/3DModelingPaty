import * as THREE from "three";

/** Posición en el piso (coordenadas three) de cada montacargas tal como se dibuja: la escribe Scene3D en cada
 *  cuadro y la leen las cinemáticas para seguirlos con la cámara. */
export const fleetGround = new Map<string, THREE.Vector3>();

/** Grupo 3D de cada montacargas: lo mueve Scene3D según la simulación, o Walk cuando el operario lo maneja. */
export const forklifts = new Map<string, THREE.Group>();

/** Pose del camión de la cinemática (coordenadas de Blender); la escribe CineTruck y la lee la cámara. */
export const camionCine = { x: 0, y: 0, h: 0, visible: false };
