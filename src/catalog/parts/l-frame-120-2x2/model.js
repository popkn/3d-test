import * as THREE from 'three';
import { makeLFrame } from '../../../kit/frame.js';
import { makeBolt } from '../../../kit/fasteners.js';

export function build() {
  const root = new THREE.Group();
  const l = makeLFrame({ a: 2, b: 2, w: 1, angle: 120 });
  root.add(l);
  const bolts = [-4, -14].map((x) => { const b = makeBolt({ length: 6 }); b.position.set(x, 7, 0); b.userData.noBounds = true; b.visible = false; root.add(b); return b; });
  const up = (180 - 120) * Math.PI / 180;
  return {
    object3d: root,
    labels: [
      { name: 'BASE LEG', sub: '구멍 2개', object: l, anchor: [-18 / 2, 1, 0], off: [-120, 30] },
      { name: 'UPRIGHT LEG', sub: '120° · 구멍 2개', object: l, anchor: [Math.cos(up) * 18 * 0.7, Math.sin(up) * 18 * 0.7, 0], off: [60, -60] },
    ],
    frameWith: bolts,
    handles: { bolts, info: { holes: '2 + 2개 · M3 탭', use: '두 판을 120°로 연결' } },
  };
}
