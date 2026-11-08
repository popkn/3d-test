import * as THREE from 'three';
import { mesh } from '../../../kit/materials.js';
import { makeRim } from '../../../kit/wheelRim.js';

export function build() {
  const root = new THREE.Group();
  const spin = new THREE.Group();
  spin.position.y = 25;
  root.add(spin);
  const rim = makeRim({ seatR: 21, flangeR: 22.5, width: 14, hubR: 4.5, spokes: 6, color: 0xf2f1ec });
  spin.add(rim);
  // 타이어 Ø50[V2] 미리보기 (치수에서 뺀다)
  const prof = [[20.5, -4.25], [23, -4.25], [24.6, -3.4], [25, -2], [25, 2], [24.6, 3.4], [23, 4.25], [20.5, 4.25], [21.3, 2.5], [21.3, -2.5]].map(([r, y]) => new THREE.Vector2(r, y));
  const tg = new THREE.LatheGeometry(prof, 64); tg.rotateX(Math.PI / 2);
  const tire = mesh(tg, new THREE.MeshStandardMaterial({ color: 0x1c1c1e, roughness: 0.85 }));
  tire.userData.noBounds = true; tire.visible = false;
  spin.add(tire);
  return {
    object3d: root,
    labels: [
      { name: 'WHEEL Ø50 V2', sub: 'ABS 흰색 · 7 g', object: rim, anchor: [0, 22.5, 0], off: [60, -60] },
      { name: 'D-CUT HUB', sub: '모터 축 Ø3', object: rim, anchor: [0, 0, 7], off: [-120, 40] },
    ],
    frameWith: [tire],
    handles: { spin, tire, rimDia: 45 },
  };
}
