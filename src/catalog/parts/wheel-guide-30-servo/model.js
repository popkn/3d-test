import { buildGuideModel } from '../../../kit/wheelGuide.js';
export function build() {
  return buildGuideModel({ dia: 30, thick: 8, color: 0xf2f1ec, hub: 'servo', hex: true, name: '휠가이드 Ø30/Servo', sub: 'Plastic (흰색) · Ø30', hubLabel: '서보 축 · 육각 허브' });
}
