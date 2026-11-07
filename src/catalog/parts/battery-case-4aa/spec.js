// AA 배터리케이스 1x4 업그레이드형: AA 건전지 4개를 직렬로 넣어 6V를 만든다
export default {
  id: 'battery-case-4aa',
  name: 'AA 배터리케이스 1x4',
  category: 'power',
  productNo: 69,
  url: 'https://roboroboshop.com/product/detail.html?product_no=69&cate_no=194',
  size: { x: 74, y: 18, z: 62, estimated: true, note: '상품 페이지에 크기 없음 · AA 건전지 4개(14.5 × 50mm) 배치와 사진으로 추정' },
  specs: [
    ['전압', '6 V (1.5 V × 4)'],
    ['건전지', 'AA 4개'],
    ['케이블', '24 AWG (빨강 + / 검정 -)'],
    ['연결', '2핀 커넥터'],
  ],
  function: 'AA 건전지 4개를 직렬로 연결해 6V 전원을 만든다. CPU 보드 배터리 커넥터에 꽂아 로봇에 전원을 공급한다.',
  ports: [
    { id: 'power', type: '2핀 커넥터 (24AWG)', role: 'CPU 보드 배터리 커넥터' },
    { id: 'mount', type: '고정 귀 구멍', role: '프레임 고정' },
  ],
};
