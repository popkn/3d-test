// 축가이드: 축을 가로로 받쳐 돌게 하는 파란 베어링 블록
export default {
  id: 'axle-guide',
  name: '축가이드',
  category: 'wheel',
  productNo: 165,
  url: 'https://roboroboshop.com/product/detail.html?product_no=165&cate_no=194',
  size: { x: 28, y: 5, z: 18, estimated: false, note: '상품 페이지 공식 규격 28(L) × 18(W) × 5(H) mm (축 받침 높이는 사진으로 보완)' },
  specs: [
    ['재질', 'ABS'],
    ['크기', '28 × 18 × 5 mm'],
    ['구성', '받침판(구멍 4개) + 가로 축 구멍'],
  ],
  function: '프레임에 볼트로 고정하고 가로 구멍에 축(75mm Ø3)을 꿰면, 축이 흔들리지 않고 부드럽게 돈다.',
  ports: [
    { id: 'bore', type: '가로 축 구멍 (Ø3 축용)', role: '축 받침' },
    { id: 'holes', type: '고정 구멍 4개', role: '프레임 고정' },
  ],
};
