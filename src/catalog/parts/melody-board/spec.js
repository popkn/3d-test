// 멜로디 보드: 스피커로 노래를 연주하는 로보키트 전용 보드
export default {
  id: 'melody-board',
  name: '멜로디 보드',
  category: 'board',
  productNo: 340,
  url: 'https://roboroboshop.com/product/detail.html?product_no=340&cate_no=194',
  size: { x: 66, y: 12, z: 50, estimated: true, note: '상품 페이지에 크기 없음 · 프레임 구멍(12 × 9)과 사진으로 추정' },
  specs: [
    ['출력', '스피커 (멜로디)'],
    ['버튼', 'LEFT · RIGHT'],
    ['호환', 'CPU Board 8M[12V] 전용 (다른 CPU 연결 시 고장 · 오동작)'],
    ['사용법', '워크북 참조'],
  ],
  function: 'CPU 보드 신호나 LEFT/RIGHT 버튼으로 저장된 멜로디를 골라 스피커로 연주한다.',
  ports: [
    { id: 'input', type: '3핀 INPUT', role: 'CPU Board 8M[12V] 출력 포트' },
    { id: 'frame', type: '프레임 구멍', role: '로보로보 프레임 고정' },
  ],
};
