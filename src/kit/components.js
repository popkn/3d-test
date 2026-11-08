import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { M, mesh } from './materials.js';
import { canvasTexture, FONT } from './textures.js';

// 전자 부품 모음 (단위 mm). 모든 부품은 기판 윗면(y = 0)에 놓이는 기준으로,
// 바닥 가운데가 원점이다. 놓을 때 position만 정하면 된다.

const box = (w, h, d, mat, x = 0, y = 0, z = 0, opt) => {
  const m = mesh(new THREE.BoxGeometry(w, h, d), mat, opt);
  m.position.set(x, y + h / 2, z);
  return m;
};
export { box };

// ── 칩 윗면 각인
export function chipTopMaterial(w, d, lines, { dot = true } = {}) {
  return new THREE.MeshStandardMaterial({
    roughness: 0.45,
    map: canvasTexture(w, d, (g) => {
      g.fillStyle = '#1b1c1e'; g.fillRect(0, 0, w, d);
      g.fillStyle = '#8f9196';
      const fs = Math.min(1.2, (w * 1.6) / Math.max(...lines.map((l) => l.length), 4));
      g.font = `600 ${fs}px ${FONT}`;
      lines.forEach((t, i) => g.fillText(t, Math.max(0.4, w * 0.08), d / 2 - ((lines.length - 1) * fs * 1.2) / 2 + i * fs * 1.2 + fs * 0.35));
      if (dot) { g.beginPath(); g.arc(Math.min(1, w * 0.15), Math.min(1, d * 0.15), Math.min(0.35, w * 0.06), 0, Math.PI * 2); g.fillStyle = '#2b2c2f'; g.fill(); }
    }, 48),
  });
}

function chipBody(w, h, d, lines) {
  const top = chipTopMaterial(w, d, lines);
  const m = mesh(new THREE.BoxGeometry(w, h, d), [M.chip, M.chip, top, M.chip, M.chip, M.chip]);
  return m;
}

// ── QFP (네 변에 핀): TQFP-32, TQFP-64 등
export function qfp({ size = 7, pins = 32, pitch = 0.8, height = 1.0, lines = [] } = {}) {
  const g = new THREE.Group();
  const body = chipBody(size, height, size, lines);
  body.position.y = 0.2 + height / 2;
  g.add(body);
  const per = pins / 4;
  const leadGeo = new THREE.BoxGeometry(1.0, 0.15, pitch * 0.45);
  for (let s = 0; s < 4; s++) {
    for (let i = 0; i < per; i++) {
      const t = (i - (per - 1) / 2) * pitch;
      const a = (s * Math.PI) / 2;
      const r = size / 2 + 0.5;
      const l = mesh(leadGeo, M.solder, { cast: false });
      l.position.set(Math.cos(a) * r - Math.sin(a) * t, 0.08, Math.sin(a) * r + Math.cos(a) * t);
      l.rotation.y = -a;
      g.add(l);
    }
  }
  return g;
}

// ── QFN (핀이 몸통 옆면에 붙은 얇은 칩)
export function qfn({ size = 5, pins = 28, height = 0.9, lines = [] } = {}) {
  const g = new THREE.Group();
  const body = chipBody(size, height, size, lines);
  body.position.y = height / 2;
  g.add(body);
  const per = pins / 4;
  const pitch = (size - 1) / per;
  const padGeo = new THREE.BoxGeometry(0.3, 0.2, pitch * 0.5);
  for (let s = 0; s < 4; s++) {
    for (let i = 0; i < per; i++) {
      const t = (i - (per - 1) / 2) * pitch;
      const a = (s * Math.PI) / 2;
      const p = mesh(padGeo, M.solder, { cast: false });
      p.position.set(Math.cos(a) * (size / 2 + 0.05) - Math.sin(a) * t, 0.1, Math.sin(a) * (size / 2 + 0.05) + Math.cos(a) * t);
      p.rotation.y = -a;
      g.add(p);
    }
  }
  return g;
}

