// 프레임 4×12 [PCB]
export default {
  id: 'frame-4x12-pcb',
  name: '프레임 4×12 [PCB]',
  category: 'frame',
  productNo: 147,
  url: 'https://roboroboshop.com/product/detail.html?product_no=147&cate_no=194',
  size: { x: 118, y: 1.6, z: 38, estimated: false, note: '상품 페이지 공식 규격 118 × 38 × 1.6 mm (Frame 4 × 12). 체크리스트 이름은 5×13' },
  specs: [
    ['크기', '118 × 38 × 1.6 mm'],
    ['구멍', '4 × 12 (10mm 간격)'],
    ['재질', 'FR-4 (Epoxy) 1.6T'],
  ],
  function: '4 × 12 구멍 판. 보드를 받치거나 프레임 여러 개를 넓게 이어 붙인다. 구멍이 10mm 간격이라 모든 로보로보 부품과 맞는다.',
  ports: [{ id: 'holes', type: 'M3 구멍', role: '큰 바닥판 · 보드 받침' }],
};
