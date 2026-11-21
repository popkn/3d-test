import * as THREE from 'three';
import { catalog, categories, loadPart } from './catalog/index.js';
import { createScene, partBounds } from './viewer/scene.js';
import { createOverlay } from './viewer/overlay.js';
import { createPanel } from './viewer/panel.js';
import { buildEagle, EXPLODE, WING_SPREAD } from './eagle/assemble.js';
import { SHEETS, BOM_TOTAL } from './eagle/assembly.js';
import { buildBattlebot, EXPLODE as BB_EXPLODE } from './battlebot/assemble.js';
import { SHEETS as BB_SHEETS, BOM_TOTAL as BB_TOTAL } from './battlebot/assembly.js';
import { buildTrain, SPEED as TRAIN_SPEED } from './train/assemble.js';
import { buildTrainSteps, buildTrainStaged } from './train/build.js';
import { buildGatling, TILT_MAX as GAT_TILT_MAX, WHEEL_R as GAT_WHEEL_R } from './gatling/assemble.js';
import { SHEETS as GAT_SHEETS, GUN as GAT_GUN } from './gatling/assembly.js';
import { buildScorpion, WHEEL_R as SCORP_WHEEL_R, CLAW_OPEN as SCORP_OPEN, CLAW_NEUT as SCORP_NEUT, CLAW_CLAMP as SCORP_CLAMP, TAIL_READY as SCORP_TAIL_READY, TAIL_SMASH as SCORP_TAIL_SMASH } from './scorpion/assemble.js';
import { SHEETS as SCORP_SHEETS, BOT as SCORP_BOT } from './scorpion/assembly.js';
import { detailAdapter } from '../robots/lib.js';
import { createStaged } from './assembly/staged.js';

// 로보로보 부품 뷰어: 왼쪽 목록에서 부품을 고르면 3D 모양과 기능(조작 패널)을 불러온다.
const stage = document.getElementById('stage');
const view = createScene(stage);
const overlay = createOverlay(stage);
view.scene.add(overlay.dimGroup);
const panel = createPanel(document.getElementById('panel'));
const opts = { labels: true, dims: true, spin: false };

// 목록
const nav = document.getElementById('parts');
nav.innerHTML = `<a href="#scorpion" data-id="scorpion" class="all"><b>🦂 크림슨 스콜피온 v3 (완성품)</b><small>4WD 전원 · 쌍발 400rpm 수직 낫 · 4절링크 집게 · 꼬리 해머</small></a><a href="#scorpion-build" data-id="scorpion-build" class="all"><b>🔧 스콜피온 단계별 조립 (501단계+테스트)</b><small>1부품·1체결 498단계 + 3무기 메커니즘 테스트(배경 반투명)</small></a><a href="#gatling" data-id="gatling" class="all"><b>🎯 썬더 개틀링 6연장 v3 (완성품)</b><small>4륜 전원 모터 · 원형 고무줄 탄성 격발 · 거치/격발 테스트</small></a><a href="#gatling-build" data-id="gatling-build" class="all"><b>🔧 개틀링 단계별 조립 (세분화+테스트)</b><small>1부품·1체결 352단계 · 거치/격발 테스트(배경 반투명) 내장</small></a><a href="#eagle" data-id="eagle" class="all"><b>🦅 독수리 조립 (설계도면)</b><small>부품으로 조립한 독수리 · 날갯짓 · 분해 보기</small></a><a href="#battlebot" data-id="battlebot" class="all"><b>⚔ 배틀로봇 썬더 웨지</b><small>무한궤도 · 스피너 · 들어올림 웨지</small></a><a href="#train" data-id="train" class="all"><b>🚂 협동 기차 하나로 열차</b><small>3칸 · 칸마다 CPU · 3명이 따로 조종</small></a><a href="#stage-eagle" data-id="stage-eagle" class="all"><b>🔧 독수리 파트별 조립</b><small>받침대 · 다리 · 몸통 · 얼굴 · 날개 · 꼬리 → 연결 · 분해</small></a><a href="#stage-battlebot" data-id="stage-battlebot" class="all"><b>🔧 배틀로봇 파트별 조립</b><small>섀시 · 구동부 · 무기 · 웨지 · 상판 · 장갑 → 연결 · 분해</small></a><a href="#stage-train" data-id="stage-train" class="all"><b>🔧 기차 파트별 조립</b><small>칸마다 차대 · 차체 → 연결봉 · 분해</small></a><a href="#train-build" data-id="train-build" class="all"><b>🔧 기차 단계별 조립 (모듈 작업대)</b><small>부품 하나씩 · 모듈은 따로 조립 후 끼우기</small></a><a href="#all" data-id="all" class="all"><b>▦ 전체 펼쳐보기</b><small>${catalog.length}개 부품 · 실제 크기로 한 화면에</small></a>` + categories.map(([cat, title]) => `
  <h3>${title}</h3>
  ${catalog.filter((p) => p.category === cat).map((p) => `
    <a href="#${p.id}" data-id="${p.id}"><b>${p.name}</b><small>${p.size.x} × ${p.size.z} × ${p.size.y} mm${p.size.estimated ? ' · 추정' : ''}</small></a>`).join('')}
`).join('');

// 보기 옵션
document.querySelectorAll('.toggles button').forEach((b) => {
  b.addEventListener('click', () => {
    opts[b.dataset.k] = !opts[b.dataset.k];
    b.classList.toggle('on', opts[b.dataset.k]);
    view.controls.autoRotate = opts.spin;
  });
});

let current = null; // { id, root, fn }
let loadToken = 0;

// 전체 펼쳐보기: 모든 부품을 실제 크기 그대로 분류별 줄로 늘어놓는다. 부품을 누르면 그 부품 화면으로 간다.
const ROW_W = 1300, GAP = 14;
const picks = []; // [{ root, id }]
async function showAll(token) {
  const parts = await Promise.all(catalog.map((p) => loadPart(p.id)));
  if (token !== loadToken) return null;
  const root = new THREE.Group();
  const labels = [];
  let z = 0;
  picks.length = 0;
  for (const [cat, title] of categories) {
    const list = catalog.map((p, i) => [p, parts[i]]).filter(([p]) => p.category === cat);
    if (!list.length) continue;
    let x = 0, rowDepth = 0, first = true;
    for (const [spec, part] of list) {
      const model = part.build();
      const g = new THREE.Group();
      g.add(model.object3d);
      root.add(g);
      g.updateMatrixWorld(true);
      const box = partBounds(g);
      const size = box.getSize(new THREE.Vector3()), c = box.getCenter(new THREE.Vector3());
      if (x > 0 && x + size.x > ROW_W) { z += rowDepth + GAP * 2; x = 0; rowDepth = 0; }
      model.object3d.position.set(-c.x + x + size.x / 2, -box.min.y, -c.z + z + size.z / 2);
      if (first) { labels.push({ name: title, sub: `${list.length}개`, object: root, anchor: [x, 0, z - 6], off: [-20, -40], hideOff: true }); first = false; }
      labels.push({ name: spec.name, sub: `${spec.size.x} × ${spec.size.z} × ${spec.size.y} mm`, object: root, anchor: [x + size.x / 2, size.y, z + size.z / 2], off: [10, -26], small: true });
      picks.push({ root: g, id: spec.id });
      x += size.x + GAP;
      rowDepth = Math.max(rowDepth, size.z);
    }
    z += rowDepth + GAP * 4;
  }
  return { root, labels };
}

// 독수리 조립: eagle/BLUEPRINT.md 도면의 부품 배치대로 실제 부품 모델을 조립한다
let eagle = null;
async function showEagle(token) {
  const loading = document.getElementById('loading');
  const e = await buildEagle(loadPart, (k) => { loading.textContent = `부품 불러오는 중… ${Math.round(k * 100)}%`; });
  loading.textContent = '불러오는 중…';
  if (token !== loadToken) return null;
  return e;
}
function eagleFunction(e) {
  const st = { flap: -20, auto: false, head: 90, scan: false, explode: 0, t: 0, hidden: {} };
  panel.ui.controls([
    { type: 'toggle', id: 'auto', label: '자동 날갯짓', value: false },
    { type: 'slider', id: 'flap', label: '날개 각도', min: -20, max: 45, step: 1, value: -20, unit: '°' },
    { type: 'toggle', id: 'scan', label: '머리 둘러보기', value: false },
    { type: 'slider', id: 'head', label: '머리 방향 (90 = 정면)', min: 45, max: 135, step: 1, value: 90, unit: '°' },
    { type: 'slider', id: 'explode', label: '분해 보기', min: 0, max: 1, step: 0.01, value: 0 },
    ...Object.entries(SHEETS).map(([no, t]) => ({ type: 'toggle', id: 'g' + no, label: `${no} ${t}`, value: true, compact: true })),
  ]);
  panel.ui.readouts([['parts', '놓인 부품'], ['wing', '날개 끝 높이'], ['state', '동작']]);
  return {
    onControl(id, v) { if (id.startsWith('g')) st.hidden[id.slice(1)] = !v; else st[id] = id === 'auto' || id === 'scan' ? v : Number(v); },
    update(dt) {
      st.t += dt;
      const flap = st.auto ? 12.5 + 32.5 * Math.sin(st.t * Math.PI * 2 / 1.2) : st.flap;
      const head = st.scan ? 90 + 45 * Math.sin(st.t * 0.8) : st.head;
      const a = THREE.MathUtils.degToRad(flap);
      e.wing.r.rotation.z = a; e.wing.l.rotation.z = -a;
      e.head.rotation.y = THREE.MathUtils.degToRad(head - 90);
      for (const [no, g] of Object.entries(e.groups)) {
        const d = EXPLODE[no] || [0, 0, 0];
        g.position.set(d[0] * st.explode, d[1] * st.explode, d[2] * st.explode);
        g.visible = !st.hidden[no];
      }
      e.wing.r.position.x = 62 + WING_SPREAD * st.explode; e.wing.l.position.x = -62 - WING_SPREAD * st.explode;
      panel.ui.readout('parts', `${e.count}개 (볼트 · 너트 포함 ${BOM_TOTAL}개)`);
      panel.ui.readout('wing', `${(204 * Math.sin(a)).toFixed(0)} mm (${flap.toFixed(0)}°)`);
      panel.ui.readout('state', st.auto ? '날갯짓 (1.2초에 한 번)' : st.explode > 0.02 ? '분해 보기' : '정지');
    },
  };
}