// ── SOIC/SOP (두 변에 핀)
export function soic({ length = 5, width = 4, pins = 8, height = 1.5, lines = [] } = {}) {
  const g = new THREE.Group();
  const body = chipBody(length, height, width, lines);
  body.position.y = 0.15 + height / 2;
  g.add(body);
  const per = pins / 2;
  const pitch = 1.27;
  for (const side of [-1, 1]) {
    for (let i = 0; i < per; i++) {
      const l = mesh(new THREE.BoxGeometry(0.42, 0.2, 1.2), M.solder, { cast: false });
      l.position.set((i - (per - 1) / 2) * pitch, 0.1, side * (width / 2 + 0.5));
      g.add(l);
    }
  }
  return g;
}

// ── 칩 저항/콘덴서 (0805), SOD 다이오드, SOT-23 트랜지스터
export function smd(kind = 'res') {
  const g = new THREE.Group();
  if (kind === 'diode') {
    g.add(box(2.7, 1.1, 1.6, M.chip));
    g.add(box(0.35, 1.12, 1.62, M.metal, -0.9, 0, 0, { cast: false }));
  } else if (kind === 'sot23') {
    g.add(box(2.9, 1.0, 1.3, M.chip, 0, 0.1));
    for (const [x, z] of [[-0.95, 1.0], [0.95, 1.0], [0, -1.0]]) g.add(box(0.4, 0.15, 0.7, M.solder, x, 0, z, { cast: false }));
  } else {
    g.add(box(1.4, 0.6, 1.25, kind === 'res' ? M.chip : M.ceramic));
    for (const sx of [-0.85, 0.85]) g.add(box(0.4, 0.62, 1.27, M.solder, sx, 0, 0, { cast: false }));
  }
  return g;
}

// ── 축 방향 저항 (베이지 몸통 + 색띠), 기판에 눕혀서
export function axialResistor({ length = 6.3, dia = 2.3, bands = ['#8b4513', '#111', '#ff8c00', '#d4af37'] } = {}) {
  const g = new THREE.Group();
  const body = mesh(new THREE.CapsuleGeometry(dia / 2, length - dia, 6, 16), M.resistorBody);
  body.rotation.z = Math.PI / 2;
  body.position.y = dia / 2 + 0.3;
  g.add(body);
  bands.forEach((c, i) => {
    const b = mesh(new THREE.CylinderGeometry(dia / 2 + 0.03, dia / 2 + 0.03, 0.5, 16), new THREE.MeshStandardMaterial({ color: c, roughness: 0.5 }), { cast: false });
    b.rotation.z = Math.PI / 2;
    b.position.set(-length / 2 + 1.3 + i * (i === bands.length - 1 ? 1.4 : 0.9), dia / 2 + 0.3, 0);
    g.add(b);
  });
  for (const s of [-1, 1]) {
    const lead = mesh(new THREE.CylinderGeometry(0.25, 0.25, 2.2, 8), M.solder, { cast: false });
    lead.rotation.z = Math.PI / 2;
    lead.position.set(s * (length / 2 + 0.9), dia / 2 + 0.3, 0);
    g.add(lead);
    const down = mesh(new THREE.CylinderGeometry(0.25, 0.25, dia / 2 + 0.4, 8), M.solder, { cast: false });
    down.position.set(s * (length / 2 + 1.9), (dia / 2 + 0.3) / 2, 0);
    g.add(down);
  }
  return g;
}

