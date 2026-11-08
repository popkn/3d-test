import * as THREE from 'three';
import { mesh } from '../../../kit/materials.js';
import { makeRim, makeTire50 } from '../../../kit/wheelRim.js';

// 단면을 돌린 실리콘 고리: 바깥 Ø50, 옆 입구 Ø45, 안쪽 홈 Ø48 (휠 돌기), 폭 8.5. 바퀴 축 = Z
export function build() {
  const root = new THREE.Group();
  const spin = new THREE.Group();
  spin.position.y = 25;
  root.add(spin);
  const tire = makeTire50();
  spin.add(tire);
  // 흰 휠 Ø50[V2] 미리보기 (크기 측정에서 뺀다)
  const rim = makeRim({ seatR: 22.5, width: 14, ridgeR: 24, ridgeW: 4.8, hubR: 4.5, spokes: 8, color: 0xf2f1ec, ySpoke: true });
  rim.userData.noBounds = true;
  rim.visible = false;
  spin.add(rim);
  const mark = mesh(new THREE.BoxGeometry(2, 0.6, 8.6), new THREE.MeshStandardMaterial({ color: 0xe8432a }), { cast: false });
  mark.position.y = 25.1;
  spin.add(mark);
  return {
    object3d: root,
    labels: [{ name: 'SILICONE TIRE', sub: 'Ø50 × 8.5 · 5g', object: tire, anchor: [0, 25, 0], off: [60, -60] }],
    frameWith: [rim],
    handles: { spin, rim },
  };
}
