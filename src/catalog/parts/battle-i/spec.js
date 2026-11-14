// 프레임 - I [PCB, 배틀]: 배틀 로봇용 무기 판 (평행사변형 · 불꽃 무늬)
export default {
  id: 'battle-i',
  name: '배틀무기 I',
  category: 'battle',
  productNo: 448,
  url: 'https://roboroboshop.com/product/detail.html?product_no=448&cate_no=194',
  size: { x: 90, y: 1.6, z: 30, estimated: false, note: '사용자가 보낸 실제 부품 사진에서 구멍 간격 10 mm로 크기 환산 (±2 mm)' },
  specs: [
    ['재질', 'FR-4 (Epoxy) 1.6T'],
    ['모양', '긴 판 · 한쪽 끝 모서리가 비스듬히 잘림 · 빨간 소용돌이 불꽃. J와 좌우 반대'],
    ['구멍', '3줄 (9 · 8 · 7개, 간격 10)'],
  ],
  function: '로봇 앞이나 서보에 볼트로 달아 상대 로봇을 밀거나 막는 배틀 무기. 단단한 PCB라 부딪혀도 잘 휘지 않는다.',
  ports: [{ id: 'holes', type: 'M3 구멍', role: '프레임 · 서보 혼 고정' }],
};