// ── LED (지름 3/5mm 둥근 머리, 또는 칩 LED). 켜짐 정도를 setLevel(0~1)로 바꾼다.
export function led({ dia = 5, color = 0xff2a1a, smd: isSmd = false } = {}) {
  const g = new THREE.Group();
  const c = new THREE.Color(color);
  const mat = new THREE.MeshPhysicalMaterial({
    color: c.clone().multiplyScalar(0.55), emissive: c, emissiveIntensity: 0, roughness: 0.15,
    transmission: 0, transparent: true, opacity: 0.9, clearcoat: 1,
  });
  let lens;
  if (isSmd) {
    g.add(box(1.6, 0.5, 0.8, M.whitePlastic));
    lens = mesh(new THREE.BoxGeometry(1.2, 0.25, 0.6), mat, { cast: false });
    lens.position.y = 0.6;
  } else {
    const h = dia * 1.1;
    lens = new THREE.Group();
    const cyl = mesh(new THREE.CylinderGeometry(dia / 2, dia / 2, h - dia / 2, 24), mat);
    cyl.position.y = (h - dia / 2) / 2 + 1;
    const dome = mesh(new THREE.SphereGeometry(dia / 2, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), mat);
    dome.position.y = h - dia / 2 + 1;
    const rim = mesh(new THREE.CylinderGeometry(dia / 2 + 0.4, dia / 2 + 0.4, 1, 24), mat);
    rim.position.y = 1.5;
    lens.add(cyl, dome, rim);
    for (const x of [-1.27, 1.27]) g.add(box(0.5, 1, 0.5, M.solder, x, 0, 0, { cast: false }));
  }
  g.add(lens);
  // 빛: 켜지면 주변을 물들이는 점광원
  const light = new THREE.PointLight(c, 0, isSmd ? 12 : 30, 2);
  light.position.y = isSmd ? 1.5 : dia * 1.4;
  g.add(light);
  g.userData.setLevel = (v) => {
    mat.emissiveIntensity = v * 3.2;
    mat.color.copy(c).multiplyScalar(0.55 + v * 0.45);
    light.intensity = v * (isSmd ? 120 : 600);
  };
  g.userData.setLevel(0);
  return g;
}

// ── 핀 헤더 (2.54mm 간격). up: 위로 선 핀, below: 기판 아래로 나온 길이
export function pinHeader({ cols = 3, rows = 1, pitch = 2.54, above = 6, base = 2.5, below = 3, color = M.blackPlastic, pinMat = M.gold } = {}) {
  const g = new THREE.Group();
  g.add(box(cols * pitch, base, rows * pitch, color));
  const pinGeo = new THREE.BoxGeometry(0.64, base + above + below, 0.64);
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      const p = mesh(pinGeo, pinMat, { cast: true });
      p.position.set((i - (cols - 1) / 2) * pitch, (base + above - below) / 2, (j - (rows - 1) / 2) * pitch);
      g.add(p);
    }
  }
  return g;
}

// ── 박스 헤더 (암 커넥터 모양: 검은 상자에 구멍)
export function femaleHeader({ cols = 3, rows = 1, pitch = 2.54, height = 8.5, color = M.blackPlastic } = {}) {
  const g = new THREE.Group();
  g.add(box(cols * pitch, height, rows * pitch, color));
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      g.add(box(1, 0.05, 1, M.hole, (i - (cols - 1) / 2) * pitch, height, (j - (rows - 1) / 2) * pitch, { cast: false }));
    }
  }
  return g;
}

// ── JST 커넥터 (흰색/빨간색 2핀 등, 핀은 위로 열린 소켓)
export function jst({ pins = 2, pitch = 2.5, color = M.whitePlastic, height = 7, depth = 5.75 } = {}) {
  const g = new THREE.Group();
  const w = pins * pitch + 2.4;
  g.add(box(w, 1.2, depth, color));
  g.add(box(w, height - 1.2, 0.8, color, 0, 1.2, -depth / 2 + 0.4));
  for (const s of [-1, 1]) g.add(box(0.8, height - 1.2, depth, color, s * (w / 2 - 0.4), 1.2, 0));
  g.add(box(w, height - 1.2, 0.6, color, 0, 1.2, depth / 2 - 0.3));
  g.add(box(w - 1.6, 0.05, depth - 1.4, M.hole, 0, 1.25, 0, { cast: false }));
  for (let i = 0; i < pins; i++) {
    g.add(box(0.64, height - 2, 0.64, M.gold, (i - (pins - 1) / 2) * pitch, 1.2, 0.4));
  }
  return g;
}

