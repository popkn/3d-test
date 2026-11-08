import * as THREE from 'three';
import { makeFrame, cornerBolts } from '../../../kit/frame.js';

export function build() {
  const root = new THREE.Group();
  const frame = makeFrame({ cols: 8, rows: 4, skip: (c, r) => c > 0 && c < 7 && r > 0 && r < 3, cutouts: [{ x: 0, z: 0, w: 52, d: 12 }], material: 'pcb', margin: 4, marginZ: 4 });
  root.add(frame);
  const bolts = cornerBolts(frame, 1.6 + 6);
  bolts.forEach((b) => root.add(b));
  return {
    object3d: root,
    labels: [{ name: 'ㅁ자 [PCB]', sub: 'FR-4 (Epoxy) 1.6T', object: frame, anchor: [78 / 2 - 4, 1.6, 0], off: [60, -60] }],
    frameWith: bolts,
    handles: { bolts, info: { holes: '가장자리 8 × 4 (가운데 창)', use: '몸체 뼈대 · 보드 받침' } },
  };
}