// 배틀로봇: battlebot/BLUEPRINT.md 도면대로 조립
let bot = null;
function botFunction(e) {
  const st = { drive: 'stop', spin: false, rpm: 0, wedge: 0, explode: 0, dl: 0, dr: 0, yaw: 0, hidden: {} };
  panel.ui.controls([
    { type: 'select', id: 'drive', label: '조종', options: [['stop', '정지'], ['fwd', '전진 (궤도)'], ['back', '후진'], ['left', '제자리 왼쪽 회전'], ['right', '제자리 오른쪽 회전']], value: 'stop' },
    { type: 'toggle', id: 'spin', label: '스피너 (DC 400rpm)', value: false },
    { type: 'slider', id: 'wedge', label: '웨지 들기 (서보)', min: 0, max: 60, step: 1, value: 0, unit: '°' },
    { type: 'button', id: 'attack', label: '공격 데모 (웨지 들기 + 스피너)' },
    { type: 'slider', id: 'explode', label: '분해 보기', min: 0, max: 1, step: 0.01, value: 0 },
    ...Object.entries(BB_SHEETS).map(([no, t]) => ({ type: 'toggle', id: 'g' + no, label: `${no} ${t}`, value: true, compact: true })),
  ]);
  panel.ui.readouts([['parts', '놓인 부품'], ['track', '궤도'], ['spin', '스피너'], ['wedge', '웨지']]);
  let demo = 0;
  return {
    onControl(id, v) {
      if (id.startsWith('g')) st.hidden[id.slice(1)] = !v;
      else if (id === 'attack') { demo = 3; st.spin = true; }
      else st[id] = id === 'drive' ? v : id === 'spin' ? v : Number(v);
    },
    update(dt) {
      const v = 130 / 60 * Math.PI * 62;   // mm/s
      const [l, r] = { stop: [0, 0], fwd: [1, 1], back: [-1, -1], left: [-1, 1], right: [1, -1] }[st.drive];
      st.dl += l * v * dt; st.dr += r * v * dt;
      e.setTracks(-st.dl, -st.dr);
      if (st.drive === 'left' || st.drive === 'right') { st.yaw += (st.drive === 'left' ? 1 : -1) * dt * 0.8; e.root.rotation.y = st.yaw; }
      const target = st.spin ? 400 : 0;
      st.rpm += Math.sign(target - st.rpm) * Math.min(Math.abs(target - st.rpm), dt * 300);
      e.spinner.rotation.y -= st.rpm / 60 * Math.PI * 2 * dt;
      let w = st.wedge;
      if (demo > 0) { demo -= dt; w = demo > 2 ? (3 - demo) * 60 : demo > 1 ? 60 : demo * 60; if (demo <= 0) st.spin = false; }
      e.setWedge(w);
      for (const [no, g] of Object.entries(e.groups)) {
        const d = BB_EXPLODE[no] || [0, 0, 0];
        g.position.set(d[0] * st.explode, d[1] * st.explode, d[2] * st.explode);
        g.visible = !st.hidden[no];
      }
      panel.ui.readout('parts', `${e.count}개 (볼트 · 너트 포함 ${BB_TOTAL}개)`);
      panel.ui.readout('track', st.drive === 'stop' ? '정지' : `${(v / 1000).toFixed(2)} m/s · ${{ fwd: '전진', back: '후진', left: '왼쪽 회전', right: '오른쪽 회전' }[st.drive]}`);
      panel.ui.readout('spin', `${st.rpm.toFixed(0)} rpm · 날 끝 ${(st.rpm / 60 * Math.PI * 0.084).toFixed(2)} m/s`);
      panel.ui.readout('wedge', `${w.toFixed(0)}°${demo > 0 ? ' (공격 데모)' : ''}`);
    },
  };
}

// 협동 기차: 칸마다 따로 조종 → 같은 방향이면 잘 달리고, 엇갈리면 연결봉으로 끌고 밀며 이상하게 움직인다
let train = null;
function trainFunction(e) {
  const NAMES3 = ['앞칸 (조종자 A)', '중간칸 (조종자 B)', '마지막칸 (조종자 C)'];
  const OPTS = [['stop', '정지'], ['fwd', '전진'], ['back', '후진'], ['left', '왼쪽'], ['right', '오른쪽']];
  const st = { cmd: ['stop', 'stop', 'stop'], speed: 1, body: true, follow: true, bolts: false };
  panel.ui.controls([
    ...NAMES3.map((n, i) => ({ type: 'select', id: 'c' + i, label: n, options: OPTS, value: 'stop' })),
    { type: 'button', id: 'same', label: '셋 다 전진 (같은 방향)' },
    { type: 'button', id: 'mixed', label: '엇갈림 예: 앞 왼쪽 · 가운데 후진 · 뒤 오른쪽' },
    { type: 'slider', id: 'speed', label: '속도', min: 0.2, max: 1, step: 0.05, value: 1 },
    { type: 'toggle', id: 'body', label: '차체 보이기 (끄면 차대 · CPU가 보임)', value: true },
    { type: 'toggle', id: 'bolts', label: '볼트 · 너트 보기 (조립 계산이 고른 것)', value: false },
    { type: 'toggle', id: 'follow', label: '카메라가 열차를 따라감', value: true },
    { type: 'button', id: 'reset', label: '처음 자리로' },
  ]);
  panel.ui.readouts([['team', '세 사람'], ['bend', '연결봉 꺾임'], ['speed', '속도'], ['parts', '놓인 부품'], ['check', '조립 규칙 검사']]);
  const setSel = (i, v) => { const el = document.querySelectorAll('.p-controls select')[i]; if (el) el.value = v; };
  const center = new THREE.Vector3();
  return {
    onControl(id, v) {
      if (id[0] === 'c' && id.length === 2) st.cmd[+id[1]] = v;
      else if (id === 'same') { st.cmd = ['fwd', 'fwd', 'fwd']; st.cmd.forEach((c, i) => setSel(i, c)); }
      else if (id === 'mixed') { st.cmd = ['left', 'back', 'right']; st.cmd.forEach((c, i) => setSel(i, c)); }
      else if (id === 'reset') { e.reset(); st.cmd = ['stop', 'stop', 'stop']; st.cmd.forEach((c, i) => setSel(i, c)); }
      else if (id === 'speed') st.speed = Number(v);
      else { st[id] = v; if (id === 'bolts') e.showBolts(v); }
    },
    update(dt) {
      const bend = e.step(Math.min(dt, 0.05), st.cmd, st.speed);
      e.cars.forEach((c) => c.body.forEach((h) => { h.visible = st.body; }));
      if (st.follow) {
        center.set((e.cars[0].x + e.cars[2].x) / 2, 60, (e.cars[0].z + e.cars[2].z) / 2);
        const d = center.clone().sub(view.controls.target);
        view.controls.target.add(d); view.camera.position.add(d);
      }
      const moving = st.cmd.filter((c) => c !== 'stop');
      const same = st.cmd.every((c) => c === st.cmd[0]);
      panel.ui.readout('team', same ? (st.cmd[0] === 'stop' ? '모두 정지' : '같은 방향 ✔ 잘 달림') : '엇갈림 ✘ 덜컹 · 비틀 · 접힘');
      panel.ui.readout('bend', `앞-중간 ${bend[0].toFixed(0)}° · 중간-뒤 ${bend[1].toFixed(0)}°`);
      panel.ui.readout('speed', moving.length ? `칸마다 최대 ${(TRAIN_SPEED * st.speed / 1000).toFixed(2)} m/s` : '정지');
      panel.ui.readout('parts', `${e.count}개 + 볼트 · 너트 ${e.nFast}개`);
      panel.ui.readout('check', e.errors.length ? `오류 ${e.errors.length}건` : `오류 0 · 경고 ${e.warnings.length} · 관절 ${e.joints}`);
    },
  };
}

// 단계별 조립: 재생 · 한 단계씩 · 단계 이동 · 속도 · 카메라 따라가기
let trainSteps = null;
function stepFunction(e) {
  const st = { T: 0, play: true, speed: 1, follow: true, bolts: true, goal: null };
  panel.ui.controls([
    { type: 'toggle', id: 'play', label: '재생', value: true },
    { type: 'button', id: 'prev', label: '◀ 이전 단계' },
    { type: 'button', id: 'next', label: '다음 단계 ▶' },
    { type: 'slider', id: 'step', label: '단계로 이동', min: 0, max: e.N, step: 1, value: 0 },
    { type: 'slider', id: 'speed', label: '속도 (단계 / 초)', min: 0.25, max: 6, step: 0.25, value: 1 },
    { type: 'toggle', id: 'follow', label: '카메라가 지금 부품을 따라감', value: true },
    { type: 'toggle', id: 'bolts', label: '볼트 · 너트 보기', value: true },
    { type: 'button', id: 'restart', label: '처음부터' },
  ]);
  panel.ui.readouts([['step', '단계'], ['now', '지금'], ['module', '모듈'], ['total', '전체']]);
  const slider = () => [...document.querySelectorAll('.p-controls label')].find((l) => l.textContent.includes('단계로 이동'))?.querySelector('input');
  const playBox = () => [...document.querySelectorAll('.p-controls label')].find((l) => l.textContent.startsWith('재생'))?.querySelector('input');
  const pause = () => { st.play = false; const b = playBox(); if (b) b.checked = false; };
  const tgt = new THREE.Vector3();
  let lastShown = -1;
  return {
    onControl(id, v) {
      if (id === 'play') { st.play = v; if (v && st.T >= e.N) st.T = 0; }
      else if (id === 'prev') { pause(); st.goal = Math.max(0, Math.ceil(st.T) - 1); }
      else if (id === 'next') { pause(); st.goal = Math.min(e.N, Math.floor(st.T) + 1); }
      else if (id === 'step') { pause(); st.T = Number(v); st.goal = null; }
      else if (id === 'restart') { st.T = 0; st.goal = null; st.play = true; const b = playBox(); if (b) b.checked = true; }
      else if (id === 'bolts') { st.bolts = v; e.setBolts(v); }
      else st[id] = v;
    },
    update(dt) {
      dt = Math.min(dt, 0.05);
      if (st.goal !== null) { const d = st.goal - st.T; st.T += Math.sign(d) * Math.min(Math.abs(d), dt * 2.5); if (Math.abs(d) < 1e-3) { st.T = st.goal; st.goal = null; } }
      else if (st.play) { st.T = Math.min(e.N, st.T + dt * st.speed); if (st.T >= e.N) pause(); }
      e.pose(st.T);
      const s = Math.min(e.N, Math.max(1, Math.floor(st.T) + 1));
      const sl = slider(); if (sl && document.activeElement !== sl) { sl.value = String(Math.floor(st.T)); sl.nextElementSibling.textContent = String(Math.floor(st.T)); }
      panel.ui.readout('step', `${Math.floor(st.T) >= e.N ? e.N : s} / ${e.N}`);
      if (s !== lastShown) { panel.ui.readout('now', st.T >= e.N ? '완성!' : e.describe(s)); panel.ui.readout('module', st.T >= e.N ? '—' : e.moduleOf(s)); lastShown = s; }
      panel.ui.readout('total', `부품 ${e.count}개 · 볼트 · 너트 ${e.nFast}개 · 모듈 ${e.groups}개`);
      if (st.follow && st.T < e.N) {
        tgt.copy(e.focusOf(s));
        const d = tgt.sub(view.controls.target).multiplyScalar(Math.min(1, dt * 3));
        view.controls.target.add(d); view.camera.position.add(d);
      }
    },
  };
}

