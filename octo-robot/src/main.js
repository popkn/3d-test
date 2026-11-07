import { createScene } from './scene/createScene.js';
import { createLoop } from './scene/loop.js';
import { OctoRobot } from './robot/index.js';
import { modes, ModeController } from './modes/index.js';
import { Sequencer, CameraDirector } from './sequence/index.js';
import { JetWake, ExplodeGuides } from './effects/index.js';
import { LabelLayer } from './labels/index.js';
import { createDevPanel } from './dev/devPanel.js';

const canvas = document.getElementById('viewport');
const ctx = createScene(canvas);
const loop = createLoop(ctx);

// 로봇
const robot = new OctoRobot();
ctx.scene.add(robot.object3d);

// 모드: 목표 자세를 정하고 로봇을 부드럽게 움직인다
const controller = new ModeController(robot, modes);

// 진행: 진행표에 맞춰 모드를 바꾸고, 카메라를 구간마다 옮긴다
const sequencer = new Sequencer(controller);
const director = new CameraDirector(ctx.camera, ctx.controls);
director.setShot(sequencer.entry.camera, { immediate: true });
sequencer.onChange((entry) => director.setShot(entry.camera));

// 연출: 분사 물살, 분해 안내선
const wake = new JetWake();
ctx.scene.add(wake.object3d);
const guides = new ExplodeGuides(robot);
ctx.scene.add(guides.object3d);

// 부품 이름표: 모드에 맞는 이름표만 나타난다
const labels = new LabelLayer(robot, document.getElementById('hud'));
labels.setMode(controller.mode.id);
controller.onChange((mode) => labels.setMode(mode.id));

loop.add((t, dt) => {
  sequencer.update(dt);
  controller.update(dt);
  robot.update(t, dt);
  director.update(dt);
  // 물살 세기는 모드의 wake 값을 부드럽게 따라간다
  const goal = (controller.mode.wake ?? 0) * robot.state.siphon;
  wake.strength += (goal - wake.strength) * Math.min(1, dt * 4);
  wake.update(dt, robot.siphon.nozzle.object3d, robot.siphon.object3d);
  guides.update(t);
  // 이번 프레임의 부품/카메라 위치를 확정한 뒤 이름표를 옮긴다
  robot.object3d.updateMatrixWorld();
  ctx.camera.updateMatrixWorld();
  labels.update(ctx.camera, dt);
});

// 확인용 패널 (9단계 HUD로 교체)
const panel = createDevPanel({ controller, sequencer, director, labels });
loop.add((t, dt) => panel.update(dt));

loop.start();

// 개발용 콘솔 도구
window.__robot = robot;
window.__modes = controller;
window.__seq = sequencer;
window.__cam = (x, y, z) => { director.enabled = false; ctx.camera.position.set(x, y, z); ctx.controls.update(); };
window.__info = () => ctx.renderer.info.render;
