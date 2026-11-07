// DC Motor 400rpm [RS]
export default {
  id: 'dc-motor-400-rs',
  name: 'DC Motor 400rpm [RS]',
  category: 'motor',
  productNo: 338,
  url: 'https://roboroboshop.com/product/detail.html?product_no=338&cate_no=194',
  size: { x: 60, y: 40, z: 20, estimated: true, note: '상품 페이지에 크기 없음 · 같은 케이스인 HT600 공식 규격(60×40×20mm) 기준 추정' },
  specs: [
    ["전압", "6 V"],
    ["회전 속도", "400 rpm"],
    ["연결", "2핀 커넥터 (빨강/검정)"],
  ],
  function: '1분에 400번 회전하는 빠른 기어드 모터. 로봇과 바퀴 탈부착이 간편하다.',
  motor: { ratedVoltage: 6, ratedRpm: 400, maxVoltage: 7.5 },
  ports: [
    { id: 'shaft', type: '출력축 (윗면)', role: '바퀴 · 부품 연결' },
    { id: 'power', type: '2핀 커넥터', role: '모터 드라이브 보드 연결' },
    { id: 'mount', type: '고정 귀 구멍 4개', role: '프레임에 나사 고정' },
  ],
};
