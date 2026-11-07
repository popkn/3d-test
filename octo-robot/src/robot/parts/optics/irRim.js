import * as THREE from 'three';
import { materials } from '../../../materials/index.js';

// 적외선 링: 렌즈를 둘러싼 빨간 고리 + 그 아래 검은 받침 고리
export function createIrRim(s) {
  const group = new THREE.Group();
  group.name = 'irRim';
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.79 * s, 0.79 * s, 0.14 * s, 48, 1, true), materials.metalDark);
  base.position.y = 0.32 * s;
  group.add(base);
  const plate = new THREE.Mesh(new THREE.RingGeometry(0.62 * s, 0.79 * s, 48), materials.metalDark);
  plate.rotation.x = -Math.PI / 2;
  plate.position.y = 0.39 * s;
  group.add(plate);
  const red = new THREE.Mesh(new THREE.TorusGeometry(0.72 * s, 0.055 * s, 12, 64), materials.accent);
  red.rotation.x = Math.PI / 2;
  red.position.y = 0.42 * s;
  red.castShadow = true;
  group.add(red);
  return group;
}
