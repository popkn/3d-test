// 컬러 센서 보드: 물체의 색(빨강 · 초록 · 파랑 성분)을 읽는 로보키트 전용 센서
export default {
  id: 'sensor-color',
  name: '컬러 센서 보드',
  category: 'sensor',
  productNo: 339,
  url: 'https://roboroboshop.com/product/detail.html?product_no=339&cate_no=194',
  size: { x: 50, y: 10, z: 50, estimated: true, note: '상품 페이지에 크기 없음 · 프레임 구멍(A~I, 1~9)과 같은 간격으로 추정' },
  specs: [
    ['종류', '컬러 센서 (로보키트 전용)'],
    ['측정', '빨강 · 초록 · 파랑 성분'],
    ['조명', '흰색 LED (가운데 창)'],
    ['주의', '로두이노 보드에서 동작시키면 고장 원인'],
  ],
  function: '흰 LED로 물체를 비추고 반사된 빛의 빨강·초록·파랑 양을 재서 색을 알아낸다. 컬러볼 분류 등에 쓴다.',
  ports: [
    { id: 'signal', type: '신호 커넥터', role: 'CPU 보드 연결' },
    { id: 'frame', type: '프레임 구멍', role: '로보로보 프레임 고정' },
  ],
};
