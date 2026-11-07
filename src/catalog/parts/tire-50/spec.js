// 타이어 - Ø50[V2]: 휠 Ø50[V2]에 끼우는 검은 실리콘 타이어
export default {
  id: 'tire-50',
  name: '타이어 - Ø50[V2]',
  category: 'wheel',
  productNo: 85,
  url: 'https://roboroboshop.com/product/detail.html?product_no=85&cate_no=194',
  size: { x: 50, y: 50, z: 8.5, estimated: false, note: '상품 페이지 공식 규격 Ø50 × 8.5 mm' },
  specs: [
    ['재질', '실리콘'],
    ['크기', 'Ø50 × 8.5 mm'],
    ['무게', '5 g'],
    ['짝', '휠 - Ø50[V2] (흰색, Ø50 × 14mm)'],
  ],
  function: '휠 Ø50[V2] 바깥에 끼워 바닥을 붙잡는 고무 테두리. 7호 키트의 "바퀴"는 이 타이어와 흰 휠을 합친 것으로 보인다.',
  ports: [{ id: 'rim', type: '안쪽 홈', role: '휠 Ø50[V2] 테두리' }],
};
