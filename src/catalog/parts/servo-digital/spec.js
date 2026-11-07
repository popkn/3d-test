// Servo Motor[Digital]: 원하는 각도로 돌아가 멈추는 서보 모터 (로봇 관절 · 조향)
export default {
  id: 'servo-digital',
  name: 'Servo Motor[Digital]',
  category: 'motor',
  productNo: 255,
  url: 'https://roboroboshop.com/product/detail.html?product_no=255&cate_no=194',
  size: { x: 60, y: 40, z: 20, estimated: true, note: '상품 페이지에 크기 없음 · 같은 케이스(DC 모터, 60×40×20mm) 기준 추정' },
  specs: [
    ['전압', '6 V (초과 시 고장 원인)'],
    ['속도', '60 rpm'],
    ['토크', '4 kg·cm'],
    ['최대 전류', '1.2 A'],
    ['포함', '모터가이드 1개'],
    ['권장 전원', '알카라인 건전지'],
  ],
  function: '감속 기어가 들어 있는 서보 모터. 신호로 정한 각도까지 돌아가 그 자리를 유지한다. 로봇 관절이나 조향 장치에 쓴다.',
  ports: [
    { id: 'horn', type: '출력축 (윗면, 흰 허브)', role: '관절 · 조향 연결' },
    { id: 'signal', type: '3선 케이블 (신호 · + · -)', role: 'CPU 출력 포트 연결' },
    { id: 'mount', type: '고정 귀 구멍 4개', role: '모터가이드로 프레임 고정' },
  ],
};
