import * as THREE from 'three';
import { makeBattleFrame, gridHoles, holesInside } from '../../../kit/battleFrame.js';

export function build() {
  const root = new THREE.Group();
  const frame = new THREE.Group();
  root.add(frame);
  // 사진 기준: 한쪽 끝 윗부분이 비스듬히 잘린 판, 구멍 3줄
  const outline = [[-40, 14], [-40, 2], [-24, -14], [38, -14], [40, -12], [40, 12], [38, 14]];
  const holes = holesInside(gridHoles(8, 3), outline);
  frame.add(makeBattleFrame({ outline, holes, pattern: 'flame', width: 80, depth: 28 }));
  return {
    object3d: root,
    labels: [{ name: 'BATTLE I', sub: 'FR-4 · 빨간 무늬', object: frame, anchor: [0, 1.6, 0], off: [60, -60] }],
    handles: { frame, info: { holes: `${holes.length}개 (3줄)` } },
  };
}
