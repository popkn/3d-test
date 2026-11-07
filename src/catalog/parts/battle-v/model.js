import * as THREE from 'three';
import { makeBattleFrame } from '../../../kit/battleFrame.js';

// 날개: 위쪽이 둥글게 퍼지고 아래 가운데에 고정 탭 (구멍 2개), 빨간 날개 + 가운데 마름모
export function build() {
  const root = new THREE.Group();
  const frame = new THREE.Group();
  root.add(frame);
  const outline = [[-42, 0], [-30, -16], [-10, -23], [10, -23], [30, -16], [42, 0], [36, 6], [12, 8], [10, 23], [-10, 23], [-12, 8], [-36, 6]];
  const holes = [[-5, 17], [5, 17]];
  frame.add(makeBattleFrame({
    outline, holes, width: 84, depth: 46,
    paint: (g, X, Y) => {
      g.fillStyle = '#d4202a';
      for (const s of [-1, 1]) {
        g.beginPath(); g.moveTo(X(s * 6), Y(-2)); g.lineTo(X(s * 26), Y(-17)); g.lineTo(X(s * 39), Y(-1)); g.lineTo(X(s * 12), Y(5)); g.closePath(); g.fill();
      }
      g.beginPath(); g.moveTo(X(0), Y(-8)); g.lineTo(X(5), Y(-2)); g.lineTo(X(0), Y(4)); g.lineTo(X(-5), Y(-2)); g.closePath(); g.fill();
    },
  }));
  return { object3d: root, labels: [{ name: 'BATTLE V', sub: '날개 · 마름모 무늬', object: frame, anchor: [0, 1.6, -5], off: [60, -60] }], handles: { frame, info: { holes: '2개 (10mm 간격)' } } };
}
