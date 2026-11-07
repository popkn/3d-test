import * as THREE from 'three';
import { makeBattleFrame, gridHoles } from '../../../kit/battleFrame.js';

export function build() {
  const root = new THREE.Group();
  const frame = new THREE.Group();
  root.add(frame);
  const outline = [[-44, 14], [-34, -14], [32, -14], [44, 14]];
  const holes = gridHoles(8, 2);
  frame.add(makeBattleFrame({ outline, holes, pattern: 'flame', width: 88, depth: 28 }));
  return {
    object3d: root,
    labels: [{ name: 'BATTLE J', sub: 'FR-4 · 빨간 무늬', object: frame, anchor: [0, 1.6, 0], off: [60, -60] }],
    handles: { frame, info: { holes: '8 × 2' } },
  };
}
