import holding from './holding.js';

// 모드 컨트롤러: 현재 모드의 목표 자세를 정하고, 매 프레임 로봇을 목표 쪽으로 부드럽게 옮긴다.
//
// 모드 파일 형식 (모두 생략 가능, 없으면 대기 모드 값):
//   parts:  { mantle, optics, siphon, beak, explode }   0~1
//   body:   { x, y, z, pitch, yaw, roll }              떠 있는 위치 기준
//   arms:   { all: {팔 자세}, R2: {팔 자세}, ... }     팔 이름별로 덮어쓴다
//   motion(elapsed) → { body 값 }                     목표 위에 더해지는 시간 움직임
//   blend:  넘어가는 빠르기
const PART_KEYS = ['mantle', 'optics', 'siphon', 'beak', 'explode'];
const BODY_KEYS = ['x', 'y', 'z', 'pitch', 'yaw', 'roll'];
const ARM_KEYS = ['curl', 'spiral', 'lift', 'side', 'wave', 'waveSpeed', 'spread'];

export class ModeController {
  constructor(robot, modes) {
    this.robot = robot;
    this.modes = modes;
    this.armNames = Object.keys(robot.arms);
    this.listeners = [];

    // 현재 값 (대기 모드에서 시작)
    this.current = this.resolve(holding);
    this.target = this.resolve(holding);
    this.mode = holding;
    this.elapsed = 0;
    this.apply(0);
  }

  // 모드 하나를 '모든 값이 채워진 목표'로 바꾼다
  resolve(mode) {
    const parts = { ...holding.parts, ...mode.parts };
    const body = { ...holding.body, ...mode.body };
    const arms = {};
    for (const name of this.armNames) {
      arms[name] = { ...holding.arms.all, ...mode.arms?.all, ...mode.arms?.[name] };
    }
    return { parts, body, arms };
  }

  setMode(id) {
    const mode = this.modes[id];
    if (!mode || mode === this.mode) return;
    // 이전 모드의 시간 움직임을 현재 값에 넣어 두어 순간이동하지 않게 하고,
    // 몸체 방향(yaw)은 가까운 쪽으로 돌도록 정리한다
    const m = this.motionOffset();
    for (const key of BODY_KEYS) this.current.body[key] += m[key];
    this.current.body.yaw = wrapNear(this.current.body.yaw, mode.body?.yaw ?? 0);
    this.mode = mode;
    this.target = this.resolve(mode);
    this.elapsed = 0;
    for (const fn of this.listeners) fn(mode);
  }

  onChange(fn) { this.listeners.push(fn); }

  // 넘어가는 과정 없이 바로 목표 자세로 (시작 장면, 구간 이동에 쓴다)
  snap() {
    this.current = structuredClone(this.target);
    this.apply();
  }

  motionOffset() {
    const m = this.mode.motion ? this.mode.motion(this.elapsed) : {};
    return Object.fromEntries(BODY_KEYS.map((k) => [k, m[k] ?? 0]));
  }

  update(dt) {
    this.elapsed += dt;
    // 지수 감쇠: 목표와의 차이가 매초 일정 비율씩 줄어든다 (프레임 속도와 무관)
    const k = 1 - Math.exp(-dt * (this.mode.blend ?? 2));
    const c = this.current;
    const g = this.target;
    for (const key of PART_KEYS) c.parts[key] += (g.parts[key] - c.parts[key]) * k;
    for (const key of BODY_KEYS) c.body[key] += (g.body[key] - c.body[key]) * k;
    for (const name of this.armNames) {
      for (const key of ARM_KEYS) c.arms[name][key] += (g.arms[name][key] - c.arms[name][key]) * k;
    }
    this.apply();
  }

  apply() {
    const r = this.robot;
    const c = this.current;
    r.setMantle(c.parts.mantle);
    r.setOptics(c.parts.optics);
    r.setSiphon(c.parts.siphon);
    r.setBeak(c.parts.beak);
    r.setExplode(c.parts.explode);
    const m = this.motionOffset();
    r.setBodyPose(Object.fromEntries(BODY_KEYS.map((key) => [key, c.body[key] + m[key]])));
    for (const name of this.armNames) r.setArmPose(c.arms[name], name);
  }
}

// a를 2PI 단위로 옮겨 b와 가장 가까운 값으로
function wrapNear(a, b) {
  const TWO_PI = Math.PI * 2;
  return a - Math.round((a - b) / TWO_PI) * TWO_PI;
}

