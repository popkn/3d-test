import * as THREE from 'three';
import { M, mesh, placed } from './materials.js';

// 캐터필러 부품 공통 모양 (단위 mm)
export const LINK = { pitch: 10, width: 22, thick: 3 };

// 마디 하나: 판 + 양쪽 고리. 진행 방향 = X, 폭 = Z
export function makeLink(withRubber = false) {
  const g = new THREE.Group();
  const black = new THREE.MeshStandardMaterial({ color: 0x1a1a1c, roughness: 0.55 });
  g.add(placed(mesh(new THREE.BoxGeometry(LINK.pitch * 0.8, LINK.thick, LINK.width), black), 0, LINK.thick / 2, 0));
  for (const z of [-LINK.width / 2 + 2.5, LINK.width / 2 - 2.5]) {
    const knuckle = mesh(new THREE.CylinderGeometry(1.8, 1.8, 4, 12), black);
    knuckle.rotation.x = Math.PI / 2;
    knuckle.position.set(LINK.pitch / 2 - 0.5, 1.5, z);
    g.add(knuckle);
  }
  // 안쪽 돌기 (톱니가 걸리는 자리)
  g.add(placed(mesh(new THREE.BoxGeometry(3, 3, 6), black), 0, -1.5, 0));
  if (withRubber) g.add(makeRubber(LINK.thick));
  return g;
}

// 고무 패드 (파란 실리콘): 마디 바깥면에 끼운다
// 러버 패드: 모서리가 둥근 파란 실리콘 + 윗면 ROBOROBO 돋을새김 (사진 기준)
let rubberTex = null;
export function makeRubber(y = 0) {
  const w = LINK.pitch * 0.75, d = LINK.width - 4, h = 2.5, r = 1.6, bev = 0.5;
  const s = new THREE.Shape();
  const x0 = -w / 2 + bev, x1 = w / 2 - bev, z0 = -d / 2 + bev, z1 = d / 2 - bev;
  s.moveTo(x0 + r, z0); s.lineTo(x1 - r, z0); s.quadraticCurveTo(x1, z0, x1, z0 + r); s.lineTo(x1, z1 - r);
  s.quadraticCurveTo(x1, z1, x1 - r, z1); s.lineTo(x0 + r, z1); s.quadraticCurveTo(x0, z1, x0, z1 - r); s.lineTo(x0, z0 + r); s.quadraticCurveTo(x0, z0, x0 + r, z0);
  const geo = new THREE.ExtrudeGeometry(s, { depth: h - bev * 2, bevelEnabled: true, bevelThickness: bev, bevelSize: bev, bevelSegments: 3, curveSegments: 8 });
  geo.rotateX(Math.PI / 2); geo.translate(0, h - bev, 0);
  const mat = new THREE.MeshStandardMaterial({ color: 0x2f7fe8, roughness: 0.8 });
  const g = new THREE.Group();
  g.add(mesh(geo, mat));
  if (!rubberTex) {
    const c = document.createElement('canvas'); c.width = 512; c.height = 128;
    const x = c.getContext('2d'); x.font = 'italic 900 78px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillStyle = 'rgba(16,70,160,0.55)'; x.fillText('ROBOROBO', 258, 68);
    x.fillStyle = 'rgba(150,200,255,0.45)'; x.fillText('ROBOROBO', 254, 62);
    rubberTex = new THREE.CanvasTexture(c); rubberTex.colorSpace = THREE.SRGBColorSpace;
  }
  const logo = mesh(new THREE.PlaneGeometry(Math.max(w, d) * 0.82, Math.max(w, d) * 0.82 / 4), new THREE.MeshStandardMaterial({ map: rubberTex, transparent: true, roughness: 0.8 }), { cast: false });
  logo.rotation.set(-Math.PI / 2, 0, d > w ? -Math.PI / 2 : 0);
  logo.position.y = h + 0.01;
  g.add(logo);
  g.position.y = y;
  return g;
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
