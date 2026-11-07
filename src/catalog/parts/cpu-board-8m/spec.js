// CPU Board 8M[12V/S]: 로봇 코딩 제어 보드 (로봇의 두뇌)
export default {
  id: 'cpu-board-8m',
  name: 'CPU Board 8M[12V/S]',
  category: 'board',
  productNo: 502,
  url: 'https://roboroboshop.com/product/detail.html?product_no=502&cate_no=194',
  size: { x: 83, y: 14, z: 61, estimated: true, note: '상품 페이지에 크기 없음 · 프레임 구멍(15 × 11)과 USB 소켓 크기 비율로 추정' },
  specs: [
    ['CPU', 'ATmega8A'],
    ['사용 전압', '6 ~ 20 V (권장 6V 또는 12V, 스위치 선택)'],
    ['소모 전류', '0.03 A (모터 미구동 시)'],
    ['입력 포트', '7개 (접촉 스위치 · 적외선 · 소리 센서)'],
    ['출력 포트', '5개 (DC 모터 · 서보 · LED · 부저)'],
    ['모터 커넥터', '2개 (+ 확장 EX-Motor 3·4)'],
    ['프로그램', 'Rogic (USB) · C언어 (ISP 보드)'],
    ['기타', '적외선 리모컨 입력 (8키 조합)'],
  ],
  function: '입력 포트의 센서 값을 읽고 프로그램대로 출력 포트의 모터·LED·부저를 제어한다. 모터 구동에는 Motor Drive Board[A3] (별매)가 필요.',
  ports: [
    { id: 'in', type: '3핀 × 7 (IN1~7)', role: '센서 입력' },
    { id: 'out', type: '3핀 × 5 (OUT1~5)', role: '모터 · 서보 · LED · 부저 출력' },
    { id: 'usb', type: 'USB-B', role: 'Rogic 프로그램 다운로드' },
    { id: 'isp', type: 'ISP 6핀', role: 'C언어 프로그램 다운로드 (ISP 보드)' },
    { id: 'battery', type: '배터리 커넥터 2개', role: '6V / 12V 전원' },
    { id: 'frame', type: '프레임 구멍', role: '로보로보 프레임 고정' },
  ],
};
