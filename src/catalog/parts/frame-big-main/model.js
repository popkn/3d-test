import { makeFrame, cornerBolts, frameSize } from '../../../kit/frame.js';
import * as THREE from 'three';

export function build() {
  const root = new THREE.Group();
  // 구멍 배치: 상세 이미지에서 읽은 위치. 10mm 격자 16 × 12 + 5mm 사이 줄 (열 3개 · 행 3개, 행 2개는 일부만)
  const xs = [0, 10, 20, 30, 35, 40, 50, 60, 70, 75, 80, 90, 100, 110, 115, 120, 130, 140, 150];
  const zs = [0, 10, 20, 25, 30, 40, 50, 55, 60, 70, 80, 85, 90, 100, 110];
  const partRow = (r) => r === 3 || r === 11, partCols = [3, 4, 5, 13, 14, 15];
  const frame = makeFrame({ xs, zs, material: 'pcb', skip: (c, r) => partRow(r) && !partCols.includes(c) });
  root.add(frame);
  const bolts = cornerBolts(frame, 1.6 + 6);
  bolts.forEach((b) => root.add(b));
  return {
    object3d: root,
    labels: [{ name: 'BIG MAIN PCB', sub: '구멍 259개 · FR-4', object: frame, anchor: [158 / 2 - 4, 1.6, 0], off: [60, -60] }],
    frameWith: bolts,
    handles: { bolts, info: { holes: '259개 (10mm 격자 + 5mm 사이 줄)', use: '로봇 바닥판 · 차체' } },
  };
}
