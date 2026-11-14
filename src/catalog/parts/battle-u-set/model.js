import { battleSet } from '../../../kit/battleShapes.js';

// 배틀무기 U 세트 (별 조각 3장)
export function build() {
  const { root, pieces } = battleSet('u');
  return {
    object3d: root,
    labels: [{ name: 'BATTLE U 세트', sub: '3장 세트', object: pieces[0], anchor: [0, 1.6, 0], off: [60, -60] }],
    handles: { frame: root, pieces, info: { holes: '세트 3장' } },
  };
}