// 파트별 단계 조립: 파트 고르기 → 한 단계씩 조립 · 분해 정도 → 마지막에 파트 연결
const STAGED = {
  'stage-eagle': { title: '독수리 — 파트별 조립', async make() { const e = await buildEagle(loadPart, progress); return { root: e.root, stages: Object.entries({ '01': '받침대', '02': '다리', '03': '몸통', '04': '얼굴 (목 · 머리)', '05': '날개', '06': '꼬리' }).map(([id, name]) => ({ id, name: `${name} — ${SHEETS[id]}` })) }; } },
  'stage-battlebot': { title: '배틀로봇 — 파트별 조립', async make() { const e = await buildBattlebot(loadPart, progress); return { root: e.root, stages: Object.entries(BB_SHEETS).map(([id, name]) => ({ id, name })) }; } },
  'stage-train': { title: '협동 기차 — 파트별 조립', async make() { return buildTrainStaged(loadPart, progress); } },
};
const stagedCache = {};
function progress(k) { const l = document.getElementById('loading'); l.textContent = `부품 불러오는 중… ${Math.round(k * 100)}%`; }
function stagedFunction(e) {
  const st = { k: 0, T: 0, play: true, speed: 1.5, explode: 0, follow: true, goal: null };
  const N = () => e.steps(st.k);
  const frame = () => { e.pose(st.k, N(), 0); const box = e.boxOf(st.k); view.frame(box, { dir: [-1, 0.75, -0.9], fit: st.k === 'final' ? 0.9 : 1.15, minDist: 20 }); e.pose(st.k, st.T, st.explode); };
  const build = () => {
    panel.ui.controls([
      { type: 'select', id: 'stage', label: '조립 파트', options: [...e.stages.map((s, i) => [String(i), `${i + 1}. ${s.name}`]), ['final', `${e.stages.length + 1}. 최종 연결 (파트 잇기)`]], value: String(st.k) },
      { type: 'toggle', id: 'play', label: '재생', value: st.play },
      { type: 'button', id: 'prev', label: '◀ 이전 단계' },
      { type: 'button', id: 'next', label: '다음 단계 ▶' },
      { type: 'slider', id: 'step', label: '단계로 이동', min: 0, max: N(), step: 1, value: Math.floor(st.T) },
      { type: 'slider', id: 'explode', label: '분해 (자세히 보기)', min: 0, max: 1, step: 0.05, value: st.explode },
      { type: 'slider', id: 'speed', label: '속도 (단계 / 초)', min: 0.25, max: 6, step: 0.25, value: st.speed },
      { type: 'toggle', id: 'follow', label: '카메라가 지금 부품을 따라감', value: st.follow },
      { type: 'button', id: 'nextStage', label: '다음 파트로 ▶▶' },
    ]);
    panel.ui.readouts([['stage', '파트'], ['step', '단계'], ['now', '지금'], ['total', '전체']]);
  };
  const ctl = (t) => [...document.querySelectorAll('.p-controls label')].find((l) => l.textContent.startsWith(t))?.querySelector('input');
  const pause = () => { st.play = false; const b = ctl('재생'); if (b) b.checked = false; };
  const setStage = (k) => { st.k = k; st.T = 0; st.goal = null; st.play = true; build(); frame(); };
  build(); frame();
  const tgt = new THREE.Vector3();
  let shown = '';
  return {
    onControl(id, v) {
      if (id === 'stage') setStage(v === 'final' ? 'final' : Number(v));
      else if (id === 'nextStage') setStage(st.k === 'final' ? 0 : st.k + 1 >= e.stages.length ? 'final' : st.k + 1);
      else if (id === 'play') { st.play = v; if (v && st.T >= N()) st.T = 0; }
      else if (id === 'prev') { pause(); st.goal = Math.max(0, Math.ceil(st.T) - 1); }
      else if (id === 'next') { pause(); st.goal = Math.min(N(), Math.floor(st.T) + 1); }
      else if (id === 'step') { pause(); st.T = Number(v); st.goal = null; }
      else st[id] = v;
    },
    update(dt) {
      dt = Math.min(dt, 0.05);
      if (st.goal !== null) { const d = st.goal - st.T; st.T += Math.sign(d) * Math.min(Math.abs(d), dt * 2.5); if (Math.abs(d) < 1e-3) { st.T = st.goal; st.goal = null; } }
      else if (st.play) { st.T = Math.min(N(), st.T + dt * st.speed); if (st.T >= N()) pause(); }
      e.pose(st.k, st.T, st.explode);
      const s = Math.min(N() - 1, Math.floor(st.T));
      const sl = ctl('단계로 이동'); if (sl && document.activeElement !== sl) { sl.value = String(Math.floor(st.T)); sl.nextElementSibling.textContent = String(Math.floor(st.T)); }
      const done = st.T >= N();
      const label = st.k === 'final' ? '최종 연결' : e.stages[st.k].name;
      const now = done ? (st.k === 'final' ? '완성!' : '이 파트 완성 — "다음 파트로"') : e.stepName(st.k, s);
      if (shown !== label + now) { panel.ui.readout('stage', label); panel.ui.readout('now', now); shown = label + now; }
      panel.ui.readout('step', `${done ? N() : s + 1} / ${N()}`);
      panel.ui.readout('total', `파트 ${e.stages.length}개 · 부품 ${e.count}개`);
      if (st.follow && !done) {
        tgt.copy(e.focus(st.k, s));
        const d = tgt.sub(view.controls.target).multiplyScalar(Math.min(1, dt * 2.5));
        view.controls.target.add(d); view.camera.position.add(d);
      }
    },
  };
}

// 썬더 개틀링 6연장 v3 (완성품): 4륜 전원 모터 · 서보 고각 · 원형 고무줄 탄성 격발 · 거치/격발 테스트(배경 반투명) · 완전 분해
let gatling = null;
function gatlingFunction(e) {
  const st = { drive: 'stop', aim: 0, liveAim: 0, auto: true, loop: false, slow: false, testMode: 'normal', testPhase: 0, testInfo: null, explode: 0, bolts: true, guides: true, dl: 0, dr: 0, yaw: 0, want: 0, budget: 0, shots: 0, camGoal: null };
  const speed = 130 / 60 * Math.PI * 2 * GAT_WHEEL_R;
  const W = 220 / 60 * Math.PI * 2;
  const stageById = new Map((e.testStages || []).map((t) => [t.id, t]));
  e.showBolts(true); e.setGuides(true); e.setExplode(0); e.updateTestMode(null);
  panel.ui.controls([
    {
      type: 'select', id: 'testMode', label: '🧪 메커니즘 테스트 (배경 반투명 격리)',
      options: [
        ['normal', '일반 완성품 (전체 100% 불투명)'],
        ['hook', '① 원형 고무줄 거치·당김 테스트 (배경 반투명)'],
        ['trigger', '② 12시 36.9° 쐐기 격발·탄성 발사 테스트 (배경 반투명)'],
      ],
      value: 'normal',
    },
    { type: 'select', id: 'drive', label: '4륜 전원 구동 (M1~M4)', options: [['stop', '정지'], ['fwd', '전진'], ['back', '후진'], ['left', '왼쪽 회전'], ['right', '오른쪽 회전']], value: 'stop' },
    { type: 'slider', id: 'aim', label: '고각 (서보 OUT1)', min: 0, max: Math.floor(GAT_TILT_MAX), step: 1, value: 0, unit: '°' },
    { type: 'button', id: 'fire1', label: '🎯 1발 발사 (원형 고무줄 탄성 비행)' },
    { type: 'button', id: 'fire6', label: '🔥 6발 연사' },
    { type: 'toggle', id: 'slow', label: '슬로우모션 (탄성·12시 쐐기 관찰)', value: false },
    { type: 'button', id: 'zoomAll', label: '🔄 로봇 전체 보기' },
    { type: 'toggle', id: 'auto', label: '원형 고무줄 자동 장전', value: true },
    { type: 'toggle', id: 'loop', label: '계속 발사', value: false },
    { type: 'slider', id: 'explode', label: '분해 보기 (모든 부품 · 볼트 · 너트 · 캡너트)', min: 0, max: 1, step: 0.01, value: 0 },
    { type: 'toggle', id: 'bolts', label: '볼트 · 너트 · 캡너트 보기 (분해 시 자동 포함)', value: true },
    { type: 'toggle', id: 'guides', label: '분해 가이드선 보기', value: true },
    ...Object.entries(GAT_SHEETS).map(([no, t]) => ({ type: 'toggle', id: 'g' + no, label: `${no} ${t.split(' (')[0]}`, value: true, compact: true })),
  ]);
  panel.ui.readouts([['parts', '실체 배치'], ['mech', '메커니즘 / 테스트 원리'], ['aim', '포탑 고각'], ['ammo', '원형 고무줄'], ['state', '상태']]);
  const testSelect = () => [...document.querySelectorAll('.p-controls label')].find((l) => l.textContent.includes('메커니즘 테스트'))?.querySelector('select');
  const exitTest = () => {
    if (st.testMode === 'normal') return;
    st.testMode = 'normal'; st.testPhase = 0; st.testInfo = null;
    e.updateTestMode(null);
    const el = testSelect(); if (el) el.value = 'normal';
  };
  return {
    onControl(id, v) {
      if (id.startsWith('g')) e.setHidden(id.slice(1), !v);
      else if (id === 'testMode') {
        if (v === 'normal') {
          exitTest();
          st.camGoal = null;
          e.root.updateMatrixWorld(true);
          view.frame(partBounds(e.root), { dir: [-0.9, 0.6, -1], fit: 1.15, minDist: 20 });
        } else {
          st.testMode = v; st.testPhase = 0; st.want = 0; st.budget = 0; st.drive = 'stop';
          st.explode = 0; e.setExplode(0);
          st.testInfo = e.updateTestMode(v, 0);
          const ts = stageById.get(v);
          if (ts?.cam) st.camGoal = { pos: new THREE.Vector3(...ts.cam.pos), target: new THREE.Vector3(...ts.cam.target) };
        }
      } else if (id === 'fire1') { exitTest(); st.want += 1; st.budget = Math.PI * 2.2; }
      else if (id === 'fire6') { exitTest(); st.want += 6; st.budget = Math.PI * 4.2; }
      else if (id === 'zoomAll') {
        exitTest();
        st.camGoal = null;
        e.root.updateMatrixWorld(true);
        view.frame(partBounds(e.root), { dir: [-0.9, 0.6, -1], fit: 1.15, minDist: 20 });
      } else if (id === 'explode') {
        st.explode = Number(v);
        if (st.explode > 0.005) exitTest();
        e.setExplode(st.explode);
      } else if (id === 'bolts') { st.bolts = v; e.showBolts(v); }
      else if (id === 'guides') { st.guides = v; e.setGuides(v); }
      else if (id === 'aim') st.aim = Number(v);
      else st[id] = v;
    },
    update(dt) {
      dt = Math.min(dt, 0.05);
      if (st.camGoal) {
        const k = Math.min(1, dt * 5);
        view.camera.position.lerp(st.camGoal.pos, k);
        view.controls.target.lerp(st.camGoal.target, k);
        if (view.camera.position.distanceTo(st.camGoal.pos) < 0.8) st.camGoal = null;
      }
      if (st.testMode !== 'normal' && st.explode < 0.005) {
        st.testPhase = (st.testPhase + dt * (st.slow ? 0.09 : 0.19)) % 1;
        st.testInfo = e.updateTestMode(st.testMode, st.testPhase);
      } else if (st.explode < 0.005) {
        const [l, r] = { stop: [0, 0], fwd: [1, 1], back: [-1, -1], left: [-1, 1], right: [1, -1] }[st.drive];
        if (l || r) { st.dl += l * speed * dt; st.dr += r * speed * dt; e.setWheels(-st.dl, -st.dr); }
        if (st.drive === 'left' || st.drive === 'right') { st.yaw += (st.drive === 'left' ? 1 : -1) * dt * 0.7; e.root.rotation.y = st.yaw; }
        if (Math.abs(st.aim - st.liveAim) > 0.01) { st.liveAim += Math.sign(st.aim - st.liveAim) * Math.min(Math.abs(st.aim - st.liveAim), dt * 20); e.setTilt(st.liveAim); }
        if (st.loop && st.auto) { st.want = Math.max(st.want, 1); st.budget = Math.PI * 2; }
        if (st.want > 0 && st.budget > 0) {
          const d = W * (st.slow ? 0.16 : 1) * dt; st.budget -= d;
          const n = e.spin(d, st.auto); st.shots += n; st.want -= n;
          if (st.want <= 0 || st.budget <= 0 || (!st.auto && e.loaded() === 0)) { st.want = 0; st.budget = 0; }
        }
        e.flyBands(dt * (st.slow ? 0.35 : 1));
      }
      panel.ui.readout('parts', `구조 ${e.structCount} + 체결 ${e.fastenerCount} = ${e.count}개 (4WD 전원 모터)`);
      if (st.testMode !== 'normal' && st.testInfo) {
        panel.ui.readout('mech', `[${st.testInfo.stage}] ${st.testInfo.detail}`);
        panel.ui.readout('ammo', `원형 고무줄 신장 ${Math.round(st.testInfo.stretch * 100)}% · 탄성 장력 ${st.testInfo.forceN.toFixed(1)} N`);
        panel.ui.readout('state', st.testMode === 'hook' ? '🧪 거치·당김 테스트 중 (배경 반투명)' : '🎯 12시 격발 트리거 테스트 중 (배경 반투명)');
      } else {
        panel.ui.readout('mech', '순수 원형 고무줄(Ø37): 총구 캡너트(−Z) ↔ 걸쇠 캡너트(+Z) → 12시 36.9° 쐐기 이탈 & 탄성 수축 비행');
        panel.ui.readout('ammo', `${e.loaded()} / 6 (매듭 0 · 관통 0) · 발사 ${st.shots}발`);
        panel.ui.readout('state', st.explode > 0.02 ? `완전 분해 ${(st.explode * 100).toFixed(0)}% (볼트 · 너트 · 캡너트 포함)` : st.want > 0 ? (st.slow ? '슬로우모션 탄성 격발 관찰 중' : '발사 중') : st.drive !== 'stop' ? '4WD 주행 중' : '대기');
      }
      panel.ui.readout('aim', `+${st.liveAim.toFixed(1)}° (서보 토크 ${GAT_GUN.servoNeed} kg·cm)`);
    },
    dispose() { e.reset(); e.root.rotation.y = 0; },
  };
}

