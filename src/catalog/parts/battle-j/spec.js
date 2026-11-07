// 프레임 - J [PCB, 배틀]: 배틀 로봇용 무기 판 (사다리꼴 · 불꽃 무늬)
export default {
  id: 'battle-j',
  name: '배틀무기 J',
  category: 'battle',
  productNo: 449,
  url: 'https://roboroboshop.com/product/detail.html?product_no=449&cate_no=194',
  size: { x: 88, y: 1.6, z: 28, estimated: true, note: '상품 페이지: 재질 FR-4 1.6T (크기 없음) · 외곽선과 구멍 배치는 사진과 10mm 구멍 간격으로 추정' },
  specs: [
    ['재질', 'FR-4 (Epoxy) 1.6T'],
    ['모양', '사다리꼴 · 불꽃 무늬'],
    ['구멍', '8 × 2 (10mm 간격)'],
  ],
  function: '로봇 앞이나 서보에 볼트로 달아 상대 로봇을 밀거나 막는 배틀 무기. 단단한 PCB라 부딪혀도 잘 휘지 않는다.',
  ports: [{ id: 'holes', type: 'M3 구멍', role: '프레임 · 서보 혼 고정' }],
};
