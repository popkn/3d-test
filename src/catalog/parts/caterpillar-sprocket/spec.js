// 캐터필러 휠 [톱니 휠가이드 일체형]: 캐터필러 마디를 걸어 돌리는 흰 톱니 휠
export default {
  id: 'caterpillar-sprocket',
  name: '캐터필러 휠 (톱니)',
  category: 'wheel',
  productNo: 163,
  url: 'https://roboroboshop.com/product/detail.html?product_no=163&cate_no=194',
  size: { x: 60, y: 60, z: 10, estimated: false, note: '상품 페이지 공식 규격 Ø60 × 10 mm' },
  specs: [
    ['재질', '플라스틱'],
    ['크기', 'Ø60 × 10 mm'],
    ['구성', '톱니 휠 + 휠가이드 일체형'],
  ],
  function: '모터 축에 달고 톱니에 캐터필러 마디를 걸면, 휠이 돌 때 궤도가 함께 움직인다.',
  ports: [{ id: 'hub', type: '가운데 구멍 + 고정 구멍 6개', role: '모터 축 · 휠가이드 연결' }],
};
