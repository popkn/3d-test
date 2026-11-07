import * as THREE from 'three';
import { M, mesh } from '../../../kit/materials.js';
import { box, jst } from '../../../kit/components.js';

// 검은 상자 + 양옆 고정 귀 + 뚜껑(열 수 있음). 안에 AA 건전지 4개가 번갈아 놓인다.
export function build() {
  const W = 62, D = 58, H = 16;
  const root = new THREE.Group();
  // 바닥 상자 (위가 열린 통)
  for (const [w, h, d, x, y, z] of [[W, 2, D, 0, 0, 0], [W, H, 2, 0, 0, -D / 2 + 1], [W, H, 2, 0, 0, D / 2 - 1], [2, H, D, -W / 2 + 1, 0, 0], [2, H, D, W / 2 - 1, 0, 0]]) {
    root.add(box(w, h, d, M.matteBlack, x, y, z));
  }
  // 고정 귀
  for (const x of [-W / 2 - 5, W / 2 + 5]) for (const z of [-16, 16]) {
    const ear = mesh(new THREE.CylinderGeometry(4.5, 4.5, 2.5, 20), M.matteBlack);
    ear.position.set(x * 0.98, 1.25, z);
    root.add(ear);
    root.add(box(6, 2.5, 9, M.matteBlack, Math.sign(x) * (W / 2 + 2), 0, z));
    const hole = mesh(new THREE.CylinderGeometry(1.6, 1.6, 2.6, 12), M.hole, { cast: false });
    hole.position.set(x * 0.98, 1.3, z);
    root.add(hole);
  }
  // AA 건전지 4개 (방향을 번갈아)
  const cells = [];
  for (let i = 0; i < 4; i++) {
    const cell = new THREE.Group();
    const body = mesh(new THREE.CylinderGeometry(7.2, 7.2, 50, 24), new THREE.MeshStandardMaterial({ color: i % 2 ? 0x2a2b30 : 0xd9a520, roughness: 0.4, metalness: 0.3 }));
    body.rotation.z = Math.PI / 2;
    const tip = mesh(new THREE.CylinderGeometry(2.6, 2.6, 1.2, 16), M.metal);
    tip.rotation.z = Math.PI / 2;
    tip.position.x = 25.6;
    cell.add(body, tip);
    cell.rotation.y = i % 2 ? Math.PI : 0;
    cell.position.set(0, 9.2, -21.75 + i * 14.5);
    root.add(cell);
    cells.push(cell);
  }
  // 뚜껑 (뒤쪽 경첩으로 열린다)
  const lidPivot = new THREE.Group();
  lidPivot.position.set(0, H, -D / 2);
  const lid = box(W, 2, D, M.blackPlastic, 0, 0, D / 2);
  lidPivot.add(lid);
  const label = box(30, 0.1, 18, M.matteBlack, 0, 2, D / 2);
  lidPivot.add(label);
  root.add(lidPivot);
  // 전선 + 커넥터
  const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(W / 2 - 4, 8, D / 2), new THREE.Vector3(W / 2 + 6, 6, D / 2 + 14), new THREE.Vector3(W / 2 - 6, 3, D / 2 + 34), new THREE.Vector3(W / 2 - 22, 3, D / 2 + 40)]);
  for (const [off, mat] of [[-0.7, M.wireRed], [0.7, M.wireBlack]]) {
    const c = new THREE.CatmullRomCurve3(curve.points.map((p) => p.clone().add(new THREE.Vector3(0, off, 0))));
    root.add(mesh(new THREE.TubeGeometry(c, 40, 0.6, 8, false), mat));
  }
  const plug = jst({ pins: 2, height: 5 });
  plug.rotation.z = Math.PI / 2;
  plug.position.set(W / 2 - 24, 3, D / 2 + 40);
  root.add(plug);
  return {
    object3d: root,
    labels: [
      { name: 'LID', sub: '열어서 건전지 교체', object: lid, anchor: [0, 1, 0], off: [60, -80] },
      { name: 'AA ×4', sub: '직렬 = 6V', object: cells[1], anchor: [0, 7, 0], off: [-150, -60] },
      { name: 'POWER LEAD', sub: '24AWG · 빨강(+) 검정(-)', object: plug, anchor: [0, 0, 0], off: [60, 30] },
      { name: 'MOUNT EAR', sub: '프레임 고정', object: root, anchor: [-W / 2 - 5, 2.5, 16], off: [-120, 30] },
    ],
    handles: { cells, lidPivot },
  };
}
