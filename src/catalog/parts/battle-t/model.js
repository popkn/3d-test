import * as THREE from 'three';
import { makeBattleFrame } from '../../../kit/battleFrame.js';

// 휘어진 칼날: 뿌리(오른쪽 위)에 구멍 2개, 끝(왼쪽 아래)이 뾰족하다
export function build() {
  const root = new THREE.Group();
  const frame = new THREE.Group();
  root.add(frame);
  const outline = [];
  for (let i = 0; i <= 12; i++) { const t = i / 12; outline.push([36 - t * 72, -23 + t * t * 46 * 0.15 + Math.sin(t * Math.PI) * -2]); }
  for (let i = 12; i >= 0; i--) { const t = i / 12; outline.push([36 - t * 72 + (1 - t) * 4, 23 - (1 - t) * 0 - t * 40 - Math.sin(t * Math.PI) * 8]); }
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
