// 프레임 - 6x6[L자]: 판과 판을 직각으로 잇는 스테인리스 L 브래킷
export default {
  id: 'l-frame-6x6',
  name: '프레임 - 6x6[L자]',
  category: 'frame',
  productNo: 123,
  url: 'https://roboroboshop.com/product/detail.html?product_no=123&cate_no=194',
  size: { x: 18, y: 18, z: 18, estimated: false, note: '상품 페이지 공식 규격 18(L) × 18(W) × 1(H) mm (다리 하나 기준)' },
  specs: [
    ['크기', '다리 18 × 18 mm, 두께 1 mm'],
    ['구멍', '다리마다 2 × 2 (10mm 간격)'],
    ['재질', 'SUS (스테인리스)'],
  ],
  function: '바닥판에 세로 판을 직각으로 세워 고정한다. 구멍이 2 × 2라 흔들리지 않게 단단히 잡는다.',
  ports: [{ id: 'legs', type: '다리 2개 × 구멍 4개', role: '두 프레임을 직각으로 연결' }],
};
