import * as THREE from 'three';
import { partBounds } from '../src/viewer/scene.js';
import { createGuideLines, setHighlight } from '../src/assembly/render.js';
import { BOLT_PITCH } from '../src/assembly/solver.js';

// 완성 로봇 파일 공통 (앱 조립 재생기와 약속한 모양: makeAdapter(ctx) → 어댑터)
// ctx = { view, st, onProgress } — 앱 화면 쪽 카메라 · 재생 상태
export const V3 = THREE.Vector3;
export const rad = (d) => THREE.MathUtils.degToRad(d);
export const ease = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
export const DRIVE5 = [['back', '후진'], ['left', '왼쪽'], ['stop', '정지'], ['right', '오른쪽'], ['fwd', '전진']];
export { partBounds };

export function groupAdapter(root, groups, keys, names, explode, extra, frameOpts, count) {
  root.updateMatrixWorld(true);
  const full = partBounds(root);
  const H = full.getSize(new V3()).y;
  const centers = keys.map((k) => partBounds(groups[k]).getCenter(new V3()));
  const hidden = {};
  let ex = 0;
  return {
    root, N: keys.length, rate: 1, hasBolts: false, frameOpts, full, count,
    mods: keys.map((k) => ({ no: k, name: names[k], short: names[k].split(' (')[0] })),
    pose(T) {
      keys.forEach((k, i) => {
        const g = groups[k], t = T - i, d = explode[k] || [0, 0, 0];
        const drop = (1 - ease(t / 0.85)) * H * 0.55;
        g.visible = t > 0 && !hidden[i];
        g.position.set(d[0] * ex, d[1] * ex + drop, d[2] * ex);
      });
      if (extra) extra(ex);
    },
    setExplode(x) {
      ex = x;
    },
    setHidden(i, v) {
      hidden[i] = v;
    },
    stepName: (s) => `${keys[s - 1]} ${names[keys[s - 1]]}`,
    stepShort: (s) => `${keys[s - 1]} ${names[keys[s - 1]].split(' (')[0]} 결합`,
    modOfStep: (s) => s - 1,
    focus(s) {
      const k = keys[s - 1], d = explode[k] || [0, 0, 0];
      return centers[s - 1].clone().add(new V3(d[0] * ex, d[1] * ex, d[2] * ex));
    },
  };
}

