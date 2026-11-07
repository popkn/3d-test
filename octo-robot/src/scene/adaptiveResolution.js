// 자동 해상도: 프레임이 느리면 픽셀 밀도를 낮추고, 여유가 생기면 다시 올린다.
// (고해상도 화면이나 느린 기기에서 끊김을 줄인다)
export function createAdaptiveResolution(renderer, { max = Math.min(window.devicePixelRatio, 2), min = 1 } = {}) {
  let ratio = max;
  let acc = 0;
  let frames = 0;
  renderer.setPixelRatio(ratio);

  return function update(dt) {
    acc += dt;
    frames += 1;
    if (acc < 1.5) return;
    const ms = (acc / frames) * 1000;
    acc = 0;
    frames = 0;
    let next = ratio;
    if (ms > 24 && ratio > min) next = Math.max(min, ratio - 0.25);
    else if (ms < 12 && ratio < max) next = Math.min(max, ratio + 0.25);
    if (next !== ratio) {
      ratio = next;
      renderer.setPixelRatio(ratio);
      renderer.setSize(window.innerWidth, window.innerHeight, false);
    }
  };
}
