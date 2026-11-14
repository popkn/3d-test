import { battleSet } from '../../../kit/battleShapes.js';

// 배틀무기 T 세트 (초승달 반쪽 2장)
export function build() {
  const { root, pieces } = battleSet('t');
  return {
    object3d: root,
    labels: [{ name: 'BATTLE T 세트', sub: '2장 세트', object: pieces[0], anchor: [0, 1.6, 0], off: [60, -60] }],
    handles: { frame: root, pieces, info: { holes: '세트 2장' } },
  };
}
