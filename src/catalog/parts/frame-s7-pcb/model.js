import * as THREE from 'three';
import { makeFrame, cornerBolts } from '../../../kit/frame.js';

export function build() {
  const root = new THREE.Group();
  const frame = makeFrame({ xs: [0, 5, 10, 15, 20, 30, 40, 45, 50, 55, 60], zs: [0], material: 'pcb', margin: 4, marginZ: 4 });
  root.add(frame);
  const bolts = cornerBolts(frame, 1.6 + 6);
  bolts.forEach((b) => root.add(b));
  return {
    object3d: root,
    labels: [{ name: '소7 [PCB]', sub: 'FR-4 (Epoxy) 1.6T', object: frame, anchor: [68 / 2 - 4, 1.6, 0], off: [60, -60] }],
    frameWith: bolts,
    handles: { bolts, info: { holes: '11개 (10mm + 5mm 사이 구멍)', use: '프레임 · 보드 연결 막대' } },
  };
}
