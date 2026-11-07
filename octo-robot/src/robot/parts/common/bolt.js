import * as THREE from 'three';
import { materials } from '../../../materials/index.js';
import { cachedGeometry } from './geometryCache.js';
import { writeInstances } from './placement.js';

// 볼트: 와셔(얇은 원판) + 육각 머리. 마디 연결부와 관절 캡을 고정한다.
export const BOLT_SIZE = 0.035;

function washerGeometry() {
  return cachedGeometry('bolt.washer', () => {
    const g = new THREE.CylinderGeometry(1, 1, 0.18, 20);
    g.translate(0, 0.09, 0);
    return g;
  });
}

function headGeometry() {
  return cachedGeometry('bolt.head', () => {
    const g = new THREE.CylinderGeometry(0.68, 0.68, 0.5, 6);
    g.translate(0, 0.18 + 0.25, 0);
    return g;
  });
}

// 볼트 하나
export function createBolt({ size = BOLT_SIZE } = {}) {
  const group = new THREE.Group();
  group.name = 'bolt';
  const washer = new THREE.Mesh(washerGeometry(), materials.metal);
  const head = new THREE.Mesh(headGeometry(), materials.metalDark);
  for (const m of [washer, head]) { m.castShadow = true; group.add(m); }
  group.scale.setScalar(size);
  return group;
}

// 볼트 여러 개를 한 번에
export function createBoltField(placements, { size = BOLT_SIZE } = {}) {
  const group = new THREE.Group();
  group.name = 'boltField';
  const washers = new THREE.InstancedMesh(washerGeometry(), materials.metal, placements.length);
  const heads = new THREE.InstancedMesh(headGeometry(), materials.metalDark, placements.length);
  for (const m of [washers, heads]) {
    writeInstances(m, placements, size);
    group.add(m);
  }
  return group;
}
