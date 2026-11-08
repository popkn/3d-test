// 프레임 2x6 [L자]
export default {
  id: 'l-frame-2x6',
  name: '프레임 2x6 [L자]',
  category: 'frame',
  productNo: 113,
  url: 'https://roboroboshop.com/product/detail.html?product_no=113&cate_no=194',
  size: { x: 18.0, y: 58.0, z: 8, estimated: false, note: '상품 페이지 공식 규격 80(L) × 8(W) × 1(H) mm (펼친 길이)' },
  specs: [
    ['크기', '다리 18 mm + 58 mm, 폭 8 mm, 두께 1 mm'],
    ['각도', '90°'],
    ['구멍', '다리마다 2개 · 6개 (10mm 간격), Ø3.2 관통'],
    ['재질', 'SUS (스테인리스)'],
  ],
  function: '긴 다리(6구멍)로 높은 기둥이나 팔을 세운다.',
  ports: [{ id: 'legs', type: '다리 2개 × 구멍 2 · 6개', role: '두 프레임을 90°로 연결' }],
};
