// 프레임 2x2 [L자]
export default {
  id: 'l-frame-2x2',
  name: '프레임 2x2 [L자]',
  category: 'frame',
  productNo: 112,
  url: 'https://roboroboshop.com/product/detail.html?product_no=112&cate_no=194',
  size: { x: 18.0, y: 18.0, z: 8, estimated: false, note: '상품 페이지 공식 규격 18(L) × 18(W) × 1(H) mm (두 다리 길이)' },
  specs: [
    ['크기', '다리 18 mm + 18 mm, 폭 8 mm, 두께 1 mm'],
    ['각도', '90°'],
    ['구멍', '다리마다 2개 · 2개 (10mm 간격), Ø3.2 관통'],
    ['재질', 'SUS (스테인리스)'],
  ],
  function: '두 판을 직각으로 잇는다. 다리마다 구멍 2개라 돌아가지 않고 단단히 고정된다.',
  ports: [{ id: 'legs', type: '다리 2개 × 구멍 2 · 2개', role: '두 프레임을 90°로 연결' }],
};
