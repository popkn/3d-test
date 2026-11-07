// 리모콘 수신부[8key/적외선]: 송신부의 적외선 신호를 받아 버튼 번호를 출력하는 보드
export default {
  id: 'ir-remote-rx',
  name: '리모콘 수신부[8key/적외선]',
  category: 'board',
  productNo: 193,
  url: 'https://roboroboshop.com/product/detail.html?product_no=193&cate_no=194',
  size: { x: 78, y: 10, z: 48, estimated: false, note: '상품 페이지 공식 규격 78 × 48 × 10 mm' },
  specs: [
    ['수신 모듈', 'RPM7138-V4 (IR Receiver Module)'],
    ['반송파', '37.9 kHz'],
    ['소비 전류', '0.95 mA (수신 모듈)'],
    ['전원', 'DC 5V'],
    ['채널', 'DIP 스위치로 최대 16명'],
    ['출력', '누른 스위치와 1:1 출력'],
    ['PCB', 'FR-4 1.6T 양면 · 고정 구멍 ø3 16개'],
  ],
  function: '송신부가 보낸 적외선 신호를 받아, 채널(DIP)이 같으면 누른 버튼 번호에 해당하는 출력을 켠다. CPU 보드 입력으로 로봇을 조종한다.',
  ports: [
    { id: 'out', type: '출력 커넥터', role: 'CPU 보드 입력 포트 연결' },
    { id: 'frame', type: '고정 구멍 ø3 16개', role: '프레임 고정' },
  ],
};
