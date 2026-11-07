// Interface Board [서보] IPRC용: CPU 보드 출력 포트에 별도 배터리 전원을 공급한다
export default {
  id: 'interface-board-servo',
  name: 'Interface Board [서보]',
  category: 'board',
  productNo: 79,
  url: 'https://roboroboshop.com/product/detail.html?product_no=79&cate_no=194',
  size: { x: 18, y: 19, z: 46, estimated: false, note: '상품 페이지 공식 규격 46(L) × 18(W) × 19(H) mm' },
  specs: [
    ['권장 전압', '6 V (AA 건전지 배터리케이스 권장)'],
    ['무게', '6.6 g'],
    ['출력 포트', 'OUT1 ~ OUT5 (CPU 보드 출력 핀에 끼움)'],
    ['전원 스위치', 'ON / OFF'],
    ['포트 4·5 스위치', 'Battery / CPU(4,5)'],
    ['표시등', 'LED 전원 표시등'],
  ],
  function: '서보모터처럼 순간 전류를 많이 쓰는 부품에 독립 전원을 공급해 CPU 보드가 안정적으로 동작하게 한다.',
  ports: [
    { id: 'out', type: '3핀 × 5 (2.54mm)', role: 'CPU 보드 OUT1~5에 끼우고, 서보를 연결' },
    { id: 'battery', type: '2핀 전원 커넥터', role: '배터리 연결' },
  ],
};
