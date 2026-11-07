import { createScene } from './scene/createScene.js';
import { createLoop } from './scene/loop.js';
import { OctoRobot } from './robot/index.js';
import { modes, ModeController } from './modes/index.js';
import { Sequencer, CameraDirector } from './sequence/index.js';
import { JetWake, ExplodeGuides } from './effects/index.js';
import { LabelLayer } from './labels/index.js';
import { createSimState, updateSimState, pushJetHistory } from './state/index.js';
import { Hud } from './hud/index.js';

const canvas = document.getElementById('viewport');
const hudEl = document.getElementById('hud');
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

// 연출: 분사 물살, 분해 안내선
const wake = new JetWake();
ctx.scene.add(wake.object3d);
const guides = new ExplodeGuides(robot);
ctx.scene.add(guides.object3d);

// 부품 이름표
const labels = new LabelLayer(robot, hudEl);
labels.setMode(controller.mode.id);
controller.onChange((mode) => labels.setMode(mode.id));

// 상태 (HUD가 읽는다)
const state = createSimState({
  timeline: sequencer.timeline, duration: sequencer.duration, armNames: Object.keys(robot.arms),
});
sequencer.onChange((entry) => { director.setShot(entry.camera); state.actions += 1; });

// ── HUD에서 오는 조작 ──
function seekTo(time) {
  sequencer.seek(time);
  director.userHold = 0;
  director.setShot(sequencer.entry.camera);
}

function selectAssembly(item) {
  // 그 부위를 보여주는 첫 구간으로 이동 (HERO는 가운데 대기 구간)
  const entries = sequencer.timeline;
  const entry = item.id === 'hero'
    ? entries.find((e, i) => e.mode === 'holding' && i > 0) ?? entries[0]
    : entries.find((e) => e.mode === item.mode);
  if (entry) seekTo(entry.start + 0.01);
  sequencer.play();
}

function toggleDisplay(key) {
  const d = state.display;
  d[key] = !d[key];
  labels.enabled = d.labels;
  controller.forceExplode = d.exploded;
  wake.enabled = d.wake;
  // 회전 보기: 카메라 연출 대신 로봇 둘레를 천천히 돈다
  ctx.controls.autoRotate = d.turntable;
  director.enabled = !d.turntable;
}

const hud = new Hud(hudEl, {
  armNames: Object.keys(robot.arms),
  onSelectAssembly: selectAssembly,
  onToggleDisplay: toggleDisplay,
  onTogglePlay: () => sequencer.toggle(),
  onSeek: (u) => seekTo(u * sequencer.duration),
});
const refreshSafeArea = () => { labels.safe = hud.safeArea(); };
window.addEventListener('resize', refreshSafeArea);

// 스페이스: 재생/정지
window.addEventListener('keydown', (e) => {
  if (e.code === 'Space' && e.target === document.body) { e.preventDefault(); sequencer.toggle(); }
});

// URL 옵션: ?t=12 (12초부터), ?pause=1 (정지 상태로 시작), ?cam=0 (카메라 연출 끄기)
const params = new URLSearchParams(location.search);
if (params.get('t')) { sequencer.seek(Number(params.get('t'))); director.setShot(sequencer.entry.camera, { immediate: true }); }
if (params.get('pause') === '1') sequencer.pause();
if (params.get('cam') === '0') director.enabled = false;

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

  updateSimState(state, { controller, robot, sequencer, wake, dt });
  if (hud.update(state, dt)) {
    pushJetHistory(state);
    refreshSafeArea();
  }
});

loop.start();

// 개발용 콘솔 도구
window.__robot = robot;
window.__modes = controller;
window.__seq = sequencer;
window.__state = state;
window.__cam = (x, y, z) => { director.enabled = false; ctx.camera.position.set(x, y, z); ctx.controls.update(); };
window.__info = () => ctx.renderer.info.render;
