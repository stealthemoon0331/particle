import * as THREE from "three";

/**
 * Create a THREE.SpriteMaterial using a radial canvas gradient.
 */
export function createGradientMaterial({
  innerColor = "#3b70c7",
  midColor = "#ffffff",
  outerColor = "#081825",
  size = 24,
  blending = THREE.AdditiveBlending,
  alphaTest = 0.1,
  transparent = true,
} = {}): THREE.SpriteMaterial {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;

  const ctx = canvas.getContext("2d")!;
  const gradient = ctx.createRadialGradient(
    size / 2,
    size / 2,
    0,
    size / 2,
    size / 2,
    size / 2
  );

  gradient.addColorStop(0, innerColor);
  gradient.addColorStop(0.5, midColor);
  gradient.addColorStop(1, outerColor);

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);

  return new THREE.SpriteMaterial({
    map: texture,
    blending,
    alphaTest,
    transparent,
  });
}

/**
 * Create a THREE.SpriteMaterial using an image texture.
 */
// export function createImageMaterial({
//   color = "#ffffff",
//   textureUrl = "/assets/map_mask.png",
//   blending = THREE.AdditiveBlending,
//   alphaTest = 0.1,
//   transparent = true,
// }={}): THREE.SpriteMaterial {
//   const texture = new THREE.TextureLoader().load(textureUrl);

//   return new THREE.SpriteMaterial({
//     map: texture,
//     color: new THREE.Color(color),
//     blending,
//     alphaTest,
//     transparent,
//   });
// }


export function createSprite({
  material,
  scale = new THREE.Vector3(50, 50, 50),
  position = new THREE.Vector3(0, 0, 0),
}: any): THREE.Sprite {
  const sprite = new THREE.Sprite(material);
  sprite.scale.copy(scale);
  sprite.position.copy(position);
  return sprite;
}
