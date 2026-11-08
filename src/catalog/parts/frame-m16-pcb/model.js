import * as THREE from 'three';
import { makeFrame, cornerBolts } from '../../../kit/frame.js';

export function build() {
  const root = new THREE.Group();
  const frame = makeFrame({ xs: [0, 10, 20, 30, 40, 50, 60, 70, 75, 80, 90, 100, 110, 120, 130, 140, 150], zs: [0, 5, 10], material: 'pcb', margin: 4, marginZ: 4 });
  root.add(frame);
  const bolts = cornerBolts(frame, 1.6 + 6);
  bolts.forEach((b) => root.add(b));
  return {
    object3d: root,
    labels: [{ name: '중16 [PCB]', sub: 'FR-4 (Epoxy) 1.6T', object: frame, anchor: [158 / 2 - 4, 1.6, 0], off: [60, -60] }],
    frameWith: bolts,
    handles: { bolts, info: { holes: '51개 (17 × 3, 가운데 줄 · 열 5mm)', use: '프레임 · 보드 연결' } },
  };
}
