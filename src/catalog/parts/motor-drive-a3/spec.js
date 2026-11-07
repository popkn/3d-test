// Motor Drive Board[A3]: CPU 신호를 받아 DC 모터에 큰 전류를 흘려 돌리는 보드
export default {
  id: 'motor-drive-a3',
  name: 'Motor Drive Board[A3]',
  category: 'board',
  productNo: 191,
  url: 'https://roboroboshop.com/product/detail.html?product_no=191&cate_no=194',
  size: { x: 23, y: 9, z: 20, estimated: true, note: '상품 페이지에 크기 없음 · 2.54mm 핀 간격(6핀 2줄)과 사진 비율로 추정' },
  specs: [
    ['입력 전압', '6 ~ 12 V (최대 18 V)'],
    ['출력 전류', '1.8 A'],
    ['구동 모터', 'DC 모터 2개 (최대 4개)'],
    ['연결', '6핀 × 2줄 (CPU 보드 / 모터드라이브 연결 보드에 꽂음)'],
    ['호환', '12V 스쿨키트 CPU 보드 (CPU Board 8M[12V])'],
  ],
  function: 'CPU 보드는 약한 신호만 낼 수 있어서, 이 보드가 신호를 받아 배터리 전원으로 모터를 정회전·역회전·정지시킨다.',
  ports: [
    { id: 'pins', type: '6핀 × 2줄', role: 'CPU 보드 또는 모터드라이브 연결 보드에 꽂음' },
  ],
};
