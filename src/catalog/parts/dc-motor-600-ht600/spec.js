// DC Motor 600rpm [HT600]
export default {
  id: 'dc-motor-600-ht600',
  name: 'DC Motor 600rpm [HT600]',
  category: 'motor',
  productNo: 178,
  url: 'https://roboroboshop.com/product/detail.html?product_no=178&cate_no=194',
  size: { x: 60, y: 40, z: 20, estimated: false, note: '상품 페이지 공식 규격 60 × 40 × 20 mm' },
  specs: [
    ["전압", "DC 9 V (리튬폴리머 충전지 권장)"],
    ["회전 속도", "600 rpm"],
    ["기어", "엔지니어링 플라스틱 + 금속 기어 + 듀얼 베어링"],
    ["무부하 전류", "135 mA"],
    ["기동 토크", "115 g·cm"],
    ["출력 토크", "1.5 kg·cm"],
    ["회전 방향", "CW"],
  ],
  function: '감속 기어가 케이스에 내장된 고속 금속 기어 모터. 로봇 구동, 배틀로봇 대회용.',
  motor: { ratedVoltage: 9, ratedRpm: 600, maxVoltage: 11, noLoadCurrent: 135, torque: '1.5 kg·cm' },
  ports: [
    { id: 'shaft', type: '출력축 (윗면)', role: '바퀴 · 부품 연결' },
    { id: 'power', type: '2핀 커넥터', role: '모터 드라이브 보드 연결' },
    { id: 'mount', type: '고정 귀 구멍 4개', role: '프레임에 나사 고정' },
  ],
};
