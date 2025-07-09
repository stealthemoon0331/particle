import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import {
  addParticles,
  regenerateInitialPositions,
  setupParticles,
  updateParticles,
  updateTargetPositions,
} from "./particles";
import { loadParticleModel } from "./loaders";
import { configureCamera } from "./camera";
import {
  MAXPARTICLES,
  PARTICLE_COUNT,
  PARTICLE_RADIUS,
  SECTOR_HALF_ANGLE,
} from "~/config/constants";

const MicrofiberStarModel: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const scrollProgress = useRef(0); // Track scroll progress for gathering
  const rotationSpeed = useRef(0.005);
  const lastScrollDirection = useRef<"up" | "down" | null>(null);

  let maxDim = 0;
  let particleRadius = PARTICLE_RADIUS;
  const particleCount = PARTICLE_COUNT;
  let currentParticleCount = particleCount;
  const maxParticles = MAXPARTICLES;
  const sectorHalfAngle = SECTOR_HALF_ANGLE;

  const particlesGeometry = new THREE.BufferGeometry();
  const positions = new Float32Array(maxParticles * 3);
  const velocities = new Float32Array(maxParticles * 3);
  const targetPositions = new Float32Array(maxParticles * 3);
  const gatherSpeeds = new Float32Array(maxParticles);

  useEffect(() => {
    if (!mountRef.current) return;

    const scene = new THREE.Scene();
    const objModel = new THREE.Group();

    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;

    // const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);

    const aspect = width / height;
    const frustumSize = 2000; // You can tweak the zoom level here

    const camera = new THREE.OrthographicCamera(
      (-frustumSize * aspect) / 4,
      (frustumSize * aspect) / 4,
      frustumSize / 6,
      -frustumSize / 6,
      0.1,
      5000
    );

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 0); // Transparent background
    mountRef.current.appendChild(renderer.domElement);

    // Lightin
    // scene.add(new THREE.AmbientLight(0xffffff, 0.8));
    const directionalLight = new THREE.DirectionalLight(0xffffff, 3);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 500;
    directionalLight.shadow.camera.left = -100;
    directionalLight.shadow.camera.right = 100;
    directionalLight.shadow.camera.top = 100;
    directionalLight.shadow.camera.bottom = -100;
    directionalLight.position.set(-2, 8, 1);
    scene.add(directionalLight);

    const directionalLightTwo = new THREE.DirectionalLight(0xffffff, 1);
    directionalLightTwo.castShadow = true;
    directionalLightTwo.shadow.mapSize.width = 2048;
    directionalLightTwo.shadow.mapSize.height = 2048;
    directionalLightTwo.shadow.camera.near = 0.5;
    directionalLightTwo.shadow.camera.far = 500;
    directionalLightTwo.shadow.camera.left = -100;
    directionalLightTwo.shadow.camera.right = 100;
    directionalLightTwo.shadow.camera.top = 100;
    directionalLightTwo.shadow.camera.bottom = -100;
    directionalLightTwo.position.set(1, 1, -5);
    scene.add(directionalLightTwo);
    

    const fillLight = new THREE.DirectionalLight(0xffffff, 1);
    fillLight.position.set(-2, 1, -1);
    scene.add(fillLight);

    if (!renderer.getContext()) {
      console.error("WebGL not supported");
      return;
    }

    regenerateInitialPositions({
      positions,
      velocities,
      gatherSpeeds,
      targetPositions,
      particleRadius,
      count: currentParticleCount,
    });

    const particleSystem = setupParticles(particlesGeometry, positions);
    scene.add(particleSystem);

    let starModel: THREE.Object3D | null = null;
    let skinModel: THREE.Object3D | null = null;
    const loader = new GLTFLoader();

    loader.load("/assets/skin.glb", (gltf) => {
      skinModel = gltf.scene;
      const box = new THREE.Box3().setFromObject(skinModel);
      const center = new THREE.Vector3();

      const textureLoader = new THREE.TextureLoader();
      const texture = textureLoader.load("/assets/texture_pipe1.png");
      const material = new THREE.MeshStandardMaterial({
        map: texture,
        roughness: 1,
        metalness: 0,
        transparent: false,
        opacity: 1.0,
      });

      skinModel.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          mesh.material = material;
          mesh.castShadow = true;
          mesh.receiveShadow = true;
        }
      });

      // let skinObjectModel = new THREE.Group();

      objModel.add(skinModel);

      box.getCenter(center);
      skinModel.position.sub(center);
      scene.add(objModel);
    });

    // Load star
    loadParticleModel("/assets/star.glb", 10000000, scene, (pivot, size) => {
      starModel = pivot;
      maxDim = Math.max(size.x, size.y, size.z, 10);
      particleRadius = maxDim * 1.5;

      objModel.add(starModel);
      objModel.rotation.x = Math.PI / 4;
      objModel.rotation.z = -Math.PI / 3.5;
      objModel.rotation.y = Math.PI / 6;

      configureCamera(camera, maxDim);
      scene.add(objModel);
    });

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      addParticles({
        count: 3,
        currentParticleCount,
        maxParticles,
        particleRadius,
        positions,
        velocities,
        gatherSpeeds,
        targetPositions,
        particlesGeometry,
        updateCount: (v: any) => (currentParticleCount = v),
      });

      if (currentParticleCount === maxParticles)
        currentParticleCount = particleCount;

      if (rotationSpeed.current > 0.04) {
        updateTargetPositions({
          targetPositions,
          maxDim,
          currentParticleCount,
          scrollProgress: scrollProgress.current,
          particleRadius,
        });
      }

      if (starModel) starModel.rotation.y += rotationSpeed.current;

      currentParticleCount = updateParticles({
        rotationSpeed: rotationSpeed.current,
        currentParticleCount,
        positions,
        velocities,
        targetPositions,
        gatherSpeeds,
        onParticleRemoved: (i) => {
          console.log("Particle", i, "removed");
          // Optionally: add a new one immediately here if you want
        },
      });

      particlesGeometry.attributes.position.needsUpdate = true;
      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!mountRef.current) return;
      const newWidth = mountRef.current.clientWidth;
      const newHeight = mountRef.current.clientHeight;
      const newAspect = newWidth / newHeight;

      renderer.setSize(newWidth, newHeight);
      // camera.aspect = newWidth / newHeight;
      // camera.updateProjectionMatrix();

      camera.left = (-frustumSize * newAspect) / 2;
      camera.right = (frustumSize * newAspect) / 2;
      camera.top = frustumSize / 2;
      camera.bottom = -frustumSize / 2;
      camera.updateProjectionMatrix();
    };

    const handleScroll = (event: WheelEvent) => {
      const delta = event.deltaY;
      const direction = delta > 0 ? "down" : "up";

      if (direction !== lastScrollDirection.current) {
        // if (direction === "up") {
        //   regenerateInitialPositions({
        //     positions,
        //     velocities,
        //     gatherSpeeds,
        //     targetPositions,
        //     particleRadius,
        //     count: currentParticleCount,
        //   });
        // }
        lastScrollDirection.current = direction;
      }

      scrollProgress.current += delta * 0.0001;
      scrollProgress.current = Math.max(0, Math.min(1, scrollProgress.current));
      rotationSpeed.current +=
        (direction === "down" ? 1 : -1) * Math.abs(delta) * 0.00005;
      rotationSpeed.current = Math.max(
        0.005,
        Math.min(rotationSpeed.current, 0.05)
      );
    };

    window.addEventListener("wheel", handleScroll);
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("wheel", handleScroll);
      window.removeEventListener("resize", handleResize);
      mountRef.current?.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="w-[100vw] h-[100vh] min-h-[640px] min-w-[600px] md:bottom-5"
      style={{
        background: "transparent",
      }}
    />
  );
};

export default MicrofiberStarModel;
