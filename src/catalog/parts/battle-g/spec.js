// 프레임 - G [PCB, 배틀]: 배틀 로봇용 무기 판 (별 무늬 긴 막대)
export default {
  id: 'battle-g',
  name: '배틀무기 G',
  category: 'battle',
  productNo: 446,
  url: 'https://roboroboshop.com/product/detail.html?product_no=446&cate_no=194',
  size: { x: 98, y: 1.6, z: 20, estimated: false, note: '사용자가 보낸 실제 부품 사진에서 구멍 간격 10 mm로 크기 환산 (±2 mm)' },
  specs: [
    ['재질', 'FR-4 (Epoxy) 1.6T'],
    ['모양', '긴 막대 · 빨간 네 갈래 별 5개'],
    ['구멍', '2 × 10 (간격 10)'],
  ],
  function: '로봇 앞이나 서보에 볼트로 달아 상대 로봇을 밀거나 막는 배틀 무기. 단단한 PCB라 부딪혀도 잘 휘지 않는다.',
  ports: [{ id: 'holes', type: 'M3 구멍', role: '프레임 · 서보 혼 고정' }],
};
