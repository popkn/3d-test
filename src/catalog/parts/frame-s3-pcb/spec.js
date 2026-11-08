// 프레임 소3 [PCB]
export default {
  id: 'frame-s3-pcb',
  name: '프레임 소3 [PCB]',
  category: 'frame',
  productNo: 126,
  url: 'https://roboroboshop.com/product/detail.html?product_no=126&cate_no=194',
  size: { x: 28, y: 1.6, z: 8, estimated: false, note: '상품 페이지 공식 규격 27.8 × 7.9 × 1.6 mm' },
  specs: [
    ['크기', '28 × 8 × 1.6 mm'],
    ['구멍', '3개 (10mm 간격)'],
    ['재질', 'FR-4 (Epoxy) 1.6T'],
  ],
  function: '프레임과 프레임, 보드와 모터를 이어 붙이는 막대. 구멍이 10mm 간격이라 모든 로보로보 부품과 맞는다.',
  ports: [{ id: 'holes', type: 'M3 구멍', role: '프레임 · 보드 연결' }],
};
