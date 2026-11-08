import { build as buildWheel } from '../wheel-50-v2/model.js';

// 휠 Ø50[V2] 모델에 타이어를 끼운 상태로 보여 준다 (바퀴 축 = Z, 가운데 높이 25)
export function build() {
  const w = buildWheel();
  const { tire, spin } = w.handles;
  tire.visible = true; tire.userData.noBounds = false;
  return {
    object3d: w.object3d,
    labels: [
      { name: 'WHEEL SET Ø50', sub: '휠 + 타이어 (한 부품)', object: tire, anchor: [0, 25, 0], off: [60, -60] },
      { name: 'D-CUT HUB', sub: '모터 축 Ø3', object: spin, anchor: [0, 0, 7], off: [-120, 40] },
    ],
    handles: { spin },
  };
}
