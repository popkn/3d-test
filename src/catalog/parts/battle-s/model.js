import * as THREE from 'three';
import { battlePiece, shapeS } from '../../../kit/battleShapes.js';

// BATTLE S: 사용자 사진의 실제 부품 모양 · 크기 (구멍 간격 10 mm로 환산)
export function build() {
  const root = new THREE.Group();
  const f = battlePiece(shapeS());
  root.add(f.mesh);
  return {
    object3d: root,
    labels: [{ name: 'BATTLE S', sub: '방패 · 꽃 무늬', object: f.mesh, anchor: [0, 1.6, 0], off: [60, -60] }],
    handles: { frame: f.mesh, info: { holes: '구멍 4 (모서리, 간격 30 × 60) + 가운데 큰 구멍 Ø12 + 꽃잎 홈 6 (반지름 13)' } },
  };
}
