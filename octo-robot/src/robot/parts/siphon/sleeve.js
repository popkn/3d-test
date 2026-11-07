import * as THREE from 'three';
import { materials } from '../../../materials/index.js';
import { createBoltField, placeOnCircle } from '../common/index.js';

// 사이펀 슬리브: 몸체에 붙는 받침 + 바깥 슬리브(고정) + 안쪽 슬리브(뽑혀 나옴). +Y 방향. (s = 크기)
export function createSiphonBase(s) {
  const group = new THREE.Group();
  group.name = 'siphonBase';
  const profile = [[1.7, -0.5], [1.7, 0], [1.5, 0.15], [1.05, 0.22], [1.0, 0.22]]
    .map(([r, y]) => new THREE.Vector2(r * s, y * s));
  const flange = new THREE.Mesh(new THREE.LatheGeometry(profile, 48), materials.shell);
  flange.castShadow = true;
  group.add(flange);
  group.add(createBoltField(placeOnCircle({ radius: 1.4 * s, count: 8, y: 0.12 * s, facing: 'up' }), { size: 0.12 * s }));
  return group;
}

export function createOuterSleeve(s) {
  const group = new THREE.Group();
  group.name = 'outerSleeve';
  const tube = new THREE.Mesh(new THREE.CylinderGeometry(s, s, 1.4 * s, 40, 1, true), materials.shell);
  tube.position.y = 0.7 * s;
  tube.castShadow = true;
  group.add(tube);
  const lip = new THREE.Mesh(new THREE.TorusGeometry(s, 0.08 * s, 8, 40), materials.shellShade);
  lip.rotation.x = Math.PI / 2;
  lip.position.y = 1.4 * s;
  group.add(lip);
  const stripe = new THREE.Mesh(new THREE.TorusGeometry(s * 1.005, 0.05 * s, 6, 40), materials.accent);
  stripe.rotation.x = Math.PI / 2;
  stripe.position.y = 1.05 * s;
  group.add(stripe);
  return group;
}

export function createInnerSleeve(s) {
  const group = new THREE.Group();
  group.name = 'innerSleeve';
  const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.82 * s, 0.82 * s, 1.4 * s, 32), materials.metal);
  tube.position.y = 0.7 * s;
  tube.castShadow = true;
  group.add(tube);
  const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.9 * s, 0.9 * s, 0.15 * s, 32), materials.metalDark);
  collar.position.y = 1.4 * s;
  group.add(collar);
  return group;
}
