import * as THREE from 'three';
import { makePcb, scallopOutline } from '../../../kit/pcb.js';
import { pinHeader, jst, led, smd, box } from '../../../kit/components.js';
import { M } from '../../../kit/materials.js';
import { FONT } from '../../../kit/textures.js';
import spec from './spec.js';

// 검은 기판: 위쪽 · 왼쪽에 고정 구멍, 가운데 블루투스 칩 모듈 + 기판 안테나, UART 4핀, 흰 2핀 전원
export function build() {
  const T = 1.6;
  const { x: W, z: D } = spec.size;
  const holes = [];
  // 구멍: 지름 3.2 (M3) · 간격 5 mm (모든 부품 공통 격자)
  for (let i = 0; i < 9; i++) holes.push({ x: -20 + i * 5, z: -D / 2 + 3, r: 1.6, ring: true });
  for (let j = 1; j < 5; j++) holes.push({ x: -20, z: -D / 2 + 3 + j * 5, r: 1.6, ring: true });
  const root = new THREE.Group();
  root.add(makePcb({
    width: W, depth: D, color: 'black', holes, corner: 2, outline: scallopOutline(W, D, holes),
    silk: (g, w, d, X, Y) => {
      g.font = `700 1.6px ${FONT}`;
      g.fillText('ANTENNA', X(4), Y(-5.5));
      g.fillText('UART', X(-14), Y(-5.5));
      g.fillText('POWER', X(-14), Y(12));
      g.strokeRect(X(2), Y(-4.5), 18, 8); // 안테나 영역
      g.font = `600 1px ${FONT}`;
      g.save(); g.translate(X(22.5), Y(-10)); g.rotate(Math.PI / 2); g.fillText('ROBOKIT WIRELESS', 0, 0); g.restore();
    },
  }));
  const place = (o, x, z, rot = 0) => { o.position.set(x, T, z); o.rotation.y = rot; root.add(o); return o; };
  // 블루투스 칩 모듈 (은색 차폐 캔)
  const chip = place(box(12, 2, 9, M.metal), 10, 6);
  // 기판 안테나 (구불구불한 금색 선)
  const ant = new THREE.Group();
  for (let i = 0; i < 6; i++) ant.add(box(0.5, 0.05, 6, M.gold, i * 3, 0, 0, { cast: false }));
  for (let i = 0; i < 5; i++) ant.add(box(3.5, 0.05, 0.5, M.gold, i * 3 + 1.5, 0, i % 2 ? -2.8 : 2.8, { cast: false }));
  place(ant, 4, -0.5);
  const uart = place(pinHeader({ cols: 4, above: 5, below: 2 }), -12, -1);
  const power = place(jst({ pins: 2, height: 6 }), -12, 8);
  const status = place(led({ smd: true, color: 0x3b82f6 }), 18, 12);
  for (const [x, z] of [[2, 10], [2, 6], [-4, 4], [-4, 11]]) place(smd('res'), x, z);
  return {
    object3d: root,
    labels: [
      { name: 'BLUETOOTH CHIP', sub: '무선 송수신', object: chip, anchor: [0, 2, 0], off: [60, 50] },
      { name: 'ANTENNA', sub: '기판 안테나', object: ant, anchor: [7, 0, 0], off: [60, -70] },
      { name: 'UART', sub: 'CPU 보드 연결', object: uart, anchor: [0, 7, 0], off: [-120, -50] },
      { name: 'STATUS LED', sub: '깜빡임 = 찾는 중 · 켜짐 = 연결', object: status, anchor: [0, 1, 0], off: [60, 10] },
    ],
    handles: { status },
  };
}
