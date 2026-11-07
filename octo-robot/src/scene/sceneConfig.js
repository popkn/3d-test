// 화면 환경 수치 모음. 색, 카메라, 조명, 바닥 크기를 여기서만 바꾼다.
export const sceneConfig = {
  colors: {
    background: 0xefede9,
    fog: 0xefede9,
    line: 0x9a9894,
    lineAccent: 0xf0482a,
  },
  fog: { near: 18, far: 45 },
  environmentIntensity: 0.55,

  camera: {
    fov: 35,
    near: 0.1,
    far: 200,
    position: [6.2, 4.0, 8.2],
    target: [0, 1.4, 0],
  },

  controls: {
    minDistance: 4,
    maxDistance: 24,
    minPolarAngle: 0.15,
    maxPolarAngle: Math.PI * 0.49, // 바닥 아래로 내려가지 않게
    dampingFactor: 0.06,
  },

  lights: {
    hemisphere: { sky: 0xffffff, ground: 0xd8d4cc, intensity: 1.1 },
    key: { color: 0xffffff, intensity: 2.4, position: [5, 10, 6], shadowMapSize: 2048, shadowArea: 6 },
    fill: { color: 0xfff4ec, intensity: 0.6, position: [-6, 4, -4] },
    rim: { color: 0xffffff, intensity: 0.8, position: [0, 5, -9] },
  },

  ground: {
    size: 80,
    shadowOpacity: 0.16,
  },

  backdrop: {
    orbitRadii: [3.2, 5.6, 8.5],
    crossRows: 2,
    crossCols: 13,
    crossSpacing: 0.55,
    crossHeight: 4.6,
    crossDepth: -4,
  },
};
