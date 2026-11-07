// LED Dot Matrix Board: 삼색 LED 도트로 그림과 글자를 표시한다
export default {
  id: 'led-dot-matrix',
  name: 'LED Dot Matrix Board',
  category: 'board',
  productNo: 80,
  url: 'https://roboroboshop.com/product/detail.html?product_no=80&cate_no=194',
  size: { x: 83, y: 12, z: 50, estimated: true, note: '상품 페이지에 사양 없음 · 프레임 구멍(15 × 9) 간격과 사진으로 추정' },
  specs: [
    ['종류', '출력 모듈 (표시 장치)'],
    ['LED', '삼색 (빨강 · 초록 · 주황) 도트 매트릭스'],
    ['도트 수', '16 × 8 (8×8 두 개, 추정)'],
    ['덮개', '흰색 확산판'],
    ['기판', '로보로보 프레임 구멍 (1~15, A~I)'],
  ],
  function: '도트 하나하나를 켜서 그림, 글자, 색을 표시한다. 빨강과 초록을 같이 켜면 주황이 된다.',
  ports: [
    { id: 'signal', type: '신호 커넥터', role: 'CPU 보드 연결' },
    { id: 'frame', type: '프레임 구멍', role: '로보로보 프레임 고정' },
  ],
};
