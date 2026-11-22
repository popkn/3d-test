// 로보로보 완성 로봇 조립 — 앱 화면 (모바일 D안 · 몰입형 HUD)
// 로봇 자체(조립 데이터 · 부품 모양 · 기능)는 완성 로봇 파일(app/robots/)에서 불러온다 → GitHub main에 로봇을 올리면 앱이 자동 업데이트.
import * as THREE107 from 'three';
import { createScene, partBounds } from './scene.js';
import { initRobots, loadRobot, robotCode, checkUpdates, clearRobotCache } from './robots.js';

var $ = (s) => document.querySelector(s);
var stage = $("#stage");
var view = null;
var V3 = THREE107.Vector3;
var clamp = (x, a, b) => Math.max(a, Math.min(b, x));
var buzz = () => {
  try {
    if (navigator.vibrate) navigator.vibrate(8);
  } catch (e) {
  }
};
// 내려받기용 원본 (화면이 바뀌기 전에 보관)
var SRC = {
  head: document.head.innerHTML,
  app: document.getElementById("app").outerHTML,
  script: [...document.querySelectorAll('script[type="module"]')].map((s) => s.textContent).join("\n")
};
var SINGLE = window.__SINGLE || null;
if (SINGLE) document.documentElement.classList.add("single");
var esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
var I = {
  download: '<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 4v11"/><path d="M7.5 10.5L12 15l4.5-4.5"/><path d="M5 19h14"/></svg>',
  close: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  edit: '<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/></svg>',
  folder: '<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 7.5A1.5 1.5 0 0 1 4.5 6H9l2 2.2h8.5A1.5 1.5 0 0 1 21 9.7v8.8a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18.5z"/></svg>',
  play: '<svg width="15" height="15" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4.5l12 7.5-12 7.5z" fill="currentColor"/></svg>',
  check: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  plus: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
  none: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="8"/><path d="M6.5 17.5l11-11"/></svg>',
  box: '<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#9b978f" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 7.5A1.5 1.5 0 0 1 4.5 6H9l2 2.2h8.5A1.5 1.5 0 0 1 21 9.7v8.8a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18.5z"/><path d="M9 14h6"/></svg>'
};
var FCOLORS = [["#e8432a", "빨강"], ["#f2a516", "노랑"], ["#1f8a50", "초록"], ["#2f6fdb", "파랑"], ["#7a4cc2", "보라"], ["#63615c", "회색"]];

// ───────── 저장소 (이름 · 제작자 · 폴더) ─────────
var ROBOT_DEFS = (await initRobots()).map((r) => ({ id: r.id, name: r.name, mods: r.mods, fnOnly: !!r.fnOnly }));
var STORE_KEY = "roborobo-home-v2";
var store = { names: {}, folders: [], inFolder: {}, active: "all" };
try {
  const raw = JSON.parse(localStorage.getItem(STORE_KEY) || "null");
  if (raw) store = { ...store, ...raw };
  else {
    const old = JSON.parse(localStorage.getItem("roborobo-robot-names-v1") || "null");
    if (old) store.names = old;
  }
} catch (e) {
}
var robots = ROBOT_DEFS.map((r) => ({ ...r, name: store.names[r.id]?.name || r.name, maker: store.names[r.id]?.maker || "", count: null }));
if (SINGLE) robots = robots.filter((r) => r.id === SINGLE.id).map((r) => ({ ...r, name: SINGLE.name || r.name, maker: SINGLE.maker || "" }));
function persist() {
  if (SINGLE) return;
  store.names = Object.fromEntries(robots.map((r) => [r.id, { name: r.name, maker: r.maker }]));
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(store));
  } catch (e) {
  }
}
var folderOf = (r) => store.folders.find((f) => f.id === store.inFolder[r.id]) || null;
var inView = () => store.active === "all" ? robots : robots.filter((r) => store.inFolder[r.id] === store.active);
if (store.active !== "all" && !store.folders.some((f) => f.id === store.active)) store.active = "all";

var htT = 0;
function htoast(t) {
  const el = $("#htoast");
  el.textContent = t;
  el.classList.add("show");
  clearTimeout(htT);
  htT = setTimeout(() => el.classList.remove("show"), 1600);
}

// ───────── 폴더 탭 ─────────
function renderFolders() {
  const bar = $("#fbar");
  const tabs = [{ id: "all", name: "전체", n: robots.length }].concat(store.folders.map((f) => ({ ...f, n: robots.filter((r) => store.inFolder[r.id] === f.id).length })));
  const tabHTML = (t) => `<button type="button" class="ftab pr" role="tab" data-f="${t.id}" aria-selected="${t.id === store.active}">${t.color ? `<i class="fdot" style="background:${t.color}"></i>` : ""}<span class="fname">${esc(t.name)}</span><span class="fcnt">${t.n}</span></button>`;
  bar.innerHTML = '<i class="fpill"></i>' + tabs.map(tabHTML).join("");
  // 넘치면 뒤쪽 폴더를 "+n"으로 접기 (선택된 폴더는 항상 보임)
  let hidden = [];
  const fits = () => bar.scrollWidth <= bar.clientWidth + 1;
  while (!fits()) {
    const cand = [...bar.querySelectorAll('.ftab:not(.more)')].reverse().find((b) => b.dataset.f !== "all" && b.dataset.f !== store.active);
    if (!cand) break;
    hidden.unshift(cand.dataset.f);
    cand.remove();
    let more = bar.querySelector(".more");
    if (!more) {
      more = document.createElement("button");
      more.type = "button";
      more.className = "ftab more pr";
      bar.appendChild(more);
    }
    more.innerHTML = `<span class="fname">+${hidden.length}</span>`;
    more.setAttribute("aria-label", `폴더 ${hidden.length}개 더 보기`);
  }
  movePill(false);
  $("#count").textContent = `${robots.length}대`;
  $("#folderMenu").hidden = store.active === "all";
}
function movePill(anim = true) {
  const bar = $("#fbar"), pill = bar.querySelector(".fpill"), on = bar.querySelector('.ftab[aria-selected="true"]');
  if (!pill || !on) return;
  if (!anim) pill.style.transition = "none";
  pill.style.width = `${on.offsetWidth}px`;
  pill.style.transform = `translateX(${on.offsetLeft}px)`;
  if (!anim) requestAnimationFrame(() => pill.style.transition = "");
}
function setActive(id) {
  if (store.active === id) return;
  store.active = id;
  persist();
  $("#fbar").querySelectorAll(".ftab").forEach((b) => b.setAttribute("aria-selected", String(b.dataset.f === id)));
  if (!$("#fbar").querySelector(`[data-f="${id}"]`)) renderFolders();
  else movePill();
  $("#folderMenu").hidden = id === "all";
  renderCards();
}
$("#fbar").addEventListener("click", (ev) => {
  const b = ev.target.closest(".ftab");
  if (!b) return;
  buzz();
  if (b.classList.contains("more")) return folderPicker();
  setActive(b.dataset.f);
});

