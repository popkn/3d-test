// 맨틀 열기: 머리 꽃잎판이 펼쳐져 속 기계(리액터 링, 구동 기어)가 드러난다.
export default {
  id: 'mantleOpen',
  label: 'MANTLE OPEN',
  description: '8 PETALS · REACTOR EXPOSED',
  parts: { mantle: 1 },
  body: { y: -0.15, pitch: -0.12 },
  arms: { all: { wave: 0.3, lift: 0.4 } },
  blend: 1.4,
};
