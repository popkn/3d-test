import * as THREE from 'three';
import { makeFrame, cornerBolts } from '../../../kit/frame.js';

export function build() {
  const root = new THREE.Group();
  const frame = makeFrame({ cols: 13, rows: 5, xs: [0, 10, 20, 30, 40, 50, 55, 60, 70, 80, 90, 100, 110], zs: [0, 10, 15, 20, 30], material: 'pcb', margin: 4, marginZ: 4 });
  root.add(frame);
  const bolts = cornerBolts(frame, 1.6 + 6);
  bolts.forEach((b) => root.add(b));
  return {
    object3d: root,
    labels: [{ name: '5×13 [PCB]', sub: 'FR-4 (Epoxy) 1.6T', object: frame, anchor: [118 / 2 - 4, 1.6, 0], off: [60, -60] }],
    frameWith: bolts,
    handles: { bolts, info: { holes: '5 × 13 = 65개', use: '큰 바닥판 · 보드 받침' } },
  };
}
