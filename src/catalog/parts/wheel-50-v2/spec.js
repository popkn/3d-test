// 휠 - Ø50[V2]: 타이어 Ø50[V2]를 끼우는 흰색 ABS 휠
export default {
  id: 'wheel-50-v2',
  name: '휠 - Ø50[V2]',
  category: 'wheel',
  productNo: 84,
  url: 'https://roboroboshop.com/product/detail.html?product_no=84&cate_no=194',
  size: { x: 45, y: 45, z: 14, estimated: true, note: 'Ø50은 타이어를 끼운 바퀴 지름. 휠 폭 14 mm · ABS 흰색 · 7 g (상품 페이지). 휠 지름 Ø45는 타이어 Ø50[V2] 안쪽 Ø41에 맞춰 추정' },
  specs: [
    ['크기', '휠 Ø45 × 14 mm (타이어 포함 Ø50)'],
    ['무게', '7 g'],
    ['재질', 'ABS (흰색)'],
    ['축 구멍', 'D컷 Ø3 (DC 모터 축)'],
  ],
  function: 'DC 모터 축에 끼우는 바퀴. 실리콘 타이어 Ø50[V2]를 림에 씌워 미끄러지지 않게 굴러간다.',
  ports: [
    { id: 'hub', type: 'D컷 축 구멍', role: 'DC 모터 130 축에 끼움' },
    { id: 'rim', type: '림', role: '타이어 Ø50[V2] 장착' },
  ],
};
