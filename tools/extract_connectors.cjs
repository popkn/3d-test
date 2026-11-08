// 부품 모델에서 기준점 · 구멍 · 모터 축을 뽑아 JSON으로 저장 (로컬 서버 http://localhost:8092 에 __test.html 필요)
// 사용법: node tools/extract_connectors.cjs tools/connectors_auto.json  →  python3 tools/assembly_guide.py
const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage();
  await p.goto('http://localhost:8092/__test.html#cpu-board-8m'); await p.waitForTimeout(3000);
  const r = await p.evaluate(async () => {
    const THREE = await import('three');
    const { catalog, loadPart } = await import('/src/catalog/index.js');
    const { partBounds } = await import('/src/viewer/scene.js');
    const R = (v) => Math.round(v * 10) / 10;
    const out = [];
    for (const s of catalog) {
      const m = (await loadPart(s.id)).build();
      const root = new THREE.Group(); root.add(m.object3d);
      root.traverse((o) => { if (o !== root && o.userData?.noBounds) o.visible = false; });
      root.updateMatrixWorld(true);
      const bb = partBounds(root); const c = bb.getCenter(new THREE.Vector3()); const sz = bb.getSize(new THREE.Vector3());
      const off = [-c.x, -bb.min.y, -c.z];                 // 모델 좌표 → 표준 좌표 (가운데 · 바닥 = 0)
      const conns = [];
      const toStd = (v) => [R(v.x + off[0]), R(v.y + off[1]), R(v.z + off[2])];
      root.traverse((o) => {
        if (!o.visible) return;
        const u = o.userData || {};
        if (Array.isArray(u.holes) && u.holes.length && u.holes[0].x !== undefined) {
          const t = u.thickness ?? 1.6;
          const ax = new THREE.Vector3(0, 1, 0).transformDirection(o.matrixWorld);
          for (const h of u.holes) conns.push({ t: h.r && h.r > 2 ? 'H' + (h.r * 2).toFixed(1) : 'M3', p: toStd(o.localToWorld(new THREE.Vector3(h.x, t, h.z))), a: [R(ax.x), R(ax.y), R(ax.z)] });
        }
        if (Array.isArray(u.pos) && u.plate !== undefined) {
          for (const [x, z] of u.pos) conns.push({ t: 'M3', p: toStd(o.localToWorld(new THREE.Vector3(x, u.plate, -z))), a: [0, 1, 0] });
        }
        if (Array.isArray(u.hubs)) for (const h of u.hubs) {
          const w = h.hub.getWorldPosition(new THREE.Vector3()); conns.push({ t: 'DCUT', p: toStd(w), a: [h.axis.x, h.axis.y, h.axis.z] });
        }
      });
      out.push({ id: s.id, name: s.name, cat: s.category, size: [R(sz.x), R(sz.y), R(sz.z)], off: off.map(R), est: !!s.size.estimated, conns });
    }
    return out;
  });
  fs.writeFileSync(process.argv[2], JSON.stringify(r));
  console.log(r.length, r.filter((x) => x.conns.length).length, r.reduce((a, x) => a + x.conns.length, 0));
  await b.close();
})();
