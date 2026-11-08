// 프레임 2x2 120도 [L자 · 탭]
export default {
  id: 'l-frame-120-2x2',
  name: '프레임 2x2 120도 [L자 · 탭]',
  category: 'frame',
  productNo: 119,
  url: 'https://roboroboshop.com/product/detail.html?product_no=119&cate_no=194',
  size: { x: 27.0, y: 15.6, z: 8, estimated: false, note: '상품 페이지 공식 규격 40(L) × 8(W) × 1(H) mm (펼친 길이). 구멍 4개에 M3 탭' },
  specs: [
    ['크기', '다리 18 mm + 18 mm, 폭 8 mm, 두께 1 mm'],
    ['각도', '120°'],
    ['구멍', '다리마다 2개 · 2개 (10mm 간격), M3 탭 (너트 없이 볼트만)'],
    ['재질', 'SUS (스테인리스)'],
  ],
  function: '두 판을 120°로 비스듬히 잇는다. 구멍에 M3 나사산(탭)이 있어 너트 없이 볼트만으로 고정한다.',
  ports: [{ id: 'legs', type: '다리 2개 × 구멍 2 · 2개', role: '두 프레임을 120°로 연결' }],
};
