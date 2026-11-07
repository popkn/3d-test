// 인너 - Ø80 버기[스폰지]
export default {
  id: 'inner-80-buggy',
  name: '인너 - Ø80 버기[스폰지]',
  category: 'wheel',
  productNo: 168,
  url: 'https://roboroboshop.com/product/detail.html?product_no=168&cate_no=194',
  size: { x: 200, y: 10, z: 10, estimated: false, note: '상품 페이지 공식 규격 200 × 10 × 10 mm (펼친 상태)' },
  specs: [
    ['재질', '스폰지'],
    ['크기', '200 × 10 × 10 mm'],
    ['감았을 때', '지름 약 64 mm 고리'],
    ['짝', '버기 휠 · Ø80 버기 타이어 (별매)'],
  ],
  function: '휠 - Ø80 버기와 타이어 - Ø80 버기 사이에 넣는 스폰지 띠. 휠 가운데 홈에 감아 붙이면 타이어가 찌그러지지 않고 모양을 유지한다.',
  ports: [{ id: 'ring', type: '스폰지 고리', role: '버기 휠 홈 ↔ Ø80 버기 타이어 안쪽' }],
};
