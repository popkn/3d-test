// 프레임 - S [PCB, 배틀]: 배틀 로봇용 무기 판 (방패 (사다리꼴) · 가운데 꽃 무늬)
export default {
  id: 'battle-s',
  name: '배틀무기 S',
  category: 'battle',
  productNo: 458,
  url: 'https://roboroboshop.com/product/detail.html?product_no=458&cate_no=194',
  size: { x: 82, y: 1.6, z: 92, estimated: false, note: '사용자가 보낸 실제 부품 사진에서 구멍 간격 10 mm로 크기 환산 (±2 mm)' },
  specs: [
    ['재질', 'FR-4 (Epoxy) 1.6T'],
    ['모양', '방패 (위가 좁은 사다리꼴) · 빨간 테두리 · 가운데 꽃 (꽃잎 홈 6 → 휠가이드 · 모터 축에 끼움)'],
    ['구멍', '구멍 4 (모서리, 간격 30 × 60) + 가운데 큰 구멍 Ø12 + 꽃잎 홈 6 (반지름 13)'],
  ],
  function: '로봇 앞이나 서보에 볼트로 달아 상대 로봇을 밀거나 막는 배틀 무기.',
  ports: [{ id: 'holes', type: 'M3 구멍', role: '프레임 · 서보 혼 고정' }],
};
