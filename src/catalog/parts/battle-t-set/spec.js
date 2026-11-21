// 배틀무기 T 세트 (초승달 반쪽 2장): 같은 판 2장을 실제처럼 배치한 한 덩어리 (낱장은 battle-t)
export default {
  id: 'battle-t-set',
  name: '배틀무기 T 세트 (초승달 반쪽 2장)',
  category: 'battle',
  productNo: 462,
  url: 'https://roboroboshop.com/product/detail.html?product_no=462&cate_no=194',
  set: [['battle-t', 2]],
  size: { x: 41, y: 3.2, z: 102, estimated: false, note: '사용자가 보낸 실제 부품 사진에서 구멍 간격 10 mm로 크기 환산 (±2 mm)' },
  specs: [
    ['재질', 'FR-4 (Epoxy) 1.6T'],
    ['구성', 'battle-t × 2'],
    ['모양', '초승달 반쪽 2장 (한 장은 뒤집음)을 뿌리에서 겹침 → 위아래로 휜 초승달 칼날 (길이 102). 뿌리 구멍 4개가 겹침'],
  ],
  function: '배틀 로봇의 무기 날. 낱장으로도 쓰고, 세트로 모아 큰 날로도 쓴다.',
  ports: [{ id: 'holes', type: 'M3 구멍', role: '휠가이드 · 프레임 고정' }],
  mountHoles: {"boltAllowed": true, "types": ["M3"], "count": 8, "holes": [[-1.2, 3.2, -4, 0, 1, 0, "M3"], [8.8, 3.2, -4, 0, 1, 0, "M3"], [-1.2, 3.2, 4, 0, 1, 0, "M3"], [8.8, 3.2, 4, 0, 1, 0, "M3"], [-1.2, 0, 4, 0, -1, 0, "M3"], [8.8, 0, 4, 0, -1, 0, "M3"], [-1.2, 0, -4, 0, -1, 0, "M3"], [8.8, 0, -4, 0, -1, 0, "M3"]], "otherMounts": []},
};
