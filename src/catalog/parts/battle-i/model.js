import * as THREE from 'three';
import { battlePiece, shapeI } from '../../../kit/battleShapes.js';

// BATTLE I: 사용자 사진의 실제 부품 모양 · 크기 (구멍 간격 10 mm로 환산)
export function build() {
  const root = new THREE.Group();
  const f = battlePiece(shapeI(false));
  root.add(f.mesh);
  return {
    object3d: root,
    labels: [{ name: 'BATTLE I', sub: '불꽃 판', object: f.mesh, anchor: [0, 1.6, 0], off: [60, -60] }],
    handles: { frame: f.mesh, info: { holes: '3줄 (9 · 8 · 7개, 간격 10)' } },
  };
}
