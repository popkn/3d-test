import * as THREE from 'three';
import { M, mesh } from './materials.js';

// 체결 부품 공통: 육각 너트, 볼트 (M3 기준, 단위 mm)
export function hexNutGeometry({ af = 5.5, thickness = 2.4, hole = 1.5 } = {}) {
  const r = af / Math.sqrt(3); // 맞변 거리 → 꼭짓점 반지름
  const s = new THREE.Shape();
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
    i ? s.lineTo(Math.cos(a) * r, Math.sin(a) * r) : s.moveTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  s.closePath();
  if (hole > 0) { const h = new THREE.Path(); h.absarc(0, 0, hole, 0, Math.PI * 2, true); s.holes.push(h); }
  const g = new THREE.ExtrudeGeometry(s, { depth: thickness - 0.4, bevelEnabled: true, bevelThickness: 0.2, bevelSize: 0.15, bevelSegments: 2 });
  g.rotateX(-Math.PI / 2);
  g.translate(0, 0.2, 0);
  return g;
}

// 볼트: 둥근 머리(+ 십자 홈) + 나사산. 머리 아래가 y = 0, 나사는 아래(-Y)로
export function makeBolt({ length = 10, dia = 3, headDia = 5.5, headH = 2, mat = M.metal } = {}) {
  const g = new THREE.Group();
  const head = mesh(new THREE.SphereGeometry(headDia / 2, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), mat);
  head.scale.y = headH / (headDia / 2);
  g.add(head);
  for (const r of [0, Math.PI / 2]) {
    const slot = mesh(new THREE.BoxGeometry(headDia * 0.6, 0.6, 0.6), M.metalDark, { cast: false });
    slot.position.y = headH - 0.1;
    slot.rotation.y = r;
    g.add(slot);
  }
  const shank = mesh(new THREE.CylinderGeometry(dia / 2 - 0.15, dia / 2 - 0.15, length, 20), mat);
  shank.position.y = -length / 2;
  g.add(shank);
  const pitch = 0.5;
  for (let y = -0.4; y > -length + 0.3; y -= pitch) {
    const t = mesh(new THREE.TorusGeometry(dia / 2 - 0.15, 0.13, 4, 20), mat, { cast: false });
    t.rotation.x = Math.PI / 2;
    t.position.y = y;
    g.add(t);
  }
  return g;
}
