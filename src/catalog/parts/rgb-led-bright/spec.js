// RGB LED 보드[고휘도]: 빨강·초록·파랑을 섞어 여러 색을 내는 밝은 LED (흰 확산 덮개)
export default {
  id: 'rgb-led-bright',
  name: 'RGB LED 보드[고휘도]',
  category: 'board',
  productNo: 72,
  url: 'https://roboroboshop.com/product/detail.html?product_no=72&cate_no=194',
  size: { x: 24, y: 20, z: 18, estimated: true, note: '상품 페이지에 사양 없음 · 사진으로 추정 (흰 확산 덮개 + 고정 클립)' },
  specs: [
    ['종류', '출력 모듈 (RGB LED)'],
    ['색', '빨강 · 초록 · 파랑 혼합 (고휘도)'],
    ['덮개', '흰색 원통 확산 덮개'],
    ['고정', '아래쪽 클립'],
  ],
  function: '빨강·초록·파랑 세 빛의 밝기를 섞어 원하는 색을 만든다. 흰 덮개가 빛을 고르게 퍼뜨린다.',
  ports: [{ id: 'signal', type: '신호 커넥터', role: 'CPU 출력 포트 연결' }],
};
