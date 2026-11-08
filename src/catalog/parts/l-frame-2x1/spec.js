// 프레임 2x1 [L자]
export default {
  id: 'l-frame-2x1',
  name: '프레임 2x1 [L자]',
  category: 'frame',
  productNo: 111,
  url: 'https://roboroboshop.com/product/detail.html?product_no=111&cate_no=194',
  size: { x: 18.0, y: 8.0, z: 8, estimated: false, note: '상품 페이지 공식 규격 18(L) × 8(W) × 1(H) mm' },
  specs: [
    ['크기', '다리 18 mm + 8 mm, 폭 8 mm, 두께 1 mm'],
    ['각도', '90°'],
    ['구멍', '다리마다 2개 · 1개 (10mm 간격), Ø3.2 관통'],
    ['재질', 'SUS (스테인리스)'],
  ],
  function: '작은 판을 직각으로 세울 때 쓰는 가장 작은 L 브래킷. 긴 다리 2구멍, 짧은 다리 1구멍.',
  ports: [{ id: 'legs', type: '다리 2개 × 구멍 2 · 1개', role: '두 프레임을 90°로 연결' }],
};
