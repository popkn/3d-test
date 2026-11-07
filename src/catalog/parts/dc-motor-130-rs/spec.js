// DC Motor 130rpm [RS]
export default {
  id: 'dc-motor-130-rs',
  name: 'DC Motor 130rpm [RS]',
  category: 'motor',
  productNo: 355,
  url: 'https://roboroboshop.com/product/detail.html?product_no=355&cate_no=194',
  size: { x: 60, y: 36, z: 25, estimated: true, note: '상품 페이지에 크기 없음 · HT600 공식 규격 케이스 기준 추정' },
  specs: [
    ["전압", "6 V"],
    ["회전 속도", "130 rpm"],
    ["연결", "2핀 커넥터 (빨강/검정)"],
  ],
  function: '로봇의 구동이나 회전운동에 쓰는 기어드 모터. 1분에 130번 회전.',
  motor: { ratedVoltage: 6, ratedRpm: 130, maxVoltage: 7.5 },
  ports: [
    { id: 'shaft', type: '출력축 (옆면)', role: '바퀴 · 부품 연결' },
    { id: 'power', type: '2핀 커넥터', role: '모터 드라이브 보드 연결' },
    { id: 'mount', type: '고정 귀 구멍 4개', role: '프레임에 나사 고정' },
  ],
};
