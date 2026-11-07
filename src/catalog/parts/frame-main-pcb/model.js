import * as THREE from 'three';
import { makeFrame, cornerBolts } from '../../../kit/frame.js';

export function build() {
  const root = new THREE.Group();
  const frame = makeFrame({ cols: 12, rows: 8, material: 'pcb', margin: 4 });
  root.add(frame);
  const bolts = cornerBolts(frame, 1.6 + 6);
  bolts.forEach((b) => root.add(b));
  return {
    object3d: root,
    labels: [{ name: 'Main PCB 8×12', sub: '12 × 8 구멍', object: frame, anchor: [118 / 2 - 4, 1.6, 0], off: [60, -60] }],
    frameWith: bolts,
    handles: { bolts, info: { holes: '12 × 8 = 96개', use: '기본 로봇의 바닥판. CPU 보드와 모터를 올려 고정한다.' } },
  };
}
