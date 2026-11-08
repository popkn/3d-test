import { buildGuideModel } from '../../../kit/wheelGuide.js';
export function build() {
  return buildGuideModel({ dia: 30, thick: 8, color: 0x1d1e21, hub: 'dcut', hex: true, name: '휠가이드 Ø30/나일론/검정', sub: 'ABS (검정) · Ø30', hubLabel: 'D컷 축 구멍' });
}
