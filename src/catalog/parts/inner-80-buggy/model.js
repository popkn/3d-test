import { buildInner } from '../../../kit/innerSponge.js';

export function build() {
  return buildInner({ length: 200, width: 10, height: 10, color: 0x6e7074, name: 'INNER SPONGE', sub: '스폰지 · 200 × 10 × 10' });
}
