import * as THREE from 'three';
import { makeFrame, cornerBolts } from '../../../kit/frame.js';

export function build() {
  const root = new THREE.Group();
  const frame = makeFrame({ cols: 9, rows: 4, cutouts: [{ x: -35, z: 0, r: 1.6 }, { x: -25, z: 0, r: 3 }], material: 'plastic', margin: 5, marginZ: 5 });
  root.add(frame);
  const bolts = cornerBolts(frame, 1.6 + 6);
  bolts.forEach((b) => root.add(b));
  return {
    object3d: root,
    labels: [{ name: '중 [플라스틱]', sub: 'Plastic 1.6T', object: frame, anchor: [90 / 2 - 4, 1.6, 0], off: [60, -60] }],
    frameWith: bolts,
    handles: { bolts, info: { holes: '36개 + 사이 구멍 2개 (큰 구멍 Ø6 포함)', use: '프레임 · 보드 연결' } },
  };
}
