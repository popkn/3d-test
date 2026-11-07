// 리모콘 송신부[8key/적외선]: 버튼 8개를 누르면 적외선 신호를 보내는 리모컨
export default {
  id: 'ir-remote-tx',
  name: '리모콘 송신부[8key/적외선]',
  category: 'board',
  productNo: 192,
  url: 'https://roboroboshop.com/product/detail.html?product_no=192&cate_no=194',
  size: { x: 90, y: 12, z: 60, estimated: true, note: '상품 페이지에 사양 없음 · 수신부(78 × 48mm 공식)와 사진 비율로 추정' },
  specs: [
    ['버튼', '8개 (왼쪽 1~4, 오른쪽 5~8)'],
    ['신호', '적외선 LED (반송파 37.9 kHz, 수신부 사양 기준)'],
    ['채널', 'DIP 스위치 4개 (최대 16명 구분)'],
    ['짝', '리모콘 수신부[8key/적외선]'],
  ],
  function: '버튼을 누르면 적외선 LED가 그 버튼 번호를 신호로 보낸다. DIP 스위치로 채널을 정해 여러 명이 동시에 써도 섞이지 않는다.',
  ports: [{ id: 'power', type: '2핀 전원', role: '배터리 연결' }],
};
