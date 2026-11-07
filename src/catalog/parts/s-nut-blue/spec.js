// 너트 S[Blue]: 파란색 M3 플라스틱 캡너트 (S후크와 함께 쓰는 S너트)
export default {
  id: 's-nut-blue',
  name: '너트 S[Blue]',
  category: 'hardware',
  productNo: 106,
  url: 'https://roboroboshop.com/product/detail.html?product_no=106&cate_no=194',
  size: { x: 6.4, y: 6, z: 5.5, estimated: true, note: '상품 페이지: 크기 M3 · 모양 치수는 사진으로 추정 (회색 캡너트와 같은 모양)' },
  specs: [
    ['크기', 'M3'],
    ['재질', 'ABS (플라스틱)'],
    ['색', '파랑'],
    ['수량', '100개입 (상품명)'],
  ],
  function: 'S후크 끝이나 볼트 끝에 돌려 끼워 고정하고 나사 끝을 덮는다.',
  ports: [{ id: 'thread', type: 'M3 암나사 (막힌 구멍)', role: 'S후크 · M3 볼트 끝' }],
};
