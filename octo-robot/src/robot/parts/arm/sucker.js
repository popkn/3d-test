import * as THREE from 'three';
import { mat } from './geometryBuckets.js';

// 빨판 바퀴 한 쌍: 마디 아래(-Y)에 달린 받침 + 축 + 빨간 바퀴 2개.
// 반지름 1 마디 기준으로 만들고 buckets에 넣는다. z = 바퀴 위치.
const box = new THREE.BoxGeometry(1, 1, 1);
const cyl = new THREE.CylinderGeometry(1, 1, 1, 14);
const tire = new THREE.TorusGeometry(0.3, 0.12, 8, 18);

export function addSuckerPair(buckets, z, scale = 1) {
  const s = scale;
  buckets.add('metalDark', box, mat(0, -0.98 * s, z, 0, 0, 0, 0.7 * s, 0.22 * s, 0.42 * s));
  buckets.add('metal', cyl, mat(0, -1.22 * s, z, 0, 0, Math.PI / 2, 0.07 * s, 1.3 * s, 0.07 * s));
  for (const side of [-1, 1]) {
    const x = side * 0.52 * s;
    buckets.add('accent', tire, mat(x, -1.22 * s, z, 0, Math.PI / 2, 0, s));
    buckets.add('rubber', cyl, mat(x, -1.22 * s, z, 0, 0, Math.PI / 2, 0.24 * s, 0.16 * s, 0.24 * s));
    buckets.add('metal', cyl, mat(x + side * 0.06 * s, -1.22 * s, z, 0, 0, Math.PI / 2, 0.09 * s, 0.08 * s, 0.09 * s));
  }
}
