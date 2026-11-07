// 블루투스 와이어리스 보드2 (송수신용): 블루투스 모듈끼리 짝(페어링)을 맺어 주는 파란 보드
export default {
  id: 'bt-wireless-board2',
  name: '블루투스 와이어리스 보드2',
  category: 'board',
  productNo: 185,
  url: 'https://roboroboshop.com/product/detail.html?product_no=185&cate_no=194',
  size: { x: 62, y: 16, z: 43, estimated: false, note: '상품 페이지 공식 규격 62 × 43 × 16 mm (덮개 포함, 미포함 13mm)' },
  specs: [
    ['주요 부품', 'CP2102'],
    ['정격 전압', '5 VDC (USB 전원)'],
    ['PCB', 'FR-4 1.6T 양면'],
    ['무게', '20 g (후면 덮개 포함), 16 g (덮개 없음)'],
    ['필요', 'USB A/B 케이블'],
  ],
  function: '블루투스 모듈 2개(또는 모듈과 블루투스 송수신기[8KEY])를 꽂고 PC와 USB로 연결해 서로 짝을 맺어 준다.',
  ports: [
    { id: 'usb', type: 'USB-B', role: 'PC 연결 · 5V 전원' },
    { id: 'bt1', type: 'BLUETOOTH_1 소켓', role: '블루투스 모듈 1' },
    { id: 'bt2', type: 'BLUETOOTH_2 소켓', role: '블루투스 모듈 2' },
  ],
};
