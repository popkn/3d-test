import * as THREE from 'three';
import { M, mesh } from '../../../kit/materials.js';

// 바퀴 축 = X축. 바깥부터 타이어(검정, 돌기) → 인너(스펀지) → 휠(빨강) → 휠가이드(검정 원판)
export function build() {
  const R = 65, W = 50;
  const root = new THREE.Group();
  const wheel = new THREE.Group(); // 회전하는 부분
  wheel.position.y = R;
  root.add(wheel);
  const spin = new THREE.Group();
  wheel.add(spin);
  const parts = {};

  // 타이어: 단면을 돌려 만든 몸통 + 돌기
  const tire = new THREE.Group();
  const prof = [[44, -W / 2], [52, -W / 2], [59, -W / 2 + 4], [61, -W / 2 + 10], [61, W / 2 - 10], [59, W / 2 - 4], [52, W / 2], [44, W / 2]]
    .map(([r, y]) => new THREE.Vector2(r, y));
  const rubber = new THREE.MeshStandardMaterial({ color: 0x1c1c1e, roughness: 0.9 });
  const body = mesh(new THREE.LatheGeometry(prof, 72), rubber);
  body.rotation.z = Math.PI / 2;
  tire.add(body);
  const lugGeo = new THREE.BoxGeometry(14, 4, 9);
  const lugs = new THREE.InstancedMesh(lugGeo, rubber, 72);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
  for (let i = 0; i < 72; i++) {
    const a = (i / 36) * Math.PI;
    const side = i % 2 ? 1 : -1;
    e.set(a, 0, 0);
    q.setFromEuler(e);
    const p = new THREE.Vector3(side * 11, Math.cos(a) * 62, Math.sin(a) * 62);
    m.compose(p, q, new THREE.Vector3(1, 1, 1));
    lugs.setMatrixAt(i, m);
  }
  lugs.castShadow = true;
  tire.add(lugs);
  spin.add(tire);
  parts.tire = tire;

  // 인너 (스펀지 띠)
  const inner = mesh(new THREE.TorusGeometry(51, 6, 12, 60), new THREE.MeshStandardMaterial({ color: 0x24335a, roughness: 1 }));
  inner.rotation.y = Math.PI / 2;
  inner.scale.z = 3.4;
  spin.add(inner);
  parts.inner = inner;

  // 휠 (빨강): 테 + 살 5개 + 허브
  const rim = new THREE.Group();
  const red = new THREE.MeshStandardMaterial({ color: 0xd42a22, roughness: 0.45 });
  const ring = mesh(new THREE.CylinderGeometry(45, 45, W - 8, 48, 1, true), red);
  ring.rotation.z = Math.PI / 2;
  ring.material.side = THREE.DoubleSide;
  rim.add(ring);
  for (let i = 0; i < 5; i++) {
    const spoke = mesh(new THREE.BoxGeometry(6, 40, 12), red);
    spoke.rotation.x = (i / 5) * Math.PI * 2;
    spoke.translateY(24);
    rim.add(spoke);
  }
  const hub = mesh(new THREE.CylinderGeometry(9, 9, 22, 24), red);
  hub.rotation.z = Math.PI / 2;
  rim.add(hub);
  // 앞판: 살 5개 사이에 창을 뚫는다 (사진처럼 안쪽이 보임)
  const fs = new THREE.Shape(); fs.absarc(0, 0, 44, 0, Math.PI * 2, false);
  for (let i = 0; i < 5; i++) {
    const a0 = (i / 5) * Math.PI * 2 + Math.PI / 2 + 0.2, a1 = ((i + 1) / 5) * Math.PI * 2 + Math.PI / 2 - 0.2;
    const w = new THREE.Path(); w.absarc(0, 0, 39, a0 + 0.06, a1 - 0.06, false); w.absarc(0, 0, 13, a1 - 0.25, a0 + 0.25, true); w.closePath();
    fs.holes.push(w);
  }
  const fg = new THREE.ExtrudeGeometry(fs, { depth: 2.5, bevelEnabled: true, bevelThickness: 0.6, bevelSize: 0.6, bevelSegments: 2, curveSegments: 32 });
  fg.rotateY(-Math.PI / 2);
  const face = mesh(fg, red);
  face.position.x = -5;
  rim.add(face);
  spin.add(rim);
  parts.rim = rim;

  // 휠가이드 (검정 원판, 구멍 4개): 모터 축과 휠을 잇는다
  const guide = new THREE.Group();
  const disc = new THREE.Shape();
  disc.absarc(0, 0, 18, 0, Math.PI * 2);
  for (let i = 0; i < 4; i++) { const h = new THREE.Path(); const a = (i / 4) * Math.PI * 2; h.absarc(Math.cos(a) * 10, Math.sin(a) * 10, 2.4, 0, Math.PI * 2, true); disc.holes.push(h); }
  const c = new THREE.Path(); c.absarc(0, 0, 2, 0, Math.PI * 2, true); disc.holes.push(c);
  const gGeo = new THREE.ExtrudeGeometry(disc, { depth: 4, bevelEnabled: false });
  gGeo.rotateY(Math.PI / 2);
  const g = mesh(gGeo, M.blackPlastic);
  g.position.x = W / 2 - 6;
  guide.add(g);
  spin.add(guide);
  parts.guide = guide;

  return {
    object3d: root,
    labels: [
      { name: 'TIRE', sub: '고무 · Ø130', object: tire, anchor: [0, 62, 0], off: [60, -60] },
      { name: 'INNER', sub: '스펀지 (모양 유지)', object: inner, anchor: [0, 51, 0], off: [-140, -50] },
      { name: 'WHEEL', sub: 'ABS · 빨강', object: rim, anchor: [-6, 30, 0], off: [-140, 40] },
      { name: 'WHEEL GUIDE', sub: '모터 축 연결', object: guide, anchor: [W / 2, 18, 0], off: [70, 50] },
    ],
    handles: { spin, parts },
  };
}
