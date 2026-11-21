// 프레임 - V [PCB, 배틀]: 배틀 로봇용 무기 판 (날개 모양 · 마름모 무늬)
export default {
  id: 'battle-v',
  name: '배틀무기 V',
  category: 'battle',
  productNo: 464,
  url: 'https://roboroboshop.com/product/detail.html?product_no=464&cate_no=194',
  size: { x: 46, y: 1.6, z: 80, estimated: false, note: '사용자가 보낸 실제 부품 사진에서 구멍 간격 10 mm로 크기 환산 (±2 mm)' },
  specs: [
    ['재질', 'FR-4 (Epoxy) 1.6T'],
    ['모양', '도끼 날 반쪽 · 바깥 톱니 홈 · 빨간 바탕에 흰 X · 마름모. 두 장 (180° 돌려 맞댐)이 한 세트 (배틀무기 V 세트)'],
    ['구멍', '안쪽 흰 띠에 2개 (간격 10)'],
  ],
  function: '로봇 앞이나 서보에 볼트로 달아 상대 로봇을 밀거나 막는 배틀 무기.',
  ports: [{ id: 'holes', type: 'M3 구멍', role: '프레임 · 서보 혼 고정' }],
  mountHoles: {"boltAllowed": true, "types": ["M3"], "count": 2, "holes": [[18.8, 1.6, -5, 0, 1, 0, "M3"], [18.8, 1.6, 5, 0, 1, 0, "M3"]], "otherMounts": []},
};
