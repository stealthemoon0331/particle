import * as THREE from "three";

export const configureCamera = (
  camera: THREE.PerspectiveCamera,
  maxDim: number
) => {
  camera.position.set(maxDim * 1, maxDim * 0.4, maxDim * 1);
  const isMobile = window.innerWidth <= 768;
  camera.lookAt(isMobile ? 300 : -300, -50, 0);
};
