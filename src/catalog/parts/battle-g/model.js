import * as THREE from 'three';
import { makeBattleFrame, gridHoles } from '../../../kit/battleFrame.js';

export function build() {
  const root = new THREE.Group();
  const frame = new THREE.Group();
  root.add(frame);
  const outline = [[-45, -9], [45, -9], [45, 9], [-45, 9]];
  const holes = gridHoles(9, 2);
  frame.add(makeBattleFrame({ outline, holes, pattern: 'stars', width: 90, depth: 18 }));
  return {
    object3d: root,
    labels: [{ name: 'BATTLE G', sub: 'FR-4 · 빨간 무늬', object: frame, anchor: [0, 1.6, 0], off: [60, -60] }],
    handles: { frame, info: { holes: '9 × 2' } },
  };
}