// 개틀링 최대 세분화 단계별 조립 (352단계 = 부품·체결 350 + 거치/격발 메커니즘 테스트 2단계 · 배경 반투명!)
let gatlingSteps = null;
function gatlingStepFunction(ad) {
  const mechList = ad.mechSteps || [];
  const mechByStep = new Map(mechList.map((m) => [m.step1, m]));
  const testById = new Map((ad.testSteps || []).map((t) => [t.testId, t]));
  const st = { T: 0, play: true, speed: 4, follow: true, bolts: true, guides: true, testSlow: false, explode: 0, goal: null, mechIdx: 0, camGoal: null, testPhase: 0, lastTestId: null };
  ad.setBolts(true); ad.setGuides(true); ad.setExplode(0); ad.gatling?.updateTestMode(null);
  panel.ui.controls([
    { type: 'toggle', id: 'play', label: '재생', value: true },
    { type: 'button', id: 'prev', label: '◀ 이전 단계' },
    { type: 'button', id: 'next', label: '다음 단계 ▶' },
    { type: 'button', id: 'testHook', label: '🧪 ① 고무줄 거치·당김 테스트 단계 (배경 반투명)' },
    { type: 'button', id: 'testTrigger', label: '🎯 ② 12시 격발 트리거 테스트 단계 (배경 반투명)' },
    { type: 'toggle', id: 'testSlow', label: '테스트 슬로우모션 (탄성·이탈 정밀 관찰)', value: false },
    { type: 'button', id: 'nextMech', label: '🔍 메커니즘 부품 조립 단계 이동 (①→④)' },
    { type: 'slider', id: 'step', label: '단계로 이동', min: 0, max: ad.N, step: 1, value: 0 },
    { type: 'slider', id: 'speed', label: '속도 (단계 / 초)', min: 0.25, max: 16, step: 0.25, value: 4 },
    { type: 'slider', id: 'explode', label: '분해 보기 (부품 · 볼트 · 너트 · 캡너트)', min: 0, max: 1, step: 0.01, value: 0 },
    { type: 'toggle', id: 'follow', label: '카메라가 지금 작업을 따라감 (테스트·메커니즘 자동 확대)', value: true },
    { type: 'toggle', id: 'bolts', label: '볼트 · 너트 · 캡너트 보기 (분해 시 자동 포함)', value: true },
    { type: 'toggle', id: 'guides', label: '진입 · 체결 가이드선 보기', value: true },
    { type: 'button', id: 'restart', label: '처음부터' },
  ]);
  panel.ui.readouts([['step', '단계'], ['kind', '작업 유형'], ['now', '지금'], ['mech', '메커니즘 / 테스트 원리'], ['total', '전체']]);
  const slider = () => [...document.querySelectorAll('.p-controls label')].find((l) => l.textContent.includes('단계로 이동'))?.querySelector('input');
  const explodeSlider = () => [...document.querySelectorAll('.p-controls label')].find((l) => l.textContent.includes('분해 보기'))?.querySelector('input');
  const playBox = () => [...document.querySelectorAll('.p-controls label')].find((l) => l.textContent.startsWith('재생'))?.querySelector('input');
  const pause = () => { st.play = false; const b = playBox(); if (b) b.checked = false; };
  const jumpTest = (testId) => {
    const ts = testById.get(testId);
    if (!ts) return;
    pause();
    st.explode = 0; ad.setExplode(0);
    const ex = explodeSlider(); if (ex) { ex.value = '0'; ex.nextElementSibling.textContent = '0'; }
    st.T = ts.step1 - 0.5;
    st.goal = null;
    st.testPhase = 0;
    if (ts.cam) st.camGoal = { pos: new THREE.Vector3(...ts.cam.pos), target: new THREE.Vector3(...ts.cam.target) };
  };
  const tgt = new THREE.Vector3();
  let lastShown = -1;
  return {
    onControl(id, v) {
      if (id === 'play') { st.play = v; if (v && st.T >= ad.N) st.T = 0; }
      else if (id === 'prev') { pause(); st.goal = Math.max(0, Math.ceil(st.T) - 1); st.camGoal = null; }
      else if (id === 'next') { pause(); st.goal = Math.min(ad.N, Math.floor(st.T) + 1); st.camGoal = null; }
      else if (id === 'testHook') jumpTest('hook');
      else if (id === 'testTrigger') jumpTest('trigger');
      else if (id === 'nextMech' && mechList.length) {
        pause();
        const m = mechList[st.mechIdx % mechList.length];
        st.mechIdx = (st.mechIdx + 1) % mechList.length;
        st.T = m.step1 - 0.15;
        st.goal = null;
        if (m.mech?.cam) st.camGoal = { pos: new THREE.Vector3(...m.mech.cam.pos), target: new THREE.Vector3(...m.mech.cam.target) };
      } else if (id === 'step') { pause(); st.T = Number(v); st.goal = null; st.camGoal = null; }
      else if (id === 'explode') { st.explode = Number(v); ad.setExplode(st.explode); }
      else if (id === 'bolts') { st.bolts = v; ad.setBolts(v); }
      else if (id === 'guides') { st.guides = v; ad.setGuides(v); }
      else if (id === 'speed') st.speed = Number(v);
      else if (id === 'restart') {
        st.T = 0; st.goal = null; st.play = true; st.explode = 0; st.camGoal = null; st.testPhase = 0; st.lastTestId = null;
        ad.setExplode(0); ad.gatling?.updateTestMode(null);
        const b = playBox(); if (b) b.checked = true;
        const ex = explodeSlider(); if (ex) { ex.value = '0'; ex.nextElementSibling.textContent = '0'; }
      } else st[id] = v;
    },
    update(dt) {
      dt = Math.min(dt, 0.05);
      const curStepPre = Math.min(ad.N, Math.max(1, Math.floor(st.T) + 1));
      const onTestPre = st.T < ad.N ? ad.getTestStep(curStepPre) : null;
      if (st.goal !== null) {
        const d = st.goal - st.T;
        st.T += Math.sign(d) * Math.min(Math.abs(d), dt * 4);
        if (Math.abs(d) < 1e-3) { st.T = st.goal; st.goal = null; }
      } else if (st.play) {
        // 테스트 단계 재생 중에는 1사이클(약 5.5초) 동안 고무줄 거치/격발 시뮬레이션을 충분히 감상한 뒤 다음 단계로 진행!
        const rate = onTestPre ? (st.testSlow ? 0.09 : 0.18) : st.speed;
        st.T = Math.min(ad.N, st.T + dt * rate);
        if (st.T >= ad.N) pause();
      }
      ad.pose(st.T);
      const s = Math.min(ad.N, Math.max(1, Math.floor(st.T) + 1));
      const done = Math.floor(st.T);
      const ts = st.T < ad.N ? ad.getTestStep(s) : null;
      const sl = slider(); if (sl && document.activeElement !== sl) { sl.value = String(done); sl.nextElementSibling.textContent = String(done); }
      panel.ui.readout('step', `${done >= ad.N ? ad.N : s} / ${ad.N}`);

      if (ts && ad.gatling) {
        if (ts.testId !== st.lastTestId) {
          st.lastTestId = ts.testId;
          st.testPhase = 0;
          if (st.follow && ts.cam) st.camGoal = { pos: new THREE.Vector3(...ts.cam.pos), target: new THREE.Vector3(...ts.cam.target) };
        }
        if (!st.play) st.testPhase = (st.testPhase + dt * (st.testSlow ? 0.09 : 0.19)) % 1;
        const phase = st.play ? Math.max(0, Math.min(1, st.T - (s - 1))) : st.testPhase;
        const info = ad.gatling.updateTestMode(ts.testId, phase);
        panel.ui.readout('kind', ts.kind);
        panel.ui.readout('now', `${ad.stepName(s)} — ${info.stage}`);
        panel.ui.readout('mech', `[신장 ${Math.round(info.stretch * 100)}% · 장력 ${info.forceN.toFixed(1)} N] ${info.detail}`);
        lastShown = -3;
      } else {
        if (st.lastTestId !== null) {
          ad.gatling?.updateTestMode(null);
          st.lastTestId = null;
        }
        if (s !== lastShown || st.T >= ad.N) {
          const m = mechByStep.get(s);
          panel.ui.readout('kind', st.T >= ad.N ? '완성' : m ? `★ 메커니즘 학습 · ${m.mech.step}` : ad.stepKind(s));
          panel.ui.readout('now', st.T >= ad.N ? '완성! (🧪 거치·격발 테스트 버튼으로 언제든 원리 복습 가능)' : ad.stepName(s));
          panel.ui.readout('mech', st.T >= ad.N ? '순수 원형 고무줄: 총구 캡너트(−Z) ↔ 걸쇠 캡너트(+Z) → 12시 36.9° 쐐기 이탈 · 탄성 비행' : m ? `[${m.mech.role}] ${m.mech.explain}` : '— (🧪 거치 테스트 / 🎯 격발 테스트 버튼으로 배경 반투명 시뮬레이션 바로 보기)');
          if (m && st.follow && m.mech?.cam) {
            st.camGoal = { pos: new THREE.Vector3(...m.mech.cam.pos), target: new THREE.Vector3(...m.mech.cam.target) };
          }
          lastShown = st.T >= ad.N ? -2 : s;
        }
      }
      panel.ui.readout('total', `구조 ${GAT_GUN.structCount} + 체결 ${GAT_GUN.fastenerCount} + 테스트 2 = ${ad.N}단계`);
      if (st.camGoal) {
        const k = Math.min(1, dt * 4.5);
        view.camera.position.lerp(st.camGoal.pos, k);
        view.controls.target.lerp(st.camGoal.target, k);
        if (view.camera.position.distanceTo(st.camGoal.pos) < 0.8) st.camGoal = null;
      } else if (st.follow && st.T < ad.N && st.explode < 0.01 && !ts) {
        tgt.copy(ad.focus(s));
        const d = tgt.sub(view.controls.target).multiplyScalar(Math.min(1, dt * 3));
        view.controls.target.add(d); view.camera.position.add(d);
      }
    },
    dispose() { ad.clearHighlight(); ad.gatling?.updateTestMode(null); },
  };
}


