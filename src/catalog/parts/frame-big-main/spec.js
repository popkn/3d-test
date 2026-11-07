// 프레임 Big Main PCB (12 × 16): 로봇의 몸체가 되는 가장 큰 PCB 판
export default {
  id: 'frame-big-main',
  name: '프레임 Big Main PCB',
  category: 'frame',
  productNo: 77,
  url: 'https://roboroboshop.com/product/detail.html?product_no=77&cate_no=194',
  size: { x: 158, y: 1.6, z: 118, estimated: false, note: '상품 페이지 공식 규격 158 × 118 × 1.6 mm (Frame 12 × 16)' },
  specs: [
    ['크기', '158 × 118 × 1.6 mm'],
    ['구멍', '16 × 12 (10mm 간격)'],
    ['재질', 'FR-4 (Epoxy) 1.6T'],
  ],
  function: '로봇의 바닥판(차체). CPU 보드, 모터, 배터리케이스를 볼트와 서포트로 올려 고정한다.',
  ports: [{ id: 'holes', type: 'M3 구멍 16 × 12', role: '모든 보드 · 프레임 · 모터 고정' }],
};
