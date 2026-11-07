import { makeFrame, cornerBolts, frameSize } from '../../../kit/frame.js';
import * as THREE from 'three';

export function build() {
  const root = new THREE.Group();
  const frame = makeFrame({ cols: 16, rows: 12, material: 'pcb' });
  root.add(frame);
  const bolts = cornerBolts(frame, 1.6 + 6);
  bolts.forEach((b) => root.add(b));
  return {
    object3d: root,
    labels: [{ name: 'BIG MAIN PCB', sub: '16 × 12 구멍 · FR-4', object: frame, anchor: [frameSize(16) / 2 - 4, 1.6, 0], off: [60, -60] }],
    frameWith: bolts,
    handles: { bolts, info: { holes: '16 × 12 = 192개', use: '로봇 바닥판 · 차체' } },
  };
}
