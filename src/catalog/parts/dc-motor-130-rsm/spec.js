// DC Motor 130rpm [RS/M]
export default {
  id: 'dc-motor-130-rsm',
  name: 'DC Motor 130rpm [RS/M]',
  category: 'motor',
  productNo: 494,
  url: 'https://roboroboshop.com/product/detail.html?product_no=494&cate_no=194',
  size: { x: 60, y: 36, z: 25, estimated: true, note: '상품 페이지에 크기 없음 · HT600 공식 규격 케이스 기준 추정' },
  specs: [
    ["전압", "6 V"],
    ["회전 속도", "130 rpm"],
    ["기어", "금속 기어 (메탈기어)"],
    ["연결", "2핀 커넥터 (빨강/검정)"],
  ],
  function: '로봇 구동용 130rpm 기어드 모터의 금속 기어 버전. 바퀴 탈부착이 쉽다.',
  motor: { ratedVoltage: 6, ratedRpm: 130, maxVoltage: 7.5 },
  ports: [
    { id: 'shaft', type: '출력축 (옆면)', role: '바퀴 · 부품 연결' },
    { id: 'power', type: '2핀 커넥터', role: '모터 드라이브 보드 연결' },
    { id: 'mount', type: '고정 귀 구멍 4개', role: '프레임에 나사 고정' },
  ],
};
