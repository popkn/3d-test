// 휠가이드[Ø40-YELLOW]
export default {
  id: 'wheel-guide-40-yellow',
  name: '휠가이드[Ø40-YELLOW]',
  category: 'wheel',
  productNo: 164,
  url: 'https://roboroboshop.com/product/detail.html?product_no=164&cate_no=194',
  size: { x: 40, y: 8, z: 40, estimated: false, note: '상품 페이지 공식 규격 Ø40 × 8 mm' },
  specs: [
    ['크기', 'Ø40 × 8 mm'],
    ['재질', 'SUS (노란 도장)'],
    ['구멍', '4개 십자 (반지름 10 mm) · Ø3.2 · 5 mm 격자에 통일'],
    ['허브', '둥근 축 구멍'],
  ],
  function: '모터 축에 끼우는 큰 원판. 넓은 원판에 프레임이나 바퀴를 볼트로 붙여 함께 돌린다.',
  ports: [
    { id: 'hub', type: '둥근 축 구멍', role: 'DC 모터 축에 고정' },
    { id: 'holes', type: 'M3 구멍 4개 (십자)', role: '프레임 · 휠 고정' },
  ],
};
