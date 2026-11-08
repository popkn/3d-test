import * as THREE from 'three';
import { M, mesh } from '../../../kit/materials.js';
import { makeBolt } from '../../../kit/fasteners.js';

// 납작한 받침(20 × 11 × 3) 한쪽에 고리(높이 7.5, 위는 육각 홈), 다른 쪽에 M3 구멍 · 가장자리 턱
export function build() {
  const root = new THREE.Group();
  const base = new THREE.Shape();
  base.moveTo(-10, -5.5); base.lineTo(8, -5.5); base.quadraticCurveTo(10, -5.5, 10, -3.5); base.lineTo(10, 3.5);
  base.quadraticCurveTo(10, 5.5, 8, 5.5); base.lineTo(-10, 5.5); base.closePath();
  const hole = new THREE.Path(); hole.absarc(5, 0, 1.6, 0, Math.PI * 2, true); base.holes.push(hole);
  const ringHole = new THREE.Path(); ringHole.absarc(-4.5, 0, 3.5, 0, Math.PI * 2, true); base.holes.push(ringHole);
  const g = new THREE.ExtrudeGeometry(base, { depth: 3, bevelEnabled: false });
  g.rotateX(-Math.PI / 2);
  root.add(mesh(g, M.blackPlastic));
  // 고리: 아래는 둥근 구멍(Ø7), 위 3mm는 사진처럼 육각 홈
  const ring = new THREE.Group();
  const ringPart = (y0, h, hexHole) => {
    const rs = new THREE.Shape(); rs.absarc(0, 0, 5.6, 0, Math.PI * 2);
    const rh = new THREE.Path();
    if (hexHole) { for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; i ? rh.lineTo(Math.cos(a) * 4.5, Math.sin(a) * 4.5) : rh.moveTo(4.5, 0); } rh.closePath(); }
    else rh.absarc(0, 0, 3.5, 0, Math.PI * 2, true);
    rs.holes.push(rh);
    const rg = new THREE.ExtrudeGeometry(rs, { depth: h, bevelEnabled: false, curveSegments: 32 });
    rg.rotateX(-Math.PI / 2); rg.translate(0, y0, 0);
    ring.add(mesh(rg, M.blackPlastic));
  };
  ringPart(0, 4.5, false);
  ringPart(4.5, 3, true);
  ring.position.x = -4.5;
  root.add(ring);
  // 받침 가장자리 턱 + 끝 모서리 돌기 (사진의 테두리 모양)
  for (const [w, d, x, z] of [[14, 0.8, 3, -5.1], [14, 0.8, 3, 5.1], [0.8, 11, 9.6, 0]]) {
    const lip = mesh(new THREE.BoxGeometry(w, 1, d), M.blackPlastic); lip.position.set(x, 3.5, z); root.add(lip);
  }
  for (const z of [-3.8, 3.8]) { const k = mesh(new THREE.CylinderGeometry(0.8, 0.8, 1.2, 12), M.blackPlastic); k.position.set(8.4, 3.6, z); root.add(k); }
  // 시연용: 바퀴축(Ø7, 흰색), M3 볼트
  const axle = mesh(new THREE.CylinderGeometry(3.45, 3.45, 20, 24), M.whitePlastic);
  axle.position.set(-4.5, 18, 0);
  axle.userData.noBounds = true;
  axle.visible = false;
  root.add(axle);
  const bolt = makeBolt({ length: 6 });
  bolt.position.set(5, 14, 0);
  bolt.userData.noBounds = true;
  bolt.visible = false;
  root.add(bolt);
  return {
    object3d: root,
    labels: [
      { name: 'RING', sub: '축 받침 (Ø7)', object: ring, anchor: [0, 7.5, 0], off: [-120, -60] },
      { name: 'M3 HOLE', sub: '프레임 고정', object: root, anchor: [5, 3, 0], off: [60, -50] },
    ],
    frameWith: [axle, bolt],
    handles: { axle, bolt },
  };
}
