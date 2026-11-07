import * as THREE from 'three';
import { makePcb } from '../../../kit/pcb.js';
import { qfp, crystal, tactSwitch, pinHeader, led, smd } from '../../../kit/components.js';
import { M, mesh } from '../../../kit/materials.js';
import { FONT } from '../../../kit/textures.js';
import spec from './spec.js';

export function build() {
  const T = 1.6;
  const { x: W, z: D } = spec.size;
  const root = new THREE.Group();
  root.add(makePcb({
    width: W, depth: D, color: 'black',
    frame: { pitch: 5.5, inset: 3, r: 1.6 },
    silk: (g, w, d, X, Y) => {
      g.font = `700 1.4px ${FONT}`;
      g.fillText('LEFT', X(3), Y(18)); g.fillText('RIGHT', X(13), Y(18)); g.fillText('INPUT', X(-26), Y(18));
      g.font = `600 1.2px ${FONT}`;
      g.fillText('WWW.ROBOROBO.CO.KR', X(-24), Y(-17.5)); g.fillText('Melody_Board', X(14), Y(-17.5));
      g.fillText('PC1D-N017', X(-12), Y(18));
    },
  }));
  const place = (o, x, z) => { o.position.set(x, T, z); root.add(o); return o; };
  // 스피커: 검은 원통 + 구멍 뚫린 덮개
  const speaker = new THREE.Group();
  const body = mesh(new THREE.CylinderGeometry(10, 10, 5, 40), M.matteBlack);
  body.position.y = 2.5;
  speaker.add(body);
  const grille = mesh(new THREE.CylinderGeometry(9.4, 9.4, 0.3, 40), M.blackPlastic);
  grille.position.y = 5.1;
  speaker.add(grille);
  for (let r = 0; r < 3; r++) for (let i = 0; i < [1, 6, 12][r]; i++) {
    const a = (i / [1, 6, 12][r]) * Math.PI * 2;
    const hole = mesh(new THREE.CylinderGeometry(0.9, 0.9, 0.35, 12), M.hole, { cast: false });
    hole.position.set(Math.cos(a) * r * 3.2, 5.15, Math.sin(a) * r * 3.2);
    speaker.add(hole);
  }
  place(speaker, -16, -2);
  const mcu = place(qfp({ size: 7, pins: 32, lines: ['ATMEGA', 'MELODY'] }), 4, -4);
  place(crystal({ length: 10, width: 4, height: 3.5 }), -4, 10);
  const left = place(tactSwitch({ size: 6, cap: M.blackPlastic }), 6, 12);
  const right = place(tactSwitch({ size: 6, cap: M.blackPlastic }), 16, 12);
  const input = place(pinHeader({ cols: 3, above: 5, below: 2 }), -24, 13);
  const leds = [-2, 2, 6, 10, 14, 18, 22].map((x) => place(led({ smd: true, color: 0xff2a1a }), x, -14));
  for (const [x, z] of [[14, -6], [14, -2], [-4, 2], [22, 4]]) place(smd('res'), x, z);
  return {
    object3d: root,
    labels: [
      { name: 'SPEAKER', sub: '멜로디 출력', object: speaker, anchor: [0, 5, 0], off: [-120, -70] },
      { name: 'MCU', sub: '멜로디 저장 · 재생', object: mcu, anchor: [0, 1.2, 0], off: [60, -90] },
      { name: 'LEFT / RIGHT', sub: '곡 고르기', object: right, anchor: [0, 5, 0], off: [70, 30] },
      { name: 'INPUT', sub: 'CPU Board 8M 연결', object: input, anchor: [0, 7, 0], off: [-120, 40] },
    ],
    handles: { grille, leds, left, right },
  };
}
