import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { sampleParticlesByRadialDistance } from "./particles";

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
      const pivot = new THREE.Object3D();
      const size = new THREE.Vector3();

      gltf.scene.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;

          // Bake transforms into geometry
          mesh.updateWorldMatrix(true, false);
          const geometry = mesh.geometry.clone();
          geometry.applyMatrix4(mesh.matrixWorld);
          geometry.computeBoundingBox();

          // Center geometry
          const box = geometry.boundingBox!;
          const center = new THREE.Vector3();
          box.getCenter(center);
          geometry.translate(-center.x, -center.y, -center.z);

          // Update mesh
          mesh.geometry = geometry;
          mesh.position.set(0, 0, 0);
          const textureLoader = new THREE.TextureLoader();
          const texture = textureLoader.load("/assets/texture.png");

          mesh.material = new THREE.MeshStandardMaterial({
            map: texture,
            roughness: 0.8,
            metalness: 0.1,
            transparent: true,
            opacity: 0.3,
          });

          // Add mesh to pivot
          pivot.add(mesh);

          // Sample particles on same geometry
          const tempMesh = new THREE.Mesh(geometry);
          const particles = sampleParticlesByRadialDistance(tempMesh, count);
          pivot.add(particles);
          // Size for camera config
          box.getSize(size);
        }
      });

      scene.add(pivot);
      onLoaded(pivot, size);
    },
    undefined,
    (err) => console.error(`Failed to load ${url}`, err)
  );
};
