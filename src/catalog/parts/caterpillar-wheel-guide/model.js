import * as THREE from 'three';
import { mesh } from '../../../kit/materials.js';

// 단면을 돌려 만든 허브: 넓은 테두리(Ø30) + 가운데 몸통 + 위쪽 작은 돌기, 가운데 육각 구멍
export function build() {
  const root = new THREE.Group();
  const prof = [[2.6, 0], [15, 0], [15, 3], [11, 4.5], [10, 6], [10, 15], [12, 17], [12, 19], [6.5, 20], [6.5, 26], [2.6, 26]]
    .map(([r, y]) => new THREE.Vector2(r, y));
  const white = new THREE.MeshStandardMaterial({ color: 0xf2f1ec, roughness: 0.5 });
  const body = mesh(new THREE.LatheGeometry(prof, 48), white);
  root.add(body);
  const hex = mesh(new THREE.CylinderGeometry(2.6, 2.6, 26.2, 6), new THREE.MeshStandardMaterial({ color: 0x777777, roughness: 0.8, side: 1 }), { cast: false });
  hex.position.y = 13;
  root.add(hex);
  return {
    object3d: root,
    labels: [
      { name: 'FLANGE', sub: 'Ø30 · 궤도 이탈 방지', object: body, anchor: [15, 1.5, 0], off: [60, 30] },
      { name: 'HEX BORE', sub: '축과 함께 회전', object: body, anchor: [0, 26, 0], off: [-110, -50] },
    ],
    handles: { body },
  };
}
