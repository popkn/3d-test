// DC Motor 130rpm 양축
export default {
  id: 'dc-motor-130-dual',
  name: 'DC Motor 130rpm 양축',
  category: 'motor',
  productNo: 90,
  url: 'https://roboroboshop.com/product/detail.html?product_no=90&cate_no=194',
  size: { x: 60, y: 46, z: 20, estimated: true, note: '상품 페이지에 크기 없음 · 같은 케이스인 HT600 공식 규격(60×40×20mm) 기준 추정 · 아래쪽 축 포함 높이' },
  specs: [
    ["전압", "6 V"],
    ["회전 속도", "130 rpm"],
    ["축", "양축 (윗면 · 아랫면 양쪽 출력)"],
    ["연결", "2핀 커넥터 (빨강/검정)"],
  ],
  function: '위아래 양쪽으로 축이 나와 부품을 양쪽에 달 수 있는 기어드 모터. CPU 보드(모터 드라이브 보드 필요)에 연결한다.',
  motor: { ratedVoltage: 6, ratedRpm: 130, maxVoltage: 7.5 },
  ports: [
    { id: 'shaft', type: '출력축 (윗면 + 아랫면)', role: '바퀴 · 부품 연결' },
    { id: 'power', type: '2핀 커넥터', role: '모터 드라이브 보드 연결' },
    { id: 'mount', type: '고정 귀 구멍 4개', role: '프레임에 나사 고정' },
  ],
};
