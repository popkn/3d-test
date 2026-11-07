import { createInnerFunction } from '../../../kit/innerSponge.js';

// 기능: 펼친 띠를 감아 타이어 안쪽에 들어가는 고리로 만든다.
export function create(model, ui) {
  return createInnerFunction(model, ui, { tireName: 'Ø80 버기 타이어' });
}
