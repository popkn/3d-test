import * as THREE from 'three';
import { createAdaptiveResolution } from './adaptiveResolution.js';

// 매 프레임 실행 루프. 등록된 함수들에 (경과 시간, 프레임 간격)을 넘겨준다.
export function createLoop({ renderer, scene, camera, controls }) {
  const timer = new THREE.Timer();
  const updaters = [];
  const adapt = createAdaptiveResolution(renderer);

  function frame(timestamp) {
    timer.update(timestamp);
    const raw = timer.getDelta();
    adapt(raw);
    const dt = Math.min(raw, 0.1);
    const t = timer.getElapsed();
    for (const fn of updaters) fn(t, dt);
    controls.update();
    renderer.render(scene, camera);
  }

  return {
    add(fn) { updaters.push(fn); },
    start() { renderer.setAnimationLoop(frame); },
    stop() { renderer.setAnimationLoop(null); },
  };
}