// ── USB Type-B 리셉터클 (입구는 -X 방향)
export function usbB() {
  const g = new THREE.Group();
  const w = 16.5, d = 12, h = 10.9;
  const shell = mesh(new RoundedBoxGeometry(w, h, d, 2, 0.5), M.metal);
  shell.position.y = h / 2;
  g.add(shell);
  const s = new THREE.Shape();
  const ow = 8.45, oh = 7.78, ch = 1.6;
  s.moveTo(-ow / 2, 0); s.lineTo(ow / 2, 0); s.lineTo(ow / 2, oh - ch); s.lineTo(ow / 2 - ch, oh);
  s.lineTo(-ow / 2 + ch, oh); s.lineTo(-ow / 2, oh - ch); s.closePath();
  const hole = new THREE.Mesh(new THREE.ShapeGeometry(s), M.hole);
  hole.rotation.y = -Math.PI / 2;
  hole.position.set(-w / 2 - 0.02, 1.6, 0);
  g.add(hole);
  g.add(box(0.6, 3.0, 5.2, M.whitePlastic, -w / 2 - 0.05, 1.6 + 2.1, 0, { cast: false }));
  for (const x of [-3, 3]) g.add(box(0.4, 0.15, d - 2, M.solder, x, h, 0, { cast: false }));
  for (const z of [-d / 2, d / 2]) g.add(box(2.4, 2.2, 0.3, M.metal, 1.8, 0, z + Math.sign(z) * 0.15));
  return g;
}

// ── 6P 모듈러 잭 RJ12 (입구는 +X 방향)
export function rj12({ height = 16.4 } = {}) {
  const g = new THREE.Group();
  const w = 17, d = 14;
  const body = mesh(new RoundedBoxGeometry(w, height, d, 2, 0.6), M.blackPlastic);
  body.position.y = height / 2;
  g.add(body);
  const s = new THREE.Shape();
  s.moveTo(-3.3, 0); s.lineTo(-1.6, 0); s.lineTo(-1.6, -2.2); s.lineTo(1.6, -2.2); s.lineTo(1.6, 0);
  s.lineTo(3.3, 0); s.lineTo(3.3, 6.0); s.lineTo(-3.3, 6.0); s.closePath();
  const hole = new THREE.Mesh(new THREE.ShapeGeometry(s), M.hole);
  hole.rotation.y = Math.PI / 2;
  hole.position.set(w / 2 + 0.02, height * 0.38, 0);
  g.add(hole);
  for (let i = 0; i < 6; i++) g.add(box(0.2, 2.2, 0.45, M.gold, w / 2 - 0.05, height * 0.38 + 3.6, -3.2 + i * 1.27, { cast: false }));
  g.add(box(w - 4, 0.3, d - 4, M.chip, 0, height, 0, { cast: false }));
  return g;
}

// ── 크리스털 HC-49/S
export function crystal({ length = 11, width = 4.7, height = 3.5, label = '' } = {}) {
  const g = new THREE.Group();
  const r = width / 2;
  const s = new THREE.Shape();
  s.absarc(-length / 2 + r, 0, r, Math.PI / 2, (Math.PI * 3) / 2, false);
  s.absarc(length / 2 - r, 0, r, -Math.PI / 2, Math.PI / 2, false);
  const geo = new THREE.ExtrudeGeometry(s, { depth: height - 0.4, bevelEnabled: true, bevelThickness: 0.2, bevelSize: 0.2, bevelSegments: 3, curveSegments: 20 });
  geo.rotateX(-Math.PI / 2);
  const body = mesh(geo, M.metal);
  body.position.y = 0.2;
  g.add(body);
  if (label) {
    const p = new THREE.Mesh(new THREE.PlaneGeometry(length * 0.7, width * 0.5), new THREE.MeshBasicMaterial({
      transparent: true,
      map: canvasTexture(length * 0.7, width * 0.5, (c, w, h) => { c.fillStyle = '#6f7277'; c.font = `700 ${h * 0.6}px ${FONT}`; c.fillText(label, 0.4, h * 0.72); }, 48),
    }));
    p.rotation.x = -Math.PI / 2;
    p.position.y = height + 0.02;
    g.add(p);
  }
  return g;
}

