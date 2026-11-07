import * as THREE from 'three';
import { materials } from '../../../materials/index.js';
import { createRivetField, placeOnCircle } from '../common/index.js';

// 눈 소켓: 머리에서 튀어나온 두꺼운 흰 하우징. +Y 방향으로 만든다. (s = 눈 크기)
export function createEyeSocket(s) {
  const group = new THREE.Group();
  group.name = 'eyeSocket';
  const profile = [
    [1.05, -0.45], [1.07, 0.1], [1.05, 0.34], [0.99, 0.48], [0.9, 0.55],
    [0.82, 0.53], [0.79, 0.44], [0.78, 0.1],
  ].map(([r, y]) => new THREE.Vector2(r * s, y * s));
  const housing = new THREE.Mesh(new THREE.LatheGeometry(profile, 64), materials.shell);
  housing.castShadow = housing.receiveShadow = true;
  group.add(housing);

  // 안쪽 바닥판
  const back = new THREE.Mesh(new THREE.CircleGeometry(0.8 * s, 48), materials.metalDark);
  back.rotation.x = -Math.PI / 2;
  back.position.y = 0.1 * s;
  group.add(back);

  // 하우징 둘레 리벳
  group.add(createRivetField(placeOnCircle({ radius: 1.075 * s, count: 20, y: 0.05 * s })));
  return group;
}
