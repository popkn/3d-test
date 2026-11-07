// 바퀴축[유아용]: 바퀴를 끼우는 짧은 흰색 플라스틱 축
export default {
  id: 'wheel-axle',
  name: '바퀴축[유아용]',
  category: 'wheel',
  productNo: 92,
  url: 'https://roboroboshop.com/product/detail.html?product_no=92&cate_no=194',
  size: { x: 7, y: 7, z: 20, estimated: false, note: '상품 페이지 공식 규격 Ø7 × 20 mm' },
  specs: [
    ['재질', '플라스틱'],
    ['크기', 'Ø7 × 20 mm'],
    ['색', '흰색'],
    ['끝', '한쪽 육각 (바퀴 · 모터 허브에 끼움, 사진 기준)'],
  ],
  function: '모터 허브나 바퀴 사이를 잇는 짧은 축. 모터가 돌면 같이 돌아 바퀴를 굴린다.',
  ports: [{ id: 'hex', type: '육각 끝', role: '바퀴 · 허브 연결' }],
};
