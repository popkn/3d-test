import * as THREE from 'three';
import { makeBattleFrame } from '../../../kit/battleFrame.js';

// 방패: 아래가 넓은 사다리꼴, 빨간 테두리 + 가운데 꽃 (꽃잎 6개 구멍)
export function build() {
  const root = new THREE.Group();
  const frame = new THREE.Group();
  root.add(frame);
  const outline = [[-12, -28], [12, -28], [25, 22], [20, 28], [-20, 28], [-25, 22]];
  const holes = [[0, 2], ...Array.from({ length: 6 }, (_, i) => [Math.cos((i / 6) * Math.PI * 2) * 9, 2 + Math.sin((i / 6) * Math.PI * 2) * 9]),
    [-7, -22], [7, -22], [-17, 22], [17, 22]];
  frame.add(makeBattleFrame({
    outline, holes, width: 50, depth: 56,
    paint: (g, X, Y) => {
      g.lineWidth = 2.4; g.strokeStyle = '#d4202a';
      g.beginPath(); [[-10, -25], [10, -25], [22, 21], [18, 25], [-18, 25], [-22, 21]].forEach(([x, z], i) => (i ? g.lineTo(X(x), Y(z)) : g.moveTo(X(x), Y(z)))); g.closePath(); g.stroke();
      for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; g.beginPath(); g.ellipse(X(Math.cos(a) * 9), Y(2 + Math.sin(a) * 9), 4.5, 3.2, a, 0, Math.PI * 2); g.fillStyle = '#d4202a'; g.fill(); }
      g.beginPath(); g.arc(X(0), Y(2), 5, 0, Math.PI * 2); g.fill();
    },
  }));
  return { object3d: root, labels: [{ name: 'BATTLE S', sub: '방패 · 꽃 무늬', object: frame, anchor: [0, 1.6, 2], off: [60, -60] }], handles: { frame, info: { holes: '11개 (꽃 7 + 모서리 4)' } } };
}
