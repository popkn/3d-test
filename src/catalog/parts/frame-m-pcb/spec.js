// 프레임 ㅁ자 [PCB]
export default {
  id: 'frame-m-pcb',
  name: '프레임 ㅁ자 [PCB]',
  category: 'frame',
  productNo: 140,
  url: 'https://roboroboshop.com/product/detail.html?product_no=140&cate_no=194',
  size: { x: 78, y: 1.6, z: 38, estimated: false, note: '상품 페이지 공식 규격 78 × 38 × 1.6 mm (Frame 4 × 8)' },
  specs: [
    ['크기', '78 × 38 × 1.6 mm'],
    ['구멍', '가장자리 8 × 4 (가운데 창) (10mm 간격)'],
    ['재질', 'FR-4 (Epoxy) 1.6T'],
  ],
  function: '가운데가 뚫린 네모 틀. 보드를 받치거나 로봇 몸체 뼈대로 쓰고, 가운데 창으로 선을 지나가게 한다.',
  ports: [{ id: 'holes', type: 'M3 구멍', role: '프레임 · 보드 연결' }],
};
