// 프레임 - T [PCB, 배틀]: 배틀 로봇용 무기 판 (휘어진 칼날)
export default {
  id: 'battle-t',
  name: '배틀무기 T',
  category: 'battle',
  productNo: 462,
  url: 'https://roboroboshop.com/product/detail.html?product_no=462&cate_no=194',
  size: { x: 41, y: 1.6, z: 59, estimated: false, note: '사용자가 보낸 실제 부품 사진에서 구멍 간격 10 mm로 크기 환산 (±2 mm)' },
  specs: [
    ['재질', 'FR-4 (Epoxy) 1.6T'],
    ['모양', '휘어진 칼날 반쪽 · 안쪽 얼굴 모양 홈 · 빨간 날. 두 장 (한 장은 뒤집어 겹침)이 한 세트 (배틀무기 T 세트)'],
    ['구멍', '뿌리에 2 × 2'],
  ],
  function: '로봇 앞이나 서보에 볼트로 달아 상대 로봇을 밀거나 막는 배틀 무기.',
  ports: [{ id: 'holes', type: 'M3 구멍', role: '프레임 · 서보 혼 고정' }],
};
