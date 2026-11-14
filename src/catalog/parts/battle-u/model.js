import * as THREE from 'three';
import { battlePiece, shapeU } from '../../../kit/battleShapes.js';

// BATTLE U: 사용자 사진의 실제 부품 모양 · 크기 (구멍 간격 10 mm로 환산)
export function build() {
  const root = new THREE.Group();
  const f = battlePiece(shapeU());
  root.add(f.mesh);
  return {
    object3d: root,
    labels: [{ name: 'BATTLE U', sub: '별 조각 (1/3)', object: f.mesh, anchor: [0, 1.6, 0], off: [60, -60] }],
    handles: { frame: f.mesh, info: { holes: '별 가운데에서 반지름 10에 2개 (세 장 모으면 6개) + 가운데 구멍' } },
  };
}
