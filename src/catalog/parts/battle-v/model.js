import * as THREE from 'three';
import { battlePiece, shapeV } from '../../../kit/battleShapes.js';

// BATTLE V: 사용자 사진의 실제 부품 모양 · 크기 (구멍 간격 10 mm로 환산)
export function build() {
  const root = new THREE.Group();
  const f = battlePiece(shapeV());
  root.add(f.mesh);
  return {
    object3d: root,
    labels: [{ name: 'BATTLE V', sub: '도끼 반쪽', object: f.mesh, anchor: [0, 1.6, 0], off: [60, -60] }],
    handles: { frame: f.mesh, info: { holes: '안쪽 흰 띠에 2개 (간격 10)' } },
  };
}
