// 타이어 - Ø80 버기: 버기 휠에 끼우는 굵은 무늬 고무 타이어
export default {
  id: 'tire-80-buggy',
  name: '타이어 - Ø80 버기',
  category: 'wheel',
  productNo: 155,
  url: 'https://roboroboshop.com/product/detail.html?product_no=155&cate_no=194',
  size: { x: 80, y: 80, z: 30, estimated: false, note: '상품 페이지 공식 규격 Ø80 × 30 mm' },
  specs: [
    ['재질', '고무'],
    ['크기', 'Ø80 × 30 mm'],
    ['함께 쓰는 부품', '휠 - Ø80 버기 · 인너 - Ø80 버기[스폰지] (별매)'],
  ],
  function: '버기 휠 바깥에 끼우고 안에 스폰지 인너를 넣어 쓰는 오프로드 타이어. 무늬가 깊어 거친 바닥에서도 잘 달린다.',
  ports: [{ id: 'rim', type: '안쪽 홈', role: '휠 - Ø80 버기' }],
};
