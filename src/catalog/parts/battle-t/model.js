import * as THREE from 'three';
import { makeBattleFrame } from '../../../kit/battleFrame.js';

// 휘어진 칼날: 뿌리(오른쪽 위)에 구멍 2개, 끝(왼쪽 아래)이 뾰족하다
export function build() {
  const root = new THREE.Group();
  const frame = new THREE.Group();
  root.add(frame);
  // 뿌리(오른쪽 위, 넓음)에서 끝(왼쪽 아래, 뾰족)으로 휘어진 칼날
  const outline = [[28, -23], [36, -18], [36, 2], [24, 4], [6, 8], [-12, 14], [-36, 23], [-22, 8], [-6, -4], [12, -16]];
  const holes = [[28, -14], [28, -4]];
  frame.add(makeBattleFrame({
    outline, holes, width: 72, depth: 46,
    paint: (g, X, Y) => {
      g.fillStyle = '#d4202a';
      g.beginPath(); g.moveTo(X(18), Y(-18)); g.quadraticCurveTo(X(-6), Y(-14), X(-30), Y(14)); g.quadraticCurveTo(X(0), Y(-2), X(22), Y(4)); g.closePath(); g.fill();
    },
  }));
  return { object3d: root, labels: [{ name: 'BATTLE T', sub: '휘어진 칼날', object: frame, anchor: [0, 1.6, 0], off: [60, -60] }], handles: { frame, info: { holes: '2개 (10mm 간격)' } } };
}
