import * as THREE from 'three';
import { M, mesh } from '../../../kit/materials.js';
import { makeBolt } from '../../../kit/fasteners.js';

// 납작한 받침(20 × 11 × 3) 한쪽에 둥근 고리(높이 7.5), 다른 쪽에 M3 구멍
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
  const ringShape = new THREE.Shape(); ringShape.absarc(0, 0, 5.5, 0, Math.PI * 2);
  const rh = new THREE.Path(); rh.absarc(0, 0, 3.5, 0, Math.PI * 2, true); ringShape.holes.push(rh);
  const rg = new THREE.ExtrudeGeometry(ringShape, { depth: 7.5, bevelEnabled: false, curveSegments: 32 });
  rg.rotateX(-Math.PI / 2);
  const ring = mesh(rg, M.blackPlastic);
  ring.position.x = -4.5;
  root.add(ring);
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
