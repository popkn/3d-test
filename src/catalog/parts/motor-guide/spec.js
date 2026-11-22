// 서보/모터 가이드: 모터축 구멍 양옆 가이드라인 벽(내폭 8.2 mm) + 10 mm 간격 자유 구멍
export default {
  id: 'motor-guide',
  name: '모터가이드 (서보 가이드)',
  category: 'hardware',
  productNo: 177,
  url: 'https://roboroboshop.com/product/detail.html?product_no=177&cate_no=194',
  size: { x: 20, y: 9.1, z: 10.8, estimated: false, note: '실물 기준 20 × 10.8 mm · 구멍 간격 10.0 mm · 가이드라인 내폭 8.2 mm' },
  specs: [
    ['재질', 'ABS'],
    ['크기', '20 × 10.8 mm (구멍 간격 10.0 mm)'],
    ['구성', 'Hole A(모터축 + 양옆 가이드라인) + Hole B(자유 M3 구멍)'],
  ],
  function: 'Hole A에 1열 프레임을 볼트 1개로 결합하면 양옆 가이드라인에 고정되어 회전하지 않으며, Hole B에 S후크로 결합하면 가이드라인 단턱까지 양방향 ±90°(총 180°) 회전한다.',
  ports: [
    { id: 'shaft', type: '모터축 구멍 + 양옆 가이드라인 (내폭 8.2 mm)', role: '1열 프레임 단일 볼트 회전 고정' },
    { id: 'hole', type: '자유 M3 구멍 (R=10.0 mm)', role: 'S후크 ±90°(총 180°) 힌지 연결' },
  ],
  mountHoles: {
    boltAllowed: true,
    types: ['M3'],
    count: 2,
    holes: [
      [-5, 2.8, 0, 0, 1, 0, 'M3'],
      [5, 2.8, 0, 0, 1, 0, 'M3'],
    ],
    otherMounts: ['SERVO_HEX'],
  },
};
