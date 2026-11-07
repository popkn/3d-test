// 컬러볼 Ø15 (빨강 · 초록 · 노랑): 컬러 센서로 색을 구분하는 미션용 작은 공
export default {
  id: 'color-ball',
  name: '컬러볼 Ø15',
  category: 'hardware',
  productNo: 76,
  url: 'https://roboroboshop.com/product/detail.html?product_no=76&cate_no=194',
  size: { x: 15, y: 15, z: 15, estimated: false, note: '상품 페이지 공식 규격 Ø15 (최대 직경)' },
  specs: [
    ['크기', 'Ø15 mm'],
    ['재질', 'ABS (플라스틱)'],
    ['무게', '2 g'],
    ['색', '빨강 · 초록 · 노랑 (7호 키트: 빨강 4 · 초록 3 · 노랑 4)'],
  ],
  function: '컬러 센서 보드로 색을 읽어 공을 분류하거나 옮기는 미션에 쓴다.',
  ports: [],
};
