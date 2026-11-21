// 완성 로봇 파일 불러오기 · 자동 업데이트
// 1) 앱 안 기본본 (APK에 들어 있는 robots/)  2) 휴대폰에 저장한 최신본 (IndexedDB)  3) GitHub main의 최신본
// 앱을 열면 저장본(없으면 기본본)으로 바로 시작하고, 뒤에서 GitHub를 확인해 바뀐 로봇만 받아 저장한다.
// 단일 HTML(로봇 하나 내려받기)에서는 HTML 안에 들어 있는 로봇 코드만 쓴다.

export const REMOTE = 'https://raw.githubusercontent.com/popkn/3d-test/main/app/robots/';
const LOCAL = './robots/';
const DB = 'roborobo-robots', STORE = 'files';

function idb() {
  return new Promise((ok, no) => {
    const r = indexedDB.open(DB, 1);
    r.onupgradeneeded = () => r.result.createObjectStore(STORE);
    r.onsuccess = () => ok(r.result);
    r.onerror = () => no(r.error);
  });
}
async function dbGet(key) {
  try { const db = await idb(); return await new Promise((ok) => { const q = db.transaction(STORE).objectStore(STORE).get(key); q.onsuccess = () => ok(q.result); q.onerror = () => ok(undefined); }); } catch (e) { return undefined; }
}
async function dbPut(key, val) {
  try { const db = await idb(); await new Promise((ok) => { const t = db.transaction(STORE, 'readwrite'); t.objectStore(STORE).put(val, key); t.oncomplete = ok; t.onerror = ok; }); } catch (e) { /* 저장 못 해도 다음에 다시 받음 */ }
}
async function getText(url, ms = 8000) {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), ms);
  try { const r = await fetch(url, { cache: 'no-store', signal: ctl.signal }); if (!r.ok) throw new Error(r.status); return await r.text(); } finally { clearTimeout(timer); }
}

let index = null;                 // { updated, robots: [{ id, name, mods, file, version }] }
const codes = {};                 // id → 로봇 코드 (내려받기 HTML에도 넣는다)
const SINGLE_CODE = window.__ROBOT_CODE || null;

// 앱을 열 때: 쓸 목록 (저장본 → 기본본 순서, 더 새 것)
export async function initRobots() {
  if (SINGLE_CODE) {
    index = { robots: Object.keys(SINGLE_CODE).map((id) => ({ id, name: window.__SINGLE?.name || id, mods: window.__ROBOT_META?.[id]?.mods || 0 })) };
    Object.assign(codes, SINGLE_CODE);
    return index.robots;
  }
  let local = null;
  try { local = JSON.parse(await getText(LOCAL + 'index.json', 4000)); } catch (e) { /* 기본본 없음 */ }
  const saved = await dbGet('index');
  index = saved && (!local || saved.updated >= local.updated) ? saved : local || { robots: [] };
  return index.robots;
}

// 로봇 하나의 어댑터 모듈 (저장본 → 기본본 → GitHub)
export async function loadRobot(id) {
  if (!codes[id]) {
    const r = index?.robots.find((x) => x.id === id);
    const saved = await dbGet('code:' + id);
    if (saved && (!r || saved.version === r.version)) codes[id] = saved.code;
    else {
      try { codes[id] = await getText(LOCAL + (r?.file || id + '.js'), 6000); } catch (e) { codes[id] = await getText(REMOTE + (r?.file || id + '.js'), 15000); }
    }
  }
  const url = URL.createObjectURL(new Blob([codes[id]], { type: 'text/javascript' }));
  try { return await import(url); } finally { URL.revokeObjectURL(url); }
}
export const robotCode = (id) => codes[id];
export const robotMeta = (id) => index?.robots.find((x) => x.id === id);
export async function clearRobotCache(id) {
  delete codes[id];
  try {
    const db = await idb();
    await new Promise((ok) => {
      const t = db.transaction(STORE, 'readwrite');
      t.objectStore(STORE).delete('code:' + id);
      t.oncomplete = ok;
      t.onerror = ok;
    });
  } catch (e) { /* 무시 */ }
}

// 뒤에서 GitHub 확인: 바뀐 로봇만 받아 저장. 바뀐 게 있으면 'robots-updated' 이벤트
let checking = false;
export async function checkUpdates() {
  if (SINGLE_CODE || !navigator.onLine || checking) return false;
  checking = true;
  try {
    let remote;
    try { remote = JSON.parse(await getText(REMOTE + 'index.json?t=' + Date.now())); } catch (e) { console.warn('로봇 업데이트 확인 실패', e); return false; }
    if (!Array.isArray(remote?.robots)) return false;

    const cur = index?.robots || [];
    const curMap = new Map(cur.map((x) => [x.id, x]));
    let changed = cur.length !== remote.robots.length;

    for (const r of remote.robots) {
      const local = curMap.get(r.id);
      const have = await dbGet('code:' + r.id);
      if (!local || local.name !== r.name || local.version !== r.version || local.mods !== r.mods) changed = true;
      if (have?.version === r.version || (!have && local?.version === r.version)) continue;
      try {
        const code = await getText(REMOTE + r.file + '?v=' + encodeURIComponent(r.version || Date.now()), 20000);
        if (r.size && Math.abs(code.length - r.size) > 64) {
          console.warn('로봇 파일 크기 불일치(CDN 캐시 지연 가능), 다음 주기에 재시도', r.id, code.length, r.size);
          return false;
        }
        await dbPut('code:' + r.id, { version: r.version, code });
        delete codes[r.id];
        changed = true;
      } catch (e) { console.warn('로봇 파일 받기 실패', r.id, e); return false; }   // 하나라도 실패하면 다음에 다시
    }
    if (!changed && (!remote.updated || (index?.updated && remote.updated <= index.updated))) return false;
    index = remote;
    await dbPut('index', remote);
    window.dispatchEvent(new CustomEvent('robots-updated', { detail: remote }));
    return true;
  } finally {
    checking = false;
  }
}
