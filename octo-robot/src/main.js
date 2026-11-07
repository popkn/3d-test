import { createScene } from './scene/createScene.js';
import { createLoop } from './scene/loop.js';
import { createShowcase } from './dev/showcase.js';
import { createBodyPreview } from './dev/bodyPreview.js';
import { createDevPanel } from './dev/devPanel.js';

const canvas = document.getElementById('viewport');
const ctx = createScene(canvas);
const loop = createLoop(ctx);

// 임시 확인 화면. 5단계에서 로봇으로 교체한다.
//   기본: 몸체(맨틀, 눈, 사이펀, 부리) 확인
//   ?view=parts: 2단계 재질과 공통 부품 진열대
const view = new URLSearchParams(location.search).get('view');
if (view === 'parts') {
  ctx.scene.add(createShowcase());
} else {
  const body = createBodyPreview();
  ctx.scene.add(body.object3d);
  ctx.controls.target.set(0, 1.6, 0);
  const panel = createDevPanel(body.controls);
  loop.add((t, dt) => { panel.update(t); body.update(t, dt); });
}

loop.start();

// 개발용: 콘솔에서 카메라 위치 지정 (__cam(x, y, z))
window.__cam = (x, y, z) => { ctx.camera.position.set(x, y, z); ctx.controls.update(); };
window.__info = () => ctx.renderer.info.render;
