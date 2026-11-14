// 배틀무기 V 세트 (도끼 반쪽 2장): 같은 판 2장을 실제처럼 배치한 한 덩어리 (낱장은 battle-v)
export default {
  id: 'battle-v-set',
  name: '배틀무기 V 세트 (도끼 반쪽 2장)',
  category: 'battle',
  productNo: 464,
  url: 'https://roboroboshop.com/product/detail.html?product_no=464&cate_no=194',
  set: [['battle-v', 2]],
  size: { x: 91, y: 1.6, z: 80, estimated: false, note: '사용자가 보낸 실제 부품 사진에서 구멍 간격 10 mm로 크기 환산 (±2 mm)' },
  specs: [
    ['재질', 'FR-4 (Epoxy) 1.6T'],
    ['구성', 'battle-v × 2'],
    ['모양', '도끼 반쪽 2장을 180° 돌려 맞댐 → 양날 도끼 (91 × 80). 가운데 구멍 4개'],
  ],
  function: '배틀 로봇의 무기 날. 낱장으로도 쓰고, 세트로 모아 큰 날로도 쓴다.',
  ports: [{ id: 'holes', type: 'M3 구멍', role: '휠가이드 · 프레임 고정' }],
};
