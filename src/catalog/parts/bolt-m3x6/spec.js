// 볼트 3×6
export default {
  id: 'bolt-m3x6',
  name: '볼트 3×6',
  category: 'hardware',
  productNo: 109,
  url: 'https://roboroboshop.com/product/detail.html?product_no=109&cate_no=194',
  size: { x: 5.5, y: 8, z: 5.5, estimated: true, note: '상품 페이지: 크기 M3 × 6mm · 머리 모양 치수는 사진과 표준 볼트로 추정' },
  specs: [
    ['크기', 'M3 × 6mm'],
    ['재질', 'SUS (스테인리스)'],
    ['머리', '둥근 머리 · 십자 홈'],
  ],
  function: '짧은 M3 볼트. 프레임끼리 너트와 함께 고정한다 (50개입).',
  ports: [{ id: 'thread', type: 'M3 × 6mm 수나사', role: 'M3 너트 · 지지대 체결' }],
};
