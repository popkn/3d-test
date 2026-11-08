import * as THREE from 'three';
import { mesh } from '../../../kit/materials.js';
import { makeRim } from '../../../kit/wheelRim.js';

export function build() {
  const root = new THREE.Group();
  const spin = new THREE.Group();
  spin.position.y = 40;
  root.add(spin);
  const rim = makeRim({ seatR: 28, flangeR: 30, width: 33, hubR: 5, hubLen: 20, spokes: 10, color: 0xf08a24, double: true });
  spin.add(rim);
  // 인너 스폰지 + 버기 타이어 미리보기 (치수에서 뺀다)
  const tire = new THREE.Group();
  const prof = [[27, -15], [33, -15], [37, -13], [38, -9], [38, 9], [37, 13], [33, 15], [27, 15], [28, 12], [28, -12]].map(([r, y]) => new THREE.Vector2(r, y));
  const tg = new THREE.LatheGeometry(prof, 64); tg.rotateX(Math.PI / 2);
  tire.add(mesh(tg, new THREE.MeshStandardMaterial({ color: 0x1c1c1e, roughness: 0.9 })));
  tire.userData.noBounds = true; tire.visible = false;
  spin.add(tire);
  return {
    object3d: root,
    labels: [
      { name: 'BUGGY WHEEL Ø80', sub: '주황 · 22 g · 폭 33', object: rim, anchor: [0, 30, 0], off: [60, -60] },
      { name: 'DOUBLE SPOKE', sub: '살 10개 × 2겹', object: rim, anchor: [0, -18, 15], off: [-120, 40] },
    ],
    frameWith: [tire],
    handles: { spin, tire, rimDia: 60 },
  };
}
