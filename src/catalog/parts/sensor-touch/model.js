import * as THREE from 'three';
import { makeEcvBoard, ECV } from '../../../kit/ecvBoard.js';
import { axialResistor, ceramicCap, box } from '../../../kit/components.js';
import { M, mesh } from '../../../kit/materials.js';

// 택트 스위치 12 × 12mm, 검은 버튼 높이 7.5mm (상품 사양)
function tactSwitch12() {
  const g = new THREE.Group();
  g.add(box(12, 3.5, 12, M.metal));
  g.add(box(12.2, 0.6, 12.2, M.blackPlastic, 0, 3.5));
  for (const [x, z] of [[-4.5, -4.5], [4.5, -4.5], [-4.5, 4.5], [4.5, 4.5]]) {
    const dot = mesh(new THREE.CylinderGeometry(0.8, 0.8, 0.2, 12), M.matteBlack, { cast: false });
    dot.position.set(x, 4.15, z);
    g.add(dot);
  }
  const stem = mesh(new THREE.CylinderGeometry(3.4, 3.4, 3.4, 32), M.blackPlastic);
  stem.position.y = 4.1 + 1.7;
  g.add(stem);
  g.userData.press = (p) => { stem.position.y = 4.1 + 1.7 - (p ? 0.25 * 4 : 0); }; // 실제 0.25mm는 너무 작아 4배로 보여준다
  return g;
}

export function build() {
  const T = ECV.thickness;
  const root = new THREE.Group();
  const board = makeEcvBoard({ name: 'ECV-SW', holeEdge: 'back', header: { x: -9, z: 4 } });
  root.add(board);
  const sw = tactSwitch12();
  sw.position.set(2, T, 4);
  root.add(sw);
  const r = axialResistor({ length: 5, dia: 1.8 });
  r.rotation.y = Math.PI / 2;
  r.position.set(-15, T, 4);
  root.add(r);
  const c = ceramicCap();
  c.position.set(13, T, 4);
  root.add(c);
  return {
    object3d: root,
    labels: [
      { name: 'TACT SWITCH', sub: 'THH12715 · 160gf', object: sw, anchor: [0, 7.5, 0], off: [60, -80] },
      { name: 'PULL-UP R1', sub: '안 누르면 HIGH', object: r, anchor: [0, 2, 0], off: [-110, -60] },
      { name: '3P HEADER', sub: 'S · V · G', object: board.userData.header, anchor: [0, 7, 0], off: [-120, 40] },
    ],
    handles: { sw },
  };
}
