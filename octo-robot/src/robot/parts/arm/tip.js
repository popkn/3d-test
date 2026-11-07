import * as THREE from 'three';
import { GeometryBuckets, mat } from './geometryBuckets.js';
import { addSuckerPair } from './sucker.js';

// 팔 끝 마디: 점점 가늘어지다 둥글게 끝난다. 반지름 1 기준, z = 0 ~ LENGTH.
export const TIP_LENGTH = 2.2;
let merged = null;

function buildTip() {
  const b = new GeometryBuckets();
  const L = TIP_LENGTH;
  const cone = new THREE.CylinderGeometry(0.4, 1, L - 0.4, 28);
  b.add('shell', cone, mat(0, 0, (L - 0.4) / 2, Math.PI / 2, 0, 0));
  b.add('shell', new THREE.SphereGeometry(0.4, 20, 12), mat(0, 0, L - 0.4));
  b.add('accent', new THREE.TorusGeometry(0.75, 0.07, 8, 28), mat(0, 0, (L - 0.4) * 0.4));
  b.add('shellShade', new THREE.TorusGeometry(0.97, 0.07, 8, 28), mat(0, 0, 0.04));
  addSuckerPair(b, 0.6, 0.85);
  return b.build();
}

export function tipTemplate() {
  if (!merged) merged = buildTip();
  return merged;
}
