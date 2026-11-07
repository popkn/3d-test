import * as THREE from 'three';
import { GeometryBuckets, mat } from './geometryBuckets.js';
import { addSuckerPair } from './sucker.js';
import { cachedGeometry } from '../common/geometryCache.js';

// 팔 마디 몸통. 반지름 1 기준, z = 0 ~ length 로 만들고 크기는 메시 배율로 맞춘다.
// variant: 'shell'(흰 껍데기) 또는 'glass'(유리 마디, 안쪽 프레임이 보인다)
const cyl = new THREE.CylinderGeometry(1, 1, 1, 24);
const cylOpen = new THREE.CylinderGeometry(1, 1, 1, 24, 1, true);
const lip = new THREE.TorusGeometry(0.97, 0.07, 6, 24);
const rivet = (() => {
  const g = new THREE.SphereGeometry(0.06, 6, 3, 0, Math.PI * 2, 0, Math.PI / 2);
  g.scale(1, 0.55, 1);
  return g;
})();

// 원통 옆면에 리벳 고리 (z 위치)
function addRivetRing(b, z, count, radius = 1.0, skipBottom = true) {
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2;
    if (skipBottom && Math.abs(a - Math.PI * 1.5) < 0.6) continue; // 바퀴 받침 자리는 비운다
    const x = Math.cos(a) * radius;
    const y = Math.sin(a) * radius;
    // 리벳의 +Y가 바깥(x, y)을 향하도록
    b.add('metalDark', rivet, mat(x, y, z, 0, 0, a - Math.PI / 2));
  }
}

function buildSegment(variant, length) {
  const b = new GeometryBuckets();
  const L = length;
  const along = (z0, z1) => [Math.PI / 2, (z0 + z1) / 2, z1 - z0]; // 원통을 Z축으로 눕히기 위한 값

  if (variant === 'glass') {
    const [rx, zc, h] = along(0.12, L - 0.12);
    b.add('glass', cylOpen, mat(0, 0, zc, rx, 0, 0, 0.95, h, 0.95));
    // 안쪽 프레임: 가로대 4개 + 가운데 관 + 고리
    for (let k = 0; k < 4; k++) {
      const a = (k / 4) * Math.PI * 2 + Math.PI / 4;
      b.add('metal', cyl, mat(Math.cos(a) * 0.62, Math.sin(a) * 0.62, zc, rx, 0, 0, 0.05, h, 0.05));
    }
    b.add('rubber', cyl, mat(0, 0, zc, rx, 0, 0, 0.26, h, 0.26));
    for (const z of [L * 0.35, L * 0.65]) {
      b.add('metalDark', lip, mat(0, 0, z, 0, 0, 0, 0.66, 0.66, 0.5));
    }
    // 양 끝 흰 테 (두껍게)
    for (const [z0, z1] of [[0, 0.16], [L - 0.16, L]]) {
      const [r, c, hh] = along(z0, z1);
      b.add('shell', cyl, mat(0, 0, c, r, 0, 0, 1.0, hh, 1.0));
    }
  } else {
    // 흰 껍데기 몸통
    const [rx, zc, h] = along(0, L);
    b.add('shell', cyl, mat(0, 0, zc, rx, 0, 0, 1.0, h, 1.0));
    // 등쪽 빨간 표시판과 검은 홈
    const decal = cachedGeometry('arm.decal', () => new THREE.CylinderGeometry(1.012, 1.012, 1, 10, 1, true, -0.35, 0.7));
    b.add('accent', decal, mat(0, 0, L * 0.42, Math.PI / 2, 0, 0, 1, L * 0.28, 1));
    const slot = cachedGeometry('arm.slot', () => new THREE.CylinderGeometry(1.01, 1.01, 1, 6, 1, true, 0.9, 0.5));
    b.add('metalDark', slot, mat(0, 0, L * 0.6, Math.PI / 2, 0, 0, 1, L * 0.16, 1));
    // 검은 가는 띠
    b.add('metalDark', lip, mat(0, 0, L * 0.82, 0, 0, 0, 1.02, 1.02, 0.18));
    addRivetRing(b, 0.16, 10);
    addRivetRing(b, L - 0.16, 10);
  }
  // 양 끝 테두리
  b.add('shellShade', lip, mat(0, 0, 0.04));
  b.add('shellShade', lip, mat(0, 0, L - 0.04));
  // 아래쪽 빨판 바퀴
  addSuckerPair(b, L * 0.5);
  // 끝의 관절 볼 (다음 마디와 이어지는 자리)
  b.add('metalDark', new THREE.SphereGeometry(0.5, 12, 8), mat(0, 0, L + 0.02));
  return b.build();
}

// 마디 원본 도형 { 재질 이름: 합친 도형 }. 모든 팔의 같은 종류 마디가 이 하나를 공유한다.
const templates = new Map();
export function segmentTemplate(variant, length) {
  const key = `${variant}.${length}`;
  if (!templates.has(key)) templates.set(key, buildSegment(variant, length));
  return templates.get(key);
}
