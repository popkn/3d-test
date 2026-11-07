import * as THREE from 'three';
import { sceneConfig } from './sceneConfig.js';

// 바닥: 배경색과 같은 색이라 보이지 않고, 그림자만 받아서 떠 있는 느낌을 준다.
export function createGround() {
  const { size, shadowOpacity } = sceneConfig.ground;
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(size, size),
    new THREE.ShadowMaterial({ opacity: shadowOpacity }),
  );
  ground.name = 'ground';
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  return ground;
}
