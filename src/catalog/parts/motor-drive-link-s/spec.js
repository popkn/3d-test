// MotorDrive 연결 Board[외장형/S]: Motor Drive Board[A3]를 꽂아 CPU 보드의 확장 모터(3·4)를 돌리는 보드
export default {
  id: 'motor-drive-link-s',
  name: 'MotorDrive 연결 Board[외장형/S]',
  category: 'board',
  productNo: 509,
  url: 'https://roboroboshop.com/product/detail.html?product_no=509&cate_no=194',
  size: { x: 50, y: 10, z: 50, estimated: true, note: '상품 페이지에 크기 없음 · 프레임 구멍 9 × 9 (A~I, 1~9), CPU 보드와 같은 간격으로 추정 · 높이는 A3 장착 전' },
  specs: [
    ['용도', 'CPU Board 8M[12V]에서 DC 모터를 최대 4개 제어'],
    ['결합', 'Motor Drive Board[A3]를 꽂아 사용'],
    ['사용 전압', '6 ~ 20 V (CPU Board 8M[12V]를 통해 공급)'],
    ['소모 전류', '최대 2 A (퓨즈)'],
    ['입력', 'EX-Motor3/4 (CPU 보드 확장 모터 포트)'],
    ['출력', 'Motor3 · Motor4'],
  ],
  function: 'CPU 보드의 EX-Motor3/4 신호를 받아, 꽂혀 있는 A3 보드로 Motor3·Motor4를 구동한다. 과전류가 흐르면 퓨즈가 끊어진다.',
  ports: [
    { id: 'ex', type: 'EX-Motor3/4 (2 × 3핀)', role: 'CPU 보드 확장 모터 포트 연결' },
    { id: 'a3', type: '6핀 소켓 × 2', role: 'Motor Drive Board[A3] 장착' },
    { id: 'motor3', type: '2 × 2핀', role: 'Motor3 연결' },
    { id: 'motor4', type: '2 × 2핀', role: 'Motor4 연결' },
    { id: 'frame', type: '프레임 구멍', role: '로보로보 프레임 고정' },
  ],
};
