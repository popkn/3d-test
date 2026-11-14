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
nav.innerHTML = `<a href="#eagle" data-id="eagle" class="all"><b>🦅 독수리 조립 (설계도면)</b><small>부품으로 조립한 독수리 · 날갯짓 · 분해 보기</small></a><a href="#battlebot" data-id="battlebot" class="all"><b>⚔ 배틀로봇 썬더 웨지</b><small>무한궤도 · 스피너 · 들어올림 웨지</small></a><a href="#train" data-id="train" class="all"><b>🚂 협동 기차 하나로 열차</b><small>3칸 · 칸마다 CPU · 3명이 따로 조종</small></a><a href="#stage-eagle" data-id="stage-eagle" class="all"><b>🔧 독수리 파트별 조립</b><small>받침대 · 다리 · 몸통 · 얼굴 · 날개 · 꼬리 → 연결 · 분해</small></a><a href="#stage-battlebot" data-id="stage-battlebot" class="all"><b>🔧 배틀로봇 파트별 조립</b><small>섀시 · 구동부 · 무기 · 웨지 · 상판 · 장갑 → 연결 · 분해</small></a><a href="#stage-train" data-id="stage-train" class="all"><b>🔧 기차 파트별 조립</b><small>칸마다 차대 · 차체 → 연결봉 · 분해</small></a><a href="#train-build" data-id="train-build" class="all"><b>🔧 기차 단계별 조립 (모듈 작업대)</b><small>부품 하나씩 · 모듈은 따로 조립 후 끼우기</small></a><a href="#all" data-id="all" class="all"><b>▦ 전체 펼쳐보기</b><small>${catalog.length}개 부품 · 실제 크기로 한 화면에</small></a>` + categories.map(([cat, title]) => `
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

async function select(id) {
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
  const asm = current?.id === 'eagle' ? eagle : current?.id === 'battlebot' ? bot : current?.id === 'train' ? train : current?.id === 'train-build' ? trainSteps : STAGED[current?.id] ? stagedCache[current.id] : null;
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
