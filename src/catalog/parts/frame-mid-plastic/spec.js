// 프레임 중 [플라스틱]
export default {
  id: 'frame-mid-plastic',
  name: '프레임 중 [플라스틱]',
  category: 'frame',
  productNo: 138,
  url: 'https://roboroboshop.com/product/detail.html?product_no=138&cate_no=194',
  size: { x: 90, y: 1.6, z: 40, estimated: true, note: '상품명 4 × 9 + 사진으로 추정 (플라스틱 규칙: 구멍 수 × 10 mm). 가운데 큰 구멍 Ø6' },
  specs: [
    ['크기', '90 × 40 × 1.6 mm'],
    ['구멍', '4 × 9 (10mm 간격)'],
    ['재질', 'Plastic 1.6T'],
  ],
  function: '4 × 9 구멍 판. 보드를 받치거나 프레임 여러 개를 넓게 이어 붙인다. 구멍이 10mm 간격이라 모든 로보로보 부품과 맞는다.',
  ports: [{ id: 'holes', type: 'M3 구멍', role: '프레임 · 보드 연결' }],
};
