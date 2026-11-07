import * as THREE from 'three';
import { M, mesh } from './materials.js';

// 캐터필러 부품 공통 모양 (단위 mm)
export const LINK = { pitch: 10, width: 22, thick: 3 };

// 마디 하나: 판 + 양쪽 고리. 진행 방향 = X, 폭 = Z
export function makeLink(withRubber = false) {
  const g = new THREE.Group();
  const black = new THREE.MeshStandardMaterial({ color: 0x1a1a1c, roughness: 0.55 });
  g.add(Object.assign(mesh(new THREE.BoxGeometry(LINK.pitch * 0.8, LINK.thick, LINK.width), black), { position: new THREE.Vector3(0, LINK.thick / 2, 0) }));
  for (const z of [-LINK.width / 2 + 2.5, LINK.width / 2 - 2.5]) {
    const knuckle = mesh(new THREE.CylinderGeometry(1.8, 1.8, 4, 12), black);
    knuckle.rotation.x = Math.PI / 2;
    knuckle.position.set(LINK.pitch / 2 - 0.5, 1.5, z);
    g.add(knuckle);
  }
  // 안쪽 돌기 (톱니가 걸리는 자리)
  g.add(Object.assign(mesh(new THREE.BoxGeometry(3, 3, 6), black), { position: new THREE.Vector3(0, -1.5, 0) }));
  if (withRubber) g.add(makeRubber(LINK.thick));
  return g;
}

// 고무 패드 (파란 실리콘): 마디 바깥면에 끼운다
export function makeRubber(y = 0) {
  const pad = mesh(new THREE.BoxGeometry(LINK.pitch * 0.75, 2.5, LINK.width - 4), new THREE.MeshStandardMaterial({ color: 0x2f7fe8, roughness: 0.8 }));
  pad.position.y = y + 1.25;
  return pad;
}

// 톱니 휠 (흰색, Ø60 × 10)
export function makeSprocket({ teeth = 18, dia = 60, width = 10 } = {}) {
  const s = new THREE.Shape();
  const ro = dia / 2, ri = dia / 2 - 4;
  for (let i = 0; i <= teeth * 4; i++) {
    const a = (i / (teeth * 4)) * Math.PI * 2;
    const r = (i % 4 === 1 || i % 4 === 2) ? ro : ri;
    i ? s.lineTo(Math.cos(a) * r, Math.sin(a) * r) : s.moveTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  for (let k = 0; k < 6; k++) { const h = new THREE.Path(); const a = (k / 6) * Math.PI * 2; h.absarc(Math.cos(a) * 14, Math.sin(a) * 14, 3, 0, Math.PI * 2, true); s.holes.push(h); }
  const c = new THREE.Path(); c.absarc(0, 0, 3.2, 0, Math.PI * 2, true); s.holes.push(c);
  const g = new THREE.ExtrudeGeometry(s, { depth: width, bevelEnabled: false, curveSegments: 8 });
  g.translate(0, 0, -width / 2);
  return mesh(g, new THREE.MeshStandardMaterial({ color: 0xf2f1ec, roughness: 0.5 }));
}

// 캐터필러가 두 톱니 휠을 감는 경로 (축 간격 dist, 반지름 r). u: 0~1 → 위치와 진행 방향 각도
export function trackPath(u, dist, r) {
  const straight = dist, arc = Math.PI * r, total = 2 * straight + 2 * arc;
  let d = ((u % 1) + 1) % 1 * total;
  if (d < straight) return { x: -dist / 2 + d, y: r, a: 0 };
  d -= straight;
  if (d < arc) { const t = d / r; return { x: dist / 2 + Math.sin(t) * r, y: Math.cos(t) * r, a: -t }; }
  d -= arc;
  if (d < straight) return { x: dist / 2 - d, y: -r, a: -Math.PI };
  d -= straight;
  const t = d / r;
  return { x: -dist / 2 - Math.sin(t) * r, y: -Math.cos(t) * r, a: -Math.PI - t };
}
