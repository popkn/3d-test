import * as THREE from 'three';
import { mesh, placed } from '../../../kit/materials.js';

// 받침판 28 × 18 (구멍 4개) + 가운데 가로 원통(축 구멍). 축 방향 = X
export function build() {
  const root = new THREE.Group();
  const blue = new THREE.MeshStandardMaterial({ color: 0x2457d6, roughness: 0.45 });
  const s = new THREE.Shape();
  s.moveTo(-14, -9); s.lineTo(14, -9); s.lineTo(14, 9); s.lineTo(-14, 9); s.closePath();
  for (const [x, z] of [[-10, -5], [10, -5], [-10, 5], [10, 5]]) { const h = new THREE.Path(); h.absarc(x, z, 1.6, 0, Math.PI * 2, true); s.holes.push(h); }
  const g = new THREE.ExtrudeGeometry(s, { depth: 2.5, bevelEnabled: true, bevelThickness: 0.4, bevelSize: 0.4, bevelSegments: 2 });
  g.rotateX(-Math.PI / 2);
  root.add(mesh(g, blue));
  const boss = new THREE.Shape(); boss.absarc(0, 0, 4.5, 0, Math.PI * 2);
  const bh = new THREE.Path(); bh.absarc(0, 0, 1.6, 0, Math.PI * 2, true); boss.holes.push(bh);
  const bg = new THREE.ExtrudeGeometry(boss, { depth: 12, bevelEnabled: false, curveSegments: 32 });
  bg.translate(0, 0, -6);
  bg.rotateY(Math.PI / 2);
  const cyl = mesh(bg, blue);
  cyl.position.y = 5;
  root.add(cyl);
  root.add(placed(mesh(new THREE.BoxGeometry(12, 3, 9), blue), 0, 3, 0));
  // 시연용 축 (75mm Ø3)
  const shaft = mesh(new THREE.CylinderGeometry(1.5, 1.5, 75, 16), new THREE.MeshStandardMaterial({ color: 0x3a3c40, metalness: 0.9, roughness: 0.35 }));
  shaft.rotation.z = Math.PI / 2;
  shaft.position.y = 5;
  shaft.userData.noBounds = true;
  shaft.visible = false;
  root.add(shaft);
  const mark = mesh(new THREE.BoxGeometry(60, 0.3, 0.5), new THREE.MeshStandardMaterial({ color: 0xe8432a }), { cast: false });
  mark.position.y = 1.45;
  shaft.add(mark);
  mark.rotation.z = -Math.PI / 2;
  return {
    object3d: root,
    labels: [
      { name: 'AXLE BORE', sub: 'Ø3 축 받침', object: cyl, anchor: [6, 0, 0], off: [60, -60] },
      { name: 'MOUNT HOLES', sub: '구멍 4개', object: root, anchor: [-10, 2.5, 5], off: [-120, 40] },
    ],
    frameWith: [shaft],
    handles: { shaft },
  };
}
