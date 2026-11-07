import * as THREE from 'three';
import { makeFrame, cornerBolts } from '../../../kit/frame.js';

export function build() {
  const root = new THREE.Group();
  const frame = makeFrame({ cols: 6, rows: 8, material: 'pcb', margin: 4 });
  root.add(frame);
  const bolts = cornerBolts(frame, 1.6 + 6);
  bolts.forEach((b) => root.add(b));
  return {
    object3d: root,
    labels: [{ name: 'Half PCB 6×8', sub: '6 × 8 구멍', object: frame, anchor: [58 / 2 - 4, 1.6, 0], off: [60, -60] }],
    frameWith: bolts,
    handles: { bolts, info: { holes: '6 × 8 = 48개', use: '메인 프레임의 절반 크기 판. 작은 로봇의 바닥판이나 옆판으로 쓴다.' } },
  };
}
