import * as THREE from 'three';
import { makePcb } from './pcb.js';
import { pinHeader } from './components.js';
import { FONT } from './textures.js';

// 로보로보 센서 보드 공통 기판 (소리 · 적외선 · 접촉 센서): 48 × 28mm, 1.6T (상품 페이지 공식 규격).
// 긴 변 한쪽(holeEdge)과 양 짧은 변에 고정 구멍이 있고, 숫자 1~9 / 알파벳 A~E가 인쇄돼 있다.
export const ECV = { width: 48, depth: 28, thickness: 1.6 };

export function makeEcvBoard({ name = 'ECV', holeEdge = 'back', header = { x: 14, z: 6 }, silk = null } = {}) {
  const { width: W, depth: D } = ECV;
  const zEdge = holeEdge === 'back' ? -D / 2 + 3 : D / 2 - 3;
  const holes = [];
  for (let i = 0; i < 9; i++) holes.push({ x: -W / 2 + 3.2 + i * ((W - 6.4) / 8), z: zEdge, r: 1.55, ring: true, n: i + 1 });
  for (let j = 1; j < 5; j++) {
    const z = zEdge + (holeEdge === 'back' ? 1 : -1) * j * 5.3;
    holes.push({ x: -W / 2 + 3.2, z, r: 1.55, ring: true, l: j }, { x: W / 2 - 3.2, z, r: 1.55, ring: true, l: j });
  }
  const group = new THREE.Group();
  group.add(makePcb({
    width: W, depth: D, holes, color: 'black', corner: 2,
    silk: (g, w, d, X, Y) => {
      g.font = `700 1.4px ${FONT}`;
      g.textAlign = 'center';
      for (const h of holes) {
        if (h.n) g.fillText(String(h.n), X(h.x), Y(h.z) + (holeEdge === 'back' ? 3.6 : -2.4));
        if (h.l) g.fillText('ABCDE'[h.l], X(h.x) + (h.x < 0 ? 3 : -3), Y(h.z) + 0.5);
      }
      g.fillText('ABCDE'[0], X(-W / 2 + 6.2), Y(zEdge) + 0.5);
      g.textAlign = 'left';
      g.font = `700 1.2px ${FONT}`;
      g.fillText(name, X(-W / 2 + 7), Y(holeEdge === 'back' ? D / 2 - 2 : -D / 2 + 3));
      g.fillText('WWW.ROBOROBO.CO.KR', X(-6), Y(holeEdge === 'back' ? D / 2 - 2 : -D / 2 + 3));
      g.font = `600 0.9px ${FONT}`;
      g.fillText('RoHS   J&D2 1151', X(-8), Y(holeEdge === 'back' ? 3 : -9));
      if (silk) silk(g, w, d, X, Y);
    },
  }));
  // 3핀 헤더 (신호 · 전원 · GND). 높이 9mm 규격에 맞춰 짧은 핀
  const h = pinHeader({ cols: 3, above: 5, below: 3 });
  h.position.set(header.x, ECV.thickness, header.z);
  group.add(h);
  group.userData = { header: h };
  return group;
}
