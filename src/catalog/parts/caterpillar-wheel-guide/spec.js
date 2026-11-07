// 캐터필러 휠가이드 [육각]: 캐터필러 바퀴를 축에 고정하는 흰 허브
export default {
  id: 'caterpillar-wheel-guide',
  name: '캐터필러 휠가이드 [육각]',
  category: 'wheel',
  productNo: 166,
  url: 'https://roboroboshop.com/product/detail.html?product_no=166&cate_no=194',
  size: { x: 30, y: 26, z: 30, estimated: false, note: '상품 페이지 공식 규격 Ø30 × 26 mm' },
  specs: [
    ['재질', '플라스틱'],
    ['크기', 'Ø30 × 26 mm'],
    ['무게', '6 g'],
    ['주의', '150mm · 200mm 축에는 사용 불가'],
  ],
  function: '육각 구멍으로 축과 함께 돌며, 넓은 테두리가 캐터필러 궤도가 옆으로 빠지지 않게 잡아 준다. 75mm 축과 함께 쓴다.',
  ports: [{ id: 'hex', type: '육각 구멍', role: '축 연결' }],
};
