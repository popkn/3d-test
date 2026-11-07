import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { M, mesh } from './materials.js';
import { box } from './components.js';
import { canvasTexture, FONT } from './textures.js';

// 로보로보 기어드 DC 모터 케이스 (서보 모터 모양의 검은 상자 + 양쪽 고정 귀).
// 크기는 HT600의 공식 규격(60 × 40 × 20mm, 귀 포함)을 기준으로 한다.
//   shaft: 'top'   = 윗면(+Y)으로 축이 나온다 (서보 모터와 같은 배치, 한쪽 끝 가까이)
//          'dual'  = 윗면과 아랫면 양쪽으로 축이 나온다 (양축)
//   sticker: 윗면 축 옆 스티커 { color, text }
export const MOTOR = { bodyLength: 40, bodyHeight: 33, width: 20, earSpan: 60, earThickness: 2.4 };

export function makeMotorCase({ shaft = 'top', hubColor = M.bluePlastic, sticker = null, topLabel = 'ROBOROBO', bodyHeight = MOTOR.bodyHeight } = {}) {
  const { bodyLength: L, width: W, earSpan, earThickness } = MOTOR;
  const H = bodyHeight;
  const g = new THREE.Group();

  const body = mesh(new RoundedBoxGeometry(L, H, W, 3, 1.2), M.blackPlastic);
  body.position.y = H / 2;
  g.add(body);
  // 케이스 이음선 (위 뚜껑 / 아래 몸통)
  g.add(box(L + 0.1, 0.4, W + 0.1, M.matteBlack, 0, H - 7, 0, { cast: false }));
  g.add(box(L + 0.1, 0.4, W + 0.1, M.matteBlack, 0, 5, 0, { cast: false }));

  // 고정 귀: 양 끝, 구멍 2개씩
  const earLen = (earSpan - L) / 2;
  for (const s of [-1, 1]) {
    const ear = new THREE.Shape();
    ear.moveTo(0, -W / 2); ear.lineTo(earLen - 1.5, -W / 2); ear.quadraticCurveTo(earLen, -W / 2, earLen, -W / 2 + 1.5);
    ear.lineTo(earLen, W / 2 - 1.5); ear.quadraticCurveTo(earLen, W / 2, earLen - 1.5, W / 2); ear.lineTo(0, W / 2);
    for (const z of [-5, 5]) { const p = new THREE.Path(); p.absarc(earLen * 0.55, z, 1.6, 0, Math.PI * 2, true); ear.holes.push(p); }
    // 가운데 홈
    const geo = new THREE.ExtrudeGeometry(ear, { depth: earThickness, bevelEnabled: false });
    geo.rotateX(Math.PI / 2);
    const m = mesh(geo, M.blackPlastic);
    m.scale.x = s;
    m.position.set(s * L / 2, H - 9, 0);
    g.add(m);
  }

  // 윗면 글자 + 흰 홈 스티커
  const topMat = new THREE.MeshStandardMaterial({
    roughness: 0.55,
    map: canvasTexture(L - 4, W - 4, (c, w, h) => {
      c.fillStyle = '#17181a'; c.fillRect(0, 0, w, h);
      c.fillStyle = '#2c2d30'; c.font = `italic 700 3.2px ${FONT}`; c.fillText(topLabel, 2, h / 2 + 1);
    }, 24),
  });
  const top = mesh(new THREE.PlaneGeometry(L - 4, W - 4), topMat, { cast: false });
  top.rotation.x = -Math.PI / 2;
  top.position.y = H + 0.02;
  g.add(top);
  g.add(box(1.6, 0.2, 6, M.whitePlastic, L / 2 - 8, H, 0, { cast: false }));

  // 출력축 허브
  const hubs = [];
  function makeHub() {
    const hub = new THREE.Group();
    const collar = mesh(new THREE.CylinderGeometry(5, 5, 1.2, 32), M.matteBlack);
    collar.position.y = 0.6;
    const cyl = mesh(new THREE.CylinderGeometry(3.6, 3.6, 4, 6), hubColor); // 육각 허브
    cyl.position.y = 1.2 + 2;
    const holeM = mesh(new THREE.CylinderGeometry(1.2, 1.2, 0.1, 16), M.hole, { cast: false });
    holeM.position.y = 5.25;
    // 회전이 잘 보이도록 표시선
    const mark = box(0.6, 0.12, 3, M.whitePlastic, 0, 5.2, 1.8, { cast: false });
    const spin = new THREE.Group();
    spin.add(cyl, holeM, mark);
    hub.add(collar, spin);
    hub.userData.spin = spin;
    return hub;
  }
  // 윗면 출력: 한쪽 끝 가까이 둥근 받침 위에 축 (사진 기준)
  const shaftX = -L / 2 + 10;
  const boss = mesh(new THREE.CylinderGeometry(6, 6, 2, 32), M.blackPlastic);
  boss.position.set(shaftX, H + 1, 0);
  g.add(boss);
  const topHub = makeHub();
  topHub.position.set(shaftX, H + 2, 0);
  g.add(topHub);
  hubs.push({ hub: topHub, axis: new THREE.Vector3(0, 1, 0) });
  if (shaft === 'dual') {
    // 양축: 같은 축이 아랫면으로도 나온다
    const bottomHub = makeHub();
    bottomHub.rotation.x = Math.PI;
    bottomHub.position.set(shaftX, 0, 0);
    g.add(bottomHub);
    hubs.push({ hub: bottomHub, axis: new THREE.Vector3(0, -1, 0) });
  }

  // 윗면 스티커 (축 옆)
  if (sticker) {
    const st = mesh(new THREE.PlaneGeometry(9, 9), new THREE.MeshStandardMaterial({
      roughness: 0.4,
      map: canvasTexture(9, 9, (c, w, h) => {
        c.fillStyle = sticker.color; c.fillRect(0, 0, w, h);
        c.fillStyle = '#ffffff'; c.font = `900 5.5px ${FONT}`; c.fillText(sticker.text, 1.6, 6.8);
        c.font = `600 1px ${FONT}`; c.fillText(sticker.sub || '', 0.6, 8.4);
      }, 32),
    }), { cast: false });
    st.rotation.x = -Math.PI / 2;
    st.position.set(2, H + 0.05, 0);
    g.add(st);
  }

  // 전선 (빨강/검정) + 2핀 커넥터
  const start = new THREE.Vector3(L / 2 - 4, H - 3, -W / 2 + 4);
  const pts = [start, new THREE.Vector3(L / 2 + 6, H + 6, -W / 2 - 4), new THREE.Vector3(L / 2 + 22, H - 2, -6),
    new THREE.Vector3(L / 2 + 30, H - 12, 4), new THREE.Vector3(L / 2 + 38, H - 16, 10)];
  const curve = new THREE.CatmullRomCurve3(pts);
  for (const [off, mat] of [[-0.65, M.wireRed], [0.65, M.wireBlack]]) {
    const shifted = new THREE.CatmullRomCurve3(curve.points.map((p) => p.clone().add(new THREE.Vector3(0, 0, off))));
    g.add(mesh(new THREE.TubeGeometry(shifted, 40, 0.65, 8, false), mat));
  }
  const end = pts[pts.length - 1];
  const plug = box(5.2, 2.6, 5.2, M.blackPlastic, end.x + 2.4, end.y - 1.3, end.z);
  g.add(plug);

  g.userData = { hubs };
  return g;
}

