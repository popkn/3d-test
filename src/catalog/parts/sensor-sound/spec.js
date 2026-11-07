// 소리 감지 센서: 주위 소리가 설정값보다 크면 반응한다
export default {
  id: 'sensor-sound',
  name: '소리 감지 센서',
  category: 'sensor',
  productNo: 183,
  url: 'https://roboroboshop.com/product/detail.html?product_no=183&cate_no=194',
  size: { x: 48, y: 9, z: 28, estimated: false, note: '상품 페이지 공식 규격 48 × 28 × 9 mm' },
  specs: [
    ['감지', '콘덴서 MIC'],
    ['감도 조절', '가변저항'],
    ['표시', '감지하면 LED 켜짐'],
    ['출력', 'ACTIVE LOW (감지 시 LOW)'],
    ['전원', 'DC 5V'],
    ['PCB', 'FR-4 1.6T 양면'],
    ['고정 구멍', 'ø3 NT Hole'],
  ],
  function: '주위 소리 크기가 가변저항으로 정한 기준보다 크면 출력이 LOW가 되고 LED가 켜진다. CPU 보드 입력 포트에 연결.',
  ports: [{ id: 'signal', type: '3핀 2.54mm', role: 'CPU 입력 포트 연결' }],
};
