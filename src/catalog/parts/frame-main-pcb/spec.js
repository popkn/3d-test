// 프레임 Main PCB 8×12
export default {
  id: 'frame-main-pcb',
  name: '프레임 Main PCB 8×12',
  category: 'frame',
  productNo: 124,
  url: 'https://roboroboshop.com/product/detail.html?product_no=124&cate_no=194',
  size: { x: 118, y: 1.6, z: 78, estimated: false, note: '상품 페이지 공식 규격 118 × 78 × 1.6 mm (Frame 8 × 12)' },
  specs: [
    ['크기', '118 × 78 × 1.6 mm'],
    ['구멍', '117개: 10mm 격자 12 × 8 + 가운데 5mm 사이 줄 (가로 · 세로 1줄씩, 상세 이미지 기준)'],
    ['재질', 'FR-4 (Epoxy) 1.6T'],
  ],
  function: '기본 로봇의 바닥판. CPU 보드와 모터를 올려 고정한다.',
  ports: [{ id: 'holes', type: 'M3 구멍 12 × 8', role: '보드 · 프레임 · 모터 고정' }],
};
