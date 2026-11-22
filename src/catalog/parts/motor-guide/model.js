import * as THREE from 'three';
import { M, mesh } from '../../../kit/materials.js';
import { makeBolt } from '../../../kit/fasteners.js';

// 실물 서보 가이드(motor-guide · 20 × 10.8 × 7.3 mm):
// - 직사각 평면 베이스(y = 0..2.8)에 10.0 mm 간격 M3 구멍 2개: Hole A(x=-5, 모터축) · Hole B(x=+5, 자유 구멍)
// - 아래면(y = -4.5..0): Hole A 동축 서보 육각 허브
// - 윗면(y = 2.8..4.6): Hole A 구간(x=-10..0) 양옆에 평행 가이드라인 벽(내폭 8.2 mm)
//   → Hole A에 1열 프레임(폭 8.0 mm)을 볼트 1개로 결합 시 가이드라인에 끼워져 회전 없이 고정
//   → Hole B에 S후크로 프레임 결합 시 가이드라인 단턱(x=0)에 걸려 양방향 ±90°(총 180°) 회전 가능
export function build() {
  const root = new THREE.Group();

  // 1. 직사각 평면 베이스 (20 × 10.8 × 2.8 mm, y = 0..2.8)
  const base = new THREE.Shape();
  base.moveTo(-10, -5.4);
  base.lineTo(10, -5.4);
  base.lineTo(10, 5.4);
  base.lineTo(-10, 5.4);
  base.closePath();
  for (const hx of [-5, 5]) {
    const hole = new THREE.Path();
    hole.absarc(hx, 0, 1.6, 0, Math.PI * 2, true);
    base.holes.push(hole);
  }
  const baseGeo = new THREE.ExtrudeGeometry(base, { depth: 2.8, bevelEnabled: false, curveSegments: 24 });
  baseGeo.rotateX(-Math.PI / 2);
  root.add(mesh(baseGeo, M.blackPlastic));

  // 2. Hole A 구간(x = -10..0) 양옆 가이드라인 벽 (내폭 8.2 mm, 높이 1.8 mm, y = 2.8..4.6)
  for (const sz of [-1, 1]) {
    const rail = mesh(new THREE.BoxGeometry(10.0, 1.8, 1.3), M.blackPlastic);
    rail.position.set(-5.0, 2.8 + 0.9, sz * (4.1 + 0.65));
    rail.name = sz < 0 ? 'guide-rail-neg' : 'guide-rail-pos';
    root.add(rail);
  }

  // 3. 아래면 서보 육각 허브 (Hole A 동축 x = -5.0, y = -4.5..0)
  const hub = new THREE.Group();
  const makeBoss = (y0, h, hexHole) => {
    const s = new THREE.Shape();
    s.absarc(0, 0, 5.2, 0, Math.PI * 2);
    const inn = new THREE.Path();
    if (hexHole) {
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        if (i) inn.lineTo(Math.cos(a) * 3.8, Math.sin(a) * 3.8);
        else inn.moveTo(3.8, 0);
      }
      inn.closePath();
    } else {
      inn.absarc(0, 0, 1.6, 0, Math.PI * 2, true);
    }
    s.holes.push(inn);
    const g = new THREE.ExtrudeGeometry(s, { depth: h, bevelEnabled: false, curveSegments: 32 });
    g.rotateX(-Math.PI / 2);
    g.translate(0, y0, 0);
    hub.add(mesh(g, M.blackPlastic));
  };
  makeBoss(-1.5, 1.5, false);
  makeBoss(-4.5, 3.0, true);
  hub.position.x = -5.0;
  root.add(hub);

  // 시연용 (noBounds)
  const axle = mesh(new THREE.CylinderGeometry(3.45, 3.45, 16, 24), M.whitePlastic);
  axle.position.set(-5, -12, 0);
  axle.userData.noBounds = true;
  axle.visible = false;
  root.add(axle);

  const bolt = makeBolt({ length: 6 });
  bolt.position.set(-5, 14, 0);
  bolt.userData.noBounds = true;
  bolt.visible = false;
  root.add(bolt);

  return {
    object3d: root,
    labels: [
      { name: 'GUIDE RAILS', sub: '1열 프레임 회전 방지 가이드라인 (내폭 8.2 mm)', object: root, anchor: [-5, 4.6, 4.75], off: [-120, -60] },
      { name: 'FREE HOLE (B)', sub: 'S후크 ±90° (총 180°) 회전 구멍', object: root, anchor: [5, 2.8, 0], off: [70, -50] },
    ],
    frameWith: [axle, bolt],
    handles: { axle, bolt, hub },
  };
}
