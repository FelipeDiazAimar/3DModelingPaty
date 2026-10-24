import * as THREE from "three";

/** Posición en el piso (coordenadas three) de cada montacargas tal como se dibuja: la escribe Scene3D en cada
 *  cuadro y la leen las cinemáticas para seguirlos con la cámara. */
export const fleetGround = new Map<string, THREE.Vector3>();
