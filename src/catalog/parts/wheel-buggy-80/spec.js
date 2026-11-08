// 휠 - Ø80 버기: 스폰지 인너 + 버기 타이어를 끼우는 주황 휠
export default {
  id: 'wheel-buggy-80',
  name: '휠 - Ø80 버기',
  category: 'wheel',
  productNo: 91,
  url: 'https://roboroboshop.com/product/detail.html?product_no=91&cate_no=194',
  size: { x: 60, y: 60, z: 33, estimated: true, note: '상품 페이지 80 × 80 × 33 mm · 22 g은 타이어까지 끼운 바퀴 기준으로 판단. 휠 지름 Ø60은 타이어 Ø80 버기 안쪽(Ø56)에 맞춰 추정, 폭 33 mm는 공식' },
  specs: [
    ['크기', '휠 Ø60 × 33 mm (타이어 포함 Ø80)'],
    ['무게', '22 g'],
    ['재질', '플라스틱 (주황)'],
    ['축 구멍', 'D컷 Ø3 (DC 모터 축)'],
  ],
  function: 'DC 모터에 끼우는 큰 버기 바퀴. 인너 Ø80 버기[스폰지]를 넣고 타이어 Ø80 버기를 씌워 울퉁불퉁한 바닥도 달린다.',
  ports: [
    { id: 'hub', type: 'D컷 축 구멍', role: 'DC 모터 축에 끼움' },
    { id: 'rim', type: '림', role: '인너 스폰지 + 타이어 Ø80 버기 장착' },
  ],
};
