import * as THREE from 'three';
import { makeFrame, cornerBolts } from '../../../kit/frame.js';

export function build() {
  const root = new THREE.Group();
  const frame = makeFrame({ xs: [0, 10, 20, 30, 40, 50, 55, 60, 70, 80, 90, 100, 110], zs: [0, 10, 20, 30, 35, 40, 50, 60, 70], material: 'pcb', margin: 4 }) // 상세 이미지 기준;
  root.add(frame);
  const bolts = cornerBolts(frame, 1.6 + 6);
  bolts.forEach((b) => root.add(b));
  return {
    object3d: root,
    labels: [{ name: 'Main PCB 8×12', sub: '구멍 117개', object: frame, anchor: [118 / 2 - 4, 1.6, 0], off: [60, -60] }],
    frameWith: bolts,
    handles: { bolts, info: { holes: '117개 (10mm 격자 12 × 8 + 5mm 사이 줄)', use: '기본 로봇의 바닥판. CPU 보드와 모터를 올려 고정한다.' } },
  };
}
