// 프레임 - U [PCB, 배틀]: 배틀 로봇용 무기 판 (반쪽 별 (뾰족한 톱날))
export default {
  id: 'battle-u',
  name: '배틀무기 U',
  category: 'battle',
  productNo: 463,
  url: 'https://roboroboshop.com/product/detail.html?product_no=463&cate_no=194',
  size: { x: 69, y: 1.6, z: 46, estimated: false, note: '사용자가 보낸 실제 부품 사진에서 구멍 간격 10 mm로 크기 환산 (±2 mm)' },
  specs: [
    ['재질', 'FR-4 (Epoxy) 1.6T'],
    ['모양', '12각 별의 1/3 (120°) 조각 · 뾰족 끝 4개 · 빨간 마름모 무늬. 세 장이 한 세트 (배틀무기 U 세트)'],
    ['구멍', '별 가운데에서 반지름 10에 2개 (세 장 모으면 6개) + 가운데 구멍'],
  ],
  function: '로봇 앞이나 서보에 볼트로 달아 상대 로봇을 밀거나 막는 배틀 무기.',
  ports: [{ id: 'holes', type: 'M3 구멍', role: '프레임 · 서보 혼 고정' }],
  mountHoles: {"boltAllowed": true, "types": ["M3"], "count": 2, "holes": [[-5, 1.6, 15.5, 0, 1, 0, "M3"], [5, 1.6, 15.5, 0, 1, 0, "M3"]], "otherMounts": []},
};
