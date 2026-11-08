import { build as buildWheel } from '../wheel-buggy-80/model.js';
import { build as buildTire } from '../tire-80-buggy/model.js';

// 휠 Ø80 버기 + 타이어 Ø80 버기 (인너는 타이어 안에 숨어서 그리지 않음). 바퀴 축 = Z, 가운데 높이 40
export function build() {
  const w = buildWheel();
  const { spin } = w.handles;
  w.handles.tire.visible = false;
  const t = buildTire();
  const tire = t.handles.spin;              // 타이어 모델도 가운데 높이 40
  tire.position.set(0, 0, 0);
  spin.add(tire);
  return {
    object3d: w.object3d,
    labels: [
      { name: 'BUGGY WHEEL SET Ø80', sub: '휠 + 인너 + 타이어', object: tire, anchor: [0, 38, 0], off: [60, -60] },
      { name: 'D-CUT HUB', sub: '모터 축 Ø3', object: spin, anchor: [0, 0, 16], off: [-120, 40] },
    ],
    handles: { spin },
  };
}
