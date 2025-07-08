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

          const posAttr = geometry.getAttribute("position");
          const count = posAttr.count;
          const colors = new Float32Array(count * 3);

          let minRadius = Infinity;
          let maxRadius = -Infinity;

          // First pass: find min/max radial distance
          for (let i = 0; i < count; i++) {
            const x = posAttr.getX(i);
            const z = posAttr.getZ(i);
            const r = Math.sqrt(x * x + z * z);
            minRadius = Math.min(minRadius, r);
            maxRadius = Math.max(maxRadius, r);
          }

          // Second pass: assign colors
          const innerColor = new THREE.Color(0xffeb0a); // Yellow
          const outerColor = new THREE.Color(0xff740a); // Red-Orange
          const tempColor = new THREE.Color();

          for (let i = 0; i < count; i++) {
            const x = posAttr.getX(i);
            const z = posAttr.getZ(i);
            const r = Math.sqrt(x * x + z * z);
            const t = (r - minRadius) / (maxRadius - minRadius);

            tempColor.lerpColors(innerColor, outerColor, t);
            colors[i * 3] = tempColor.r;
            colors[i * 3 + 1] = tempColor.g;
            colors[i * 3 + 2] = tempColor.b;
          }

          geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

          // Use material with vertex colors
          mesh.geometry = geometry;
          mesh.material = new THREE.MeshStandardMaterial({
            vertexColors: true,
            roughness: 0.5,
            metalness: 0.1,
            transparent: false,
            opacity: 0.25,
          });

          mesh.position.set(0, 0, 0);
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
