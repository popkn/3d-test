// 프레임 중6 [PCB]
export default {
  id: 'frame-m6-pcb',
  name: '프레임 중6 [PCB]',
  category: 'frame',
  productNo: 141,
  url: 'https://roboroboshop.com/product/detail.html?product_no=141&cate_no=194',
  size: { x: 58, y: 1.6, z: 18, estimated: false, note: '상품 페이지 공식 규격 58 × 18 × 1.6 mm (Frame 2 × 6)' },
  specs: [
    ['크기', '58 × 18 × 1.6 mm'],
    ['구멍', '21개 (7 × 3, 가운데 줄 · 열 5mm) · 상세 이미지 기준'],
    ['재질', 'FR-4 (Epoxy) 1.6T'],
  ],
  function: '2 × 6 구멍 판. 보드를 받치거나 프레임 여러 개를 넓게 이어 붙인다. 구멍이 10mm 간격이라 모든 로보로보 부품과 맞는다.',
  ports: [{ id: 'holes', type: 'M3 구멍', role: '프레임 · 보드 연결' }],
};
