// 프레임 Half PCB 6×8
export default {
  id: 'frame-half-pcb',
  name: '프레임 Half PCB 6×8',
  category: 'frame',
  productNo: 148,
  url: 'https://roboroboshop.com/product/detail.html?product_no=148&cate_no=194',
  size: { x: 58, y: 1.6, z: 78, estimated: false, note: '상품 페이지 공식 규격 58 × 78 × 1.6 mm' },
  specs: [
    ['크기', '58 × 78 × 1.6 mm'],
    ['구멍', '63개: 10mm 격자 6 × 8 + 가운데 5mm 사이 줄 (가로 · 세로 1줄씩, 상세 이미지 기준)'],
    ['재질', 'FR-4 (Epoxy) 1.6T'],
  ],
  function: '메인 프레임의 절반 크기 판. 작은 로봇의 바닥판이나 옆판으로 쓴다.',
  ports: [{ id: 'holes', type: 'M3 구멍 6 × 8', role: '보드 · 프레임 · 모터 고정' }],
};
