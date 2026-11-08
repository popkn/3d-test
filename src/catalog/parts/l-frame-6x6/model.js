import * as THREE from 'three';
import { makeLFrame } from '../../../kit/frame.js';
import { makeBolt } from '../../../kit/fasteners.js';

export function build() {
  const root = new THREE.Group();
  const l = makeLFrame({ a: 2, b: 2, w: 3, wPitch: 5 });
  root.add(l);
  const bolts = [[-4, 5], [-14, 5], [-4, -5], [-14, -5]].map(([x, z]) => { const b = makeBolt({ length: 6 }); b.position.set(x, 7, z); b.userData.noBounds = true; b.visible = false; root.add(b); return b; });
  return {
    object3d: root,
    labels: [
      { name: 'BASE LEG', sub: '구멍 2 × 3 = 6개', object: l, anchor: [-9, 1, 0], off: [-120, 30] },
      { name: 'UPRIGHT LEG', sub: '90° 세움', object: l, anchor: [0, 12, 0], off: [60, -60] },
    ],
    frameWith: bolts,
    handles: { bolts, info: { holes: '다리마다 2 × 3 = 6개 (총 12개)', use: '두 판을 직각으로 연결' } },
  };
}
