// 로보키트 무선 통신보드 (7호 키트의 "블루투스 모듈"): 블루투스로 리모컨 · 다른 모듈과 무선 통신
export default {
  id: 'bt-module',
  name: '무선 통신보드 (블루투스 모듈)',
  category: 'board',
  productNo: 537,
  url: 'https://roboroboshop.com/product/detail.html?product_no=537&cate_no=194',
  size: { x: 48, y: 9, z: 28, estimated: true, note: '상품 페이지에 사양 없음 · 사진의 고정 구멍 배치로 추정 (센서 보드와 같은 크기)' },
  specs: [
    ['통신', '블루투스 (무선)'],
    ['연결', 'UART 4핀 (CPU 보드) · 2핀 전원'],
    ['안테나', '기판 안테나 (ANTENNA 표시)'],
    ['짝 맺기', '블루투스 와이어리스 보드2로 페어링'],
  ],
  function: '로봇의 CPU 보드에 UART로 연결해 블루투스 컨트롤러나 다른 모듈의 명령을 무선으로 받는다. 처음 한 번 와이어리스 보드2로 짝(페어링)을 맺는다.',
  ports: [
    { id: 'uart', type: 'UART 4핀', role: 'CPU 보드 연결' },
    { id: 'power', type: '2핀 전원', role: '전원' },
  ],
};