// ───────── 로봇 목록 (이름 선택 · 첫 화면 3D 로딩 없음) ─────────
function renderCards() {
  const list = inView();
  const box2 = $("#cards"), empty = $("#empty");
  empty.hidden = list.length > 0;
  box2.hidden = list.length === 0;
  if (!list.length) {
    const f = store.folders.find((x) => x.id === store.active);
    empty.innerHTML = `<div class="eic">${I.box}</div><b>‘${esc(f?.name || "")}’ 폴더가 비어 있어요</b><p>로봇을 담으면 여기에서 바로 조립을 볼 수 있어요.</p><button type="button" class="primary pr" id="fillFolder">${I.plus}로봇 담기</button>`;
  }
  box2.innerHTML = list.map((r, i) => {
    const f = folderOf(r);
    const num = String(robots.indexOf(r) + 1).padStart(2, "0");
    return `<article class="card" data-id="${r.id}" style="animation-delay:${i * 35}ms">
  <button type="button" class="cmain pr" data-open="${r.id}" aria-label="${esc(r.name)} ${r.fnOnly ? "기능 조작" : "조립 보기"}">
    <span class="cidx">${num}</span>
    <span class="names">${f && store.active === "all" ? `<span class="chipf"><i style="background:${f.color}"></i>${esc(f.name)}</span>` : ""}
      <b class="rname">${esc(r.name)}</b>${r.maker ? `<span class="maker">${esc(r.maker)}</span>` : ""}</span>
    <span class="cgo" aria-hidden="true">${I.play}</span>
  </button>
  <div class="mini"><button type="button" class="ibtn pr" data-edit="${r.id}" aria-label="${esc(r.name)} 정보 수정">${I.edit}</button>
    <button type="button" class="ibtn pr dl" data-dl="${r.id}" aria-label="${esc(r.name)} 조립 보기 HTML 내려받기">${I.download}</button></div>
</article>`;
  }).join("");
}
document.getElementById("home").addEventListener("click", (ev) => {
  const o = ev.target.closest("[data-open]"), mv = ev.target.closest("[data-move]"), ed = ev.target.closest("[data-edit]"), dl = ev.target.closest("[data-dl]");
  if (dl) {
    buzz();
    downloadRobot(robots.find((r) => r.id === dl.dataset.dl), dl);
  } else if (o) {
    buzz();
    openedFromHome = true;
    location.hash = o.dataset.open;
  } else if (mv) {
    buzz();
    moveSheet(robots.find((r) => r.id === mv.dataset.move));
  } else if (ed) {
    buzz();
    editRobotSheet(robots.find((r) => r.id === ed.dataset.edit));
  } else if (ev.target.closest("#fillFolder")) {
    buzz();
    fillSheet(store.folders.find((f) => f.id === store.active));
  }
});
function editRobotSheet(r) {
  if (!r) return;
  let folder = store.inFolder[r.id] || "";
  const chip = (id, label, color) => `<button type="button" class="fchip" role="radio" data-f="${id}" aria-checked="${folder === id}">${color ? `<i style="background:${color}"></i>` : ""}${label}</button>`;
  openSheet(`<h2><span class="bar"></span>로봇 정보</h2>
    ${field("name", "로봇 이름", r.name, 30, "예: 하늘 독수리")}
    ${field("maker", "제작자", r.maker, 20, "만든 사람 이름")}
    <div class="field">폴더<div class="fchips" role="radiogroup" aria-label="폴더">${chip("", "없음")}${store.folders.map((f) => chip(f.id, esc(f.name), f.color)).join("")}<button type="button" class="fchip add" data-newf>+ 새 폴더</button></div></div>
    <div class="two"><button type="button" class="ghost pr" data-close>취소</button><button type="submit" class="solid pr" data-need="name">저장</button></div>`, (fd) => {
    const before = store.inFolder[r.id] || "";
    r.name = String(fd.get("name")).trim() || r.name;
    r.maker = String(fd.get("maker")).trim();
    if (folder) store.inFolder[r.id] = folder;
    else delete store.inFolder[r.id];
    persist();
    renderFolders();
    if (store.active !== "all" && (store.inFolder[r.id] || "") !== store.active) renderCards();
    else patchCard(r);
    if (cur?.id === r.id) setTitle(r);
    closeSheet();
    htoast(before !== folder ? "저장했어요 · 폴더를 옮겼어요" : "저장했어요");
  }, '[name="name"]');
  const sh = $("#sheet");
  const onChip = (ev) => {
    const c = ev.target.closest(".fchip:not(.add)");
    if (c) {
      buzz();
      folder = c.dataset.f;
      sh.querySelectorAll(".fchip:not(.add)").forEach((x) => x.setAttribute("aria-checked", String(x === c)));
    } else if (ev.target.closest("[data-newf]")) {
      buzz();
      closeSheet();
      setTimeout(() => folderSheet(null, r), 260);
    }
  };
  sh.addEventListener("click", onChip);
  const mo = new MutationObserver(() => {
    if ($("#modal").hidden) { sh.removeEventListener("click", onChip); mo.disconnect(); }
  });
  mo.observe($("#modal"), { attributes: true, attributeFilter: ["hidden"] });
}
function patchCard(r) {
  const card = document.querySelector(`.card[data-id="${r.id}"]`);
  if (!card) return renderCards();
  const f = folderOf(r);
  card.querySelector(".names").innerHTML = `${f && store.active === "all" ? `<span class="chipf"><i style="background:${f.color}"></i>${esc(f.name)}</span>` : ""}
      <b class="rname">${esc(r.name)}</b>${r.maker ? `<span class="maker">${esc(r.maker)}</span>` : ""}`;
  card.querySelector(".names").animate([{ opacity: 0, transform: "translateY(6px)" }, { opacity: 1, transform: "none" }], { duration: 260, easing: "cubic-bezier(.2,.8,.2,1)" });
}

