// LED 보드[빨강/S]: 불을 켜는 출력 모듈
export default {
  id: 'led-board-red-s',
  name: 'LED 보드[빨강/S]',
  category: 'board',
  productNo: 507,
  url: 'https://roboroboshop.com/product/detail.html?product_no=507&cate_no=194',
  size: { x: 22, y: 12, z: 32, estimated: true, note: '상품 페이지에 크기 없음 · 같은 S 모듈 기판으로 추정' },
  specs: [
    ['종류', '출력 모듈 (LED)'],
    ['LED', '빨강 5mm (D1)'],
    ['저항', '전류 제한 저항 (R1)'],
    ['연결', '3핀 헤더 (J2)'],
    ['고정', '구멍 3개 (1 · 2 · 3)'],
  ],
  function: 'CPU 보드 출력 포트에 연결하고, 프로그램 신호로 빨간 LED를 켜고 끈다. PWM으로 밝기 조절.',
  ports: [{ id: 'signal', type: '3핀 2.54mm', role: 'CPU 출력 포트 연결' }],
};
