// M3 너트: 볼트와 함께 프레임을 고정하는 육각 너트
export default {
  id: 'nut-m3',
  name: 'M3 너트',
  category: 'hardware',
  productNo: 105,
  url: 'https://roboroboshop.com/product/detail.html?product_no=105&cate_no=194',
  size: { x: 6.4, y: 2.4, z: 5.5, estimated: true, note: '상품 페이지: 크기 M3 · 모양 치수는 M3 표준 너트(맞변 5.5mm, 두께 2.4mm)' },
  specs: [
    ['크기', 'M3'],
    ['재질', 'SUS (스테인리스)'],
    ['나사 간격', '0.5 mm (M3 표준)'],
    ['수량', '50개입'],
  ],
  function: '볼트에 끼워 돌려 조이면 프레임과 부품을 고정한다. 한 바퀴 돌릴 때마다 0.5mm씩 이동한다.',
  ports: [{ id: 'thread', type: 'M3 암나사', role: 'M3 볼트 체결' }],
};
