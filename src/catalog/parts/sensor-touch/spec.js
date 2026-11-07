// 접촉 센서 보드: 누르면 신호가 바뀌는 스위치 입력 보드
export default {
  id: 'sensor-touch',
  name: '접촉 센서 보드',
  category: 'sensor',
  productNo: 189,
  url: 'https://roboroboshop.com/product/detail.html?product_no=189&cate_no=194',
  size: { x: 48, y: 9, z: 28, estimated: false, note: '상품 페이지 공식 규격 48 × 28 × 9 mm' },
  specs: [
    ['스위치', 'THH12715 (택트 스위치)'],
    ['누르는 힘', '160 gf'],
    ['눌리는 거리', '0.25 mm'],
    ['최대 전원', '50 mA / 12 VDC'],
    ['수명', '100,000회'],
    ['버튼', '검정, 높이 7.5 mm'],
    ['회로', '풀업: 누르면 LOW(0), 안 누르면 HIGH(1)'],
    ['PCB', 'FR-4 1.6T 양면'],
  ],
  function: '버튼을 누르면 출력이 LOW(0), 떼면 HIGH(1)가 된다. CPU 보드 입력 포트에 연결하고, 유선 리모컨을 만들 때도 쓴다.',
  ports: [{ id: 'signal', type: '3핀 2.54mm', role: 'CPU 입력 포트 연결' }],
};
