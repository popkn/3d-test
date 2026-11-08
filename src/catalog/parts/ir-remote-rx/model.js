import * as THREE from 'three';
import { makePcb } from '../../../kit/pcb.js';
import { dipSwitch, led, soic, crystal, pinHeader, smd, box } from '../../../kit/components.js';
import { M, mesh } from '../../../kit/materials.js';
import { FONT } from '../../../kit/textures.js';
import spec from './spec.js';

export function build() {
  const T = 1.6;
  const { x: W, z: D } = spec.size;
  const root = new THREE.Group();
  root.add(makePcb({
    width: W, depth: D, color: 'black',
    frame: { pitch: 5.5, inset: 3, r: 1.6, numbers: true, letters: true, scallop: 1.3 },
    silk: (g, w, d, X, Y) => {
      g.font = `italic 800 3px ${FONT}`;
      g.fillText('ROBOROBO', X(-24), Y(-11));
      g.font = `600 1.3px ${FONT}`;
      g.fillText('WWW.ROBOROBO.CO.KR', X(-24), Y(-8.4));
      g.fillText('MADE IN KOREA', X(-24), Y(-6.4));
      g.fillText('1234', X(21), Y(3.5));
      g.fillText('IR', X(-8), Y(8));
    },
  }));
  const place = (o, x, z, rot = 0) => { o.position.set(x, T, z); o.rotation.y = rot; root.add(o); return o; };
  // 적외선 수신 모듈 (검은 몸통 + 둥근 렌즈)
  const ir = new THREE.Group();
  ir.add(box(6.5, 7, 3.6, M.blackPlastic));
  const lens = mesh(new THREE.SphereGeometry(2, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), M.blackPlastic);
  lens.rotation.x = -Math.PI / 2;
  lens.position.set(0, 4.5, -1.8);
  ir.add(lens);
  place(ir, -6, 2);
  const mcu = place(soic({ length: 11, width: 7.5, pins: 18, lines: ['RECEIVER', 'MCU'] }), 10, 4);
  place(crystal({ length: 10, width: 4, height: 3.5 }), 12, -8);
  const dip = place(dipSwitch({ n: 4, color: M.blackPlastic }), 22, 8);
  const lamp = place(led({ dia: 3, color: 0x2aff5a }), -20, 12);
  const out = place(pinHeader({ cols: 1, rows: 3, above: 5, below: 2 }), 26, -10);
  for (const [x, z] of [[2, -4], [4, 12], [-12, 12], [16, 14], [-2, 12]]) place(smd('res'), x, z);
  return {
    object3d: root,
    labels: [
      { name: 'IR RECEIVER', sub: 'RPM7138 · 37.9kHz', object: ir, anchor: [0, 7, 0], off: [-130, -70] },
      { name: 'MCU', sub: '신호 해석 → 1:1 출력', object: mcu, anchor: [0, 1.6, 0], off: [40, -90] },
      { name: 'CHANNEL DIP', sub: '송신부와 같게', object: dip, anchor: [0, 4, 0], off: [70, -30] },
      { name: 'RX LED', sub: '받으면 깜빡임', object: lamp, anchor: [0, 4, 0], off: [-120, 40] },
      { name: 'OUTPUT', sub: 'CPU 입력 연결', object: out, anchor: [0, 6, 0], off: [70, 40] },
    ],
    handles: { dip, lamp },
  };
}
