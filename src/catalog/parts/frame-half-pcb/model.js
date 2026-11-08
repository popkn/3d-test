import * as THREE from 'three';
import { makeFrame, cornerBolts } from '../../../kit/frame.js';

export function build() {
  const root = new THREE.Group();
  const frame = makeFrame({ xs: [0, 10, 20, 25, 30, 40, 50], zs: [0, 10, 20, 30, 35, 40, 50, 60, 70], material: 'pcb', margin: 4 }) // 상세 이미지 기준: 10mm 격자 + 5mm 사이 줄 1개씩;
  root.add(frame);
  const bolts = cornerBolts(frame, 1.6 + 6);
  bolts.forEach((b) => root.add(b));
  return {
    object3d: root,
    labels: [{ name: 'Half PCB 6×8', sub: '구멍 63개', object: frame, anchor: [58 / 2 - 4, 1.6, 0], off: [60, -60] }],
    frameWith: bolts,
    handles: { bolts, info: { holes: '63개 (10mm 격자 6 × 8 + 5mm 사이 줄)', use: '메인 프레임의 절반 크기 판. 작은 로봇의 바닥판이나 옆판으로 쓴다.' } },
  };
}
