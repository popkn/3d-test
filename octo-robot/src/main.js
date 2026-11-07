import { createScene } from './scene/createScene.js';
import { createLoop } from './scene/loop.js';
import { OctoRobot } from './robot/index.js';
import { createDevPanel } from './dev/devPanel.js';

const canvas = document.getElementById('viewport');
const ctx = createScene(canvas);
const loop = createLoop(ctx);

const robot = new OctoRobot();
ctx.scene.add(robot.object3d);
ctx.controls.target.set(0, 1.4, 0);
loop.add((t, dt) => robot.update(t, dt));

// 확인용 슬라이더 (9단계 HUD로 교체)
const panel = createDevPanel(robot);
loop.add((t) => panel.update(t));

loop.start();

// 개발용 콘솔 도구: __robot, __cam(x, y, z), __info()
window.__robot = robot;
window.__cam = (x, y, z) => { ctx.camera.position.set(x, y, z); ctx.controls.update(); };
window.__info = () => ctx.renderer.info.render;
