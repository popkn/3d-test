import * as THREE from 'three';

// 화면 위 글자: 부품 이름표(연결선 포함)와 치수(가로 · 세로 · 높이)
const SVG = 'http://www.w3.org/2000/svg';

export function createOverlay(container) {
  const layer = document.createElement('div');
  layer.className = 'overlay';
  const svg = document.createElementNS(SVG, 'svg');
  layer.appendChild(svg);
  container.appendChild(layer);
  const dimGroup = new THREE.Group();
  const dimMat = new THREE.LineBasicMaterial({ color: 0xe8432a });
  let labels = [];
  let dims = [];
  const v = new THREE.Vector3();

  function clear() {
    for (const l of labels) { l.el.remove(); l.line.remove(); }
    for (const d of dims) d.el.remove();
    labels = []; dims = [];
    dimGroup.clear();
  }

  function setLabels(list) {
    for (const def of list) {
      const el = document.createElement('div');
      el.className = def.small ? 'tag small' : 'tag';
      el.innerHTML = `${def.name}<small>${def.sub}</small>`;
      layer.appendChild(el);
      const line = document.createElementNS(SVG, 'polyline');
      svg.appendChild(line);
      labels.push({ ...def, anchor: new THREE.Vector3(...def.anchor), el, line });
    }
  }

  // box: 부품 경계 상자, size: 표시할 숫자 { x, y, z, estimated }
  function setDims(box, size) {
    const { min, max } = box;
    const pad = Math.max(4, (max.x - min.x) * 0.06);
    const mark = size.estimated ? ' (추정)' : '';
    const list = [
      { a: new THREE.Vector3(min.x, min.y, max.z + pad), b: new THREE.Vector3(max.x, min.y, max.z + pad), tick: new THREE.Vector3(0, 0, 1), text: `${size.x} MM${mark}` },
      { a: new THREE.Vector3(max.x + pad, min.y, min.z), b: new THREE.Vector3(max.x + pad, min.y, max.z), tick: new THREE.Vector3(1, 0, 0), text: `${size.z} MM${mark}` },
      { a: new THREE.Vector3(max.x + pad * 0.7, min.y, max.z + pad * 0.7), b: new THREE.Vector3(max.x + pad * 0.7, max.y, max.z + pad * 0.7), tick: new THREE.Vector3(1, 0, 0), text: `${size.y} MM${mark}` },
    ];
    const pts = [];
    for (const d of list) {
      const t = d.tick.clone().multiplyScalar(pad * 0.25);
      pts.push(d.a, d.b, d.a.clone().add(t), d.a.clone().sub(t), d.b.clone().add(t), d.b.clone().sub(t));
      const el = document.createElement('div');
      el.className = 'dim';
      el.textContent = d.text;
      layer.appendChild(el);
      dims.push({ ...d, el, offset: pad * 0.6 });
    }
    dimGroup.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(pts), dimMat));
  }

  function project(p, camera, w, h) {
    v.copy(p).project(camera);
    return [(v.x * 0.5 + 0.5) * w, (-v.y * 0.5 + 0.5) * h, v.z];
  }

  function update(camera, { showLabels, showDims }) {
    const w = container.clientWidth, h = container.clientHeight;
    const s = Math.min(1, w / 1000);
    for (const l of labels) {
      l.el.style.opacity = showLabels ? 1 : 0;
      l.line.style.opacity = showLabels ? 1 : 0;
      if (!showLabels) continue;
      const world = l.anchor.clone().applyMatrix4(l.object.matrixWorld);
      // 멀리서는 숨기는 이름표 (펼쳐보기의 부품 이름: 확대하면 보인다)
      if (l.maxDist && world.distanceTo(camera.position) > l.maxDist) { l.el.style.opacity = 0; l.line.style.opacity = 0; continue; }
      const [ax, ay, z] = project(world, camera, w, h);
      if (z > 1 || ((l.maxDist || l.hideOff) && (ax < 0 || ay < 0 || ax > w || ay > h))) { l.el.style.opacity = 0; l.line.style.opacity = 0; continue; }
      const left = l.off[0] < 0;
      const lw = l.el.offsetWidth;
      let lx = ax + l.off[0] * s;
      lx = left ? Math.max(lw + 8, Math.min(w - 8, lx)) : Math.max(8, Math.min(w - lw - 8, lx));
      const ly = Math.max(20, Math.min(h - 24, ay + l.off[1] * s));
      l.el.style.transform = `translate(${left ? lx - lw : lx}px, ${ly - 8}px)`;
      l.el.classList.toggle('left', left);
      l.line.setAttribute('points', `${ax},${ay} ${lx + (left ? 4 : -4)},${ly}`);
    }
    dimGroup.visible = showDims;
    for (const d of dims) {
      d.el.style.opacity = showDims ? 1 : 0;
      const mid = d.a.clone().lerp(d.b, 0.5).addScaledVector(d.tick, d.offset);
      const [x, y] = project(mid, camera, w, h);
      d.el.style.transform = `translate(${x - d.el.offsetWidth / 2}px, ${y - 7}px)`;
    }
  }

  return { dimGroup, clear, setLabels, setDims, update };
}
