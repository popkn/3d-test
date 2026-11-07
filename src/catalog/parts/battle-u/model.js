import * as THREE from 'three';
import { makeBattleFrame } from '../../../kit/battleFrame.js';

// 반쪽 별: 아래는 평평하고 위로 뾰족한 톱날 7개, 빨간 삼각 무늬
export function build() {
  const root = new THREE.Group();
  const frame = new THREE.Group();
  root.add(frame);
  const outline = [[-42, 14], [42, 14]];
  for (let i = 6; i >= 0; i--) {
    const a = Math.PI * (i + 0.5) / 7;
    const tip = [Math.cos(a) * 42, 14 - Math.sin(a) * 36];
    const a2 = Math.PI * i / 7;
    outline.push(tip, [Math.cos(a2) * 22, 14 - Math.sin(a2) * 18]);
  }
  outline.splice(2, 1);
  const holes = [[-5, 8], [5, 8]];
  frame.add(makeBattleFrame({
    outline, holes, width: 84, depth: 40,
    paint: (g, X, Y) => {
      g.fillStyle = '#d4202a';
      for (let i = 0; i < 7; i++) {
        const a = Math.PI * (i + 0.5) / 7, a1 = Math.PI * i / 7, a2 = Math.PI * (i + 1) / 7;
        g.beginPath(); g.moveTo(X(Math.cos(a) * 38), Y(14 - Math.sin(a) * 32)); g.lineTo(X(Math.cos(a1) * 24), Y(14 - Math.sin(a1) * 19)); g.lineTo(X(Math.cos(a2) * 24), Y(14 - Math.sin(a2) * 19)); g.closePath(); g.fill();
      }
    },
  }));
  return { object3d: root, labels: [{ name: 'BATTLE U', sub: '반쪽 별 톱날', object: frame, anchor: [0, 1.6, -5], off: [60, -60] }], handles: { frame, info: { holes: '2개 (10mm 간격)' } } };
}