// ── 세워진 전해 콘덴서 (원통 + 은색 윗면 + 극성 띠)
export function elecCap({ dia = 6.3, height = 11, color = M.capBlue } = {}) {
  const g = new THREE.Group();
  const body = mesh(new THREE.CylinderGeometry(dia / 2, dia / 2, height, 32), color);
  body.position.y = height / 2 + 0.3;
  g.add(body);
  const top = mesh(new THREE.CylinderGeometry(dia / 2 - 0.15, dia / 2 - 0.15, 0.1, 32), M.metal, { cast: false });
  top.position.y = height + 0.32;
  g.add(top);
  const stripe = mesh(new THREE.CylinderGeometry(dia / 2 + 0.02, dia / 2 + 0.02, height * 0.92, 32, 1, true, -0.4, 0.8), new THREE.MeshStandardMaterial({ color: 0xbfc4cc, roughness: 0.5 }), { cast: false });
  stripe.position.y = height / 2 + 0.3;
  g.add(stripe);
  return g;
}

// ── SMD 전해 콘덴서 (사각 받침 + 원통)
export function elecCapSmd({ dia = 5, height = 5.4 } = {}) {
  const g = new THREE.Group();
  g.add(box(dia + 0.3, 0.9, dia + 0.3, M.blackPlastic));
  const c = mesh(new THREE.CylinderGeometry(dia / 2, dia / 2, height - 0.9, 32), M.matteBlack);
  c.position.y = 0.9 + (height - 0.9) / 2;
  g.add(c);
  const top = mesh(new THREE.CylinderGeometry(dia / 2 - 0.1, dia / 2 - 0.1, 0.08, 32), M.metalDark, { cast: false });
  top.position.y = height + 0.04;
  g.add(top);
  return g;
}

// ── 슬라이드 스위치 (손잡이가 양쪽으로 움직인다). setState(0|1)
export function slideSwitch({ length = 8.5, width = 3.6, height = 3.5, travel = 1.5, color = M.blackPlastic } = {}) {
  const g = new THREE.Group();
  g.add(box(length, height, width, M.metal));
  const knob = box(2, 2.4, 1.6, color, 0, height, 0);
  g.add(knob);
  g.userData.setState = (s) => { knob.position.x = (s ? 1 : -1) * travel; };
  g.userData.setState(0);
  return g;
}

// ── 큰 검은 슬라이드 스위치 (인터페이스 보드처럼 위로 솟은 형태)
export function bigSlideSwitch({ length = 6, width = 6, height = 6 } = {}) {
  const g = new THREE.Group();
  g.add(box(length, height, width, M.blackPlastic));
  const knob = box(length * 0.6, 2.5, width * 0.35, M.matteBlack, 0, height, 0);
  g.add(knob);
  g.userData.setState = (s) => { knob.position.z = (s ? 1 : -1) * width * 0.22; };
  g.userData.setState(0);
  return g;
}

// ── 택트 스위치 (누름 버튼). press(0|1)
export function tactSwitch({ size = 6, cap = M.whitePlastic } = {}) {
  const g = new THREE.Group();
  g.add(box(size, 3.4, size, M.metal));
  // 큰 스위치(12mm)는 사진처럼 검은 몸통 위에 은색 덮개 + 다리 4개
  if (size >= 10) { g.add(box(size - 0.6, 3.6, size - 0.6, M.blackPlastic, 0, 0, 0)); g.add(box(size, 0.3, size, M.metal, 0, 3.6, 0)); for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) g.add(box(0.8, 1.2, 1.4, M.metal, x * (size / 2 + 0.2), 0, z * (size / 2 - 2))); }
  const btn = mesh(new THREE.CylinderGeometry(size * 0.3, size * 0.3, 1.6, 20), cap);
  btn.position.y = 3.4 + 0.8;
  g.add(btn);
  g.userData.press = (p) => { btn.position.y = 3.4 + 0.8 - (p ? 0.6 : 0); };
  return g;
}

