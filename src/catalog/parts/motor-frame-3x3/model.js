import * as THREE from 'three';
import { makeLFrame } from '../../../kit/frame.js';
import { makeBolt } from '../../../kit/fasteners.js';

export function build() {
  const root = new THREE.Group();
  const l = makeLFrame({ a: 3, b: 3, w: 1 });
  root.add(l);
  const bolts = [-4, -14, -24].map((x) => { const b = makeBolt({ length: 6 }); b.position.set(x, 7, 0); b.userData.noBounds = true; b.visible = false; root.add(b); return b; });
  return {
    object3d: root,
    labels: [{ name: 'MOTOR FRAME', sub: 'SUS · 구멍 3 + 3', object: l, anchor: [0, 14, 0], off: [60, -60] }],
    frameWith: bolts,
    handles: { bolts, info: { holes: '다리마다 3개 = 6개', use: '모터 · 프레임을 직각으로 고정' } },
  };
}
