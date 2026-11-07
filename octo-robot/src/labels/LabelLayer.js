import * as THREE from 'three';
import { labelDefs } from './labelDefs.js';
import { loadCss } from '../loadCss.js';

loadCss(new URL('./labels.css', import.meta.url));

const SVG_NS = 'http://www.w3.org/2000/svg';

// 이름표 층: 매 프레임 부품의 3D 위치를 화면 좌표로 바꿔 이름표와 연결선을 옮긴다.
//   setMode(id): 그 모드의 이름표만 나타난다
//   enabled: 전체 켜기/끄기 (HUD 표시 옵션 LABELS)
export class LabelLayer {
  constructor(robot, container, defs = labelDefs) {
    this.enabled = true;
    // 이름표가 들어갈 수 있는 화면 영역 (HUD 패널을 피한다)
    this.safe = { left: 16, right: 16, top: 40, bottom: 40 };
    this.root = document.createElement('div');
    this.root.className = 'label-layer';
    this.svg = document.createElementNS(SVG_NS, 'svg');
    this.svg.classList.add('label-lines');
    this.root.appendChild(this.svg);
    container.appendChild(this.root);

    this.items = defs.map((def) => {
      const { object, offset } = def.anchor(robot);
      const el = document.createElement('div');
      el.className = 'part-label';
      if (def.screen[0] < 0) el.classList.add('left');
      el.innerHTML = `<b>${def.title}</b><small>${def.sub}</small>`;
      this.root.appendChild(el);
      const line = document.createElementNS(SVG_NS, 'polyline');
      const dot = document.createElementNS(SVG_NS, 'circle');
      dot.setAttribute('r', '2.5');
      this.svg.append(line, dot);
      return { def, object, offset: offset.clone(), el, line, dot, alpha: 0, on: false };
    });
    this._v = new THREE.Vector3();
  }

  setMode(id) {
    for (const it of this.items) it.on = it.def.modes.includes(id);
  }

  update(camera, dt) {
    const w = this.root.clientWidth;
    const h = this.root.clientHeight;
    const scale = Math.min(1, w / 1200); // 작은 화면에서는 이름표를 기준점에 더 가깝게
    for (const it of this.items) {
      // 연결선은 글자와 같은 속도로 나타나고 사라진다
      const goal = this.enabled && it.on ? 1 : 0;
      it.alpha += (goal - it.alpha) * Math.min(1, dt * 6);
      it.el.classList.toggle('on', goal === 1);
      if (it.alpha < 0.01) {
        it.line.setAttribute('points', '');
        it.dot.setAttribute('opacity', '0');
        continue;
      }
      const p = this._v.copy(it.offset).applyMatrix4(it.object.matrixWorld).project(camera);
      if (p.z > 1) { it.alpha = 0; continue; } // 카메라 뒤
      const ax = (p.x * 0.5 + 0.5) * w;
      const ay = (-p.y * 0.5 + 0.5) * h;
      const [dx, dy] = it.def.screen;
      const left = dx < 0;
      // 이름표 전체가 화면 안에 들어오도록 (왼쪽 이름표는 오른쪽 끝 기준)
      const lw = it.el.offsetWidth;
      const lx = left
        ? THREE.MathUtils.clamp(ax + dx * scale, this.safe.left + lw, w - this.safe.right)
        : THREE.MathUtils.clamp(ax + dx * scale, this.safe.left, w - this.safe.right - lw);
      const ly = THREE.MathUtils.clamp(ay + dy * scale, this.safe.top, h - this.safe.bottom);
      // 기준점 → 꺾이는 점 → 이름표 옆
      const elbowX = lx + (left ? 18 : -18);
      it.line.setAttribute('points', `${ax},${ay} ${elbowX},${ly} ${lx + (left ? 4 : -4)},${ly}`);
      it.line.setAttribute('opacity', String(it.alpha));
      it.dot.setAttribute('cx', ax);
      it.dot.setAttribute('cy', ay);
      it.dot.setAttribute('opacity', String(it.alpha));
      const tx = left ? lx - it.el.offsetWidth : lx;
      it.el.style.transform = `translate(${tx}px, ${ly - 8}px)`;
    }
  }
}
