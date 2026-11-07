// 볼트 2.6×10 와셔붙이
export default {
  id: 'bolt-m26x10',
  name: '볼트 2.6×10 와셔붙이',
  category: 'hardware',
  productNo: 108,
  url: 'https://roboroboshop.com/product/detail.html?product_no=108&cate_no=194',
  size: { x: 7.4, y: 12, z: 7.4, estimated: true, note: '상품 페이지: 크기 M2.6 × 10mm · 머리 모양 치수는 사진과 표준 볼트로 추정' },
  specs: [
    ['크기', 'M2.6 × 10mm'],
    ['재질', 'SUS (스테인리스)'],
    ['머리', '와셔붙이 둥근 머리 · 십자 홈'],
  ],
  function: '와셔가 붙은 태핑 볼트. 너트 없이 플라스틱에 직접 박아 고정한다.',
  ports: [{ id: 'thread', type: 'M2.6 × 10mm 수나사', role: '플라스틱 구멍에 직접 체결' }],
};