// 크림슨 스콜피온 v3 (완성품): 4WD · 쌍발 400rpm 수직 낫 · 4절링크 집게 · 꼬리 해머 · 3무기 테스트 · 완전 분해
let scorpion = null;
function scorpionFunction(e) {
  const st = {
    drive: 'stop', spin: false, rpm: 0, spinAng: 0,
    claw: SCORP_NEUT, liveClaw: SCORP_NEUT,
    tail: SCORP_TAIL_READY, liveTail: SCORP_TAIL_READY,
    slow: false, combo: 0,
    testMode: 'normal', testPhase: 0, testInfo: null,
    explode: 0, bolts: true, guides: true,
    dl: 0, dr: 0, yaw: 0, camGoal: null,
  };
  const speed = 130 / 60 * Math.PI * 2 * SCORP_WHEEL_R;
  const stageById = new Map((e.testStages || []).map((t) => [t.id, t]));
  e.showBolts(true); e.setGuides(true); e.setExplode(0); e.updateTestMode(null);
  panel.ui.controls([
    {
      type: 'select', id: 'testMode', label: '🧪 메커니즘 테스트 (배경 반투명 격리)',
      options: [
        ['normal', '일반 완성품 (전체 100% 불투명)'],
        ['spin', '① 쌍발 400rpm 수직 어퍼컷 낫 테스트 (배경 반투명)'],
        ['claw', '② 좌·우 대칭 4절링크 집게 크러셔 테스트 (배경 반투명)'],
        ['tail', '③ 오버헤드 전갈 꼬리 해머 타격 테스트 (배경 반투명)'],
      ],
      value: 'normal',
    },
    { type: 'select', id: 'drive', label: '4륜 전원 구동 (M1~M4)', options: [['stop', '정지'], ['fwd', '전진'], ['back', '후진'], ['left', '왼쪽 회전'], ['right', '오른쪽 회전']], value: 'stop' },
    { type: 'toggle', id: 'spin', label: '쌍발 수직 어퍼컷 낫 (DC 400rpm × 2 · EX-M1/M2)', value: false },
    { type: 'slider', id: 'claw', label: '4절링크 집게 (72° 압착 ↔ 160° 열림)', min: SCORP_CLAMP, max: SCORP_OPEN, step: 1, value: SCORP_NEUT, unit: '°' },
    { type: 'slider', id: 'tail', label: '전갈 꼬리 해머 (0° 타격 ↔ 55° 대기)', min: SCORP_TAIL_SMASH, max: SCORP_TAIL_READY, step: 1, value: SCORP_TAIL_READY, unit: '°' },
    { type: 'button', id: 'combo', label: '🦂 3무기 필살 콤보 (포획 → 어퍼컷 → 꼬리 강타)' },
    { type: 'toggle', id: 'slow', label: '슬로우모션 관찰', value: false },
    { type: 'button', id: 'zoomAll', label: '🔄 로봇 전체 보기' },
    { type: 'slider', id: 'explode', label: '분해 보기 (모든 부품 · 볼트 · 너트 · 캡너트)', min: 0, max: 1, step: 0.01, value: 0 },
    { type: 'toggle', id: 'bolts', label: '볼트 · 너트 · 캡너트 보기 (분해 시 자동 포함)', value: true },
    { type: 'toggle', id: 'guides', label: '분해 가이드선 보기', value: true },
    ...Object.entries(SCORP_SHEETS).map(([no, t]) => ({ type: 'toggle', id: 'g' + no, label: `${no} ${t.split(' (')[0]}`, value: true, compact: true })),
  ]);
  panel.ui.readouts([['parts', '실체 배치'], ['mech', '메커니즘 / 테스트 원리'], ['spin', '쌍발 수직 낫'], ['claw', '4절링크 집게'], ['tail', '꼬리 해머']]);
  const testSelect = () => [...document.querySelectorAll('.p-controls label')].find((l) => l.textContent.includes('메커니즘 테스트'))?.querySelector('select');
  const exitTest = () => {
    if (st.testMode === 'normal') return;
    st.testMode = 'normal'; st.testPhase = 0; st.testInfo = null;
    e.updateTestMode(null);
    const el = testSelect(); if (el) el.value = 'normal';
  };
  return {
    onControl(id, v) {
      if (id.startsWith('g')) e.setHidden(id.slice(1), !v);
      else if (id === 'testMode') {
        if (v === 'normal') {
          exitTest(); st.camGoal = null;
          e.root.updateMatrixWorld(true);
          view.frame(partBounds(e.root), { dir: [-0.9, 0.6, -1], fit: 1.15, minDist: 20 });
        } else {
          st.testMode = v; st.testPhase = 0; st.combo = 0; st.drive = 'stop';
          st.explode = 0; e.setExplode(0);
          st.testInfo = e.updateTestMode(v, 0);
          const ts = stageById.get(v);
          if (ts?.cam) st.camGoal = { pos: new THREE.Vector3(...ts.cam.pos), target: new THREE.Vector3(...ts.cam.target) };
        }
      } else if (id === 'combo') { exitTest(); st.combo = 3.6; st.spin = true; }
      else if (id === 'zoomAll') {
        exitTest(); st.camGoal = null;
        e.root.updateMatrixWorld(true);
        view.frame(partBounds(e.root), { dir: [-0.9, 0.6, -1], fit: 1.15, minDist: 20 });
      } else if (id === 'explode') {
        st.explode = Number(v);
        if (st.explode > 0.005) exitTest();
        e.setExplode(st.explode);
      } else if (id === 'bolts') { st.bolts = v; e.showBolts(v); }
      else if (id === 'guides') { st.guides = v; e.setGuides(v); }
      else if (id === 'claw' || id === 'tail') st[id] = Number(v);
      else st[id] = v;
    },
    update(dt) {
      dt = Math.min(dt, 0.05);
      if (st.camGoal) {
        const k = Math.min(1, dt * 5);
        view.camera.position.lerp(st.camGoal.pos, k);
        view.controls.target.lerp(st.camGoal.target, k);
        if (view.camera.position.distanceTo(st.camGoal.pos) < 0.8) st.camGoal = null;
      }
      if (st.testMode !== 'normal' && st.explode < 0.005) {
        st.testPhase = (st.testPhase + dt * (st.slow ? 0.08 : 0.18)) % 1;
        st.testInfo = e.updateTestMode(st.testMode, st.testPhase);
      } else if (st.explode < 0.005) {
        const sc = st.slow ? 0.25 : 1;
        const [l, r] = { stop: [0, 0], fwd: [1, 1], back: [-1, -1], left: [-1, 1], right: [1, -1] }[st.drive];
        if (l || r) { st.dl += l * speed * dt * sc; st.dr += r * speed * dt * sc; e.setWheels(-st.dl, -st.dr); }
        if (st.drive === 'left' || st.drive === 'right') { st.yaw += (st.drive === 'left' ? 1 : -1) * dt * 0.7 * sc; e.root.rotation.y = st.yaw; }
        const targetRpm = st.spin ? 400 : 0;
        st.rpm += Math.sign(targetRpm - st.rpm) * Math.min(Math.abs(targetRpm - st.rpm), dt * 320);
        if (st.rpm > 0.5) { st.spinAng += (st.rpm / 60) * Math.PI * 2 * dt * sc; e.setSpin(st.spinAng); }
        let tgtClaw = st.claw, tgtTail = st.tail;
        if (st.combo > 0) {
          st.combo = Math.max(0, st.combo - dt * sc);
          const t = 3.6 - st.combo;
          if (t < 0.7) { tgtClaw = SCORP_OPEN; tgtTail = SCORP_TAIL_READY; }
          else if (t < 1.5) { tgtClaw = SCORP_CLAMP; tgtTail = SCORP_TAIL_READY; }
          else if (t < 2.3) { tgtClaw = SCORP_CLAMP; tgtTail = SCORP_TAIL_SMASH; }
          else if (t < 3.0) { tgtClaw = SCORP_CLAMP; tgtTail = SCORP_TAIL_READY; }
          else { tgtClaw = SCORP_NEUT; tgtTail = SCORP_TAIL_READY; }
          if (st.combo <= 0) st.spin = false;
        }
        if (Math.abs(tgtClaw - st.liveClaw) > 0.05) {
          st.liveClaw += Math.sign(tgtClaw - st.liveClaw) * Math.min(Math.abs(tgtClaw - st.liveClaw), dt * 160);
          e.setClaws(st.liveClaw, st.liveClaw);
        }
        if (Math.abs(tgtTail - st.liveTail) > 0.05) {
          st.liveTail += Math.sign(tgtTail - st.liveTail) * Math.min(Math.abs(tgtTail - st.liveTail), dt * 180);
          e.setTail(st.liveTail);
        }
      }
      panel.ui.readout('parts', `구조 ${e.structCount} + 체결 ${e.fastenerCount} = ${e.count}개 (BOM 506개 · ${SCORP_BOT.massG} g)`);
      if (st.testMode !== 'normal' && st.testInfo) {
        panel.ui.readout('mech', `[${st.testInfo.stage}] ${st.testInfo.detail}`);
      } else {
        panel.ui.readout('mech', st.explode > 0.02 ? `완전 분해 ${(st.explode * 100).toFixed(0)}%` : st.combo > 0 ? '🦂 3무기 필살 콤보 실행 중!' : '4절링크 집게(토크 2.87×) + 쌍발 400rpm 수직 낫 + 오버헤드 꼬리 해머');
      }
      panel.ui.readout('spin', `${st.rpm.toFixed(0)} rpm · 날 끝 ${(st.rpm / 60 * Math.PI * 0.104).toFixed(2)} m/s`);
      panel.ui.readout('claw', `서보 ${st.liveClaw.toFixed(0)}° (낫 여유 +12.1 mm)`);
      panel.ui.readout('tail', `${st.liveTail.toFixed(0)}° (낫 위 +${SCORP_BOT.tailSpinGap} mm 여유)`);
    },
    dispose() { e.reset(); e.root.rotation.y = 0; },
  };
}

