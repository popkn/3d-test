import { buildGuideModel } from '../../../kit/wheelGuide.js';
export function build() {
  return buildGuideModel({ dia: 40, thick: 8, color: 0xf5c518, hub: 'round', hex: false, name: '휠가이드 Ø40-YELLOW', sub: 'SUS (노란 도장) · Ø40', hubLabel: '둥근 축 구멍' });
}
