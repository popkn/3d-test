import * as THREE from 'three';
import { makeFrame, cornerBolts } from '../../../kit/frame.js';

export function build() {
  const root = new THREE.Group();
  const frame = makeFrame({ cols: 3, rows: 1, material: 'pcb', margin: 4, marginZ: 4 });
  root.add(frame);
  const bolts = cornerBolts(frame, 1.6 + 6);
  bolts.forEach((b) => root.add(b));
  return {
    object3d: root,
    labels: [{ name: '소3 [PCB]', sub: 'FR-4 (Epoxy) 1.6T', object: frame, anchor: [28 / 2 - 4, 1.6, 0], off: [60, -60] }],
    frameWith: bolts,
    handles: { bolts, info: { holes: '3개', use: '프레임 · 보드 연결 막대' } },
  };
}
