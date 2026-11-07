import * as THREE from 'three';
import { GeometryBuckets, mat } from './geometryBuckets.js';

// 마디 사이 연결부: 스프링 + 피스톤 막대 2개 + 가운데 고무관. 반지름 1 기준, z = 0 ~ 1.
// 분리 모드에서는 z 방향으로 늘어난다.
let merged = null;

class Helix extends THREE.Curve {
  getPoint(t, target = new THREE.Vector3()) {
    const a = t * Math.PI * 2 * 5;
    return target.set(Math.cos(a) * 0.42, Math.sin(a) * 0.42, t);
  }
}

function buildLink() {
  const b = new GeometryBuckets();
  b.add('metal', new THREE.TubeGeometry(new Helix(), 70, 0.05, 4, false));
  const cyl = new THREE.CylinderGeometry(1, 1, 1, 10);
  for (const x of [-0.68, 0.68]) {
    b.add('metal', cyl, mat(x, 0.2, 0.5, Math.PI / 2, 0, 0, 0.06, 1, 0.06));
    b.add('metalDark', cyl, mat(x, 0.2, 0.25, Math.PI / 2, 0, 0, 0.1, 0.5, 0.1));
  }
  b.add('rubber', cyl, mat(0, 0, 0.5, Math.PI / 2, 0, 0, 0.22, 1, 0.22));
  return b.build();
}

export function linkTemplate() {
  if (!merged) merged = buildLink();
  return merged;
}
