import * as THREE from 'three';
import { mesh } from '../../../kit/materials.js';
import { makeRim, makeTire50 } from '../../../kit/wheelRim.js';

export function build() {
  const root = new THREE.Group();
  const spin = new THREE.Group();
  spin.position.y = 25;
  root.add(spin);
  // 옆면 Ø45 + 가운데 돌기 Ø48 (타이어 안쪽 홈에 들어가 숨는다)
  const rim = makeRim({ seatR: 22.5, width: 14, ridgeR: 24, ridgeW: 4.8, hubR: 4.5, spokes: 6, color: 0xf2f1ec });
  spin.add(rim);
  // 타이어 Ø50[V2] 미리보기 (치수에서 뺀다)
  const tire = makeTire50();
  tire.userData.noBounds = true; tire.visible = false;
  spin.add(tire);
  return {
    object3d: root,
    labels: [
      { name: 'WHEEL Ø50 V2', sub: '실제 Ø48 · 끼우면 Ø45만 보임', object: rim, anchor: [0, 24, 0], off: [60, -60] },
      { name: 'D-CUT HUB', sub: '모터 축 Ø3', object: rim, anchor: [0, 0, 7], off: [-120, 40] },
    ],
    frameWith: [tire],
    handles: { spin, tire, rimDia: 48, visibleDia: 45 },
  };
}