// 상세 조립 어댑터: 모듈 안의 부품을 하나씩 조립한다.
//   granular = true: 규칙 10.3 최대 세분화 (부품 1개 · 볼트/너트/캡너트 1개 = 1단계, 묶기 금지)
//   hasBolts = true: 볼트 · 너트 · 캡너트 기본 표시 + 분해 시 자동 포함 + 나사 회전
//   guides = true: 진입 · 분해 가이드선 표시
//   highlight = true: 현재 작업 대상 하이라이트
export function detailAdapter(root, modules, {
  frameOpts, count, moduleDir = {}, onPose = null, extraSteps = [], onTestStep = null,
  granular = false, hasBolts = false, guides = false, highlight = false, rate = 2,
} = {}) {
  root.updateMatrixWorld(true);
  const full = partBounds(root);
  const all = full.getCenter(new V3());
  const steps = [], items = [], testSteps = [];
  const inv = new THREE.Quaternion(), W = new V3();
  const Y = new V3(0, 1, 0), qSpin = new THREE.Quaternion();
  const w0 = new V3(), w1 = new V3();
  const extraByHolder = new Map(extraSteps.filter((e) => e.afterHolder).map((e) => [e.afterHolder, e]));

  modules.forEach((m, mi) => {
    const its = m.holders.map((h) => {
      const c = partBounds(h).getCenter(new V3());
      h.parent.getWorldQuaternion(inv).invert();
      return {
        h, mi, c,
        p0: h.position.clone(),
        q0: h.quaternion.clone(),
        inv: inv.clone(),
        fastener: !!h.userData?.fastener,
        expDir: h.userData?.expDir ? new V3(...h.userData.expDir) : null,
      };
    });
    m.c = its.reduce((s, it) => s.add(it.c), new V3()).multiplyScalar(1 / Math.max(1, its.length));
    const d = moduleDir[m.no] ? new V3(...moduleDir[m.no]) : m.c.clone().sub(all).multiplyScalar(0.9).add(new V3(0, 30 * mi, 0));
    m.dir = d;
    for (const it of its) {
      const v = it.c.clone().sub(m.c);
      if (it.expDir && it.expDir.lengthSq() > 1e-6) {
        if (it.fastener) {
          const dir = it.expDir.clone().normalize();
          it.spread = v.clone().multiplyScalar(0.45).addScaledVector(dir, 34);
          it.come = dir.clone().multiplyScalar(24);
        } else {
          it.spread = it.expDir.clone();
          it.come = it.expDir.clone().normalize().multiplyScalar(42);
        }
      } else {
        it.spread = v.clone().multiplyScalar(0.9);
        it.come = v.clone().setY(Math.abs(v.y) * 0.6 + 26).normalize().multiplyScalar(48);
      }
      const last = steps[steps.length - 1];
      // 규칙 10.3: 구조 부품은 1부품=1단계, 연속으로 이어지는 볼트·너트·캡너트 체결은 1단계로 묶음 (중간에 부품 a가 끼면 3단계로 분리)
      if (it.fastener && last && !last.isTest && last.mi === mi && last.fastener) {
        last.items.push(it);
      } else if (!granular && last && !last.isTest && last.mi === mi && last.name === it.h.userData.name && last.id === it.h.userData.id) {
        last.items.push(it);
      } else {
        steps.push({ mi, name: it.h.userData.name, id: it.h.userData.id, note: it.h.userData.note || '', fastener: it.fastener, items: [it] });
      }
      it.step = steps.length - 1;
      items.push(it);

      const exStep = extraByHolder.get(it.h);
      if (exStep) {
        const ts = {
          mi, isTest: true, testId: exStep.id, name: exStep.name, short: exStep.short || exStep.name,
          kind: exStep.kind || '★ 메커니즘 테스트', cam: exStep.cam || null,
          focusPt: exStep.focusPt ? exStep.focusPt.clone() : it.c.clone(),
          items: [],
        };
        steps.push(ts);
        testSteps.push({ ...ts, step1: steps.length });
      }
    }
  });

  const guide = guides ? createGuideLines(items.length, 0x38bdf8, 0.6) : null;
  if (guide) root.add(guide.object);

  const hidden = {};
  let ex = 0;
  let boltsOn = true;
  let guidesOn = true;
  let hlStep = -1;
  let hlObjs = [];
  const clearHighlight = () => { hlObjs.forEach((o) => setHighlight(o, false)); hlObjs = []; hlStep = -1; };
  const off = new V3();

  return {
    root, N: steps.length, rate, hasBolts, frameOpts, full, count, clearHighlight, testSteps,
    mods: modules.map((m) => ({ no: m.no, name: m.name, short: m.name.split(' (')[0] })),
    getTestStep: (s) => { const st = steps[s - 1]; return st?.isTest ? st : null; },
    stepOfHolder: (h) => { const it = items.find((x) => x.h === h); return it ? it.step + 1 : -1; },
    pose(T) {
      if (onPose) onPose(T);
      const showFast = boltsOn || ex > 0.005;
      const curStepIdx = Math.min(steps.length - 1, Math.max(0, Math.floor(T)));
      const finished = T >= steps.length;
      const curStep = !finished ? steps[curStepIdx] : null;
      if (highlight) {
        const want = finished || curStep?.isTest ? -1 : curStepIdx;
        if (want !== hlStep) {
          clearHighlight();
          hlStep = want;
          if (want >= 0 && steps[want]) {
            for (const it of steps[want].items) { setHighlight(it.h, true); hlObjs.push(it.h); }
          }
        }
      }
      const segs = [];
      for (const it of items) {
        const t = T - it.step, m = modules[it.mi];
        const vis = t > 0 && !hidden[it.mi] && (!it.fastener || showFast);
        it.h.visible = vis;
        const enter = 1 - ease(t / 0.8);
        off.copy(it.come).multiplyScalar(enter).addScaledVector(m.dir, ex).addScaledVector(it.spread, ex);
        if (off.lengthSq() < 1e-8) {
          if (it.moved) {
            it.h.position.copy(it.p0);
            if (it.fastener) it.h.quaternion.copy(it.q0);
            it.moved = false;
          }
          continue;
        }
        W.copy(off).applyQuaternion(it.inv);
        it.h.position.copy(it.p0).add(W);
        if (it.fastener) {
          const travel = off.length();
          qSpin.setFromAxisAngle(Y, (travel / (BOLT_PITCH * 4)) * Math.PI * 2);
          it.h.quaternion.copy(it.q0).multiply(qSpin);
        }
        it.moved = true;
        if (guide && guidesOn && vis && ((it.step === curStepIdx && enter > 0.02) || ex > 0.01)) {
          w0.copy(it.c);
          w1.copy(it.c).add(off);
          if (w0.distanceToSquared(w1) > 1) segs.push([w0.x, w0.y, w0.z, w1.x, w1.y, w1.z]);
        }
      }
      if (guide) guide.update(segs);
      if (onTestStep) onTestStep(curStep?.isTest ? curStep : null, curStep?.isTest ? Math.max(0, Math.min(1, T - curStepIdx)) : 0);
    },
    setExplode(x) { ex = x; },
    setBolts(v) { boltsOn = v; },
    setGuides(v) { guidesOn = v; },
    setHidden(i, v) { hidden[i] = v; },
    stepName: (s) => {
      const st = steps[s - 1], m = modules[st.mi];
      if (st.isTest) return `${m.no} ${m.name.split(' (')[0]} › ${st.name}`;
      if (st.fastener && st.items.length > 1) {
        const cnt = {};
        for (const x of st.items) { const k = x.h.userData.id; cnt[k] = (cnt[k] || 0) + 1; }
        const summary = Object.entries(cnt).map(([k, n]) => `${k} × ${n}`).join(' + ');
        return `${m.no} ${m.name.split(' (')[0]} › [체결 일괄] ${st.name.split(' (')[0]} (${summary}, 총 ${st.items.length}개)`;
      }
      const tag = st.fastener ? '[체결] ' : '[부품] ';
      return `${m.no} ${m.name.split(' (')[0]} › ${tag}${st.name}${st.items.length > 1 ? ` × ${st.items.length}` : ''}${st.note ? ` — ${st.note}` : ''}`;
    },
    stepShort: (s) => {
      const st = steps[s - 1];
      if (st.isTest) return st.short;
      if (st.fastener && st.items.length > 1) return `${modules[st.mi].no} · 체결 일괄 (${st.items.length}개)`;
      return `${modules[st.mi].no} · ${st.fastener ? '체결: ' : ''}${st.name.split(' (')[0]}${st.items.length > 1 ? ` × ${st.items.length}` : ''}`;
    },
    stepKind: (s) => {
      const st = steps[s - 1];
      if (st?.isTest) return st.kind;
      return st?.fastener ? '볼트 · 너트 · 캡너트 체결' : '부품 배치';
    },
    modOfStep: (s) => steps[s - 1].mi,
    focus(s) {
      const st = steps[s - 1], m = modules[st.mi];
      if (st.isTest) return st.focusPt.clone().addScaledVector(m.dir, ex);
      return st.items[0].c.clone().addScaledVector(m.dir, ex).addScaledVector(st.items[0].spread, ex);
    },
  };
}
