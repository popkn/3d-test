import * as THREE from 'three';
import { makePcb } from '../../../kit/pcb.js';
import { elecCap, femaleHeader, pinHeader, led, smd } from '../../../kit/components.js';
import { FONT } from '../../../kit/textures.js';
import { build as buildA3, ROW_GAP } from '../motor-drive-a3/model.js';
import spec from './spec.js';

// 9 × 9 프레임 구멍 기판. 가운데 위: A3 보드 소켓 2줄 + 콘덴서 2개, 아래: Motor3 · EX-Motor3/4 · Motor4
export function build() {
  const T = 1.6;
  const { x: W, z: D } = spec.size;
  const root = new THREE.Group();
  root.add(makePcb({
    width: W, depth: D, color: 'black',
    frame: { pitch: 5.5, inset: 3, r: 1.7, numbers: true, letters: true },
    silk: (g, w, d, X, Y) => {
      g.font = `700 1.5px ${FONT}`;
      g.fillText('EX-Motor3/4', X(-5), Y(5.5));
      g.fillText('Motor3', X(-14), Y(9.5));
      g.fillText('Motor4', X(8), Y(9.5));
      g.fillText('EX-A B', X(-3), Y(16.5));
      g.font = `600 1.1px ${FONT}`;
      g.fillText('WWW.ROBOROBO.CO.KR', X(-4), Y(-17));
      g.fillText('SIE ▲', X(-14), Y(3));
    },
  }));
  const place = (o, x, z) => { o.position.set(x, T, z); root.add(o); return o; };
  // A3 소켓: 6핀 암 헤더 두 줄 (A3의 핀 간격에 맞춤)
  const sockets = [-ROW_GAP / 2, ROW_GAP / 2].map((z) => place(femaleHeader({ cols: 6, height: 7 }), 3, z - 6));
  sockets.forEach((s) => { s.rotation.y = 0; });
  const capL = place(elecCap({ dia: 6.3, height: 7.5 }), -12, -10);
  const capR = place(elecCap({ dia: 6.3, height: 7.5 }), -12, -1);
  const ex = place(pinHeader({ cols: 2, rows: 3, above: 6, below: 1.5 }), 0, 11);
  const m3 = place(pinHeader({ cols: 2, rows: 2, above: 6, below: 1.5 }), -11, 13);
  const m4 = place(pinHeader({ cols: 2, rows: 2, above: 6, below: 1.5 }), 11, 13);
  const led3 = place(led({ smd: true, color: 0xff2a1a }), -16, 6);
  const led4 = place(led({ smd: true, color: 0xff2a1a }), 16, 6);
  for (const [x, z] of [[-6, 1], [12, -2], [-6, -14]]) place(smd('res'), x, z);

  // A3 보드 (장착하면 소켓 위에 꽂힌다)
  const a3 = buildA3().object3d;
  a3.position.set(3, T + 7 - 6 + 0.2, -6); // A3 기판 아랫면이 소켓 윗면에 닿도록
  a3.userData.noBounds = true;
  root.add(a3);

  return {
    object3d: root,
    labels: [
      { name: 'A3 SOCKET', sub: 'Motor Drive Board[A3] 장착', object: sockets[0], anchor: [0, 7, 0], off: [60, -90] },
      { name: 'EX-MOTOR 3/4', sub: 'CPU 보드 연결', object: ex, anchor: [0, 8, 0], off: [-60, 90] },
      { name: 'MOTOR3', sub: '모터 출력', object: m3, anchor: [0, 8, 0], off: [-120, 30] },
      { name: 'MOTOR4', sub: '모터 출력', object: m4, anchor: [0, 8, 0], off: [70, 30] },
      { name: 'E-CAP ×2', sub: '전원 안정', object: capL, anchor: [0, 7.5, 0], off: [-130, -60] },
    ],
    handles: { a3, led3, led4, capR },
  };
}
