import * as THREE from 'three';
import { makePcb } from '../../../kit/pcb.js';
import { tactSwitch, dipSwitch, led, soic, jst, pinHeader, smd } from '../../../kit/components.js';
import { M } from '../../../kit/materials.js';
import { FONT } from '../../../kit/textures.js';

// 게임패드 모양 검은 기판. 왼쪽 버튼 1~4, 오른쪽 5~8 (사진 배치), 위쪽 가운데 적외선 LED
export const KEYS = [
  [-26, -12], [-26, 8], [-36, -2], [-16, -2], // 1 위, 2 아래, 3 왼쪽, 4 오른쪽
  [26, -12], [26, 8], [16, -2], [36, -2],      // 5 위, 6 아래, 7 왼쪽, 8 오른쪽
];

export function build() {
  const T = 1.6;
  const root = new THREE.Group();
  const outline = [
    [-40, -30], [40, -30], [45, -25], [45, 22], [40, 30], [24, 30], [16, 20], [-16, 20], [-24, 30], [-40, 30], [-45, 22], [-45, -25],
  ];
  root.add(makePcb({
    width: 90, depth: 60, color: 'black', outline,
    silk: (g, w, d, X, Y) => {
      g.font = `700 2.2px ${FONT}`;
      KEYS.forEach(([x, z], i) => g.fillText(String(i + 1), X(x) - 0.6, Y(z) - 4.2));
      g.font = `700 1.6px ${FONT}`;
      g.fillText('1234', X(-3), Y(-8.6));
      g.font = `italic 800 2.4px ${FONT}`;
      g.fillText('ROBOROBO', X(14), Y(16));
      g.font = `600 1px ${FONT}`;
      g.fillText('PC0C-N000-140  ROBOPIA 1707', X(4), Y(-27));
    },
  }));
  const place = (o, x, z, rot = 0) => { o.position.set(x, T, z); o.rotation.y = rot; root.add(o); return o; };
  const keys = KEYS.map(([x, z]) => place(tactSwitch({ size: 12, cap: M.blackPlastic }), x, z));
  const dip = place(dipSwitch({ n: 4, color: M.blackPlastic }), 0, -14);
  const irLed = led({ dia: 5, color: 0xb070ff });
  irLed.rotation.x = -Math.PI / 2; // 앞(-Z)을 향해 눕힌 LED
  irLed.position.set(0, T + 3, -28);
  root.add(irLed);
  const chip = place(soic({ length: 9, width: 4, pins: 16, lines: ['IR', 'ENCODER'] }), 0, 4);
  place(jst({ pins: 2 }), 6, 14);
  place(pinHeader({ cols: 4, above: 5, below: 2 }), -30, 20);
  for (const [x, z] of [[-8, -4], [8, -4], [-8, 10], [10, 8], [-6, -22], [6, -22]]) place(smd('res'), x, z);
  // 적외선 신호 표시 (앞으로 퍼지는 고리)
  const waves = [];
  for (let i = 0; i < 3; i++) {
    const r = new THREE.Mesh(new THREE.TorusGeometry(4, 0.25, 6, 32), new THREE.MeshBasicMaterial({ color: 0xb070ff, transparent: true, opacity: 0 }));
    r.position.set(0, T + 3, -32);
    r.userData.noBounds = true;
    root.add(r);
    waves.push(r);
  }
  return {
    object3d: root,
    labels: [
      { name: 'IR LED', sub: '적외선 신호 발신', object: irLed, anchor: [0, 3, 0], off: [60, -80] },
      { name: 'KEYS 1~4', sub: '왼쪽 버튼', object: keys[2], anchor: [0, 5, 0], off: [-110, -50] },
      { name: 'KEYS 5~8', sub: '오른쪽 버튼', object: keys[7], anchor: [0, 5, 0], off: [60, -40] },
      { name: 'CHANNEL DIP', sub: '최대 16명 구분', object: dip, anchor: [0, 4, 0], off: [-60, -100] },
      { name: 'ENCODER', sub: '버튼 → 적외선 신호', object: chip, anchor: [0, 1.6, 0], off: [70, 60] },
    ],
    handles: { keys, dip, irLed, waves },
  };
}
