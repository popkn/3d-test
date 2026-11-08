import * as THREE from 'three';
import { catalog, categories, loadPart } from './catalog/index.js';
import { createScene, partBounds } from './viewer/scene.js';
import { createOverlay } from './viewer/overlay.js';
import { createPanel } from './viewer/panel.js';
import { buildEagle, EXPLODE, WING_SPREAD } from './eagle/assemble.js';
import { SHEETS, BOM_TOTAL } from './eagle/assembly.js';

// 로보로보 부품 뷰어: 왼쪽 목록에서 부품을 고르면 3D 모양과 기능(조작 패널)을 불러온다.
const stage = document.getElementById('stage');
const view = createScene(stage);
const overlay = createOverlay(stage);
view.scene.add(overlay.dimGroup);
const panel = createPanel(document.getElementById('panel'));
const opts = { labels: true, dims: true, spin: false };

// 목록
const nav = document.getElementById('parts');
nav.innerHTML = `<a href="#eagle" data-id="eagle" class="all"><b>🦅 독수리 조립 (설계도면)</b><small>부품으로 조립한 독수리 · 날갯짓 · 분해 보기</small></a><a href="#all" data-id="all" class="all"><b>▦ 전체 펼쳐보기</b><small>${catalog.length}개 부품 · 실제 크기로 한 화면에</small></a>` + categories.map(([cat, title]) => `
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

async function select(id) {
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
      name: '독수리 로봇 (설계도면 조립)', url: 'https://github.com/popkn/3d-test/blob/로보로보-3d-test/eagle/BLUEPRINT.md',
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
  if (current?.id !== 'eagle' || !eagle) { tipEl.style.opacity = 0; return; }
  const r = view.renderer.domElement.getBoundingClientRect();
  const v = new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  const rc = new THREE.Raycaster(); rc.setFromCamera(v, view.camera);
  const hit = rc.intersectObject(eagle.root, true).find((h) => h.object.visible);
  let o = hit?.object; while (o && !o.userData?.id) o = o.parent;
  if (!o) { tipEl.style.opacity = 0; return; }
  tipEl.innerHTML = `${o.userData.name}<small>${o.userData.id} · 도면 ${o.userData.sheet}</small>`;
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
