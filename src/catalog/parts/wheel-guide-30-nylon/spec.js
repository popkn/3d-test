// 휠가이드[Ø30/나일론/검정]
export default {
  id: 'wheel-guide-30-nylon',
  name: '휠가이드[Ø30/나일론/검정]',
  category: 'wheel',
  productNo: 87,
  url: 'https://roboroboshop.com/product/detail.html?product_no=87&cate_no=194',
  size: { x: 30, y: 8, z: 30, estimated: false, note: '상품 페이지 공식 규격 Ø30 × 8 mm · 2 g (상품명은 나일론, 상세 페이지 재질은 ABS)' },
  specs: [
    ['크기', 'Ø30 × 8 mm'],
    ['재질', 'ABS (검정)'],
    ['구멍', '4개 십자 (반지름 10 mm) · Ø3.2 · 5 mm 격자에 통일'],
    ['허브', 'D컷 축 구멍'],
    ['무게', '2 g'],
  ],
  function: 'DC 모터의 D컷 축에 끼워 헛돌지 않게 돌린다. 휠 · 프레임을 구멍 4개(십자)에 볼트로 붙인다.',
  ports: [
    { id: 'hub', type: 'D컷 축 구멍', role: 'DC 모터 축에 고정' },
    { id: 'holes', type: 'M3 구멍 4개 (십자)', role: '프레임 · 휠 고정' },
  ],
};
