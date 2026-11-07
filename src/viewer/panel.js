// 오른쪽 패널: 부품 정보(규격) + 기능 조작(버튼, 슬라이더 등) + 결과 표시.
// 각 부품의 function.js는 여기서 만든 ui 객체로 조작 버튼과 결과 칸을 만든다.
export function createPanel(root) {
  let onControl = () => {};
  const readoutEls = {};

  function showSpec(spec) {
    root.querySelector('.p-name').textContent = spec.name;
    const badge = root.querySelector('.p-size');
    const s = spec.size;
    badge.innerHTML = `${s.x} × ${s.z} × ${s.y} mm <span class="badge ${s.estimated ? 'est' : 'ok'}">${s.estimated ? '추정' : '공식'}</span>`;
    root.querySelector('.p-note').textContent = s.note;
    root.querySelector('.p-func').textContent = spec.function;
    root.querySelector('.p-specs').innerHTML = spec.specs.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('');
    root.querySelector('.p-ports').innerHTML = (spec.ports || []).map((p) => `<li><b>${p.type}</b><span>${p.role}</span></li>`).join('');
    const link = root.querySelector('.p-link');
    link.href = spec.url;
  }

  const ui = {
    controls(list) {
      const box = root.querySelector('.p-controls');
      box.innerHTML = '';
      for (const c of list) {
        const row = document.createElement('label');
        row.className = `ctl ctl-${c.type}${c.compact ? ' compact' : ''}`;
        if (c.type === 'toggle') {
          row.innerHTML = `<span>${c.label}</span><input type="checkbox" ${c.value ? 'checked' : ''}><i></i>`;
          const input = row.querySelector('input');
          input.addEventListener('change', () => onControl(c.id, input.checked));
        } else if (c.type === 'slider') {
          row.innerHTML = `<span>${c.label}</span><input type="range" min="${c.min}" max="${c.max}" step="${c.step}" value="${c.value}"><b>${c.value}${c.unit || ''}</b>`;
          const input = row.querySelector('input');
          const out = row.querySelector('b');
          input.addEventListener('input', () => { out.textContent = `${input.value}${c.unit || ''}`; onControl(c.id, Number(input.value)); });
        } else if (c.type === 'select') {
          row.innerHTML = `<span>${c.label}</span><select>${c.options.map(([v, t]) => `<option value="${v}" ${String(c.value) === v ? 'selected' : ''}>${t}</option>`).join('')}</select>`;
          const sel = row.querySelector('select');
          sel.addEventListener('change', () => onControl(c.id, sel.value));
        } else if (c.type === 'button') {
          row.innerHTML = `<button type="button">${c.label}</button>`;
          row.querySelector('button').addEventListener('click', () => onControl(c.id, true));
        }
        box.appendChild(row);
      }
    },
    readouts(list) {
      const box = root.querySelector('.p-readouts');
      box.innerHTML = list.map(([id, label]) => `<dt>${label}</dt><dd data-id="${id}">-</dd>`).join('');
      for (const k of Object.keys(readoutEls)) delete readoutEls[k];
      for (const [id] of list) readoutEls[id] = box.querySelector(`[data-id="${id}"]`);
    },
    readout(id, text) {
      const el = readoutEls[id];
      if (el && el.textContent !== text) el.textContent = text;
    },
    log(text) {
      const box = root.querySelector('.p-log');
      const line = document.createElement('div');
      line.textContent = text;
      box.prepend(line);
      while (box.children.length > 8) box.lastChild.remove();
    },
  };

  function reset(handler) {
    onControl = handler;
    root.querySelector('.p-controls').innerHTML = '';
    root.querySelector('.p-readouts').innerHTML = '';
    root.querySelector('.p-log').innerHTML = '';
  }

  return { ui, showSpec, reset };
}
