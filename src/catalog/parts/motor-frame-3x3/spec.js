// 프레임 Motor Frame[3x3]: 모터 · 판을 직각으로 고정하는 좁은 스테인리스 L자 프레임
export default {
  id: 'motor-frame-3x3',
  name: '모터프레임 [3x3]',
  category: 'frame',
  productNo: 120,
  url: 'https://roboroboshop.com/product/detail.html?product_no=120&cate_no=194',
  size: { x: 28, y: 28, z: 8, estimated: true, note: '상품 페이지 표기 43 × 8 × 1mm (펼친 길이로 보임) · 다리마다 구멍 3개(10mm 간격)로 모양 추정' },
  specs: [
    ['크기 (상품 표기)', '43 × 8 × 1 mm'],
    ['재질', 'SUS (스테인리스)'],
    ['구멍', '다리마다 3개 (10mm 간격)'],
    ['수량', '2개입 (상품) · 7호 키트 21개'],
  ],
  function: 'DC 모터의 고정 귀나 다른 프레임을 직각으로 세워 고정한다. 폭이 좁아 모터 옆에 붙이기 좋다.',
  ports: [{ id: 'legs', type: '다리 2개 × 구멍 3개', role: '모터 · 프레임 직각 고정' }],
};
