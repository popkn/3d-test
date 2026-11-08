// 휠 - Ø50[V2]: 타이어 Ø50[V2]를 끼우는 흰색 ABS 휠
export default {
  id: 'wheel-50-v2',
  name: '휠 - Ø50[V2]',
  category: 'wheel',
  productNo: 84,
  url: 'https://roboroboshop.com/product/detail.html?product_no=84&cate_no=194',
  size: { x: 48, y: 48, z: 14, estimated: false, note: '표기 Ø50 (상품명). 실제 휠은 Ø48: 옆면 Ø45 + 가운데 돌기 Ø48이 타이어 안쪽 홈에 들어가, 타이어를 끼우면 Ø45만 보인다 (사용자 확인). 폭 14 mm · ABS 흰색 · 7 g' },
  specs: [
    ['표기', 'Ø50'],
    ['실제 크기', 'Ø48 × 14 mm (옆면 Ø45, 가운데 돌기 Ø48)'],
    ['타이어 끼운 모습', '바깥 Ø50, 휠은 Ø45만 보임'],
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