// 크림슨 스콜피온 최대 세분화 단계별 조립 (501단계 = 부품·체결 498 + 3무기 메커니즘 테스트 3단계)
let scorpionSteps = null;
function scorpionStepFunction(ad) {
  const mechList = ad.mechSteps || [];
  const mechByStep = new Map(mechList.map((m) => [m.step1, m]));
  const testById = new Map((ad.testSteps || []).map((t) => [t.testId, t]));
  const st = { T: 0, play: true, speed: 5, follow: true, bolts: true, guides: true, testSlow: false, explode: 0, goal: null, mechIdx: 0, camGoal: null, testPhase: 0, lastTestId: null };
  ad.setBolts(true); ad.setGuides(true); ad.setExplode(0); ad.scorpion?.updateTestMode(null);
  panel.ui.controls([
    { type: 'toggle', id: 'play', label: '재생', value: true },
    { type: 'button', id: 'prev', label: '◀ 이전 단계' },
    { type: 'button', id: 'next', label: '다음 단계 ▶' },
    { type: 'button', id: 'testSpin', label: '🧪 ① 쌍발 400rpm 수직 낫 테스트 단계' },
    { type: 'button', id: 'testClaw', label: '🧪 ② 4절링크 집게 크러셔 테스트 단계' },
    { type: 'button', id: 'testTail', label: '🧪 ③ 전갈 꼬리 해머 타격 테스트 단계' },
    { type: 'toggle', id: 'testSlow', label: '테스트 슬로우모션', value: false },
    { type: 'button', id: 'nextMech', label: '🔍 메커니즘 부품 단계 이동 (①→⑥)' },
    { type: 'slider', id: 'step', label: '단계로 이동', min: 0, max: ad.N, step: 1, value: 0 },
    { type: 'slider', id: 'speed', label: '속도 (단계 / 초)', min: 0.25, max: 20, step: 0.25, value: 5 },
    { type: 'slider', id: 'explode', label: '분해 보기 (부품 · 볼트 · 너트 · 캡너트)', min: 0, max: 1, step: 0.01, value: 0 },
    { type: 'toggle', id: 'follow', label: '카메라가 지금 작업을 따라감', value: true },
    { type: 'toggle', id: 'bolts', label: '볼트 · 너트 · 캡너트 보기', value: true },
    { type: 'toggle', id: 'guides', label: '진입 · 체결 가이드선 보기', value: true },
    { type: 'button', id: 'restart', label: '처음부터' },
  ]);
  panel.ui.readouts([['step', '단계'], ['kind', '작업 유형'], ['now', '지금'], ['mech', '메커니즘 / 테스트 원리'], ['total', '전체']]);
  const slider = () => [...document.querySelectorAll('.p-controls label')].find((l) => l.textContent.includes('단계로 이동'))?.querySelector('input');
  const explodeSlider = () => [...document.querySelectorAll('.p-controls label')].find((l) => l.textContent.includes('분해 보기'))?.querySelector('input');
  const playBox = () => [...document.querySelectorAll('.p-controls label')].find((l) => l.textContent.startsWith('재생'))?.querySelector('input');
  const pause = () => { st.play = false; const b = playBox(); if (b) b.checked = false; };
  const jumpTest = (testId) => {
    const ts = testById.get(testId);
    if (!ts) return;
    pause();
    st.explode = 0; ad.setExplode(0);
    const ex = explodeSlider(); if (ex) { ex.value = '0'; ex.nextElementSibling.textContent = '0'; }
    st.T = ts.step1 - 0.5; st.goal = null; st.testPhase = 0;
    if (ts.cam) st.camGoal = { pos: new THREE.Vector3(...ts.cam.pos), target: new THREE.Vector3(...ts.cam.target) };
  };
  const tgt = new THREE.Vector3();
  let lastShown = -1;
  return {
    onControl(id, v) {
      if (id === 'play') { st.play = v; if (v && st.T >= ad.N) st.T = 0; }
      else if (id === 'prev') { pause(); st.goal = Math.max(0, Math.ceil(st.T) - 1); st.camGoal = null; }
      else if (id === 'next') { pause(); st.goal = Math.min(ad.N, Math.floor(st.T) + 1); st.camGoal = null; }
      else if (id === 'testSpin') jumpTest('spin');
      else if (id === 'testClaw') jumpTest('claw');
      else if (id === 'testTail') jumpTest('tail');
      else if (id === 'nextMech' && mechList.length) {
        pause();
        const m = mechList[st.mechIdx % mechList.length];
        st.mechIdx = (st.mechIdx + 1) % mechList.length;
        st.T = m.step1 - 0.15; st.goal = null;
        if (m.mech?.cam) st.camGoal = { pos: new THREE.Vector3(...m.mech.cam.pos), target: new THREE.Vector3(...m.mech.cam.target) };
      } else if (id === 'step') { pause(); st.T = Number(v); st.goal = null; st.camGoal = null; }
      else if (id === 'explode') { st.explode = Number(v); ad.setExplode(st.explode); }
      else if (id === 'bolts') { st.bolts = v; ad.setBolts(v); }
      else if (id === 'guides') { st.guides = v; ad.setGuides(v); }
      else if (id === 'speed') st.speed = Number(v);
      else if (id === 'restart') {
        st.T = 0; st.goal = null; st.play = true; st.explode = 0; st.camGoal = null; st.testPhase = 0; st.lastTestId = null;
        ad.setExplode(0); ad.scorpion?.updateTestMode(null);
        const b = playBox(); if (b) b.checked = true;
        const ex = explodeSlider(); if (ex) { ex.value = '0'; ex.nextElementSibling.textContent = '0'; }
      } else st[id] = v;
    },
    update(dt) {
      dt = Math.min(dt, 0.05);
      const curStepPre = Math.min(ad.N, Math.max(1, Math.floor(st.T) + 1));
      const onTestPre = st.T < ad.N ? ad.getTestStep(curStepPre) : null;
      if (st.goal !== null) {
        const d = st.goal - st.T;
        st.T += Math.sign(d) * Math.min(Math.abs(d), dt * 4);
        if (Math.abs(d) < 1e-3) { st.T = st.goal; st.goal = null; }
      } else if (st.play) {
        const rate = onTestPre ? (st.testSlow ? 0.08 : 0.18) : st.speed;
        st.T = Math.min(ad.N, st.T + dt * rate);
        if (st.T >= ad.N) pause();
      }
      ad.pose(st.T);
      const s = Math.min(ad.N, Math.max(1, Math.floor(st.T) + 1));
      const done = Math.floor(st.T);
      const ts = st.T < ad.N ? ad.getTestStep(s) : null;
      const sl = slider(); if (sl && document.activeElement !== sl) { sl.value = String(done); sl.nextElementSibling.textContent = String(done); }
      panel.ui.readout('step', `${done >= ad.N ? ad.N : s} / ${ad.N}`);

      if (ts && ad.scorpion) {
        if (ts.testId !== st.lastTestId) {
          st.lastTestId = ts.testId; st.testPhase = 0;
          if (st.follow && ts.cam) st.camGoal = { pos: new THREE.Vector3(...ts.cam.pos), target: new THREE.Vector3(...ts.cam.target) };
        }
        if (!st.play) st.testPhase = (st.testPhase + dt * (st.testSlow ? 0.08 : 0.18)) % 1;
        const phase = st.play ? Math.max(0, Math.min(1, st.T - (s - 1))) : st.testPhase;
        const info = ad.scorpion.updateTestMode(ts.testId, phase);
        panel.ui.readout('kind', ts.kind);
        panel.ui.readout('now', `${ad.stepName(s)} — ${info.stage}`);
        panel.ui.readout('mech', `[${info.metric}] ${info.detail}`);
        lastShown = -3;
      } else {
        if (st.lastTestId !== null) { ad.scorpion?.updateTestMode(null); st.lastTestId = null; }
        if (s !== lastShown || st.T >= ad.N) {
          const m = mechByStep.get(s);
          panel.ui.readout('kind', st.T >= ad.N ? '완성' : m ? `★ 메커니즘 학습 · ${m.mech.step}` : ad.stepKind(s));
          panel.ui.readout('now', st.T >= ad.N ? '크림슨 스콜피온 v3 완성!' : ad.stepName(s));
          panel.ui.readout('mech', st.T >= ad.N ? '4WD + 쌍발 400rpm 수직 낫 + 4절링크 집게(2.87×) + 전갈 꼬리 해머 검증 완료' : m ? `[${m.mech.role}] ${m.mech.explain}` : '—');
          if (m && st.follow && m.mech?.cam) st.camGoal = { pos: new THREE.Vector3(...m.mech.cam.pos), target: new THREE.Vector3(...m.mech.cam.target) };
          lastShown = st.T >= ad.N ? -2 : s;
        }
      }
      panel.ui.readout('total', `구조 ${SCORP_BOT.structCount} + 체결 ${SCORP_BOT.fastenerCount} + 테스트 3 = ${ad.N}단계`);
      if (st.camGoal) {
        const k = Math.min(1, dt * 4.5);
        view.camera.position.lerp(st.camGoal.pos, k);
        view.controls.target.lerp(st.camGoal.target, k);
        if (view.camera.position.distanceTo(st.camGoal.pos) < 0.8) st.camGoal = null;
      } else if (st.follow && st.T < ad.N && st.explode < 0.01 && !ts) {
        tgt.copy(ad.focus(s));
        const d = tgt.sub(view.controls.target).multiplyScalar(Math.min(1, dt * 3));
        view.controls.target.add(d); view.camera.position.add(d);
      }
    },
    dispose() { ad.clearHighlight(); ad.scorpion?.updateTestMode(null); },
  };
}

