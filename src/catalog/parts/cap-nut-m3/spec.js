// 캡너트 3Ø 회색 (플라스틱): 볼트 끝을 덮어 마무리하는 둥근 머리 너트
export default {
  id: 'cap-nut-m3',
  name: '캡너트 3Ø 회색',
  category: 'hardware',
  productNo: 480,
  url: 'https://roboroboshop.com/product/detail.html?product_no=480&cate_no=194',
  size: { x: 6.4, y: 6, z: 5.5, estimated: true, note: '상품 페이지: 크기 M3 · 모양 치수는 사진으로 추정' },
  specs: [
    ['크기', 'M3'],
    ['재질', 'ABS (플라스틱)'],
    ['색', '회색'],
    ['수량', '1개'],
  ],
  function: '볼트 끝에 돌려 끼우면 날카로운 나사 끝을 덮어 안전하고 깔끔하게 마무리한다.',
  ports: [{ id: 'thread', type: 'M3 암나사 (막힌 구멍)', role: 'M3 볼트 끝' }],
};
