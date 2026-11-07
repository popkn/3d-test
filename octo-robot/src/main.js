import { createScene } from './scene/createScene.js';
import { createLoop } from './scene/loop.js';
import { createShowcase } from './dev/showcase.js';

const canvas = document.getElementById('viewport');
const ctx = createScene(canvas);
const loop = createLoop(ctx);

// 임시 진열대: 재질과 공통 부품 확인용. 5단계에서 로봇으로 교체한다.
const showcase = createShowcase();
ctx.scene.add(showcase);

loop.start();
