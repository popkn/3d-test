// AVR USB ISP 보드: 로봇(AVR CPU)에 프로그램을 내려받는 장비
export default {
  id: 'avr-usb-isp',
  name: 'AVR USB ISP 보드',
  category: 'board',
  productNo: 199,
  url: 'https://roboroboshop.com/product/detail.html?product_no=199&cate_no=194',
  size: { x: 62, y: 18, z: 19, estimated: false, note: '상품 페이지 공식 규격' },
  specs: [
    ['주요 부품', 'ATmega8, CP2102'],
    ['클럭', '7.3728 MHz'],
    ['정격 전압', '5 VDC (동작 4~5.5 V)'],
    ['프로토콜', 'Atmel STK500'],
    ['PCB', 'FR-4 1.6T 양면'],
    ['동작 온도', '-20 ~ +70 °C'],
    ['전원', 'USB 전원 사용'],
  ],
  function: 'PC와 USB로 연결하고, 6P 모듈러 케이블로 로봇 CPU에 연결해 프로그램(HEX)을 내려받는다.',
  ports: [
    { id: 'usb', type: 'USB-B', role: 'PC 연결 · 5V 전원' },
    { id: 'isp', type: '6P 모듈러 (RJ12)', role: '로봇 CPU ISP 연결' },
  ],
};