// 바퀴 (주황 타이어 + 회색 휠). 첫 번째 출력축에 붙이고, 처음엔 숨긴다.
export function attachWheel(motor, { dia = 52, width = 18 } = {}) {
  const { hub, axis } = motor.userData.hubs[0];
  const wheel = new THREE.Group();
  const spin = new THREE.Group();
  wheel.add(spin);
  const tire = mesh(new THREE.TorusGeometry(dia / 2 - 5, 5, 16, 48), M.rubberTire);
  tire.rotation.x = Math.PI / 2;
  tire.scale.z = width / 10;
  const rim = mesh(new THREE.CylinderGeometry(dia / 2 - 7, dia / 2 - 7, width * 0.8, 40), new THREE.MeshStandardMaterial({ color: 0x9aa0a8, roughness: 0.5, metalness: 0.4 }));
  spin.add(tire, rim);
  for (let i = 0; i < 5; i++) {
    const hole = mesh(new THREE.CylinderGeometry(3.4, 3.4, width * 0.82, 16), M.matteBlack, { cast: false });
    const a = (i / 5) * Math.PI * 2;
    hole.position.set(Math.cos(a) * 11, 0, Math.sin(a) * 11);
    spin.add(hole);
  }
  // 축 방향으로 허브 바깥에 둔다
  wheel.position.copy(hub.position).addScaledVector(axis, 5 + width * 0.45);
  wheel.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), axis);
  wheel.visible = false;
  wheel.userData.noBounds = true;
  wheel.userData.spin = spin;
  motor.add(wheel);
  return wheel;
}
