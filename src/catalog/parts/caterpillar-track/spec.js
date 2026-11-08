// 캐터필러 궤도 세트: 마디 + 러버를 이어 만든 고리 하나 (마디 · 러버를 따로 다루지 않음)
export default {
  id: 'caterpillar-track',
  name: '캐터필러 궤도 세트 (마디 + 러버 고리)',
  category: 'wheel',
  set: [['caterpillar-link', 39], ['caterpillar-rubber', 39]],
  size: { x: 172, y: 72, z: 22, estimated: true, note: '톱니 휠 축 간격 100 mm 기준 고리 (마디 간격 10 · 폭 22). 축 간격이 바뀌면 마디 수도 바뀜 (setDistance)' },
  specs: [
    ['구성', '캐터필러 마디 + 러버 (축 간격 100 mm일 때 39개씩)'],
    ['감는 곳', '캐터필러 휠(톱니) 2개 — 지름 60 (마디 바깥 66)'],
    ['마디 간격', '10 mm'],
  ],
  function: '톱니 휠 두 개에 거는 무한궤도 한 줄. 조립에서는 마디를 하나씩 잇지 않고 완성된 고리 하나로 건다.',
  ports: [{ id: 'loop', type: '고리 (톱니 간격 10)', role: '캐터필러 휠(톱니) 2개에 걸기' }],
};
