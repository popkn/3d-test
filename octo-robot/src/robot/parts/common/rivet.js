import * as THREE from 'three';
import { materials } from '../../../materials/index.js';
import { cachedGeometry } from './geometryCache.js';
import { writeInstances } from './placement.js';

// 리벳: 납작한 반구. 머리 껍데기와 팔 마디에 줄지어 박힌다.
export const RIVET_RADIUS = 0.018;

function rivetGeometry() {
  return cachedGeometry('rivet', () => {
    const g = new THREE.SphereGeometry(1, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2);
    g.scale(1, 0.55, 1);
    return g;
  });
}

// 리벳 하나
export function createRivet({ radius = RIVET_RADIUS, material = materials.metalDark } = {}) {
  const mesh = new THREE.Mesh(rivetGeometry(), material);
  mesh.name = 'rivet';
  mesh.scale.setScalar(radius);
  mesh.castShadow = true;
  return mesh;
}

// 리벳 여러 개를 한 번에 (placements: placement.js 함수 결과)
export function createRivetField(placements, { radius = RIVET_RADIUS, material = materials.metalDark } = {}) {
  const mesh = new THREE.InstancedMesh(rivetGeometry(), material, placements.length);
  mesh.name = 'rivetField';
  writeInstances(mesh, placements, radius);
  mesh.castShadow = true;
  return mesh;
}
