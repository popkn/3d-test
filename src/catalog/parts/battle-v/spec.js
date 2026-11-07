// 프레임 - V [PCB, 배틀]: 배틀 로봇용 무기 판 (날개 모양 · 마름모 무늬)
export default {
  id: 'battle-v',
  name: '배틀무기 V',
  category: 'battle',
  productNo: 464,
  url: 'https://roboroboshop.com/product/detail.html?product_no=464&cate_no=194',
  size: { x: 84, y: 1.6, z: 46, estimated: true, note: '상품 페이지: 재질 FR-4 1.6T (크기 없음) · 외곽선 · 무늬 · 구멍은 사진으로 추정' },
  specs: [
    ['재질', 'FR-4 (Epoxy) 1.6T'],
    ['모양', '날개 모양 · 마름모 무늬'],
    ['구멍', '아래쪽 2개 (10mm 간격)'],
  ],
  function: '로봇 앞이나 서보에 볼트로 달아 상대 로봇을 밀거나 막는 배틀 무기.',
  ports: [{ id: 'holes', type: 'M3 구멍', role: '프레임 · 서보 혼 고정' }],
};
