import * as THREE from 'three';
import { makeFrame, cornerBolts } from '../../../kit/frame.js';

export function build() {
  const root = new THREE.Group();
  const frame = makeFrame({ cols: 12, rows: 8, material: 'plastic', margin: 5 });
  root.add(frame);
  const bolts = cornerBolts(frame, 1.6 + 6);
  bolts.forEach((b) => root.add(b));
  return {
    object3d: root,
    labels: [{ name: 'Main 플라스틱', sub: '12 × 8 구멍', object: frame, anchor: [120 / 2 - 4, 1.6, 0], off: [60, -60] }],
    frameWith: bolts,
    handles: { bolts, info: { holes: '12 × 8 = 96개', use: '메인 PCB 프레임과 같은 구멍 배치의 가벼운 플라스틱 판.' } },
  };
}