// ───────── 로봇 하나의 조립 보기만 HTML로 내려받기 ─────────
async function downloadRobot(r, btn) {
  if (!r) return;
  btn?.classList.add("busy");
  try { await loadRobot(r.id); } catch (e) { btn?.classList.remove("busy"); htoast("로봇 파일을 불러오지 못했어요"); return; }
  const rcode = JSON.stringify({ [r.id]: robotCode(r.id) }).replace(/</g, "\\u003c");
  const rmeta = JSON.stringify({ [r.id]: { mods: r.mods } });
  const cfg = JSON.stringify({ id: r.id, name: r.name, maker: r.maker }).replace(/</g, "\\u003c");
  const title = `${r.name} · 조립 보기`;
  const head = (window.RoboNative ? window.RoboNative.webHead(SRC.head) : SRC.head).replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(title)}</title>`);
  const html = `<!DOCTYPE html>\n<html lang="ko" class="single">\n<head>${head}</head>\n<body>\n${SRC.app}\n<script>window.__SINGLE = ${cfg}; window.__ROBOT_CODE = ${rcode}; window.__ROBOT_META = ${rmeta};<\/script>\n<script type="module">${SRC.script}<\/script>\n</body>\n</html>\n`;
  const fname = `${r.name.replace(/[\\/:*?"<>|]+/g, "").trim() || r.id}-조립보기.html`;
  if (window.RoboNative?.native) {   // 안드로이드 앱: 파일 저장 후 공유 창
    window.RoboNative.saveHtml(fname, html, title).then(() => htoast(`‘${r.name}’ 조립 보기 파일을 만들었어요`)).catch(() => htoast("파일을 만들지 못했어요")).finally(() => btn?.classList.remove("busy"));
    return;
  }
  const url = URL.createObjectURL(new Blob([html], { type: "text/html;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `${r.name.replace(/[\\/:*?"<>|]+/g, "").trim() || r.id}-조립보기.html`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => {
    URL.revokeObjectURL(url);
    btn?.classList.remove("busy");
  }, 1200);
  htoast(`‘${r.name}’ 조립 보기 HTML을 내려받아요`);
}

$("#newFolder").addEventListener("click", () => {
  buzz();
  folderSheet(null);
});
$("#folderMenu").addEventListener("click", () => {
  buzz();
  const f = store.folders.find((x) => x.id === store.active);
  if (f) folderSheet(f);
});

// ───────── 시트 ─────────
var sheetSubmit = null;
function openSheet(html, onSubmit, focusSel) {
  const m = $("#modal"), sh = $("#sheet");
  sh.innerHTML = '<span class="grab" aria-hidden="true"></span>' + html;
  $("#htoast").classList.remove("show");
  sheetSubmit = onSubmit;
  m.classList.remove("out");
  m.hidden = false;
  if (focusSel) setTimeout(() => sh.querySelector(focusSel)?.focus(), 80);
}
function closeSheet() {
  const m = $("#modal");
  if (m.hidden || m.classList.contains("out")) return;
  m.classList.add("out");
  setTimeout(() => {
    m.hidden = true;
    m.classList.remove("out");
  }, 240);
}
$("#scrim").addEventListener("click", closeSheet);
$("#sheet").addEventListener("submit", (ev) => {
  ev.preventDefault();
  if (sheetSubmit) sheetSubmit(new FormData(ev.target));
});
$("#sheet").addEventListener("click", (ev) => {
  if (ev.target.closest("[data-close]")) closeSheet();
});
$("#sheet").addEventListener("input", (ev) => {
  const c = ev.target.closest(".field")?.querySelector(".cnt");
  if (c) c.textContent = `${ev.target.value.length} / ${ev.target.maxLength}`;
  const need = $("#sheet").querySelector("[data-need]");
  if (need) need.disabled = !$("#sheet").querySelector(`[name="${need.dataset.need}"]`).value.trim();
});
var field = (name, label, value, max, ph) => `<label class="field">${label}<input name="${name}" type="text" value="${esc(value)}" maxlength="${max}" placeholder="${ph}" autocomplete="off" enterkeyhint="done"><span class="cnt">${value.length} / ${max}</span></label>`;

function editSheet(r) {
  openSheet(`<h2><span class="bar"></span>로봇 정보 수정</h2>${field("name", "로봇 이름", r.name, 30, "예: 하늘 독수리")}${field("maker", "제작자", r.maker, 20, "만든 사람 이름")}
    <div class="two"><button type="button" class="ghost pr" data-close>취소</button><button type="submit" class="solid pr" data-need="name">저장</button></div>`, (fd) => {
    r.name = String(fd.get("name")).trim() || r.name;
    r.maker = String(fd.get("maker")).trim();
    persist();
    renderCards();
    if (cur?.id === r.id) setTitle(r);
    closeSheet();
    htoast("저장했어요");
  }, '[name="name"]');
}
function swatchHTML(sel) {
  return `<div class="field">색<div class="swatches" role="radiogroup" aria-label="폴더 색">${FCOLORS.map(([c, n]) => `<button type="button" class="sw pr" role="radio" aria-label="${n}" aria-checked="${c === sel}" data-color="${c}" style="background:${c};color:${c}">${I.check}</button>`).join("")}</div></div>`;
}
function folderSheet(f, thenMove) {
  let color = f?.color || FCOLORS[store.folders.length % FCOLORS.length][0];
  openSheet(`<h2><span class="bar"></span>${f ? "폴더 설정" : "새 폴더"}</h2>${thenMove ? `<p class="hint">만들면 ‘${esc(thenMove.name)}’을(를) 바로 옮겨요.</p>` : ""}
    ${field("fname", "폴더 이름", f?.name || "", 16, "예: 3월 수업, 대회용")}${swatchHTML(color)}
    <div class="two"><button type="button" class="ghost pr" data-close>취소</button><button type="submit" class="solid pr" data-need="fname"${f ? "" : " disabled"}>${f ? "저장" : "만들기"}</button></div>
    ${f ? '<button type="button" class="danger pr" id="delFolder">폴더 삭제 (로봇은 그대로 남아요)</button>' : ""}`, (fd) => {
    const name = String(fd.get("fname")).trim();
    if (!name) return;
    if (f) {
      f.name = name;
      f.color = color;
      htoast("폴더를 고쳤어요");
    } else {
      const nf = { id: "f" + Date.now().toString(36), name, color };
      store.folders.push(nf);
      if (thenMove) {
        store.inFolder[thenMove.id] = nf.id;
        htoast(`‘${name}’ 폴더로 옮겼어요`);
      } else {
        store.active = nf.id;
        htoast(`‘${name}’ 폴더를 만들었어요`);
      }
    }
    persist();
    renderFolders();
    renderCards();
    closeSheet();
  }, '[name="fname"]');
  $("#sheet").querySelector(".swatches").addEventListener("click", (ev) => {
    const b = ev.target.closest(".sw");
    if (!b) return;
    buzz();
    color = b.dataset.color;
    $("#sheet").querySelectorAll(".sw").forEach((x) => x.setAttribute("aria-checked", String(x === b)));
  });
  $("#delFolder")?.addEventListener("click", () => {
    buzz();
    store.folders = store.folders.filter((x) => x !== f);
    for (const k of Object.keys(store.inFolder)) if (store.inFolder[k] === f.id) delete store.inFolder[k];
    store.active = "all";
    persist();
    renderFolders();
    renderCards();
    closeSheet();
    htoast(`‘${f.name}’ 폴더를 지웠어요`);
  });
}
function optHTML(attrs, dot, name, sub, checked) {
  return `<button type="button" class="opt pr" role="radio" ${attrs} aria-checked="${checked}"><span class="odot">${dot}</span><span class="oname">${name}${sub ? `<br><small>${sub}</small>` : ""}</span><span class="ock">${I.check}</span></button>`;
}
function moveSheet(r) {
  const curF = store.inFolder[r.id] || "";
  const opts = [optHTML('data-to=""', I.none, "폴더 없음", "", !curF)].concat(store.folders.map((f) => optHTML(`data-to="${f.id}"`, `<i style="width:12px;height:12px;border-radius:4px;background:${f.color}"></i>`, esc(f.name), `로봇 ${robots.filter((x) => store.inFolder[x.id] === f.id).length}대`, curF === f.id)));
  openSheet(`<h2><span class="bar"></span>폴더로 옮기기</h2><p class="hint">${esc(r.name)}</p>
    <div class="opts${store.folders.length > 2 ? " grid2" : ""}" role="radiogroup">${opts.join("")}</div>
    <button type="button" class="opt add pr" id="moveNew"><span class="odot">${I.plus}</span><span class="oname">새 폴더 만들어 옮기기</span></button>`, null);
  $("#sheet").querySelector(".opts").addEventListener("click", (ev) => {
    const b = ev.target.closest(".opt");
    if (!b) return;
    buzz();
    $("#sheet").querySelectorAll(".opt[role=radio]").forEach((x) => x.setAttribute("aria-checked", String(x === b)));
    const to = b.dataset.to;
    if (to) store.inFolder[r.id] = to;
    else delete store.inFolder[r.id];
    persist();
    setTimeout(() => {
      closeSheet();
      renderFolders();
      renderCards();
      htoast(to ? `‘${store.folders.find((f) => f.id === to).name}’ 폴더로 옮겼어요` : "폴더에서 뺐어요");
    }, 180);
  });
  $("#moveNew").addEventListener("click", () => {
    buzz();
    folderSheet(null, r);
  });
}
function fillSheet(f) {
  const sel = new Set(robots.filter((r) => store.inFolder[r.id] === f.id).map((r) => r.id));
  openSheet(`<h2><span class="bar"></span>‘${esc(f.name)}’에 담기</h2><p class="hint">담을 로봇을 고르세요. 다른 폴더에 있던 로봇은 이 폴더로 옮겨져요.</p>
    <div class="opts" role="group">${robots.map((r) => optHTML(`data-r="${r.id}" role="checkbox"`, `<b style="font-size:11px">0${robots.indexOf(r) + 1}</b>`, esc(r.name), folderOf(r) && folderOf(r) !== f ? `지금: ${esc(folderOf(r).name)}` : "", sel.has(r.id)).replace('role="radio" ', "")).join("")}</div>
    <div class="two"><button type="button" class="ghost pr" data-close>취소</button><button type="submit" class="solid pr">담기</button></div>`, () => {
    for (const r of robots) {
      if (sel.has(r.id)) store.inFolder[r.id] = f.id;
      else if (store.inFolder[r.id] === f.id) delete store.inFolder[r.id];
    }
    persist();
    renderFolders();
    renderCards();
    closeSheet();
    htoast(`${sel.size}대를 담았어요`);
  });
  $("#sheet").querySelector(".opts").addEventListener("click", (ev) => {
    const b = ev.target.closest(".opt");
    if (!b) return;
    buzz();
    const id = b.dataset.r;
    if (sel.has(id)) sel.delete(id);
    else sel.add(id);
    b.setAttribute("aria-checked", String(sel.has(id)));
  });
}
function folderPicker() {
  openSheet(`<h2><span class="bar"></span>폴더</h2><div class="opts${store.folders.length > 3 ? " grid2" : ""}" role="radiogroup">${store.folders.map((f) => optHTML(`data-to="${f.id}"`, `<i style="width:12px;height:12px;border-radius:4px;background:${f.color}"></i>`, esc(f.name), `로봇 ${robots.filter((x) => store.inFolder[x.id] === f.id).length}대`, store.active === f.id)).join("")}</div>`, null);
  $("#sheet").querySelector(".opts").addEventListener("click", (ev) => {
    const b = ev.target.closest(".opt");
    if (!b) return;
    buzz();
    closeSheet();
    store.active = "";
    setActive(b.dataset.to);
    renderFolders();
  });
}
window.addEventListener("resize", () => {
  renderFolders();
});

// ───────── 막대그래프 스크러버 (캔버스 · 가벼움) ─────────
// 3px 막대 · 2px 간격, 현재 위치 주변이 가우스 곡선으로 솟고, 위쪽에 삼각 표시. 표시값은 목표값을 부드럽게 따라간다.
var TB_ACTIVE = new Set();
var tbRaf = 0;
function tbLoop(t) {
  tbRaf = 0;
  for (const b of TB_ACTIVE) {
    if (b.step(t)) TB_ACTIVE.delete(b);
  }
  if (TB_ACTIVE.size) tbRaf = requestAnimationFrame(tbLoop);
}
function tbKick(b) {
  TB_ACTIVE.add(b);
  if (!tbRaf) tbRaf = requestAnimationFrame(tbLoop);
}
class TickBar {
  constructor(el, o) {
    this.el = el;
    this.o = { min: 0, max: 1, step: 0, value: 0, marks: 0, smooth: true, bump: 3, ...o };
    this.cv = el.querySelector("canvas");
    this.ctx = this.cv.getContext("2d");
    this.v = this.o.value;
    this.disp = this.v;
    this.last = 0;
    this.dragging = false;
    this.w = 0;
    this.h = 0;
    new ResizeObserver(() => this.resize()).observe(el);
    el.addEventListener("pointerdown", (e) => this.down(e));
    el.addEventListener("pointermove", (e) => this.move(e));
    el.addEventListener("pointerup", (e) => this.up(e));
    el.addEventListener("pointercancel", (e) => this.up(e));
    el.addEventListener("keydown", (e) => this.key(e));
    this.aria();
  }
  config(o) {
    Object.assign(this.o, o);
    if ("value" in o) {
      this.v = o.value;
      this.disp = o.value;
    }
    this.aria();
    this.draw();
  }
  aria() {
    this.el.setAttribute("aria-valuemin", this.o.min);
    this.el.setAttribute("aria-valuemax", this.o.max);
    this.el.setAttribute("aria-valuenow", Math.round(this.v * 100) / 100);
  }
  resize() {
    const r = this.el.getBoundingClientRect(), dpr = Math.min(devicePixelRatio || 1, 2);
    if (!r.width) return;
    this.w = r.width;
    this.h = r.height;
    this.cv.width = Math.round(r.width * dpr);
    this.cv.height = Math.round(r.height * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.draw();
  }
  quant(x) {
    const { min, max, step } = this.o;
    x = clamp(x, min, max);
    return step ? Math.round((x - min) / step) * step + min : x;
  }
  // 외부에서 값 지정 (재생 중 진행 위치 등)
  set(x, instant) {
    if (this.dragging) return;
    x = clamp(x, this.o.min, this.o.max);
    if (x === this.v && !instant) return;
    this.v = x;
    if (instant || !this.o.smooth) {
      this.disp = x;
      this.draw();
    } else tbKick(this);
  }
  step(t) {
    const dt = this.last ? Math.min(0.05, (t - this.last) / 1000) : 0.016;
    this.last = t;
    const d = this.v - this.disp, span = this.o.max - this.o.min || 1;
    if (Math.abs(d) < span * 4e-4) {
      this.disp = this.v;
      this.last = 0;
      this.draw();
      return true;
    }
    this.disp += d * (1 - Math.exp(-dt * 11));
    this.draw();
    return false;
  }
  fromX(clientX) {
    const r = this.el.getBoundingClientRect();
    const n = this.count(), pitch = 5, used = n * pitch - 2, x0 = (r.width - used) / 2;
    const f = clamp((clientX - r.left - x0) / Math.max(1, used), 0, 1);
    return this.o.min + f * (this.o.max - this.o.min);
  }
  down(e) {
    if (this.o.disabled) return;
    this.dragging = true;
    this.el.setPointerCapture(e.pointerId);
    buzz();
    this.input(e);
  }
  move(e) {
    if (this.dragging) this.input(e);
  }
  input(e) {
    const x = this.o.step ? this.quant(this.fromX(e.clientX)) : this.fromX(e.clientX);
    if (this.o.onStart && !this._started) {
      this._started = true;
      this.o.onStart();
    }
    this.v = x;
    tbKick(this);
    this.aria();
    if (this.o.onInput) this.o.onInput(x);
  }
  up() {
    if (!this.dragging) return;
    this.dragging = false;
    this._started = false;
    if (this.o.onCommit) this.o.onCommit(this.v);
  }
  key(e) {
    const st2 = this.o.step || (this.o.max - this.o.min) / 20;
    let x = null;
    if (e.key === "ArrowRight" || e.key === "ArrowUp") x = this.v + st2;
    else if (e.key === "ArrowLeft" || e.key === "ArrowDown") x = this.v - st2;
    if (x === null) return;
    e.preventDefault();
    x = this.quant(x);
    this.v = x;
    tbKick(this);
    this.aria();
    if (this.o.onInput) this.o.onInput(x);
    if (this.o.onCommit) this.o.onCommit(x);
  }
  count() {
    return Math.max(8, Math.floor((this.w + 2) / 5));
  }
  draw() {
    const c = this.ctx, w = this.w, h = this.h;
    if (!w) return;
    c.clearRect(0, 0, w, h);
    const n = this.count(), pitch = 5, used = n * pitch - 2, x0 = Math.round((w - used) / 2);
    const span = this.o.max - this.o.min || 1;
    const f = (this.disp - this.o.min) / span, p = f * (n - 1);
    const base = h - 4, top = 10, room = base - top - 6, sig = this.o.bump * this.o.bump;
    const dis = this.o.disabled;
    for (let i = 0; i < n; i++) {
      const g = Math.exp(-((i - p) * (i - p)) / sig);
      const bh = Math.min(room, 4 + (i * 37 % 7) * 0.8 + room * 0.72 * g);
      const past = i <= p + 0.001;
      const a = dis ? 0.14 + 0.2 * g : past ? 0.5 + 0.5 * g : 0.16 + 0.55 * g;
      c.fillStyle = `rgba(29,29,31,${a.toFixed(3)})`;
      const x = x0 + i * pitch;
      c.beginPath();
      if (c.roundRect) c.roundRect(x, base - bh, 3, bh, 1.5);
      else c.rect(x, base - bh, 3, bh);
      c.fill();
    }
    // 단계 경계 점
    if (this.o.marks > 1 && this.o.marks <= 24) {
      for (let k = 0; k <= this.o.marks; k++) {
        const x = x0 + k / this.o.marks * (n - 1) * pitch + 1.5;
        const done = k / this.o.marks <= f + 1e-4;
        c.fillStyle = done ? "rgba(29,29,31,.7)" : "rgba(29,29,31,.22)";
        c.beginPath();
        c.arc(x, h - 1.2, 1.2, 0, Math.PI * 2);
        c.fill();
      }
    }
    // 삼각 표시
    const mx = x0 + p * pitch + 1.5;
    c.fillStyle = dis ? "rgba(29,29,31,.3)" : this.o.accent ? "#e8432a" : "#1d1d1f";
    c.beginPath();
    c.moveTo(mx - 4, 1);
    c.lineTo(mx + 4, 1);
    c.lineTo(mx, 7);
    c.closePath();
    c.fill();
  }
}

// ───────── 로봇 어댑터: 선택한 로봇 파일(app/robots/<id>.js)만 필요할 때 불러온다 ─────────
async function makeAdapter(id, onProgress) {
  const mod = await loadRobot(id);
  return mod.makeAdapter({ view: ensureView(), st, onProgress });
}

// ───────── 뷰어 상태 ─────────
var cache = {};
var progress = {};
var pending = {};
var cur = null;
var A = null;
var loadToken = 0;
var openedFromHome = false;
var waitingId = null;
var mode = "asm";
var fnRoot = null;
var st = { T: 0, play: false, goal: null, speed: 1, explode: 0, follow: true, bolts: true, hidden: {} };
var modEls = [], lastStep = -1, lastDone = null, lastStepTxt = "", lastPoseKey = "";
var timer = new THREE107.Timer();
var REDUCE = matchMedia("(prefers-reduced-motion: reduce)");

// 렌더링 최적화: 첫 화면에서는 3D WebGL을 만들지 않고, 로봇을 열 때 딱 1번 초기화
var dirty = 2;
function invalidate(shadow) {
  dirty = 2;
  if (shadow && view) view.renderer.shadowMap.needsUpdate = true;
}
function ensureView() {
  if (view) return view;
  view = createScene(stage);
  view.renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
  view.renderer.shadowMap.autoUpdate = false;
  view.controls.addEventListener("change", () => invalidate(false));
  new ResizeObserver(() => invalidate(false)).observe(stage);
  bindStageTap(view);
  startViewerLoop(view);
  window.__view = view;
  return view;
}
function ensureAdapter(id) {
  if (!pending[id]) {
    progress[id] = 0;
    pending[id] = makeAdapter(id, (k) => {
      progress[id] = k;
      if (waitingId === id) showLoad(k);
    }).then((ad) => {
      cache[id] = ad;
      const r = robots.find((x) => x.id === id);
      if (r) r.count = ad.count;
      return ad;
    }).catch((err) => {
      delete pending[id];
      clearRobotCache(id);
      throw err;
    });
  }
  return pending[id];
}

function setTitle(r) {
  $("#vName").textContent = r.name;
  $("#vMaker").textContent = r.maker ? `제작 · ${r.maker}` : "제작자 미입력";
}
function setPlay(v) {
  st.play = v;
  $("#viewer").classList.toggle("playing", v);
  $("#play").setAttribute("aria-label", v ? "일시정지" : "재생");
}
function seek(k) {
  st.goal = clamp(k, 0, A.N);
}
var toastT = 0;
function toast(t) {
  const el = $("#toast");
  el.textContent = t;
  el.classList.add("show");
  clearTimeout(toastT);
  toastT = setTimeout(() => el.classList.remove("show"), 1400);
}

// 조립 막대그래프 · 분해 막대그래프
var tbStep = new TickBar($("#tbStep"), {
  min: 0, max: 1, value: 0, smooth: false, bump: 3.2,
  onStart: () => {
    setPlay(false);
    st.goal = null;
  },
  onInput: (x) => {
    st.T = x;
  },
  onCommit: (x) => {
    if (A && A.N <= 24) seek(Math.round(x));
    else if (A) st.T = Math.round(x);
  }
});
var tbEx = new TickBar($("#tbEx"), {
  min: 0, max: 100, step: 1, value: 0, bump: 2.6,
  onInput: (x) => {
    st.explode = x / 100;
    $("#exVal").textContent = `${Math.round(x)}%`;
  }
});

// ───────── 모듈 선택 ─────────
function buildMods() {
  const box2 = $("#mods");
  box2.innerHTML = A.mods.map((m, i) => `<button type="button" class="mod" data-i="${i}" aria-pressed="true" style="animation-delay:${i * 30}ms" aria-label="모듈 ${esc(m.no)} ${esc(m.short)}"><span class="mno">${esc(m.no)}</span><span class="mnm">${esc(m.short)}</span><span class="eye" aria-hidden="true"></span></button>`).join("");
  modEls = [...box2.querySelectorAll(".mod")];
  updateModCnt();
}
function updateModCnt() {
  if (!A) return;
  const vis = A.mods.filter((m, i) => !st.hidden[i]).length;
  $("#modCnt").textContent = `${vis}/${A.mods.length}`;
}
$("#mods").addEventListener("click", (ev) => {
  const b = ev.target.closest(".mod");
  if (!b || !A) return;
  buzz();
  const i = Number(b.dataset.i);
  st.hidden[i] = !st.hidden[i];
  A.setHidden(i, st.hidden[i]);
  b.setAttribute("aria-pressed", String(!st.hidden[i]));
  updateModCnt();
  lastPoseKey = "";
  toast(`${A.mods[i].no} ${A.mods[i].short} ${st.hidden[i] ? "숨김" : "보임"}`);
});
$("#showAll").addEventListener("click", () => {
  if (!A) return;
  buzz();
  st.hidden = {};
  A.mods.forEach((m, i) => A.setHidden(i, false));
  modEls.forEach((b) => b.setAttribute("aria-pressed", "true"));
  updateModCnt();
  lastPoseKey = "";
});

// ───────── 열기 · 닫기 ─────────
function showLoad(k, label) {
  if (label) $("#lText").textContent = label;
  $("#lFill").style.width = `${Math.round(k * 100)}%`;
  $("#lPct").textContent = `${Math.round(k * 100)}%`;
}
async function openRobot(id) {
  const r = robots.find((x) => x.id === id);
  if (!r) return showHome();
  closeSheet();
  setPlay(false);
  if (mode === "fn") leaveFn(true);
  if (view && A) view.scene.remove(A.root);
  if (view && fnRoot) { view.scene.remove(fnRoot); fnRoot = null; }
  cur = null;
  A = null;
  $("#home").hidden = true;
  $("#viewer").hidden = false;
  ensureView();
  setTitle(r);
  closePop(true);
  const token = ++loadToken;
  const ld = $("#loading");
  if (!cache[id]) {
    waitingId = id;
    ld.hidden = false;
    showLoad(progress[id] ?? 0, "부품 불러오는 중");
  }
  let ad;
  try {
    ad = cache[id] || await ensureAdapter(id);
  } catch (err) {
    if (token !== loadToken) return;
    console.error(err);
    waitingId = null;
    ld.hidden = true;
    showHome();
    htoast("로봇을 불러오지 못했어요");
    return;
  }
  if (token !== loadToken) return;
  waitingId = null;
  ld.hidden = true;
  cur = r;
  A = ad;
  view.scene.add(A.root);
  st.hidden = {};
  A.mods.forEach((m, i) => A.setHidden(i, false));
  st.explode = 0;
  tbEx.config({ value: 0 });
  $("#exVal").textContent = "0%";
  $("#bolts").hidden = !A.hasBolts;
  if (A.hasBolts) A.setBolts(st.bolts);
  $("#modeSw").hidden = !!A.fnOnly || !A.fn;
  tbStep.config({ min: 0, max: A.N, value: 0, marks: A.N <= 24 ? A.N : 0 });
  buildMods();
  view.controls.autoRotate = false;
  view.controls.zoomToCursor = true;
  view.frame(A.full, A.frameOpts);
  st.T = 0;
  st.goal = null;
  lastStep = -1;
  lastDone = null;
  lastStepTxt = "";
  lastPoseKey = "";
  if (A.fnOnly && A.fn) {
    mode = "asm";
    await enterFn(true);
    return;
  }
  setMode("asm", true);
  A.pose(0);
  invalidate(true);
  setPlay(true);
}
function showHome() {
  loadToken++;
  waitingId = null;
  $("#loading").hidden = true;
  setPlay(false);
  closePop(true);
  if (mode === "fn") leaveFn(true);
  if (view && A) view.scene.remove(A.root);
  if (view && fnRoot) { view.scene.remove(fnRoot); fnRoot = null; }
  cur = null;
  A = null;
  $("#viewer").hidden = true;
  $("#home").hidden = false;
  renderFolders();
  renderCards();
}
function route() {
  if (SINGLE) return openRobot(SINGLE.id);
  const id = location.hash.slice(1);
  if (id && robots.some((r) => r.id === id)) openRobot(id);
  else showHome();
}
window.addEventListener("hashchange", route);
$("#back").addEventListener("click", () => {
  buzz();
  if (openedFromHome) {
    openedFromHome = false;
    history.back();
  } else location.hash = "";
});

// ───────── 조립 ↔ 기능 전환 ─────────
var fnBars = {}, fnSegs = {}, fnStatT = 0;
function refreshFnLayout() {
  const on = $("#pages .page:not(.off)");
  if (on) $("#pages").style.height = `${on.offsetHeight}px`;
  for (const b of Object.values(fnBars)) b.tb.resize();
}
function setPages(to, instant) {
  const pages = $("#pages"), on = to === "fn" ? $("#pageFn") : $("#pageAsm"), off = to === "fn" ? $("#pageAsm") : $("#pageFn");
  const h0 = pages.offsetHeight;
  off.classList.add("off");
  off.classList.remove("on", "still");
  off.setAttribute("aria-hidden", "true");
  on.classList.remove("off");
  on.removeAttribute("aria-hidden");
  on.classList.toggle("still", !!instant);
  on.classList.remove("on");
  void on.offsetWidth;
  on.classList.add("on");
  const h1 = on.offsetHeight;
  if (instant) {
    pages.style.transition = "none";
    pages.style.height = `${h1}px`;
    void pages.offsetWidth;
    pages.style.transition = "";
  } else {
    pages.style.height = `${h0}px`;
    void pages.offsetWidth;
    pages.style.height = `${h1}px`;
  }
  if (to === "fn") for (const b of Object.values(fnBars)) b.tb.resize();
}
new ResizeObserver(() => {
  const on = $("#pages .page:not(.off)");
  if (on) $("#pages").style.height = `${on.offsetHeight}px`;
}).observe($("#player"));
function setModeLabel() {
  $("#modeSw").querySelectorAll("button[data-to]").forEach((b) => {
    b.setAttribute("aria-pressed", String(b.dataset.to === mode));
  });
}
function setMode(m, instant) {
  mode = m;
  $("#player").dataset.mode = m;
  $("#viewer").classList.toggle("fnmode", m === "fn");
  setPages(m, instant);
  setModeLabel();
}
function buildFnUI(F) {
  fnBars = {};
  fnSegs = {};
  const grid = $("#fnGrid");
  const items = F.items.filter((it) => it.id !== "drive");
  grid.innerHTML = items.map((it, k) => {
    const d = `style="animation-delay:${0.04 + k * 0.035}s"` + (it.col ? ` data-col="${it.col}"` : "");
    if (it.type === "bar") return `<div class="frow fn-bar" ${d}><div class="fhead"><span class="flab">${it.label}</span><output data-out="${it.id}"></output></div><div class="tb sm" data-bar="${it.id}" role="slider" tabindex="0" aria-label="${it.label}"><canvas></canvas></div></div>`;
    if (it.type === "seg") return `<div class="frow fn-ctrl${it.inline ? " inline" : ""}${it.wide ? " wide" : ""}" ${d}><span class="flab">${it.label}</span><div class="seg" data-seg="${it.id}" role="group" aria-label="${it.label}"><i class="pill"></i>${it.options.map(([val, t]) => `<button type="button" data-v="${val}" aria-pressed="false">${t}</button>`).join("")}</div></div>`;
    if (it.type === "toggles") return `<div class="frow fn-ctrl facts" ${d}>${it.items.map((t) => `<button type="button" class="ftog" data-tog="${t.id}" aria-pressed="false"><i class="lamp"></i>${t.label}</button>`).join("")}</div>`;
    if (it.type === "actions") return `<div class="frow fn-ctrl facts" ${d}>${it.items.map((t) => `<button type="button" class="act${t.hot ? " hot" : ""}" data-act="${t.id}">${t.label}</button>`).join("")}</div>`;
    if (it.type === "note") return `<div class="frow fn-ctrl fnote" ${d}>${esc(it.text)}</div>`;
    return "";
  }).join("");
  for (const it of items) {
    if (it.type === "bar") {
      const out = grid.querySelector(`[data-out="${it.id}"]`);
      out.textContent = it.fmt(F.v[it.id]);
      fnBars[it.id] = {
        it, out, tb: new TickBar(grid.querySelector(`[data-bar="${it.id}"]`), {
          min: it.min, max: it.max, step: it.step, value: F.v[it.id], bump: 2.6, accent: true,
          onInput: (x) => {
            F.set(it.id, x);
            out.textContent = it.fmt(x);
            syncFnUI(F);
          }
        })
      };
    }
    if (it.type === "seg") fnSegs[it.id] = grid.querySelector(`[data-seg="${it.id}"]`);
  }
  syncFnUI(F);
}
function syncFnUI(F) {
  for (const [id, seg] of Object.entries(fnSegs)) {
    const btns = [...seg.querySelectorAll("button")], idx = btns.findIndex((b) => b.dataset.v === F.v[id]);
    btns.forEach((b, i) => b.setAttribute("aria-pressed", String(i === idx)));
    const pill = seg.querySelector(".pill");
    pill.style.width = `calc((100% - 6px) / ${btns.length})`;
    pill.style.transform = `translateX(${Math.max(0, idx) * 100}%)`;
    seg.classList.toggle("go", F.v[id] !== "stop");
  }
  $("#fnGrid").querySelectorAll("[data-tog]").forEach((b) => b.setAttribute("aria-pressed", String(!!F.v[b.dataset.tog])));
}
function updateFnStats() {}
$("#fnGrid").addEventListener("click", (ev) => {
  const F = A?.fn;
  if (!F) return;
  const sb = ev.target.closest(".seg button"), tg = ev.target.closest("[data-tog]"), ac = ev.target.closest("[data-act]");
  let ret;
  if (sb) {
    buzz();
    ret = F.set(sb.closest(".seg").dataset.seg, sb.dataset.v);
  } else if (tg) {
    buzz();
    ret = F.set(tg.dataset.tog, !F.v[tg.dataset.tog]);
  } else if (ac) {
    buzz();
    ret = F.set(ac.dataset.act, true);
    ac.animate([{ transform: "scale(.94)" }, { transform: "scale(1)" }], { duration: 260, easing: "cubic-bezier(.3,1.5,.4,1)" });
  } else return;
  if (ret === "rebuild") {
    buildFnUI(F);
    refreshFnLayout();
    invalidate(true);
    return;
  }
  for (const [id, b] of Object.entries(fnBars)) {
    b.tb.set(F.v[id]);
    b.out.textContent = b.it.fmt(F.v[id]);
  }
  syncFnUI(F);
  invalidate(true);
});
async function enterFn(instant) {
  if (!A || mode === "fn" || !A.fn) return;
  const F = A.fn, ad = A, token = loadToken;
  setPlay(false);
  st.goal = null;
  st.T = A.N;
  st.explode = 0;
  tbEx.set(0);
  $("#exVal").textContent = "0%";
  st.hidden = {};
  A.mods.forEach((m, i) => A.setHidden(i, false));
  modEls.forEach((b) => b.setAttribute("aria-pressed", "true"));
  updateModCnt();
  closePop();
  A.setExplode(0);
  A.pose(A.N);
  buildFnUI(F);
  setMode("fn", instant);
  if (F.enter) {
    const ld = $("#loading");
    ld.hidden = false;
    showLoad(0, "움직이는 모델 준비 중");
    const res = await F.enter((k) => showLoad(k));
    ld.hidden = true;
    if (token !== loadToken || A !== ad || mode !== "fn") return;
    view.scene.remove(A.root);
    fnRoot = res.root;
    view.scene.add(fnRoot);
    if (F.setBolts) F.setBolts(st.bolts);
    view.frame(res.box, res.frameOpts);
  }
  invalidate(true);
}
function leaveFn(instant) {
  if (mode !== "fn" || !A) return;
  const F = A.fn;
  F.exit();
  if (fnRoot) {
    view.scene.remove(fnRoot);
    fnRoot = null;
    view.scene.add(A.root);
    view.frame(A.full, A.frameOpts);
  }
  $("#loading").hidden = true;
  setMode("asm", instant);
  lastStep = -1;
  lastDone = null;
  lastPoseKey = "";
  invalidate(true);
}
$("#modeSw").addEventListener("click", (ev) => {
  if (!A) return;
  const b = ev.target.closest("button[data-to]");
  if (!b || b.dataset.to === mode) return;
  buzz();
  if (b.dataset.to === "fn") enterFn();
  else leaveFn();
});

// ───────── 재생기 ─────────
$("#play").addEventListener("click", () => {
  if (!A) return;
  buzz();
  if (!st.play && st.T >= A.N - 1e-3) {
    st.T = 0;
    st.goal = null;
  }
  setPlay(!st.play);
});
$("#first").addEventListener("click", () => {
  if (!A) return;
  buzz();
  setPlay(false);
  seek(0);
});
$("#last").addEventListener("click", () => {
  if (!A) return;
  buzz();
  setPlay(false);
  seek(A.N);
});
function stepBy(d) {
  if (!A) return;
  setPlay(false);
  const base = st.goal ?? st.T;
  seek(d < 0 ? Math.ceil(base - 1e-3) - 1 : Math.floor(base + 1e-3) + 1);
}
for (const [idName, d] of [["#prev", -1], ["#next", 1]]) {
  const b = $(idName);
  let hold = 0, rep = 0;
  const stop = () => {
    clearTimeout(hold);
    clearInterval(rep);
  };
  b.addEventListener("pointerdown", () => {
    buzz();
    stepBy(d);
    hold = setTimeout(() => {
      rep = setInterval(() => stepBy(d), A && A.N > 24 ? 70 : 220);
    }, 380);
  });
  ["pointerup", "pointerleave", "pointercancel"].forEach((t) => b.addEventListener(t, stop));
  b.addEventListener("keydown", (ev) => {
    if (ev.key === "Enter" || ev.key === " ") {
      ev.preventDefault();
      stepBy(d);
    }
  });
}

// 오른쪽 위 드롭다운 (모듈 선택 · 보기 설정)
var DROPS = { modBtn: "#modPanel", tune: "#pop" };
function closeDrop(btnId, instant) {
  const btn = $("#" + btnId), panel = $(DROPS[btnId]);
  if (panel.hidden) return;
  btn.setAttribute("aria-expanded", "false");
  if (instant) {
    panel.hidden = true;
    return;
  }
  panel.classList.add("closing");
  setTimeout(() => {
    panel.hidden = true;
    panel.classList.remove("closing");
  }, 180);
}
function closePop(instant) {
  Object.keys(DROPS).forEach((k) => closeDrop(k, instant));
}
Object.keys(DROPS).forEach((k) => $("#" + k).addEventListener("click", () => {
  buzz();
  const panel = $(DROPS[k]), open = panel.hidden || panel.classList.contains("closing");
  Object.keys(DROPS).filter((o) => o !== k).forEach((o) => closeDrop(o, true));
  if (open) {
    panel.classList.remove("closing");
    panel.hidden = false;
    $("#" + k).setAttribute("aria-expanded", "true");
    if (k === "modBtn") modEls.forEach((b) => {
      b.style.animation = "none";
      void b.offsetWidth;
      b.style.animation = "";
    });
  } else closeDrop(k);
}));
var SPEEDS = [0.5, 1, 2, 4];
function setSpeed(v) {
  st.speed = v;
  $("#speed .pill").style.transform = `translateX(${SPEEDS.indexOf(v) * 100}%)`;
  $("#speed").querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", String(Number(b.dataset.v) === v)));
}
$("#speed").addEventListener("click", (ev) => {
  const b = ev.target.closest("button");
  if (!b) return;
  buzz();
  setSpeed(Number(b.dataset.v));
});
setSpeed(1);
$("#follow").addEventListener("click", () => {
  buzz();
  st.follow = !st.follow;
  $("#follow").setAttribute("aria-pressed", String(st.follow));
});
$("#bolts").addEventListener("click", () => {
  buzz();
  st.bolts = !st.bolts;
  $("#bolts").setAttribute("aria-pressed", String(st.bolts));
  if (A?.hasBolts) A.setBolts(st.bolts);
  if (mode === "fn" && A?.fn?.setBolts) A.fn.setBolts(st.bolts);
  lastPoseKey = "";
  invalidate(true);
});
stage.addEventListener("pointerdown", () => closePop());

// ───────── 부품 누르면 이름 ─────────
var tip = $("#tip"), tipT = 0;
var ray = new THREE107.Raycaster();
var ptr = new THREE107.Vector2();
var down = null;
function bindStageTap(v) {
  v.renderer.domElement.addEventListener("pointerdown", (e) => {
    down = [e.clientX, e.clientY];
  });
  v.renderer.domElement.addEventListener("pointerup", (e) => {
    if (!A || !down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 6) return;
    const r = v.renderer.domElement.getBoundingClientRect();
    ptr.set((e.clientX - r.left) / r.width * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ptr, v.camera);
    const hit = ray.intersectObject(fnRoot || A.root, true).find((h) => {
      for (let o = h.object; o; o = o.parent) if (!o.visible) return false;
      return true;
    });
    let o = hit?.object;
    while (o && !o.userData?.name) o = o.parent;
    if (!o) {
      tip.classList.remove("show");
      return;
    }
    tip.innerHTML = `${esc(o.userData.name)}<small>${esc(o.userData.id || "")}${o.userData.sheet ? ` · 도면 ${esc(o.userData.sheet)}` : ""}</small>`;
    const x = clamp(e.clientX - r.left + 12, 8, r.width - 250), y = clamp(e.clientY - r.top - 50, 70, r.height - 60);
    tip.style.transform = `translate(${x}px, ${y}px)`;
    tip.classList.add("show");
    clearTimeout(tipT);
    tipT = setTimeout(() => tip.classList.remove("show"), 2200);
  });
}

// ───────── 매 프레임 ─────────
var tgt = new V3();
var autoFnT = 0;
function tickAsm(dt) {
  const wasPlaying = st.play;
  if (st.goal !== null) {
    const d = st.goal - st.T;
    st.T += Math.sign(d) * Math.min(Math.abs(d), dt * Math.max(2.5, Math.abs(d) * 4));
    if (Math.abs(st.goal - st.T) < 1e-3) {
      st.T = st.goal;
      st.goal = null;
    }
  } else if (st.play) {
    st.T = Math.min(A.N, st.T + dt * st.speed * A.rate);
    if (st.T >= A.N) setPlay(false);
  }
  // 재생으로 조립이 끝나면 잠시 뒤 기능 조작으로 자동 전환
  if (wasPlaying && !st.play && st.T >= A.N - 1e-3 && A.fn) autoFnT = performance.now() + 700;
  if (autoFnT && performance.now() > autoFnT) {
    autoFnT = 0;
    if (mode === "asm" && st.T >= A.N - 1e-3 && !st.play) enterFn();
  }
  const key = `${st.T.toFixed(4)}|${st.explode.toFixed(3)}`;
  if (key !== lastPoseKey) {
    A.setExplode(st.explode);
    A.pose(st.T);
    lastPoseKey = key;
    invalidate(true);
  }
  const done = st.T >= A.N - 1e-3;
  const s = clamp(Math.floor(st.T) + 1, 1, A.N);
  if (st.follow && !done && (st.play || st.goal !== null)) {
    tgt.copy(A.focus(s));
    const d = tgt.sub(view.controls.target).multiplyScalar(Math.min(1, dt * 3));
    if (d.lengthSq() > 1e-6) {
      view.controls.target.add(d);
      view.camera.position.add(d);
      invalidate(false);
    }
  }
  const shown = done ? A.N : st.T <= 1e-3 && !st.play ? 0 : s;
  const stTxt = `${String(shown).padStart(2, "0")}<em> / ${String(A.N).padStart(2, "0")}</em>`;
  if (stTxt !== lastStepTxt) {
    $("#stepText").innerHTML = stTxt;
    lastStepTxt = stTxt;
  }
  if (s !== lastStep || done !== lastDone) {
    const nowEl = $("#now");
    nowEl.classList.toggle("done", done);
    $("#nowText").textContent = done ? "완성 · 모든 모듈 결합" : A.stepShort(s);
    $("#stepName").textContent = done ? "완성 — 기능 조작으로 움직여 보세요" : A.stepName(s);
    nowEl.classList.remove("flash");
    void nowEl.offsetWidth;
    nowEl.classList.add("flash");
    const mi = A.modOfStep(s);
    modEls.forEach((b, i) => b.classList.toggle("pending", mi >= 0 && i >= Math.ceil(st.T)));
    lastStep = s;
    lastDone = done;
  }
  tbStep.set(st.T);
}
function tickFn(dt) {
  const F = A.fn;
  if (F.update(dt)) invalidate(true);
  for (const [id, b] of Object.entries(fnBars)) {
    if (!F.live || F.live[id] === void 0 || b.tb.dragging) continue;
    const lv = F.live[id];
    if (Math.abs(lv - b.tb.v) > 1e-3) {
      b.tb.set(lv, true);
      b.out.textContent = b.it.fmt(lv);
    }
  }
  const now = performance.now();
  if (now > fnStatT) {
    fnStatT = now + 200;
    updateFnStats(F);
  }
}
function startViewerLoop(v) {
  v.renderer.setAnimationLoop((ts) => {
    timer.update(ts);
    const dt = Math.min(timer.getDelta(), 0.1);
    if ($("#viewer").hidden) return;
    if (v.controls.update()) dirty = Math.max(dirty, 1);
    if (A) {
      if (mode === "fn") tickFn(dt);
      else tickAsm(dt);
    }
    if (dirty > 0) {
      v.renderer.render(v.scene, v.camera);
      dirty--;
    }
  });
}
if (SINGLE) route();
else {
  renderFolders();
  renderCards();
  route();
}
window.__view = null;
window.__state = st;
window.__mode = () => mode;



// ───────── 컨트롤러 접기 (조립: 한 줄 미니 · 기능: 펼침=ON/OFF 버튼 / 접힘=조절바) ─────────
(function () {
  const player = $("#player"), btn = $("#fold");
  const syncLabel = () => {
    const v = player.classList.contains("folded");
    const fn = player.dataset.mode === "fn";
    btn.setAttribute("aria-expanded", String(!v));
    btn.setAttribute("aria-label", fn ? (v ? "버튼 조작 펼치기" : "조절바로 접기") : (v ? "컨트롤러 펼치기" : "컨트롤러 접기"));
  };
  const set = (v, save = true) => {
    player.classList.toggle("folded", v);
    syncLabel();
    if (save) try { localStorage.setItem("roborobo-player-folded", v ? "1" : "0"); } catch (e) {}
    if (!v || player.dataset.mode === "fn") refreshFnLayout();
  };
  btn.addEventListener("click", () => { buzz(); set(!player.classList.contains("folded")); });
  $("#miniPlay").addEventListener("click", () => $("#play").click());
  let folded = false;
  try { folded = localStorage.getItem("roborobo-player-folded") === "1"; } catch (e) {}
  set(folded, false);
  // 접힌 줄(조립 전용): 지금 단계 · 이름
  const sync = () => {
    const fn = player.dataset.mode === "fn";
    $("#miniStep").innerHTML = $("#stepText").innerHTML;
    $("#miniName").textContent = $("#stepName").textContent;
    $("#miniPlay").hidden = fn;
    syncLabel();
  };
  const mo = new MutationObserver(sync);
  for (const el of [$("#stepText"), $("#stepName")]) mo.observe(el, { childList: true, characterData: true, subtree: true });
  new MutationObserver(sync).observe(player, { attributes: true, attributeFilter: ["data-mode"] });
  sync();
})();

// ───────── 자동 업데이트: 앱을 열거나 다시 돌아올 때 GitHub에서 바뀐 로봇을 받는다 ─────────
window.addEventListener('robots-updated', () => {
  htoast('새 로봇 · 업데이트를 받았어요');
  const apply = () => { if (!$('#viewer') || $('#viewer').hidden) setTimeout(() => location.reload(), 1200); else window.addEventListener('hashchange', apply, { once: true }); };
  apply();
});
let lastCheckAt = 0;
const runCheck = () => {
  const now = Date.now();
  if (now - lastCheckAt < 15000) return;
  lastCheckAt = now;
  checkUpdates();
};
setTimeout(runCheck, 2500);
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') runCheck(); });
window.addEventListener('online', runCheck);
