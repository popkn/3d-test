import * as THREE from 'three';
import { makePcb } from './pcb.js';
import { pinHeader } from './components.js';
import { FONT } from './textures.js';

// 로보로보 S 모듈 기판 (부저 보드, LED 보드 공통): 검은 기판, 위쪽 3핀 헤더, 아래쪽 고정 구멍 3개(1·2·3).
// 크기는 사진 비율과 2.54mm 핀 간격으로 추정한 값.
export const S_BOARD = { width: 22, depth: 32, thickness: 1.6 };

export function makeSBoard({ labels = [] } = {}) {
  const { width: W, depth: D } = S_BOARD;
  const holes = [-6.6, 0, 6.6].map((x) => ({ x, z: D / 2 - 4.2, r: 2.1, ring: true }));
  // 양옆 가운데의 작은 홈
  const w = W / 2, d = D / 2, n = 1.6;
  const outline = [
    [-w + 1, -d], [w - 1, -d], [w, -d + 1], [w, -2 - n], [w - n, -2], [w - n, 2], [w, 2 + n], [w, d - 1], [w - 1, d],
    [-w + 1, d], [-w, d - 1], [-w, 2 + n], [-w + n, 2], [-w + n, -2], [-w, -2 - n], [-w, -d + 1],
  ];
  const group = new THREE.Group();
  const pcb = makePcb({
    width: W, depth: D, outline, holes, color: 'black',
    silk: (g, ww, dd, X, Y) => {
      g.font = `700 1.9px ${FONT}`;
      ['1', '2', '3'].forEach((t, i) => g.fillText(t, X(-6.6 + i * 6.6) - 0.6, Y(D / 2 - 0.6)));
      g.fillText('A', X(-W / 2 + 1.1), Y(D / 2 - 6.4));
      g.font = `600 1.1px ${FONT}`;
      g.save(); g.translate(X(-W / 2 + 2.4), Y(4)); g.rotate(-Math.PI / 2);
      g.fillText('HNS  9U ■■ MA▲ 2250', 0, 0); g.restore();
      g.save(); g.translate(X(W / 2 - 1.4), Y(-6)); g.rotate(Math.PI / 2);
      g.fillText('Made in Korea   PCID-N001', 0, 0); g.restore();
      g.strokeRect(X(W / 2 - 4.2), Y(-D / 2 + 1.6), 3, 1.8);
      g.font = `700 1.0px ${FONT}`;
      g.fillText('RoHS', X(W / 2 - 4.0), Y(-D / 2 + 3.0));
      for (const l of labels) { g.font = `600 ${l.size || 1.1}px ${FONT}`; g.fillText(l.text, X(l.x), Y(l.z)); }
    },
  });
  group.add(pcb);
  // 3핀 헤더 (위쪽 가장자리, 핀이 위로)
  const header = pinHeader({ cols: 3, above: 8, below: 3 });
  header.position.set(0, S_BOARD.thickness, -D / 2 + 3.2);
  group.add(header);
  group.userData = { header };
  return group;
}
