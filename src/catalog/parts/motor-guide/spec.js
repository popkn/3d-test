// 모터가이드: 축이나 모터 출력부를 프레임에 잡아 주는 작은 받침
export default {
  id: 'motor-guide',
  name: '모터가이드',
  category: 'hardware',
  productNo: 177,
  url: 'https://roboroboshop.com/product/detail.html?product_no=177&cate_no=194',
  size: { x: 20, y: 7.5, z: 11, estimated: false, note: '상품 페이지 공식 규격 20 × 11 × 7.5 mm' },
  specs: [
    ['재질', 'ABS'],
    ['크기', '20 × 11 × 7.5 mm'],
    ['구성', '원형 고리(축 받침) + 고정 구멍'],
  ],
  function: '고리에 축(바퀴축 Ø7)을 끼워 흔들리지 않게 받치고, 구멍에 볼트를 넣어 프레임에 고정한다. 서보모터에도 1개 들어 있다.',
  ports: [
    { id: 'ring', type: '원형 고리 (안지름 약 7mm, 추정)', role: '축 받침' },
    { id: 'hole', type: 'M3 구멍', role: '프레임 고정' },
  ],
};
