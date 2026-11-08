// 경첩[3x3]: 두 프레임을 접었다 폈다 할 수 있게 잇는 스테인리스 경첩
export default {
  id: 'hinge-3x3',
  name: '경첩[3x3]',
  category: 'hardware',
  productNo: 121,
  url: 'https://roboroboshop.com/product/detail.html?product_no=121&cate_no=194',
  size: { x: 23, y: 6, z: 18, estimated: false, note: '상품 페이지 공식 규격 23(L) × 18(W) × 6(H) mm' },
  specs: [
    ['크기', '23 × 18 × 6 mm'],
    ['재질', 'SUS (스테인리스)'],
    ['구멍', '날개마다 3개 · Ø3.2 (M3) · 간격 5 mm, 축에서 5 mm (공통 격자에 맞춤)'],
    ['수량', '1개'],
  ],
  function: '양쪽 날개를 프레임에 볼트로 고정하면 가운데 축을 중심으로 접히고 펴진다. 문, 덮개, 팔 관절에 쓴다.',
  ports: [{ id: 'leaf', type: '날개 2개 × 구멍 3개', role: '프레임에 M3 볼트 고정' }],
};
