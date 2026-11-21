// 프레임 소8 [PCB]
export default {
  id: 'frame-s8-pcb',
  name: '프레임 소8 [PCB]',
  category: 'frame',
  productNo: 129,
  url: 'https://roboroboshop.com/product/detail.html?product_no=129&cate_no=194',
  size: { x: 78, y: 1.6, z: 8, estimated: false, note: '상품 페이지 공식 규격 78 × 8 × 1.6 mm' },
  specs: [
    ['크기', '78 × 8 × 1.6 mm'],
    ['구멍', '8개 (10mm 간격)'],
    ['재질', 'FR-4 (Epoxy) 1.6T'],
  ],
  function: '프레임과 프레임, 보드와 모터를 이어 붙이는 막대. 구멍이 10mm 간격이라 모든 로보로보 부품과 맞는다.',
  ports: [{ id: 'holes', type: 'M3 구멍', role: '프레임 · 보드 연결' }],
  mountHoles: {"boltAllowed": true, "types": ["M3"], "count": 8, "holes": [[-35, 1.6, 0, 0, 1, 0, "M3"], [-25, 1.6, 0, 0, 1, 0, "M3"], [-15, 1.6, 0, 0, 1, 0, "M3"], [-5, 1.6, 0, 0, 1, 0, "M3"], [5, 1.6, 0, 0, 1, 0, "M3"], [15, 1.6, 0, 0, 1, 0, "M3"], [25, 1.6, 0, 0, 1, 0, "M3"], [35, 1.6, 0, 0, 1, 0, "M3"]], "otherMounts": []},
};
