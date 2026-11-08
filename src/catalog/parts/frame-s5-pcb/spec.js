// 프레임 소5 [PCB]
export default {
  id: 'frame-s5-pcb',
  name: '프레임 소5 [PCB]',
  category: 'frame',
  productNo: 128,
  url: 'https://roboroboshop.com/product/detail.html?product_no=128&cate_no=194',
  size: { x: 48, y: 1.6, z: 8, estimated: true, note: '(구멍 수 - 1) × 10 + 8 규칙으로 계산 (소3 · 소7 · 소8 공식 규격과 같은 규칙)' },
  specs: [
    ['크기', '48 × 8 × 1.6 mm'],
    ['구멍', '5개 (10mm 간격)'],
    ['재질', 'FR-4 (Epoxy) 1.6T'],
  ],
  function: '프레임과 프레임, 보드와 모터를 이어 붙이는 막대. 구멍이 10mm 간격이라 모든 로보로보 부품과 맞는다.',
  ports: [{ id: 'holes', type: 'M3 구멍', role: '프레임 · 보드 연결' }],
};
