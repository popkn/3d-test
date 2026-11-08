// 휠가이드[Ø30/Servo]
export default {
  id: 'wheel-guide-30-servo',
  name: '휠가이드[Ø30/Servo]',
  category: 'wheel',
  productNo: 167,
  url: 'https://roboroboshop.com/product/detail.html?product_no=167&cate_no=194',
  size: { x: 30, y: 8, z: 30, estimated: false, note: '상품 페이지 공식 규격 Ø30 × 8 mm' },
  specs: [
    ['크기', 'Ø30 × 8 mm'],
    ['재질', 'Plastic (흰색)'],
    ['구멍', '4개 십자 (반지름 10 mm) · Ø3.2 · 5 mm 격자에 통일'],
    ['허브', '서보 축 · 육각 허브'],
  ],
  function: '서보모터 축에 끼워, 서보가 돌리는 각도대로 프레임 · 팔을 움직인다. 구멍마다 육각 테두리가 있어 너트가 돌지 않는다.',
  ports: [
    { id: 'hub', type: '서보 축 · 육각 허브', role: '서보모터 축에 고정' },
    { id: 'holes', type: 'M3 구멍 4개 (십자)', role: '프레임 · 휠 고정' },
  ],
};
