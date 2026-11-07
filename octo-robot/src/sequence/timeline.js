// 진행표: 영상과 같은 순서와 시간으로 모드가 바뀐다 (단위: 초, 총 25.5초 반복).
//   mode:   모드 id
//   start:  시작 시각
//   camera: 그 구간의 카메라 자리 { position, target } — 로봇 기준 좌표, 떠 있는 높이 포함
//   enter:  구간이 시작될 때 몸체를 순간 이동시킬 위치 (화면 밖에서 들어오기 등)
export const timeline = [
  {
    mode: 'jetting', start: 0,
    enter: { x: -7 },
    camera: { position: [1.5, 3.2, 8.5], target: [0, 2.2, 0] },
  },
  { mode: 'opticsOpen', start: 3.5, camera: { position: [4.2, 2.4, 4.6], target: [0.6, 1.8, 0.6] } },
  { mode: 'mantleOpen', start: 5.5, camera: { position: [2.5, 5.4, 5.6], target: [0, 2.0, 0] } },
  { mode: 'holding', start: 7.5, camera: { position: [0.6, 3.3, 9.8], target: [0, 1.4, 0] } },
  { mode: 'armApart', start: 9.0, camera: { position: [-5.8, 3.6, 5.8], target: [-0.8, 1.4, 0.6] } },
  { mode: 'siphonOpen', start: 11.5, camera: { position: [5.6, 2.6, 4.8], target: [0, 1.6, 0] } },
  { mode: 'beakOpen', start: 13.5, camera: { position: [0.8, 1.2, 7.2], target: [0, 2.3, 0] } },
  { mode: 'teardown', start: 15.5, camera: { position: [6.8, 4.8, 8.2], target: [0, 1.8, 0] } },
  { mode: 'holding', start: 19.5, camera: { position: [-3.0, 3.5, 9.3], target: [0, 1.4, 0] } },
  { mode: 'departing', start: 21.5, camera: { position: [-1.0, 3.2, 9.0], target: [1.0, 2.0, 0] } },
];

export const duration = 25.5;