// ── 자석식 부저 (검은 원통 + 윗면 구멍). 진동은 vibrate(level, t)
export function magneticBuzzer({ dia = 12, height = 9.5 } = {}) {
  const g = new THREE.Group();
  const body = mesh(new THREE.CylinderGeometry(dia / 2, dia / 2, height, 40), M.matteBlack);
  body.position.y = height / 2;
  g.add(body);
  const top = mesh(new THREE.CylinderGeometry(dia / 2 - 0.3, dia / 2 - 0.3, 0.1, 40), M.blackPlastic, { cast: false });
  top.position.y = height + 0.03;
  g.add(top);
  const hole = mesh(new THREE.CylinderGeometry(1.0, 1.0, 0.12, 20), M.copper, { cast: false });
  hole.position.y = height + 0.06;
  g.add(hole);
  g.userData.top = top;
  return g;
}

// ── 반고정 가변저항 (파란 사각형 + 돌리는 십자 홈). setAngle(라디안)
export function trimpot({ size = 6.5, height = 4.5 } = {}) {
  const g = new THREE.Group();
  g.add(box(size, height, size, M.bluePlastic));
  const knob = new THREE.Group();
  const disc = mesh(new THREE.CylinderGeometry(size * 0.36, size * 0.36, 0.6, 24), M.whitePlastic);
  knob.add(disc);
  knob.add(box(size * 0.6, 0.25, 0.7, M.matteBlack, 0, 0.25, 0, { cast: false }));
  knob.add(box(0.7, 0.25, size * 0.6, M.matteBlack, 0, 0.25, 0, { cast: false }));
  knob.position.y = height + 0.3;
  g.add(knob);
  g.userData.setAngle = (a) => { knob.rotation.y = -a; };
  return g;
}

// ── 콘덴서 마이크 (검은 원통 + 윗면 천 덮개)
export function electretMic({ dia = 9.7, height = 6.7 } = {}) {
  const g = new THREE.Group();
  const body = mesh(new THREE.CylinderGeometry(dia / 2, dia / 2, height, 32), M.matteBlack);
  body.position.y = height / 2;
  g.add(body);
  const cloth = mesh(new THREE.CylinderGeometry(dia / 2 - 0.6, dia / 2 - 0.6, 0.1, 32), new THREE.MeshStandardMaterial({ color: 0x2a2a2c, roughness: 1 }), { cast: false });
  cloth.position.y = height + 0.03;
  g.add(cloth);
  return g;
}

// ── 세라믹 콘덴서 (노란 동글납작 머리, 다리 2개)
export function ceramicCap({ dia = 4 } = {}) {
  const g = new THREE.Group();
  const head = mesh(new THREE.SphereGeometry(dia / 2, 16, 12), new THREE.MeshStandardMaterial({ color: 0xe8b52a, roughness: 0.5 }));
  head.scale.set(1, 1, 0.5);
  head.position.y = 2.5 + dia / 2;
  g.add(head);
  for (const x of [-1.27, 1.27]) g.add(box(0.4, 2.6, 0.4, M.solder, x, 0, 0, { cast: false }));
  return g;
}

// ── DIP 스위치 (n개). setBits([true, false, ...]) 로 손잡이 위치를 바꾼다
export function dipSwitch({ n = 4, color = M.redPlastic } = {}) {
  const g = new THREE.Group();
  const w = n * 2.54;
  g.add(box(w + 1, 3, 6, color));
  const knobs = [];
  for (let i = 0; i < n; i++) {
    g.add(box(1.4, 0.1, 3.6, M.hole, (i - (n - 1) / 2) * 2.54, 3, 0, { cast: false }));
    const k = box(1.2, 1, 1.4, M.whitePlastic, (i - (n - 1) / 2) * 2.54, 3, 0);
    g.add(k);
    knobs.push(k);
  }
  g.userData.setBits = (bits) => knobs.forEach((k, i) => { k.position.z = bits[i] ? -1 : 1; });
  return g;
}
