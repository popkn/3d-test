// 케이블 - 3Pin: 센서 · 출력 보드를 CPU 보드 포트에 잇는 3선 케이블
export default {
  id: 'cable-3pin',
  name: '케이블 - 3Pin',
  category: 'hardware',
  productNo: 169,
  url: 'https://roboroboshop.com/product/detail.html?product_no=169&cate_no=194',
  size: { x: 200, y: 3, z: 8, estimated: true, note: '상품 페이지: 길이 200mm 이내 · 커넥터 크기는 2.54mm 3핀 표준으로 추정' },
  specs: [
    ['길이', '200 mm 이내'],
    ['무게', '3 g'],
    ['커넥터', '양쪽 3핀 암 커넥터 (2.54mm)'],
    ['선', '신호 · 전원(+) · GND(-)'],
  ],
  function: '센서 보드나 LED · 부저 보드의 3핀 헤더를 CPU 보드 입력 · 출력 포트에 연결해 신호와 전원을 함께 전달한다.',
  ports: [
    { id: 'a', type: '3핀 암 커넥터', role: 'CPU 보드 포트' },
    { id: 'b', type: '3핀 암 커넥터', role: '센서 · 출력 보드 헤더' },
  ],
};
