// 배틀무기 U 세트 (별 조각 3장): 같은 판 3장을 실제처럼 배치한 한 덩어리 (낱장은 battle-u)
export default {
  id: 'battle-u-set',
  name: '배틀무기 U 세트 (별 조각 3장)',
  category: 'battle',
  productNo: 463,
  url: 'https://roboroboshop.com/product/detail.html?product_no=463&cate_no=194',
  set: [['battle-u', 3]],
  size: { x: 97, y: 1.6, z: 97, estimated: false, note: '사용자가 보낸 실제 부품 사진에서 구멍 간격 10 mm로 크기 환산 (±2 mm)' },
  specs: [
    ['재질', 'FR-4 (Epoxy) 1.6T'],
    ['구성', 'battle-u × 3'],
    ['모양', '별 조각 3장을 120°씩 모아 12각 별 (지름 97). 가운데 반지름 10 구멍 6개 → 휠가이드 · 모터 축에 붙여 스피너 날'],
  ],
  function: '배틀 로봇의 무기 날. 낱장으로도 쓰고, 세트로 모아 큰 날로도 쓴다.',
  ports: [{ id: 'holes', type: 'M3 구멍', role: '휠가이드 · 프레임 고정' }],
  mountHoles: {"boltAllowed": true, "types": ["M3"], "count": 6, "holes": [[-5, 1.6, -11.8, 0, 1, 0, "M3"], [5, 1.6, -11.8, 0, 1, 0, "M3"], [10, 1.6, -3.1, 0, 1, 0, "M3"], [5, 1.6, 5.5, 0, 1, 0, "M3"], [-5, 1.6, 5.5, 0, 1, 0, "M3"], [-10, 1.6, -3.1, 0, 1, 0, "M3"]], "otherMounts": []},
};
