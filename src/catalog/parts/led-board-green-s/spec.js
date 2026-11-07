// LED 보드[초록/S]: 불을 켜는 출력 모듈 (초록 LED)
export default {
  id: 'led-board-green-s',
  name: 'LED 보드[초록/S]',
  category: 'board',
  productNo: 505,
  url: 'https://roboroboshop.com/product/detail.html?product_no=505&cate_no=194',
  size: { x: 22, y: 12, z: 32, estimated: true, note: '상품 페이지에 크기 없음 · S 모듈 기판(사진 비율과 2.54mm 핀 간격)으로 추정' },
  specs: [
    ['종류', '출력 모듈 (LED)'],
    ['LED', '초록 5mm (D1)'],
    ['저항', '전류 제한 저항 (R1)'],
    ['연결', '3핀 헤더 (J2)'],
    ['고정', '구멍 3개 (1 · 2 · 3)'],
  ],
  function: 'CPU 보드 출력 포트에 연결하고, 프로그램 신호로 초록 LED를 켜고 끈다. PWM으로 밝기 조절.',
  ports: [{ id: 'signal', type: '3핀 2.54mm', role: 'CPU 출력 포트 연결' }],
};
