// 프레임 - T [PCB, 배틀]: 배틀 로봇용 무기 판 (휘어진 칼날)
export default {
  id: 'battle-t',
  name: '배틀무기 T',
  category: 'battle',
  productNo: 462,
  url: 'https://roboroboshop.com/product/detail.html?product_no=462&cate_no=194',
  size: { x: 72, y: 1.6, z: 46, estimated: true, note: '상품 페이지: 재질 FR-4 1.6T (크기 없음) · 외곽선 · 무늬 · 구멍은 사진으로 추정' },
  specs: [
    ['재질', 'FR-4 (Epoxy) 1.6T'],
    ['모양', '휘어진 칼날'],
    ['구멍', '뿌리 쪽 2개 (10mm 간격)'],
  ],
  function: '로봇 앞이나 서보에 볼트로 달아 상대 로봇을 밀거나 막는 배틀 무기.',
  ports: [{ id: 'holes', type: 'M3 구멍', role: '프레임 · 서보 혼 고정' }],
};
