import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { sampleParticlesOnSurface } from "./particles";

export const loadParticleModel = (
  url: string,
  count: number,
  scene: THREE.Scene,
  onLoaded: (pivot: THREE.Object3D, size: THREE.Vector3) => void
) => {
  const loader = new GLTFLoader();
  loader.load(
    url,
    (gltf) => {
      gltf.scene.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          mesh.updateWorldMatrix(true, false);
          mesh.geometry.applyMatrix4(mesh.matrixWorld);

          const particles = sampleParticlesOnSurface(mesh, count);
          const box = new THREE.Box3().setFromBufferAttribute(
            mesh.geometry.attributes.position as THREE.BufferAttribute
          );
          const center = new THREE.Vector3();
          box.getCenter(center);
          particles.position.sub(center);

          const pivot = new THREE.Object3D();
          pivot.add(particles);
          scene.add(pivot);

          const size = new THREE.Vector3();
          box.getSize(size);
          onLoaded(pivot, size);
        }
      });
    },
    undefined,
    (err) => console.error(`Failed to load ${url}`, err)
  );
};
