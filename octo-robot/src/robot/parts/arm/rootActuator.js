import * as THREE from 'three';
import { GeometryBuckets, meshesFromMerged, mat } from './geometryBuckets.js';
import { addSuckerPair } from './sucker.js';

// 팔 뿌리 구동부: 소켓에 꽂히는 굵은 흰 하우징 + 검은 구동 고리 + 빨간 띠.
// 반지름 1 기준, z = 0 ~ LENGTH.
export const ROOT_LENGTH = 1.5;
let merged = null;

function buildRoot() {
  const b = new GeometryBuckets();
  const cyl = new THREE.CylinderGeometry(1, 1, 1, 36);
  const torus = new THREE.TorusGeometry(1, 0.08, 8, 36);
  const L = ROOT_LENGTH;
  // 검은 구동 고리 (소켓 쪽)
  b.add('metalDark', cyl, mat(0, 0, 0.2, Math.PI / 2, 0, 0, 1.0, 0.4, 1.0));
  for (let k = 0; k < 10; k++) {
    const a = (k / 10) * Math.PI * 2;
    b.add('metal', new THREE.BoxGeometry(1, 1, 1), mat(Math.cos(a) * 1.0, Math.sin(a) * 1.0, 0.2, 0, 0, a, 0.08, 0.16, 0.34));
  }
  // 흰 하우징 (조금 굵게)
  b.add('shell', cyl, mat(0, 0, 0.4 + (L - 0.4) / 2, Math.PI / 2, 0, 0, 1.12, L - 0.4, 1.12));
  b.add('accent', torus, mat(0, 0, 0.75, 0, 0, 0, 1.13, 1.13, 1.2));
  b.add('shellShade', torus, mat(0, 0, L - 0.05, 0, 0, 0, 1.08));
  b.add('shellShade', torus, mat(0, 0, 0.42, 0, 0, 0, 1.1));
  // 측면 검은 패널
  b.add('metalDark', new THREE.CylinderGeometry(1.125, 1.125, 1, 8, 1, true, 1.2, 0.6), mat(0, 0, 1.1, Math.PI / 2, 0, 0, 1, 0.4, 1));
  addSuckerPair(b, L * 0.62, 1.05);
  // 끝의 관절 볼
  b.add('metalDark', new THREE.SphereGeometry(0.5, 16, 10), mat(0, 0, L + 0.02, 0, 0, 0, 1.0));
  return b.build();
}

export function createRootActuator({ radius }) {
  if (!merged) merged = buildRoot();
  const group = meshesFromMerged(merged, 'rootActuator');
  group.scale.setScalar(radius);
  return group;
}
