// Buzzer 보드[S]: 프로그램으로 삑 소리를 내는 출력 모듈
export default {
  id: 'buzzer-board-s',
  name: 'Buzzer 보드[S]',
  category: 'board',
  productNo: 504,
  url: 'https://roboroboshop.com/product/detail.html?product_no=504&cate_no=194',
  size: { x: 22, y: 12, z: 32, estimated: true, note: '상품 페이지에 크기 없음 · 사진 비율과 2.54mm 핀 간격으로 추정' },
  specs: [
    ['종류', '출력 모듈 (부저)'],
    ['소리', 'Beep (단음)'],
    ['제어', 'Rogic 프로그램 On/Off 칩'],
    ['연결', '3핀 헤더 (신호 · 전원 · GND)'],
    ['고정', '구멍 3개 (1 · 2 · 3)'],
  ],
  function: 'CPU 보드 출력 포트에 연결하고, 프로그램이 신호를 보내면 소리를 낸다.',
  ports: [{ id: 'signal', type: '3핀 2.54mm', role: 'CPU 출력 포트 연결' }],
};
