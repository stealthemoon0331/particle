import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MeshSurfaceSampler } from "three/examples/jsm/math/MeshSurfaceSampler.js";

export const MicrofiberStarModel: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const scrollProgress = useRef(0); // Track scroll progress for gathering
  const rotationSpeed = useRef(0);
  const lastScrollDirection = useRef<"up" | "down" | null>(null);
  const scene = new THREE.Scene();

  const objModel = new THREE.Group();

  let maxDim = 0;
  let particleRadius = 500;
  const particleCount = 500;

  let currentParticleCount = particleCount;
  const maxParticles = 3000000;

  // Particle setup

  const particlesGeometry = new THREE.BufferGeometry();
  const positions = new Float32Array(maxParticles * 3);
  const velocities = new Float32Array(maxParticles * 3);
  const targetPositions = new Float32Array(maxParticles * 3);
  const gatherSpeeds = new Float32Array(maxParticles);

  const sectorHalfAngle = Math.PI / 3; // 30 degrees

  useEffect(() => {
    if (!mountRef.current) return;

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
    directionalLight.position.set(0, 1, 1);
    scene.add(directionalLight);

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

    // camera.position.set(0, 0, 50);
    // camera.lookAt(0, 0, 0);

    const sectorAxis = new THREE.Vector3(0, 1, 0); // Y-axis

    window.addEventListener("wheel", handleScroll);

    let model: THREE.Object3D | null = null;
    let starModel: THREE.Object3D | null = null;
    let skinModel: THREE.Object3D | null = null;

    const loader = new GLTFLoader();

    const loadParticleModel = (
      url: string,
      particleCount: number,
      onLoaded: (pivot: THREE.Object3D, size: THREE.Vector3) => void
    ) => {
      loader.load(
        url,
        (gltf) => {
          gltf.scene.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              const mesh = child as THREE.Mesh;

              mesh.updateWorldMatrix(true, false);
              mesh.geometry.applyMatrix4(mesh.matrixWorld);

              const particles = sampleParticlesOnSurface(mesh, particleCount);
              scene.add(particles);

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
        (err) => console.error(`Error loading ${url}:`, err)
      );
    };

    const load = () => {
      // Load skin.glb normally, keep as mesh
      loader.load(
        "/assets/skin.glb",
        (gltf) => {
          gltf.scene.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              const mesh = child as THREE.Mesh;
              mesh.castShadow = true;
              mesh.receiveShadow = true;
            }
          });

          skinModel = gltf.scene;

          skinModel.rotation.x = Math.PI / 3;
          skinModel.rotation.z = -Math.PI / 3;
          skinModel.rotation.y = Math.PI / 6;

          // Center the model
          const box = new THREE.Box3().setFromObject(skinModel);
          const center = new THREE.Vector3();
          box.getCenter(center);
          skinModel.position.sub(center);

          scene.add(skinModel);
        },
        undefined,
        (err) => console.error("Error loading skin.glb:", err)
      );

      loadParticleModel("/assets/star.glb", 8000, (pivot, size) => {
        starModel = pivot;

        maxDim = Math.max(size.x, size.y, size.z, 10);
        particleRadius = maxDim * 1.5;
        updateTargetPositions();

        objModel.add(starModel);

        // objModel.rotation.x

        camera.position.set(maxDim * 1, maxDim * 1, maxDim * 1);

        objModel.rotation.x = Math.PI / 3;
        objModel.rotation.z = -Math.PI / 3;
        objModel.rotation.y = Math.PI / 6;

        scene.add(objModel);

        const isMobile = window.innerWidth <= 768;
        camera.lookAt(isMobile ? 300 : -100, -50, 0);
      });
    };

    load();

    const animate = () => {
      requestAnimationFrame(animate);

      if (rotationSpeed.current > 0) {
        updateTargetPositions();
      }

      if (rotationSpeed.current > 0 && currentParticleCount < maxParticles) {
        addParticles(10); // Increment size as desired
      }

      if (starModel) {
        starModel.rotation.y += rotationSpeed.current;
      }

      for (let i = 0; i < currentParticleCount * 3; i += 3) {
        const x = positions[i];
        const y = positions[i + 1];
        const z = positions[i + 2];

        const newX =
          x * Math.cos(velocities[i + 1]) - z * Math.sin(velocities[i + 1]);
        const newZ =
          x * Math.sin(velocities[i + 1]) + z * Math.cos(velocities[i + 1]);
        console.log("rotationSpeed.current => ", rotationSpeed.current);
        if (rotationSpeed.current > 0) {
          const gatherFactor = gatherSpeeds[i / 3]; // Individualized
          const baseLerp = rotationSpeed.current * 0.3 * gatherFactor;
          const lerpFactor = Math.min(0.1, Math.max(baseLerp, 0.005));

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
        } else {
          // Move randomly when rotation speed is 0
          const randomSpeedBoost = 200;
          positions[i] += velocities[i] * randomSpeedBoost;
          positions[i + 1] += velocities[i + 1] * randomSpeedBoost;
          positions[i + 2] += velocities[i + 2] * randomSpeedBoost;
        }
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
      gatherSpeeds[i / 3] = 0.5 + Math.random() * 0.8;

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
        regenerateInitialPositions(); // Scatter
      }
      lastScrollDirection.current = direction;
    }

    scrollProgress.current += scrollDelta * 0.0001;
    scrollProgress.current = Math.max(0, Math.min(1, scrollProgress.current));

    if (direction === "down") {
      rotationSpeed.current += Math.abs(scrollDelta) * 0.0001;
      updateTargetPositions(); // ✅ Only gather targets on scroll down
    } else {
      rotationSpeed.current -= Math.abs(scrollDelta) * 0.0001;
    }

    rotationSpeed.current = Math.max(0, Math.min(rotationSpeed.current, 0.5));
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

      const spread = maxDim * 0.05; // small positional jitter

      targetPositions[i] = maxDim * 0 + (Math.random() - 0.5) * spread;
      targetPositions[i + 1] = maxDim * 0.2 + (Math.random() - 0.5) * spread;
      targetPositions[i + 2] = maxDim * 0.1 + (Math.random() - 0.5) * spread;

      // targetPositions[i] = x;
      // targetPositions[i + 1] = y;
      // targetPositions[i + 2] = z;
    }
  };

  const regenerateInitialPositions = () => {
    for (let i = 0; i < currentParticleCount * 3; i += 3) {
      gatherSpeeds[i / 3] = 0.5 + Math.random() * 0.8;

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

  function sampleParticlesOnSurface(
    mesh: THREE.Mesh,
    count: number = 10000
  ): THREE.Points {
    const geometry = mesh.geometry as THREE.BufferGeometry;

    const sampler = new MeshSurfaceSampler(mesh).build();

    const positions = new Float32Array(count * 3);
    const tempPosition = new THREE.Vector3();

    for (let i = 0; i < count; i++) {
      sampler.sample(tempPosition);
      positions.set([tempPosition.x, tempPosition.y, tempPosition.z], i * 3);
    }

    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(positions, 3)
    );

    const particleMaterial = new THREE.PointsMaterial({
      color: 0x00ffff,
      size: 0.02,
    });

    const particles = new THREE.Points(particleGeometry, particleMaterial);
    return particles;
  }

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
