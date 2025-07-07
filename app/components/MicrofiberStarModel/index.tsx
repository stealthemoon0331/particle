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
  const rotationSpeed = useRef(0);
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

    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 0); // Transparent background
    mountRef.current.appendChild(renderer.domElement);

    // Lighting
    scene.add(new THREE.AmbientLight(0xffffff, 0.8));
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);

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

      // let skinObjectModel = new THREE.Group();

      objModel.add(skinModel);

      box.getCenter(center);
      skinModel.position.sub(center);
      scene.add(objModel);
    });

    // Load star
    loadParticleModel("/assets/star.glb", 1000000, scene, (pivot, size) => {
      
      starModel = pivot;
      maxDim = Math.max(size.x, size.y, size.z, 10);
      particleRadius = maxDim * 1.5;

      objModel.add(starModel);
      objModel.rotation.x = Math.PI / 6;
      objModel.rotation.z = -Math.PI / 3;
      objModel.rotation.y = -Math.PI / 40;

      configureCamera(camera, maxDim);
      scene.add(objModel);
    });

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);

      if (rotationSpeed.current > 0) {
        updateTargetPositions({
          targetPositions,
          maxDim,
          currentParticleCount,
          scrollProgress: scrollProgress.current,
          particleRadius,
        });

        addParticles({
          count: 10,
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
      }

      if (starModel) starModel.rotation.y += rotationSpeed.current;

      updateParticles({
        rotationSpeed: rotationSpeed.current,
        currentParticleCount,
        positions,
        velocities,
        targetPositions,
        gatherSpeeds,
      });

      particlesGeometry.attributes.position.needsUpdate = true;
      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!mountRef.current) return;
      const newWidth = mountRef.current.clientWidth;
      const newHeight = mountRef.current.clientHeight;
      renderer.setSize(newWidth, newHeight);
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
    };

    const handleScroll = (event: WheelEvent) => {
      const delta = event.deltaY;
      const direction = delta > 0 ? "down" : "up";

      if (direction !== lastScrollDirection.current) {
        if (direction === "up") {
          regenerateInitialPositions({
            positions,
            velocities,
            gatherSpeeds,
            targetPositions,
            particleRadius,
            count: currentParticleCount,
          });
        }
        lastScrollDirection.current = direction;
      }

      scrollProgress.current += delta * 0.0001;
      scrollProgress.current = Math.max(0, Math.min(1, scrollProgress.current));
      rotationSpeed.current +=
        (direction === "down" ? 1 : -1) * Math.abs(delta) * 0.0001;
      rotationSpeed.current = Math.max(0, Math.min(rotationSpeed.current, 0.5));
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
      className="w-[90vw] h-[80vh] min-h-[640px] min-w-[600px]"
      style={{
        background: "transparent",
      }}
    />
  );
};

export default MicrofiberStarModel;
