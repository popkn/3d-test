// 프레임 5×13 [PCB]
export default {
  id: 'frame-5x13-pcb',
  name: '프레임 5×13 [PCB]',
  category: 'frame',
  productNo: 147,
  url: 'https://roboroboshop.com/product/detail.html?product_no=147&cate_no=194',
  size: { x: 118, y: 1.6, z: 38, estimated: false, note: '상품 페이지 공식 규격 118 × 38 × 1.6 mm. 구멍 배치는 제품 사진 (열 1~13 · 행 A~E). 상품 이미지의 4 × 12 표기는 잘못된 것 (사용자 확인)' },
  specs: [
    ['크기', '118 × 38 × 1.6 mm'],
    ['구멍', '5 × 13 = 65개 (10mm 간격, 가운데 열 6~8 · 행 B~D는 5mm 간격)'],
    ['재질', 'FR-4 (Epoxy) 1.6T'],
  ],
  function: '5 × 13 구멍 판. 가운데 5mm 간격 구멍으로 위치를 반 칸씩 맞출 수 있다. 보드를 받치거나 프레임 여러 개를 넓게 이어 붙인다. 구멍이 10mm 간격이라 모든 로보로보 부품과 맞는다.',
  ports: [{ id: 'holes', type: 'M3 구멍', role: '큰 바닥판 · 보드 받침' }],
};
