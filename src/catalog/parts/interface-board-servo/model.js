import * as THREE from 'three';
import { makePcb } from '../../../kit/pcb.js';
import { pinHeader, bigSlideSwitch, jst, elecCap, led, axialResistor } from '../../../kit/components.js';
import { FONT } from '../../../kit/textures.js';

// T자 모양 흰 기판 (길이 방향 = Z). 위(-Z)부터: 스위치 2개 → 출력 핀 5줄 + 패드 → 표시등 → 전원 커넥터 → 콘덴서
export function build() {
  const T = 1.6;
  const root = new THREE.Group();
  const outline = [[-9, -23], [1.6, -23], [1.6, -10], [9, -10], [9, 9], [1.6, 9], [1.6, 23], [-9, 23]];
  const pads = [];
  for (let r = 0; r < 5; r++) for (let c = 0; c < 3; c++) pads.push({ x: 2.9 + c * 2.54, z: -6.4 + r * 2.54, r: 0.5, ring: true });
  root.add(makePcb({
    width: 18, depth: 46, color: 'white', outline, holes: pads,
    silk: (g, w, d, X, Y) => {
      g.font = `600 1px ${FONT}`;
      g.fillText('▲ON', X(-8.4), Y(-11.6)); g.fillText('▼OFF', X(-8.4), Y(-10.6));
      g.fillText('Battery', X(-3.6), Y(-11.6)); g.fillText('CPU(4,5)', X(-3.6), Y(-10.6));
      g.font = `700 1.1px ${FONT}`;
      for (let i = 0; i < 5; i++) g.fillText(String(i + 1), X(-8.6), Y(-6.0 + i * 2.54));
      g.fillText('▲', X(-8.4), Y(7.4));
      g.font = `600 0.9px ${FONT}`;
      g.fillText('SERVO INTERFACE', X(-8.4), Y(21.6));
    },
  }));
  const place = (o, x, z, y = T) => { o.position.set(x, y, z); root.add(o); return o; };

  const swPower = place(bigSlideSwitch({ length: 4.4, width: 8, height: 5 }), -6.2, -17);
  const swPort = place(bigSlideSwitch({ length: 4.4, width: 8, height: 5 }), -1.4, -17);
  // 출력 핀: 3열(신호 · + · -) × 5줄, 아래로 길게 나와 CPU 보드에 꽂힌다
  const header = place(pinHeader({ cols: 3, rows: 5, above: 6, below: 7 }), -4.4, -1.32);
  const powerLed = place(led({ smd: true, color: 0xff2a1a }), 5.4, 6.6);
  const res = place(axialResistor({ length: 4.5, dia: 1.8 }), -1.2, 6.6);
  res.scale.setScalar(0.85);
  const conn = place(jst({ pins: 2, height: 6 }), -3.7, 13.4);
  conn.rotation.y = Math.PI;
  const cap = place(elecCap({ dia: 8, height: 11, color: new THREE.MeshStandardMaterial({ color: 0x1b2230, roughness: 0.4 }) }), -3.7, 19);

  // 출력 줄마다 전원 상태 표시 (초록 = 배터리, 파랑 = CPU 전원, 회색 = 꺼짐)
  const rowMarks = [];
  for (let i = 0; i < 5; i++) {
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.6, 12, 8), new THREE.MeshBasicMaterial({ color: 0x999999 }));
    m.position.set(-9.8, T + 9.5, -6.4 + i * 2.54);
    root.add(m);
    rowMarks.push(m);
  }

  return {
    object3d: root,
    labels: [
      { name: 'POWER SWITCH', sub: '서보 전원 ON / OFF', object: swPower, anchor: [0, 7, 0], off: [-130, -50] },
      { name: 'PORT 4·5 SWITCH', sub: 'Battery / CPU', object: swPort, anchor: [0, 7, 0], off: [60, -70] },
      { name: 'OUT 1~5', sub: '신호 · + · - (서보 연결)', object: header, anchor: [0, 8, 0], off: [-150, 30] },
      { name: 'POWER LED', sub: '전원 표시등', object: powerLed, anchor: [0, 1, 0], off: [70, -10] },
      { name: 'BATTERY IN', sub: '2핀 전원 커넥터', object: conn, anchor: [0, 6, 0], off: [70, 40] },
      { name: 'E-CAP', sub: '순간 전류 보충', object: cap, anchor: [0, 11, 0], off: [-120, 70] },
    ],
    handles: { swPower, swPort, powerLed, rowMarks },
  };
}
