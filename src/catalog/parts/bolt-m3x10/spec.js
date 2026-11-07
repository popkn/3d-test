// 볼트 M3×10
export default {
  id: 'bolt-m3x10',
  name: '볼트 M3×10',
  category: 'hardware',
  productNo: 107,
  url: 'https://roboroboshop.com/product/detail.html?product_no=107&cate_no=194',
  size: { x: 5.5, y: 12, z: 5.5, estimated: true, note: '상품 페이지: 크기 M3 × 10mm · 머리 모양 치수는 사진과 표준 볼트로 추정' },
  specs: [
    ['크기', 'M3 × 10mm'],
    ['재질', 'SUS (스테인리스)'],
    ['머리', '둥근 머리 · 십자 홈'],
  ],
  function: '긴 M3 볼트. 두꺼운 부품이나 지지대를 고정한다.',
  ports: [{ id: 'thread', type: 'M3 × 10mm 수나사', role: 'M3 너트 · 지지대 체결' }],
};
