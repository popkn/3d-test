import { createScene } from './scene/createScene.js';
import { createLoop } from './scene/loop.js';
import { OctoRobot } from './robot/index.js';
import { modes, ModeController } from './modes/index.js';
import { createDevPanel } from './dev/devPanel.js';

const canvas = document.getElementById('viewport');
const ctx = createScene(canvas);
const loop = createLoop(ctx);

const robot = new OctoRobot();
ctx.scene.add(robot.object3d);
ctx.controls.target.set(0, 1.4, 0);

// 모드: 목표 자세를 정하고 로봇을 부드럽게 움직인다
const controller = new ModeController(robot, modes);
loop.add((t, dt) => { controller.update(dt); robot.update(t, dt); });

// 확인용 모드 버튼 (9단계 HUD로 교체)
const panel = createDevPanel(controller);
loop.add((t, dt) => panel.update(dt));

loop.start();

// 개발용 콘솔 도구: __robot, __modes, __cam(x, y, z), __info()
window.__robot = robot;
window.__modes = controller;
window.__cam = (x, y, z) => { ctx.camera.position.set(x, y, z); ctx.controls.update(); };
window.__info = () => ctx.renderer.info.render;
