import * as THREE from "three";

export const configureCamera = (
  camera: THREE.OrthographicCamera,
  maxDim: number
) => {
  camera.position.set(maxDim, maxDim, maxDim);
  camera.lookAt(-100, -100, 0);
};
