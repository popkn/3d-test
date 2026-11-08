import * as THREE from 'three';
import { makeFrame, cornerBolts } from '../../../kit/frame.js';

export function build() {
  const root = new THREE.Group();
  const frame = makeFrame({ xs: [0, 10, 20, 30, 40, 50, 55, 60, 70, 80, 90, 100, 110], zs: [0, 10, 20, 30, 35, 40, 50, 60, 70], material: 'plastic', margin: 5 }) // 사진 기준: 10mm 격자 + 가운데 5mm 사이 줄;
  root.add(frame);
  const bolts = cornerBolts(frame, 1.6 + 6);
  bolts.forEach((b) => root.add(b));
  return {
    object3d: root,
    labels: [{ name: 'Main 플라스틱', sub: '구멍 117개', object: frame, anchor: [120 / 2 - 4, 1.6, 0], off: [60, -60] }],
    frameWith: bolts,
    handles: { bolts, info: { holes: '117개 (10mm 격자 12 × 8 + 5mm 사이 줄)', use: '메인 PCB 프레임과 같은 구멍 배치의 가벼운 플라스틱 판.' } },
  };
}
