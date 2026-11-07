// Ø130 자이언트 SET: 지름 130mm 큰 바퀴 (타이어 · 인너 · 휠 · 휠가이드 각 2개)
export default {
  id: 'wheel-set-130',
  name: 'Ø130 자이언트 SET',
  category: 'wheel',
  productNo: 30,
  url: 'https://roboroboshop.com/product/detail.html?product_no=30&cate_no=194',
  size: { x: 130, y: 130, z: 52, estimated: true, note: '지름 130mm (상품명) · 폭은 사진으로 추정' },
  specs: [
    ['구성', '타이어 2 · 인너(스펀지) 2 · 휠 2 · 휠가이드 2'],
    ['지름', 'Ø130 mm'],
    ['재질', '스펀지, 고무, ABS'],
    ['휠 색', '빨강'],
    ['주의', '작동을 위해 모터 등 추가 부품 필요'],
  ],
  function: '모터 축에 휠가이드로 연결하는 큰 바퀴. 지름이 커서 한 바퀴에 약 40.8cm를 간다.',
  ports: [{ id: 'hub', type: '휠가이드', role: 'DC 모터 · 서보 축 연결' }],
};