async function select(id) {
  if (id === 'scorpion') {
    if (current?.id === 'scorpion') return;
    const token = ++loadToken;
    const loading = document.getElementById('loading');
    loading.style.display = 'block';
    nav.querySelectorAll('a').forEach((a) => a.classList.toggle('on', a.dataset.id === 'scorpion'));
    const e = scorpion ?? await buildScorpion(loadPart, (k) => { loading.textContent = `크림슨 스콜피온 부품 불러오는 중… ${Math.round(k * 100)}%`; });
    loading.textContent = '불러오는 중…';
    if (token !== loadToken) return;
    scorpion = e;
    if (current) { current.fn?.dispose?.(); view.scene.remove(current.root); }
    overlay.clear();
    picks.length = 0;
    view.controls.zoomToCursor = true;
    e.reset();
    view.scene.add(e.root);
    e.root.updateMatrixWorld(true);
    const box = partBounds(e.root);
    view.frame(box, { dir: [-0.9, 0.6, -1], fit: 1.15, minDist: 20 });
    const size = box.getSize(new THREE.Vector3());
    panel.showSpec({
      name: '크림슨 스콜피온 v3 (3중 무기 배틀로봇)', url: 'https://github.com/popkn/3d-test/blob/parts/scorpion/BLUEPRINT.md',
      size: { x: Math.round(size.x), z: Math.round(size.z), y: Math.round(size.y), estimated: false, note: `v2 전수 감사 수정 완료 · 4WD 전원 DC130×4 + 쌍발 DC400×2 + 4절링크 집게(토크 ${SCORP_BOT.clawAdv}× · 그랩 포함 낫 여유 +12.1 mm) + 전갈 꼬리 해머(낫 위 +${SCORP_BOT.tailSpinGap} mm) · 구조 ${e.structCount} + 체결 ${e.fastenerCount} = ${e.count}개.` },
      function: '4륜 전원 주행(M1~M4), 쌍발 400rpm 수직 어퍼컷 초승달 낫(EX-M1/M2), 좌·우 대칭 4절링크 집게 크러셔(OUT1/OUT2), 오버헤드 전갈 꼬리 해머(OUT3). 상단 "🧪 메커니즘 테스트"에서 3대 무기를 배경 반투명 격리 상태로 관찰할 수 있습니다.',
      specs: [
        ...Object.entries(SCORP_SHEETS).map(([no, t]) => [`도면 ${no}`, t]),
        ['v2 검증', `충돌 0 · 스윕 0(그랩 포함) · 4절링크 오차 0.0000 mm · 헛바퀴 0`],
        ['볼트 · 너트 · 캡너트', Object.entries(e.bom).filter(([k]) => /^(bolt|nut|cap)/.test(k)).map(([k, n]) => `${k} ${n}`).join(' · ')],
        ['서포트 규격', Object.entries(e.spacers).sort((a, b) => a[0] - b[0]).map(([l, n]) => `${l}mm × ${n}`).join(' · ')],
      ],
      ports: [],
    });
    let fn = null;
    panel.reset((cid, v) => fn?.onControl?.(cid, v));
    fn = scorpionFunction(e);
    current = { id: 'scorpion', root: e.root, fn };
    loading.style.display = 'none';
    return;
  }
  if (id === 'scorpion-build') {
    if (current?.id === 'scorpion-build') return;
    const token = ++loadToken;
    const loading = document.getElementById('loading');
    loading.style.display = 'block';
    nav.querySelectorAll('a').forEach((a) => a.classList.toggle('on', a.dataset.id === 'scorpion-build'));
    const ad = scorpionSteps ?? await (async () => {
      const e = await buildScorpion(loadPart, (k) => { loading.textContent = `크림슨 스콜피온 부품 불러오는 중… ${Math.round(k * 100)}%`; });
      const keys = Object.keys(SCORP_SHEETS).filter((k) => e.order[k]);
      const a = detailAdapter(e.root, keys.map((k) => ({ no: k, name: SCORP_SHEETS[k], holders: e.order[k] })), {
        frameOpts: { dir: [-0.9, 0.6, -1], fit: 1.15, minDist: 20 },
        count: e.count, granular: true, hasBolts: true, guides: true, highlight: true, rate: 5,
        extraSteps: e.testStages,
        moduleDir: { '01': [0, -45, 0], '02': [0, 35, -95], '03': [0, -15, -75], '04': [0, 125, 35], '05': [0, 65, 25], '06': [0, 30, 85] },
      });
      a.scorpion = e;
      a.mechSteps = e.mechSteps.map((m) => ({ ...m, step1: a.stepOfHolder(m.h) }));
      return a;
    })();
    loading.textContent = '불러오는 중…';
    if (token !== loadToken) return;
    scorpionSteps = ad;
    if (current) { current.fn?.dispose?.(); view.scene.remove(current.root); }
    overlay.clear();
    picks.length = 0;
    view.controls.zoomToCursor = true;
    view.scene.add(ad.root);
    ad.scorpion?.updateTestMode(null);
    ad.setExplode(0); ad.pose(ad.N);
    ad.root.updateMatrixWorld(true);
    const box = partBounds(ad.root);
    ad.pose(0);
    view.frame(box, { dir: [-0.9, 0.6, -1], fit: 0.75, minDist: 20 });
    panel.showSpec({
      name: '크림슨 스콜피온 v3 — 501단계 세분화 + 3무기 테스트', url: 'https://github.com/popkn/3d-test/blob/parts/scorpion/BLUEPRINT.md',
      size: { x: Math.round(box.max.x - box.min.x), z: Math.round(box.max.z - box.min.z), y: Math.round(box.max.y - box.min.y), estimated: false, note: `규칙 10.3(498 부품·체결 세분화) + 규칙 10.6(수직 낫·4절링크 집게·꼬리 해머 3종 메커니즘 테스트 내장).` },
      function: '각 무기 조립 완료 직후 배경 반투명(opacity 12%) 격리 상태로 ① 쌍발 400rpm 수직 낫 ② 4절링크 집게 ③ 전갈 꼬리 해머 작동 테스트가 자동 재생됩니다.',
      specs: [['세분화 단계', `${ad.N}단계 (구조 ${SCORP_BOT.structCount} + 체결 ${SCORP_BOT.fastenerCount} + 메커니즘 테스트 3)`], ['v2 검증', '충돌 0 · 스윕 0(그랩 포함) · 4절링크 오차 0.0000 mm']],
      ports: [],
    });
    let fn = null;
    panel.reset((cid, v) => fn?.onControl?.(cid, v));
    fn = scorpionStepFunction(ad);
    current = { id: 'scorpion-build', root: ad.root, fn };
    loading.style.display = 'none';
    return;
  }
  if (id === 'gatling') {
    if (current?.id === 'gatling') return;
    const token = ++loadToken;
    const loading = document.getElementById('loading');
    loading.style.display = 'block';
    nav.querySelectorAll('a').forEach((a) => a.classList.toggle('on', a.dataset.id === 'gatling'));
    const e = gatling ?? await buildGatling(loadPart, (k) => { loading.textContent = `개틀링 부품 불러오는 중… ${Math.round(k * 100)}%`; });
    loading.textContent = '불러오는 중…';
    if (token !== loadToken) return;
    gatling = e;
    if (current) { current.fn?.dispose?.(); view.scene.remove(current.root); }
    overlay.clear();
    picks.length = 0;
    view.controls.zoomToCursor = true;
    e.reset();
    view.scene.add(e.root);
    e.root.updateMatrixWorld(true);
    const box = partBounds(e.root);
    view.frame(box, { dir: [-0.9, 0.6, -1], fit: 1.15, minDist: 20 });
    const size = box.getSize(new THREE.Vector3());
    panel.showSpec({
      name: '썬더 개틀링 6연장 v3 (원형 고무줄 탄성 격발 · 4륜 전원)', url: 'https://github.com/popkn/3d-test/blob/parts/gatling/BLUEPRINT.md',
      size: { x: Math.round(size.x), z: Math.round(size.z), y: Math.round(size.y), estimated: false, note: `규칙 2.5(4륜 전원 DC 130 직결 · 헛바퀴 0) · 규칙 10.6(순수 원형 고무줄 Ø37 탄성 물리 · 거치/격발 배경 반투명 테스트 · 고무줄 관통 0) · 구조 ${e.structCount} + 체결 ${e.fastenerCount} = ${e.count}개.` },
      function: `4륜 전원 주행(M1~M4), 서보 고각(OUT1, 0~${Math.floor(GAT_TILT_MAX)}°), 매듭 없는 단일 폐곡선 원형 고무줄 탄성 발사(DC 400 · EX-M1). 상단 "🧪 메커니즘 테스트"에서 배경 반투명 격리 상태로 ① 거치·당김 ② 12시 36.9° 쐐기 격발 원리를 직접 확인할 수 있습니다.`,
      specs: [
        ...Object.entries(GAT_SHEETS).map(([no, t]) => [`도면 ${no}`, t]),
        ['5중 자동 검증', `헛바퀴 0 · AABB 충돌 0 · 360° 스윕 0 · 고무줄 관통 0 · 동축 ${e.fastenerCount}개`],
        ['볼트 · 너트 · 캡너트', Object.entries(e.bom).filter(([k]) => /^(bolt|nut|cap)/.test(k)).map(([k, n]) => `${k} ${n}`).join(' · ')],
        ['서포트 규격', Object.entries(e.spacers).sort((a, b) => a[0] - b[0]).map(([l, n]) => `${l}mm × ${n}`).join(' · ')],
      ],
      ports: [],
    });
    let fn = null;
    panel.reset((cid, v) => fn?.onControl?.(cid, v));
    fn = gatlingFunction(e);
    current = { id: 'gatling', root: e.root, fn };
    loading.style.display = 'none';
    return;
  }
  if (id === 'gatling-build') {
    if (current?.id === 'gatling-build') return;
    const token = ++loadToken;
    const loading = document.getElementById('loading');
    loading.style.display = 'block';
    nav.querySelectorAll('a').forEach((a) => a.classList.toggle('on', a.dataset.id === 'gatling-build'));
    const ad = gatlingSteps ?? await (async () => {
      const e = await buildGatling(loadPart, (k) => { loading.textContent = `개틀링 부품 불러오는 중… ${Math.round(k * 100)}%`; });
      const keys = Object.keys(GAT_SHEETS).filter((k) => e.order[k]);
      let shown = null;
      const a = detailAdapter(e.root, keys.map((k) => ({ no: k, name: GAT_SHEETS[k], holders: e.order[k] })), {
        frameOpts: { dir: [-0.9, 0.6, -1], fit: 1.15, minDist: 20 },
        count: e.count, granular: true, hasBolts: true, guides: true, highlight: true, rate: 4,
        extraSteps: e.testStages,
        moduleDir: { '01': [0, -50, 0], '02': [0, 0, 120], '03': [0, 60, -110], '04': [0, 160, -15], '05': [-140, 20, 0] },
        onPose(T) { const v = T >= a.N - 0.001; if (v !== shown) { shown = v; e.showBands(v); } },
      });
      a.gatling = e;
      a.mechSteps = e.mechSteps.map((m) => ({ ...m, step1: a.stepOfHolder(m.h) }));
      return a;
    })();
    loading.textContent = '불러오는 중…';
    if (token !== loadToken) return;
    gatlingSteps = ad;
    if (current) { current.fn?.dispose?.(); view.scene.remove(current.root); }
    overlay.clear();
    picks.length = 0;
    view.controls.zoomToCursor = true;
    view.scene.add(ad.root);
    ad.gatling?.updateTestMode(null);
    ad.setExplode(0); ad.pose(ad.N);
    ad.root.updateMatrixWorld(true);
    const box = partBounds(ad.root);
    ad.pose(0);
    view.frame(box, { dir: [-0.9, 0.6, -1], fit: 0.75, minDist: 20 });
    panel.showSpec({
      name: '썬더 개틀링 6연장 v3 — 352단계 세분화 + 거치·격발 테스트', url: 'https://github.com/popkn/3d-test/blob/parts/gatling/BLUEPRINT.md',
      size: { x: Math.round(box.max.x - box.min.x), z: Math.round(box.max.z - box.min.z), y: Math.round(box.max.y - box.min.y), estimated: false, note: `규칙 10.3(350 부품·체결 세분화) + 규칙 10.6(조립 중 원형 고무줄 거치·당김 테스트 & 12시 쐐기 격발 테스트 2단계 내장 · 테스트 시 배경 반투명 격리).` },
      function: '1시 배럴 캡너트 조립 직후 "① 원형 고무줄 거치·당김 테스트", 12시 36.9° 쐐기 조립 직후 "② 격발 트리거 테스트"가 자동 확대·배경 반투명(opacity 12%)으로 재생됩니다. 🧪/🎯 버튼으로 즉시 이동해 반복 관찰할 수 있습니다.',
      specs: [['세분화 단계', `${ad.N}단계 (구조 ${GAT_GUN.structCount} + 체결 ${GAT_GUN.fastenerCount} + 메커니즘 테스트 2)`], ['5중 검증', '헛바퀴 0 · 충돌 0 · 스윕 0 · 고무줄 관통 0 · 동축 완료']],
      ports: [],
    });
    let fn = null;
    panel.reset((cid, v) => fn?.onControl?.(cid, v));
    fn = gatlingStepFunction(ad);
    current = { id: 'gatling-build', root: ad.root, fn };
    loading.style.display = 'none';
    return;
  }
  if (STAGED[id]) {
    if (current?.id === id) return;
    const token = ++loadToken;
    const loading = document.getElementById('loading');
    loading.style.display = 'block';
    nav.querySelectorAll('a').forEach((a) => a.classList.toggle('on', a.dataset.id === id));
    const e = stagedCache[id] ?? await (async () => { const m = await STAGED[id].make(); return { ...createStaged(m.root, m), root: m.root }; })();
    loading.textContent = '불러오는 중…';
    if (token !== loadToken) return;
    stagedCache[id] = e;
    if (current) { current.fn?.dispose?.(); view.scene.remove(current.root); }
    overlay.clear();
    picks.length = 0;
    view.controls.zoomToCursor = true;
    view.scene.add(e.root);
    e.restore();
    const box = e.boxOf('final');
    panel.showSpec({
      name: STAGED[id].title, url: 'https://github.com/popkn/3d-test/blob/main/ASSEMBLY_RULES.md',
      size: { x: Math.round(box.max.x - box.min.x), z: Math.round(box.max.z - box.min.z), y: Math.round(box.max.y - box.min.y), estimated: false, note: '파트마다 따로 조립한 뒤 마지막에 연결한다. 같은 부품이 이어지면 한 단계로 묶음.' },
      function: '조립 파트를 고르면 그 파트만 한 단계씩 조립된다. "분해"를 올리면 부품이 벌어져 자세히 볼 수 있다. 마지막 "최종 연결"에서 완성된 파트들이 하나씩 제자리로 붙는다. 부품에 마우스를 올리면 이름이 나온다.',
      specs: e.stages.map((s, i) => [`파트 ${i + 1}`, `${s.name} (${e.steps(i)}단계)`]),
      ports: [],
    });
    let fn = null;
    panel.reset((cid, v) => fn?.onControl?.(cid, v));
    fn = stagedFunction(e);
    current = { id, root: e.root, fn: { ...fn, dispose() { e.restore(); } } };
    loading.style.display = 'none';
    return;
  }
  if (id === 'train-build') {
    if (current?.id === 'train-build') return;
    const token = ++loadToken;
    const loading = document.getElementById('loading');
    loading.style.display = 'block';
    nav.querySelectorAll('a').forEach((a) => a.classList.toggle('on', a.dataset.id === 'train-build'));
    const e = trainSteps ?? await buildTrainSteps(loadPart, (k) => { loading.textContent = `부품 불러오는 중… ${Math.round(k * 100)}%`; });
    loading.textContent = '불러오는 중…';
    if (token !== loadToken) return;
    trainSteps = e;
    if (current) { current.fn?.dispose?.(); view.scene.remove(current.root); }
    overlay.clear();
    picks.length = 0;
    view.controls.zoomToCursor = true;
    view.scene.add(e.root);
    e.pose(e.N);
    e.root.updateMatrixWorld(true);
    const box = partBounds(e.root);
    e.pose(0);
    view.frame(box, { dir: [-1, 0.7, -0.8], fit: 0.55, minDist: 20 });
    panel.showSpec({
      name: '협동 기차 — 단계별 조립', url: 'https://github.com/popkn/3d-test/blob/main/src/train/tree.js',
      size: { x: Math.round(box.max.x - box.min.x), z: Math.round(box.max.z - box.min.z), y: Math.round(box.max.y - box.min.y), estimated: false, note: '단계 하나 = 부품 하나 + 그 단계의 볼트 · 너트. 모듈은 옆(또는 위) 작업대에서 따로 조립한 뒤 통째로 끼운다. 바퀴 · 바퀴 축 · 버기 바퀴는 세트 부품 하나.' },
      function: '재생하면 바닥판부터 한 단계씩 조립된다. 이상한 곳이 보이면 일시정지하고 이전/다음 단계로 확인하세요. 부품에 마우스를 올리면 이름이 나온다.',
      specs: [['단계', `${e.N}단계 (부품 ${e.count} · 모듈 ${e.groups})`], ['구멍 맞춤 검사', e.errors.length ? `오류 ${e.errors.length}건` : '오류 0건'],
        ...e.rules.map((r, k) => [`기본 규칙 ${k + 1}칸`, r.errors.length ? r.errors.join(' / ') : `✔ ${r.summary}`])],
      ports: [],
    });
    let fn = null;
    panel.reset((cid, v) => fn?.onControl?.(cid, v));
    fn = stepFunction(e);
    current = { id: 'train-build', root: e.root, fn: { ...fn, dispose() {} } };
    loading.style.display = 'none';
    return;
  }
  if (id === 'train') {
    if (current?.id === 'train') return;
    const token = ++loadToken;
    const loading = document.getElementById('loading');
    loading.style.display = 'block';
    nav.querySelectorAll('a').forEach((a) => a.classList.toggle('on', a.dataset.id === 'train'));
    const e = train ?? await buildTrain(loadPart, (k) => { loading.textContent = `부품 불러오는 중… ${Math.round(k * 100)}%`; });
    loading.textContent = '불러오는 중…';
    if (token !== loadToken) return;
    train = e;
    if (current) { current.fn?.dispose?.(); view.scene.remove(current.root); }
    overlay.clear();
    picks.length = 0;
    view.controls.zoomToCursor = true;
    e.reset();
    view.scene.add(e.root);
    e.root.updateMatrixWorld(true);
    const box = partBounds(e.root);
    view.frame(box, { dir: [-1, 0.55, -0.7], fit: 1.0, minDist: 20 });
    const size = box.getSize(new THREE.Vector3());
    panel.showSpec({
      name: '협동 기차 하나로 열차 (조립 규칙으로 조립)', url: 'https://github.com/popkn/3d-test/blob/main/ASSEMBLY_GUIDE.md',
      size: { x: Math.round(size.x), z: Math.round(size.z), y: Math.round(size.y), estimated: false, note: 'ASSEMBLY_GUIDE.md 규칙으로 조립: 좌표로 놓은 것은 칸마다 바닥판 하나, 나머지는 모두 "구멍 ↔ 구멍" 짝으로 위치를 계산 (src/train/tree.js). 볼트 · 너트도 겹친 두께로 자동 선택.' },
      function: '칸마다 CPU · 블루투스 · 모터가 따로 있어 세 사람이 한 칸씩 조종한다. 같은 방향이면 잘 달리고, 엇갈리면 연결봉으로 서로 끌고 밀며 이상하게 움직인다 (멈추지 않음). 아래에서 칸마다 방향을 골라 보세요.',
      specs: [...Object.entries(e.subs).map(([no, t]) => [`조립 ${no}`, t]),
        ['규칙 검사', e.errors.length ? e.errors.slice(0, 5).join(' / ') : `오류 0건 · 구멍 짝 어긋남 0.2 mm 이내 · 볼트 2개 이상`],
        ...e.warnings.filter((w, i, a) => a.findIndex((x) => x.replace(/^.*?: /, '') === w.replace(/^.*?: /, '')) === i).map((w) => ['경고', w]),
        ['볼트 · 너트', Object.entries(e.bom).filter(([k]) => /^(bolt|nut)/.test(k)).map(([k, n]) => `${k} ${n}`).join(' · ')]],
      ports: [],
    });
    let fn = null;
    panel.reset((cid, v) => fn?.onControl?.(cid, v));
    fn = trainFunction(e);
    current = { id: 'train', root: e.root, fn: { ...fn, dispose() {} } };
    loading.style.display = 'none';
    return;
  }
  if (id === 'battlebot') {
    if (current?.id === 'battlebot') return;
    const token = ++loadToken;
    const loading = document.getElementById('loading');
    loading.style.display = 'block';
    nav.querySelectorAll('a').forEach((a) => a.classList.toggle('on', a.dataset.id === 'battlebot'));
    const e = bot ?? await buildBattlebot(loadPart, (k) => { loading.textContent = `부품 불러오는 중… ${Math.round(k * 100)}%`; });
    loading.textContent = '불러오는 중…';
    if (token !== loadToken) return;
    bot = e;
    if (current) { current.fn?.dispose?.(); view.scene.remove(current.root); }
    overlay.clear();
    picks.length = 0;
    view.controls.zoomToCursor = true;
    view.scene.add(e.root);
    e.root.updateMatrixWorld(true);
    const box = partBounds(e.root);
    view.frame(box, { dir: [-0.9, 0.7, -1], fit: 1.25, minDist: 20 });
    const size = box.getSize(new THREE.Vector3());
    panel.showSpec({
      name: '배틀로봇 썬더 웨지 (설계도면 조립)', url: 'https://github.com/popkn/3d-test/blob/main/battlebot/BLUEPRINT.md',
      size: { x: Math.round(size.x), z: Math.round(size.z), y: Math.round(size.y), estimated: false, note: 'battlebot/BLUEPRINT.md 도면 좌표대로 이 저장소의 부품 모델을 놓아 조립했습니다. 볼트 · 너트 · 케이블은 생략.' },
      function: '무한궤도로 달리고, 서보 웨지로 상대를 들어 올려 수평 스피너(배틀무기 U + V 십자 날)로 친다. 궤도 마디는 경로를 따라 실제로 돈다.',
      specs: Object.entries(BB_SHEETS).map(([no, t]) => [`도면 ${no}`, t]),
      ports: [],
    });
    let fn = null;
    panel.reset((cid, v) => fn?.onControl?.(cid, v));
    fn = botFunction(e);
    current = { id: 'battlebot', root: e.root, fn: { ...fn, dispose() { e.root.rotation.y = 0; } } };
    loading.style.display = 'none';
    return;
  }
  if (id === 'eagle') {
    if (current?.id === 'eagle') return;
    const token = ++loadToken;
    document.getElementById('loading').style.display = 'block';
    nav.querySelectorAll('a').forEach((a) => a.classList.toggle('on', a.dataset.id === 'eagle'));
    const e = eagle ?? await showEagle(token);
    if (!e) return;
    eagle = e;
    if (current) { current.fn?.dispose?.(); view.scene.remove(current.root); }
    overlay.clear();
    picks.length = 0;
    view.controls.zoomToCursor = true;
    view.scene.add(e.root);
    e.root.updateMatrixWorld(true);
    const box = partBounds(e.root);
    view.frame(box, { dir: [-0.9, 0.55, -1], fit: 1.15, minDist: 20 });
    const size = box.getSize(new THREE.Vector3());
    panel.showSpec({
      name: '독수리 로봇 (설계도면 조립)', url: 'https://github.com/popkn/3d-test/blob/main/eagle/BLUEPRINT.md',
      size: { x: Math.round(size.x), z: Math.round(size.z), y: Math.round(size.y), estimated: false, note: 'eagle/BLUEPRINT.md 도면의 좌표대로 이 저장소의 부품 모델을 하나씩 놓아 조립했습니다. 볼트 · 너트 · 케이블은 생략.' },
      function: '흰머리수리가 횃대를 움켜쥐고 앉은 모습. 서보 2개로 날갯짓, 서보 1개로 머리를 돌린다. 부품에 마우스를 올리면 이름이 보입니다.',
      specs: Object.entries(SHEETS).map(([no, t]) => [`도면 ${no}`, t]),
      ports: [],
    });
    let fn = null;
    panel.reset((cid, v) => fn?.onControl?.(cid, v));
    fn = eagleFunction(e);
    current = { id: 'eagle', root: e.root, fn: { ...fn, dispose() {} } };
    document.getElementById('loading').style.display = 'none';
    return;
  }
  if (id === 'all') {
    if (current?.id === 'all') return;
    const token = ++loadToken;
    document.getElementById('loading').style.display = 'block';
    nav.querySelectorAll('a').forEach((a) => a.classList.toggle('on', a.dataset.id === 'all'));
    const res = await showAll(token);
    if (!res) return;
    if (current) { current.fn?.dispose?.(); view.scene.remove(current.root); }
    overlay.clear();
    view.scene.add(res.root);
    res.root.updateMatrixWorld(true);
    const box = partBounds(res.root);
    view.frame(box, { dir: [0, 1.6, 1], fit: 0.95, minDist: 30 });
    view.controls.zoomToCursor = true; // 마우스가 가리키는 곳으로 확대
    // 부품 이름은 처음 거리의 40%보다 가까이 확대했을 때만 보인다
    const d0 = view.camera.position.distanceTo(view.controls.target);
    for (const l of res.labels) if (l.small) l.maxDist = d0 * 0.4;
    overlay.setLabels(res.labels);
    const size = box.getSize(new THREE.Vector3());
    panel.showSpec({
      name: '전체 부품 펼쳐보기', url: '#all',
      size: { x: Math.round(size.x), z: Math.round(size.z), y: Math.round(size.y), estimated: false, note: '모든 부품을 실제 크기(1 = 1 mm) 그대로 분류별 줄로 늘어놓았습니다. 부품을 누르면 그 부품의 자세한 화면과 기능으로 갑니다.' },
      function: '드래그로 돌리고 휠로 확대해서 부품 크기를 서로 비교해 보세요. 가까이 확대하면 부품 이름이 나타납니다. LABELS로 이름표를 끄고 켭니다.',
      specs: categories.map(([cat, title]) => [title, `${catalog.filter((p) => p.category === cat).length}개`]).filter(([, n]) => n !== '0개').concat([['합계', `${catalog.length}개`]]),
      ports: [],
    });
    panel.reset(() => {});
    current = { id: 'all', root: res.root, fn: null };
    document.getElementById('loading').style.display = 'none';
    return;
  }
  picks.length = 0;
  view.controls.zoomToCursor = false;
  const spec = catalog.find((p) => p.id === id) ?? catalog[0];
  if (current?.id === spec.id) return;
  const token = ++loadToken;
  document.getElementById('loading').style.display = 'block';
  nav.querySelectorAll('a').forEach((a) => a.classList.toggle('on', a.dataset.id === spec.id));
  const part = await loadPart(spec.id);
  if (token !== loadToken) return;

  // 이전 부품 정리
  if (current) {
    current.fn?.dispose?.();
    view.scene.remove(current.root);
  }
  overlay.clear();

  // 새 부품: 바닥 위 가운데에 놓는다
  const model = part.build();
  const root = new THREE.Group();
  root.add(model.object3d);
  view.scene.add(root);
  const box = partBounds(root);
  const c = box.getCenter(new THREE.Vector3());
  model.object3d.position.set(-c.x, -box.min.y, -c.z);
  const fitted = partBounds(root);
  // 카메라는 시연용 물체(볼트, 공 등, model.frameWith)까지 보이도록 맞춘다
  view.frame(partBounds(root, { include: model.frameWith || [] }));
  overlay.setLabels(model.labels);
  overlay.setDims(fitted, spec.size);

  // 정보와 기능
  panel.showSpec(spec);
  let fn = null;
  panel.reset((cid, v) => fn?.onControl?.(cid, v));
  fn = part.createFunction(model, panel.ui);
  current = { id: spec.id, root, fn };
  document.getElementById('loading').style.display = 'none';
}

