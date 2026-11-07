import * as THREE from 'three';
import { makeEcvBoard, ECV } from '../../../kit/ecvBoard.js';
import { electretMic, trimpot, soic, smd, led } from '../../../kit/components.js';

export function build() {
  const T = ECV.thickness;
  const root = new THREE.Group();
  const board = makeEcvBoard({ name: 'ECV-SD', holeEdge: 'back', header: { x: -10, z: 4 } });
  root.add(board);
  const place = (o, x, z) => { o.position.set(x, T, z); root.add(o); return o; };
  const mic = place(electretMic(), 0, 6);
  const pot = place(trimpot(), 10, 5);
  const chip = place(soic({ length: 4.9, width: 3.9, pins: 8, lines: ['LM393'] }), 3, -4);
  for (const [x, z] of [[-4, -4], [-4, -1.5], [9, -4], [12, -4], [14.5, 0]]) place(smd('res'), x, z);
  const lamp = place(led({ smd: true, color: 0xff2a1a }), 16, 8);
  return {
    object3d: root,
    labels: [
      { name: 'MIC', sub: '콘덴서 마이크', object: mic, anchor: [0, 6.7, 0], off: [-90, -70] },
      { name: 'SENSITIVITY', sub: '가변저항 (기준값)', object: pot, anchor: [0, 5, 0], off: [60, -80] },
      { name: 'COMPARATOR', sub: '소리 크기 비교', object: chip, anchor: [0, 1.6, 0], off: [60, 70] },
      { name: 'DETECT LED', sub: '감지하면 켜짐', object: lamp, anchor: [0, 1, 0], off: [70, 20] },
      { name: '3P HEADER', sub: 'S · V · G', object: board.userData.header, anchor: [0, 7, 0], off: [-120, 30] },
    ],
    handles: { pot, lamp },
  };
}
