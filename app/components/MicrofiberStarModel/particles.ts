import * as THREE from "three";
import { MeshSurfaceSampler } from "three/examples/jsm/math/MeshSurfaceSampler.js";
import { SECTOR_HALF_ANGLE } from "~/config/constants";

export const regenerateInitialPositions = ({
  positions,
  velocities,
  gatherSpeeds,
  targetPositions,
  particleRadius,
  count,
}: any) => {
  for (let i = 0; i < count * 3; i += 3) {
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

export const setupParticles = (
  geometry: THREE.BufferGeometry,
  positions: Float32Array
): THREE.Points => {
  const attr = new THREE.BufferAttribute(positions, 3);
  attr.setUsage(THREE.DynamicDrawUsage);
  geometry.setAttribute("position", attr);

  const material = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 2.0,
    transparent: true,
    blending: THREE.AdditiveBlending,
  });

  return new THREE.Points(geometry, material);
};

export function sampleParticlesByRadialDistance(
  mesh: THREE.Mesh,
  count: number = 10000
): THREE.Points {
  const sampler = new MeshSurfaceSampler(mesh).build();

  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);

  const temp = new THREE.Vector3();

  let minRadius = Infinity;
  let maxRadius = -Infinity;

  const sampled = [];

  // First: Sample points & compute radial distance
  for (let i = 0; i < count; i++) {
    sampler.sample(temp);
    const radius = Math.sqrt(temp.x ** 2 + temp.z ** 2); // distance from Y-axis

    sampled.push({ pos: temp.clone(), radius });

    minRadius = Math.min(minRadius, radius);
    maxRadius = Math.max(maxRadius, radius);
  }

  // Normalize and apply colors based on radius
  for (let i = 0; i < count; i++) {
    const { pos, radius } = sampled[i];

    const t = (radius - minRadius) / (maxRadius - minRadius); // normalize 0–1
    const color = new THREE.Color();

    // Example gradient: inner = blue, outer = red
    // color.setHSL(0.6 - t * 0.6, 1.0, 0.5);
    const innerColor = new THREE.Color(0xffff00); // Bright Yellow
    const outerColor = new THREE.Color(0xff3300); // Strong Red + a little Yellow

    color.lerpColors(innerColor, outerColor, t);

    positions.set([pos.x, pos.y, pos.z], i * 3);
    colors.set([color.r, color.g, color.b], i * 3);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

  const material = new THREE.PointsMaterial({
    size: 0.025,
    vertexColors: true, // Enable custom colors
  });

  return new THREE.Points(geometry, material);
}

export const updateTargetPositions = ({
  targetPositions,
  maxDim,
  currentParticleCount,
  scrollProgress,
  particleRadius,
}: any) => {
  for (let i = 0; i < currentParticleCount * 3; i += 3) {
    const r = particleRadius * Math.cbrt(Math.random());
    const theta = Math.random() * 2 * Math.PI;
    const maxPhi = SECTOR_HALF_ANGLE * scrollProgress.current;
    const phi = Math.random() * maxPhi;

    const x = r * Math.sin(phi) * Math.cos(theta);
    const y = r * Math.cos(phi);
    const z = r * Math.sin(phi) * Math.sin(theta);

    const spread = maxDim * 0.05; // small positional jitter

    targetPositions[i] = maxDim * 0 + (Math.random() - 0.5) * spread;
    targetPositions[i + 1] = maxDim * 0.2 + (Math.random() - 0.5) * spread;
    targetPositions[i + 2] = maxDim * 0.1 + (Math.random() - 0.5) * spread;
  }
};

export const addParticles = ({
  count,
  currentParticleCount,
  maxParticles,
  particleRadius,
  positions,
  velocities,
  gatherSpeeds,
  targetPositions,
  particlesGeometry,
  updateCount,
}: any) => {
  const start = currentParticleCount * 3;
  const end = Math.min(currentParticleCount + count, maxParticles) * 3;

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

    gatherSpeeds[i / 3] = 0.5 + Math.random() * 0.8;
    targetPositions[i] = x;
    targetPositions[i + 1] = y;
    targetPositions[i + 2] = z;
  }

  updateCount(Math.min(currentParticleCount + count, maxParticles));

  particlesGeometry.setDrawRange(0, currentParticleCount);
  particlesGeometry.attributes.position.needsUpdate = true;
};

export const updateParticles = ({
  rotationSpeed,
  currentParticleCount,
  positions,
  velocities,
  targetPositions,
  gatherSpeeds,
}: any) => {
  for (let i = 0; i < currentParticleCount * 3; i += 3) {
    const x = positions[i];
    const y = positions[i + 1];
    const z = positions[i + 2];
    const theta = velocities[i + 1];

    const newX = x * Math.cos(theta) - z * Math.sin(theta);
    const newZ = x * Math.sin(theta) + z * Math.cos(theta);

    if (rotationSpeed > 0) {
      const gatherFactor = gatherSpeeds[i / 3];
      const lerpFactor = Math.min(
        0.1,
        Math.max(rotationSpeed * 0.3 * gatherFactor, 0.005)
      );

      positions[i] = THREE.MathUtils.lerp(newX, targetPositions[i], lerpFactor);
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
      const randomSpeed = 200;
      positions[i] += velocities[i] * randomSpeed;
      positions[i + 1] += velocities[i + 1] * randomSpeed;
      positions[i + 2] += velocities[i + 2] * randomSpeed;
    }
  }
};
