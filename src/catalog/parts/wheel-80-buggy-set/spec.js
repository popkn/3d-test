// 바퀴 Ø80 버기 세트: 휠 Ø80 버기 + 인너 스폰지 + 타이어 Ø80 버기 (세 개를 끼운 한 덩어리)
export default {
  id: 'wheel-80-buggy-set',
  name: '바퀴 Ø80 버기 세트 (휠 + 인너 + 타이어)',
  category: 'wheel',
  set: [['wheel-buggy-80', 1], ['inner-80-buggy', 1], ['tire-80-buggy', 1]],
  size: { x: 80, y: 80, z: 33, estimated: false, note: '타이어 Ø80 × 30 (공식) · 휠 폭 33 (공식). 인너는 타이어 안에 들어가 보이지 않음' },
  specs: [
    ['구성', '휠 - Ø80 버기 1 + 인너 - Ø80 버기[스폰지] 1 + 타이어 - Ø80 버기 1'],
    ['크기', 'Ø80 × 33 mm'],
    ['축 구멍', 'D컷 Ø3 (DC 모터 축)'],
  ],
  function: 'DC 모터에 끼우는 큰 오프로드 바퀴. 인너와 타이어는 휠 없이 쓰지 않으므로 한 부품으로 다룬다.',
  ports: [{ id: 'hub', type: 'D컷 축 구멍', role: 'DC 모터 축' }],
};
