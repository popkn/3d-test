import * as THREE from 'three';
import { makeBattleFrame, gridHoles } from '../../../kit/battleFrame.js';

export function build() {
  const root = new THREE.Group();
  const frame = new THREE.Group();
  root.add(frame);
  const outline = [[-40, 14], [-30, -14], [40, -14], [30, 14]];
  const holes = gridHoles(7, 2);
  frame.add(makeBattleFrame({ outline, holes, pattern: 'flame', width: 80, depth: 28 }));
  return {
    object3d: root,
    labels: [{ name: 'BATTLE I', sub: 'FR-4 · 빨간 무늬', object: frame, anchor: [0, 1.6, 0], off: [60, -60] }],
    handles: { frame, info: { holes: '7 × 2' } },
  };
}
