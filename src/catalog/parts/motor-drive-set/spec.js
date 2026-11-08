// 모터 드라이브 확장 세트: MotorDrive 연결 Board[외장형/S] + Motor Drive Board[A3]를 꽂은 한 덩어리
export default {
  id: 'motor-drive-set',
  name: '모터 드라이브 확장 세트 (연결 보드 + A3)',
  category: 'board',
  set: [['motor-drive-link-s', 1], ['motor-drive-a3', 1]],
  size: { x: 50, y: 17, z: 50, estimated: true, note: '연결 보드 50 × 50 (추정) 위에 A3 보드를 꽂은 높이. 고정 구멍은 Ø3.2 · 간격 5 mm' },
  specs: [
    ['구성', 'MotorDrive 연결 Board[외장형/S] 1 + Motor Drive Board[A3] 1 (꽂은 상태)'],
    ['입력', 'EX-Motor3/4 (CPU 보드 확장 모터 포트)'],
    ['출력', 'Motor3 · Motor4'],
  ],
  function: 'CPU 보드로 모터 3 · 4를 더 돌릴 때 쓰는 보드. 연결 보드는 A3 없이 쓰지 않으므로 한 부품으로 다룬다.',
  ports: [
    { id: 'ex', type: 'EX-Motor3/4', role: 'CPU 보드 확장 모터 포트' },
    { id: 'out', type: 'Motor3 · Motor4', role: 'DC 모터 연결' },
  ],
};
