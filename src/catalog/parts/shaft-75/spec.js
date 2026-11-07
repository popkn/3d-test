// 축 - 75mm[Ø3]: 바퀴 · 축가이드를 꿰어 돌리는 긴 금속 축
export default {
  id: 'shaft-75',
  name: '축 - 75mm[Ø3]',
  category: 'wheel',
  productNo: 115,
  url: 'https://roboroboshop.com/product/detail.html?product_no=115&cate_no=194',
  size: { x: 75, y: 3, z: 3, estimated: false, note: '상품 페이지 공식 규격 Ø3 × 75 mm' },
  specs: [
    ['재질', 'SUS (스테인리스)'],
    ['크기', 'Ø3 × 75 mm'],
  ],
  function: '축가이드나 휠가이드 구멍에 꿰어, 양쪽 바퀴를 하나의 축으로 함께 돌리거나 회전하는 부품을 받친다.',
  ports: [{ id: 'shaft', type: 'Ø3 축', role: '축가이드 · 휠가이드 구멍' }],
};
