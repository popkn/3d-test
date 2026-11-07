import * as THREE from 'three';
import { mesh } from '../../../kit/materials.js';

// 단면을 돌린 실리콘 고리: 바깥 Ø50, 안쪽 Ø41, 폭 8.5. 바퀴 축 = Z
export function build() {
  const root = new THREE.Group();
  const prof = [[20.5, -4.25], [23, -4.25], [24.6, -3.4], [25, -2], [25, 2], [24.6, 3.4], [23, 4.25], [20.5, 4.25], [21.3, 2.5], [21.3, -2.5]]
    .map(([r, y]) => new THREE.Vector2(r, y));
  const g = new THREE.LatheGeometry(prof, 64);
  g.rotateX(Math.PI / 2);
  const spin = new THREE.Group();
  spin.position.y = 25;
  root.add(spin);
  const tire = mesh(g, new THREE.MeshStandardMaterial({ color: 0x1c1c1e, roughness: 0.85 }));
  spin.add(tire);
  // 흰 휠 미리보기 (페이지 16에서 별도 부품으로 구현 예정, 크기 측정에서 뺀다)
  const rim = mesh(new THREE.CylinderGeometry(20.6, 20.6, 14, 40), new THREE.MeshStandardMaterial({ color: 0xf2f1ec, roughness: 0.5, transparent: true, opacity: 0.85 }));
  rim.rotation.x = Math.PI / 2;
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