window.addEventListener('hashchange', () => select(location.hash.slice(1)));

// 독수리 화면: 마우스를 올린 부품 이름 표시
const tipEl = document.createElement('div');
tipEl.className = 'tag hover-tip';
tipEl.style.cssText = 'position:absolute;pointer-events:none;opacity:0;z-index:5';
stage.appendChild(tipEl);
view.renderer.domElement.addEventListener('pointermove', (e) => {
  const asm = current?.id === 'scorpion' ? scorpion : current?.id === 'scorpion-build' ? scorpionSteps : current?.id === 'gatling' ? gatling : current?.id === 'gatling-build' ? gatlingSteps : current?.id === 'eagle' ? eagle : current?.id === 'battlebot' ? bot : current?.id === 'train' ? train : current?.id === 'train-build' ? trainSteps : STAGED[current?.id] ? stagedCache[current.id] : null;
  if (!asm) { tipEl.style.opacity = 0; return; }
  const r = view.renderer.domElement.getBoundingClientRect();
  const v = new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  const rc = new THREE.Raycaster(); rc.setFromCamera(v, view.camera);
  const hit = rc.intersectObject(asm.root, true).find((h) => h.object.visible);
  let o = hit?.object; while (o && !o.userData?.id) o = o.parent;
  if (!o) { tipEl.style.opacity = 0; return; }
  tipEl.innerHTML = `${o.userData.name}<small>${o.userData.id} · ${current?.id?.startsWith("train") ? "조립" : "도면"} ${o.userData.sheet}</small>`;
  tipEl.style.opacity = 1;
  tipEl.style.transform = `translate(${e.clientX - r.left + 14}px, ${e.clientY - r.top + 10}px)`;
});

// 펼쳐보기에서 부품 누르기 (끌어서 돌린 경우는 무시)
const ray = new THREE.Raycaster(), ptr = new THREE.Vector2();
let down = null;
view.renderer.domElement.addEventListener('pointerdown', (e) => { down = [e.clientX, e.clientY]; });
view.renderer.domElement.addEventListener('pointerup', (e) => {
  if (!picks.length || !down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 5) return;
  const r = view.renderer.domElement.getBoundingClientRect();
  ptr.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  ray.setFromCamera(ptr, view.camera);
  const hit = ray.intersectObjects(picks.map((p) => p.root), true).find((h) => h.object.visible);
  if (!hit) return;
  const pick = picks.find((p) => { let o = hit.object; while (o) { if (o === p.root) return true; o = o.parent; } return false; });
  if (pick) location.hash = pick.id;
});
select(location.hash.slice(1) || catalog[0].id);

// 실행 루프
const timer = new THREE.Timer();
view.renderer.setAnimationLoop((ts) => {
  timer.update(ts);
  const dt = Math.min(timer.getDelta(), 0.1);
  view.controls.update();
  current?.fn?.update?.(dt, timer.getElapsed());
  view.scene.updateMatrixWorld();
  overlay.update(view.camera, { showLabels: opts.labels, showDims: opts.dims });
  view.renderer.render(view.scene, view.camera);
});

window.__view = view;
window.__select = select;
window.__picks = picks;
