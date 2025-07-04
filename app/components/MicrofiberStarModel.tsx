import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

export const MicrofiberStarModel: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const scrollProgress = useRef(0); // Track scroll progress for gathering
  const rotationSpeed = useRef(0);
  const lastScrollDirection = useRef<"up" | "down" | null>(null);

  let maxDim = 0;
  let particleRadius = 1500;
  const particleCount = 1000;

  let currentParticleCount = particleCount;
  const maxParticles = 300000;

  // Particle setup

  const particlesGeometry = new THREE.BufferGeometry();
  const positions = new Float32Array(maxParticles * 3);
  const velocities = new Float32Array(maxParticles * 3);
  const targetPositions = new Float32Array(maxParticles * 3);

  const sectorHalfAngle = Math.PI / 3; // 30 degrees

  useEffect(() => {
    if (!mountRef.current) return;

    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 0); // Transparent background
    mountRef.current.appendChild(renderer.domElement);

    // Lighting
    scene.add(new THREE.AmbientLight(0xffffff, 0.8));
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(0, 1, 1);
    scene.add(directionalLight);

    // Debugging helpers
    scene.add(new THREE.AxesHelper(50));
    const gridHelper = new THREE.GridHelper(100, 10, 0x888888, 0x888888);
    gridHelper.position.y = -10;
    scene.add(gridHelper);

    const targetMarker = new THREE.Mesh(
      new THREE.SphereGeometry(0.5, 32, 32),
      new THREE.MeshBasicMaterial({ color: 0xff0000 })
    );
    targetMarker.position.set(600, -250, 0);
    scene.add(targetMarker);

    if (!renderer.getContext()) {
      console.error("WebGL not supported");
      return;
    }

    regenerateInitialPositions();

    const positionAttribute = new THREE.BufferAttribute(positions, 3);
    positionAttribute.setUsage(THREE.DynamicDrawUsage);
    particlesGeometry.setAttribute("position", positionAttribute);

    const particleMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 2.0,
      transparent: true,
      blending: THREE.AdditiveBlending,
    });
    const particleSystem = new THREE.Points(
      particlesGeometry,
      particleMaterial
    );
    scene.add(particleSystem);

    // camera.position.set(10, 10, 10);
    // camera.lookAt(0, 0, 0);

    const sectorAxis = new THREE.Vector3(0, 1, 0); // Y-axis

    window.addEventListener("wheel", handleScroll);

    let model: THREE.Object3D | null = null;
    const loader = new GLTFLoader();
    loader.load(
      "/assets/model.glb",
      (gltf) => {
        model = gltf.scene;
        scene.add(model);

        const box = new THREE.Box3().setFromObject(model);
        const center = new THREE.Vector3();
        box.getCenter(center);
        gltf.scene.position.sub(center);

        const pivot = new THREE.Object3D();
        pivot.add(gltf.scene);
        scene.add(pivot);
        model = pivot;

        const size = new THREE.Vector3();
        box.getSize(size);

        maxDim = Math.max(size.x, size.y, size.z, 10);
        particleRadius = maxDim * 1.5;
        updateTargetPositions();

        camera.position.set(-maxDim * 0.7, maxDim * 0.9, maxDim * 1);
        model.rotation.x += 0.6;
        camera.lookAt(-200, 100, 0);
      },
      undefined,
      (error) => console.error("Error loading GLB:", error)
    );

    const animate = () => {
      requestAnimationFrame(animate);

      if (rotationSpeed.current > 0) {
        updateTargetPositions();
      }

      if (rotationSpeed.current > 0 && currentParticleCount < maxParticles) {
        addParticles(20); // Increment size as desired
      }

      if (model) {
        model.rotation.y += rotationSpeed.current;
      }

      for (let i = 0; i < currentParticleCount * 3; i += 3) {
        const x = positions[i];
        const y = positions[i + 1];
        const z = positions[i + 2];

        const newX =
          x * Math.cos(velocities[i + 1]) - z * Math.sin(velocities[i + 1]);
        const newZ =
          x * Math.sin(velocities[i + 1]) + z * Math.cos(velocities[i + 1]);

        const lerpFactor = 0.05 * scrollProgress.current;
        positions[i] = THREE.MathUtils.lerp(
          newX,
          targetPositions[i],
          lerpFactor
        );
        positions[i + 1] = THREE.MathUtils.lerp(
          y,
          targetPositions[i + 1],
          lerpFactor
        );
        positions[i + 2] = THREE.MathUtils.lerp(
          newZ,
          targetPositions[i + 2],
          lerpFactor
        );
      }

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

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("wheel", handleScroll);
      if (mountRef.current) {
        mountRef.current.removeChild(renderer.domElement);
      }
    };
  }, []);

  const addParticles = (num: number) => {
    const start = currentParticleCount * 3;
    const end = Math.min(currentParticleCount + num, maxParticles) * 3;

    for (let i = start; i < end; i += 3) {
      const theta = Math.random() * 2 * Math.PI;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = particleRadius * Math.cbrt(Math.random());

      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);

      positions[i] = x;
      positions[i + 1] = y;
      positions[i + 2] = z;

      velocities[i] = (Math.random() - 0.5) * 0.02;
      velocities[i + 1] = (Math.random() - 0.5) * 0.02;
      velocities[i + 2] = (Math.random() - 0.5) * 0.02;

      targetPositions[i] = x;
      targetPositions[i + 1] = y;
      targetPositions[i + 2] = z;
    }

    currentParticleCount = Math.min(currentParticleCount + num, maxParticles);

    particlesGeometry.setDrawRange(0, currentParticleCount);
    particlesGeometry.attributes.position.needsUpdate = true;
  };

  const handleScroll = (event: WheelEvent) => {
    const scrollDelta = event.deltaY;
    const direction = scrollDelta > 0 ? "down" : "up";

    if (direction !== lastScrollDirection.current) {
      if (direction === "up") {
        console.log("Scrolling up: generating new scatter");
        regenerateInitialPositions();
      }
      lastScrollDirection.current = direction;
    }

    scrollProgress.current += scrollDelta * 0.0001;
    scrollProgress.current = Math.max(0, Math.min(1, scrollProgress.current));

    if (direction === "down") {
      rotationSpeed.current += scrollDelta * 0.0001;
    } else {
      rotationSpeed.current -= Math.abs(scrollDelta) * 0.0001;
    }

    rotationSpeed.current = Math.max(0, Math.min(rotationSpeed.current, 0.05));

    updateTargetPositions();
  };

  const updateTargetPositions = () => {
    for (let i = 0; i < currentParticleCount * 3; i += 3) {
      const r = particleRadius * Math.cbrt(Math.random());
      const theta = Math.random() * 2 * Math.PI;
      const maxPhi = sectorHalfAngle * scrollProgress.current;
      const phi = Math.random() * maxPhi;

      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.cos(phi);
      const z = r * Math.sin(phi) * Math.sin(theta);

      targetPositions[i] = maxDim * 0;
      targetPositions[i + 1] = maxDim * 0.2;
      targetPositions[i + 2] = maxDim * 0.1;
    }
  };

  const regenerateInitialPositions = () => {
    for (let i = 0; i < currentParticleCount * 3; i += 3) {
      const theta = Math.random() * 2 * Math.PI;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = particleRadius * Math.cbrt(Math.random());

      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);

      positions[i] = x;
      positions[i + 1] = y;
      positions[i + 2] = z;

      velocities[i] = (Math.random() - 0.5) * 0.02;
      velocities[i + 1] = (Math.random() - 0.5) * 0.02;
      velocities[i + 2] = (Math.random() - 0.5) * 0.02;

      targetPositions[i] = x;
      targetPositions[i + 1] = y;
      targetPositions[i + 2] = z;
    }
  };

  return (
    <div
      ref={mountRef}
      className="w-[100%] h-full"
      style={{
        minHeight: "640px",
        minWidth: "600px",
        background: "transparent",
      }}
    />
  );
};

export default MicrofiberStarModel;
