// 너트 프레임[소4]: 너트를 끼워 넣을 수 있는 육각 홈 4개짜리 플라스틱 프레임
export default {
  id: 'nut-frame-4',
  name: '너트 프레임[소4]',
  category: 'hardware',
  productNo: 122,
  url: 'https://roboroboshop.com/product/detail.html?product_no=122&cate_no=194',
  size: { x: 40, y: 3.5, z: 8, estimated: true, note: '상품 페이지 표기 18 × 8 × 3.5mm는 구멍 4개(10mm 간격)와 맞지 않아, 길이를 10mm × 4 = 40mm로 추정' },
  specs: [
    ['재질', '플라스틱 3.5T'],
    ['구멍', '4개, 10mm 간격 (로보로보 회로보드 · 프레임과 같은 규격)'],
    ['특징', '구멍에 너트를 넣을 수 있어 육각 드라이버 없이 조립'],
  ],
  function: '육각 홈에 M3 너트를 끼워 두면 너트가 돌지 않아, 반대편에서 볼트만 돌려 쉽게 조립할 수 있다.',
  ports: [{ id: 'holes', type: '육각 홈 4개 (10mm 간격)', role: 'M3 너트 + 볼트 고정' }],
};
