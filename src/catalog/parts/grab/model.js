import * as THREE from 'three';
import { mesh } from '../../../kit/materials.js';

// 그랩[플라스틱] 실물 모델 (PFOG-N001 · 어두운 회색 ABS 스쿠프형 버킷 집게)
// 크기: X=50(폭) × Y=34(높이) × Z=76(길이, z ∈ [-38, +38], 앞쪽 스쿠프 끝 = +Z)
// 체결 구멍(총 24개 M3):
//   - 후면 평판(z = -38): 4열 × 3행 = 12개 (x = -15,-5,+5,+15 · y = 7,17,27 · 10 mm 간격)
//   - 하부 바닥(y = 0):   6열 × 2행 = 12개 (x = -12.5..+12.5, 5 mm 간격 · z = -18,-8, 10 mm 간격)
// (사진 속 임시 육각 서포트/너트는 제외하고 순수 그랩 본체만 모델링)

const W = 50;
const H = 34;
const L = 76;
const WALL = 2.4;
const HOLE_R = 1.65;

function punchHole(shape, x, y, r = HOLE_R) {
  const p = new THREE.Path();
  p.absarc(x, y, r, 0, Math.PI * 2, true);
  shape.holes.push(p);
}

// 측면 실루엣: 상단 톱니(3개 돌출 + 3개 홈) + 하단~전면 부드러운 곡면 스쿠프
function makeSideWallGeo() {
  const s = new THREE.Shape();
  // 좌표계: shape X = +Z (뒤 -38 → 앞 +38), shape Y = +Y (바닥 0 → 상단 34)
  s.moveTo(-38, 0);
  s.lineTo(2, 0);
  // 바닥(2,0) → 전면 끝(38,34) 부드러운 곡선 스쿠프
  const segs = 18;
  for (let i = 1; i <= segs; i++) {
    const t = (i / segs) * (Math.PI / 2);
    const z = 2 + 36 * Math.sin(t);
    const y = 34 * (1 - Math.cos(t));
    s.lineTo(z, y);
  }
  // 상단 톱니 테두리 (앞 +38 → 뒤 -38)
  const topPts = [
    [38, 34], [32, 34], [30.5, 29.0], [24.5, 29.0], [23.0, 34],
    [12.5, 34], [11.0, 29.0], [3.5, 29.0], [2.0, 34],
    [-9.5, 34], [-11.0, 29.0], [-18.5, 29.0], [-20.0, 34],
    [-38, 34],
  ];
  for (const [z, y] of topPts) s.lineTo(z, y);
  s.closePath();
  const geo = new THREE.ExtrudeGeometry(s, { depth: WALL, bevelEnabled: false, curveSegments: 12 });
  // shape(X=z, Y=y, Z=extrude) → world(X=extrude, Y=y, Z=z)
  geo.rotateY(-Math.PI / 2);
  return geo;
}

// 후면 평판 (50×34, 실제 M3 구멍 4×3=12개 천공)
function makeRearWallGeo() {
  const s = new THREE.Shape();
  s.moveTo(-W / 2, 0);
  s.lineTo(W / 2, 0);
  s.lineTo(W / 2, H);
  s.lineTo(-W / 2, H);
  s.closePath();
  for (const x of [-15, -5, 5, 15]) {
    for (const y of [7, 17, 27]) {
      punchHole(s, x, y);
    }
  }
  return new THREE.ExtrudeGeometry(s, { depth: WALL, bevelEnabled: false, curveSegments: 10 });
}

// 하부 평탄 바닥판 (z ∈ [-38, +2], 실제 M3 구멍 6×2=12개 천공)
function makeFlatFloorGeo() {
  const s = new THREE.Shape();
  // shape X = x (-25..25), shape Y = z (-38..+2)
  s.moveTo(-W / 2, -38);
  s.lineTo(W / 2, -38);
  s.lineTo(W / 2, 2);
  s.lineTo(-W / 2, 2);
  s.closePath();
  for (const x of [-12.5, -7.5, -2.5, 2.5, 7.5, 12.5]) {
    for (const z of [-18, -8]) {
      punchHole(s, x, z);
    }
  }
  const geo = new THREE.ExtrudeGeometry(s, { depth: WALL, bevelEnabled: false, curveSegments: 10 });
  // shape(X=x, Y=z, Z=depth) → world(X=x, Y=depth, Z=-z) → rotateX(-PI/2) maps (x, y, z) to (x, z, -y), so flip Y before rotate
  geo.rotateX(Math.PI / 2);
  // After rotateX(+PI/2): (x, z_shape, depth) -> (x, -depth, z_shape); translate Y by +WALL so y ∈ [0, WALL]
  geo.translate(0, WALL, 0);
  return geo;
}

// 곡면 띠 (폭 w, 곡선 구간 t0..t1, 두께 thick, 반경 오프셋 dr)
function makeCurvedStripGeo(width, t0, t1, thick = WALL, dr = 0, segs = 16) {
  const s = new THREE.Shape();
  const rZ = 36 + dr, rY = 34 + dr;
  const ptsOut = [], ptsIn = [];
  for (let i = 0; i <= segs; i++) {
    const t = t0 + (t1 - t0) * (i / segs);
    const z0 = 2 + rZ * Math.sin(t);
    const y0 = 34 - rY * Math.cos(t);
    const nz = Math.sin(t), ny = -Math.cos(t); // 바깥쪽 법선
    ptsOut.push([z0, y0]);
    ptsIn.push([z0 - nz * thick, y0 - ny * thick]);
  }
  s.moveTo(ptsOut[0][0], ptsOut[0][1]);
  for (let i = 1; i < ptsOut.length; i++) s.lineTo(ptsOut[i][0], ptsOut[i][1]);
  for (let i = ptsIn.length - 1; i >= 0; i--) s.lineTo(ptsIn[i][0], ptsIn[i][1]);
  s.closePath();
  const geo = new THREE.ExtrudeGeometry(s, { depth: width, bevelEnabled: false });
  geo.translate(0, 0, -width / 2);
  geo.rotateY(-Math.PI / 2);
  return geo;
}

export function makeGrab(mat) {
  const g = new THREE.Group();

  // 1. 좌·우 톱니형 측벽
  const sideGeo = makeSideWallGeo();
  const leftWall = mesh(sideGeo, mat);
  leftWall.position.x = -W / 2 + WALL;
  g.add(leftWall);
  const rightWall = mesh(sideGeo, mat);
  rightWall.position.x = W / 2;
  g.add(rightWall);

  // 2. 후면 평판 (4×3 = 12 M3 구멍)
  const rear = mesh(makeRearWallGeo(), mat);
  rear.position.z = -38;
  g.add(rear);

  // 후면 내부 보강 리브 5줄 (사진 2의 4개 볼트 채널 구획 · 육각너트 없음)
  const ribGeo = new THREE.BoxGeometry(1.2, 27, 2.2);
  for (const rx of [-20, -10, 0, 10, 20]) {
    const rib = mesh(ribGeo, mat);
    rib.position.set(rx, 17, -34.5);
    g.add(rib);
  }

  // 3. 하부 평탄 바닥판 (6×2 = 12 M3 구멍)
  g.add(mesh(makeFlatFloorGeo(), mat));

  // 하부 외측 ROBOROBO 육각 보스 (사진 4)
  const bossShape = new THREE.Shape();
  bossShape.moveTo(-14, -4); bossShape.lineTo(14, -4);
  bossShape.lineTo(17, 0); bossShape.lineTo(14, 4);
  bossShape.lineTo(-14, 4); bossShape.lineTo(-17, 0);
  bossShape.closePath();
  const bossGeo = new THREE.ExtrudeGeometry(bossShape, { depth: 1.6, bevelEnabled: true, bevelThickness: 0.4, bevelSize: 0.4, bevelSegments: 1 });
  bossGeo.rotateX(Math.PI / 2);
  const boss = mesh(bossGeo, mat);
  boss.position.set(0, 0.2, -29);
  g.add(boss);

  // 4. 곡면 스쿠프 바닥: 4개 통풍 슬롯을 사이에 둔 5개의 곡면 바 + 상/하 가로 브리지
  const tBot = 0.0, tSlot0 = 0.08, tSlot1 = 0.62, tTop = Math.PI / 2;
  // 하단 연결 띠
  g.add(mesh(makeCurvedStripGeo(W - WALL * 2, tBot, tSlot0, WALL, 0, 4), mat));
  // 슬롯 사이 5개 세로 곡면 바 (x = -19.5, -10, 0, +10, +19.5 → 사이 4개 슬롯 열림!)
  const barSpec = [[-19.6, 6.0], [-10.0, 5.2], [0.0, 5.2], [10.0, 5.2], [19.6, 6.0]];
  for (const [bx, bw] of barSpec) {
    const bar = mesh(makeCurvedStripGeo(bw, tSlot0, tSlot1, WALL, 0, 12), mat);
    bar.position.x = bx;
    g.add(bar);
  }
  // 슬롯 위 전면 곡면 쉘 (tSlot1 ~ 1.38)
  g.add(mesh(makeCurvedStripGeo(W - WALL * 2, tSlot1, 1.38, WALL, 0, 10), mat));

  // 5. 전면 외측 3줄 돌출 보강 리브 & 끝단 3개 스쿠프 톱니 (사진 3)
  for (const rx of [-14.0, 0.0, 14.0]) {
    // 외측 보강 융기 리브
    const extRib = mesh(makeCurvedStripGeo(7.6, 0.72, tTop, 3.6, 2.2, 10), mat);
    extRib.position.x = rx;
    g.add(extRib);
  }
  // 좌·우 모서리 끝단 연결부
  for (const ex of [-21.5, 21.5]) {
    const edgeTooth = mesh(makeCurvedStripGeo(4.6, 1.36, tTop, WALL, 0, 4), mat);
    edgeTooth.position.x = ex;
    g.add(edgeTooth);
  }

  return g;
}

export function build() {
  const root = new THREE.Group();
  const darkGray = new THREE.MeshStandardMaterial({ color: 0x5c6066, roughness: 0.48, metalness: 0.06 });
  const grab = makeGrab(darkGray);
  root.add(grab);

  // 집게 시연용: 마주 보는 두 번째 그랩 + 탁구공 (크기 측정에서 제외)
  const pair = makeGrab(darkGray);
  pair.rotation.y = Math.PI;
  pair.userData.noBounds = true;
  pair.visible = false;
  root.add(pair);
  const ball = mesh(new THREE.SphereGeometry(20, 32, 16), new THREE.MeshStandardMaterial({ color: 0xf5f3ec, roughness: 0.4 }));
  ball.userData.noBounds = true;
  ball.visible = false;
  root.add(ball);

  return {
    object3d: root,
    labels: [
      { name: 'REAR MOUNT (4×3)', sub: '후면 M3 구멍 12개', object: grab, anchor: [0, 17, -38], off: [-120, -40] },
      { name: 'FLOOR MOUNT (6×2)', sub: '바닥 M3 구멍 12개', object: grab, anchor: [0, 0, -13], off: [-90, 50] },
      { name: 'SCOOP TEETH ×3', sub: '곡면 버킷 · 슬롯 4 · 톱니 3', object: grab, anchor: [0, 34, 38], off: [70, -30] },
    ],
    frameWith: [pair, ball],
    handles: { grab, pair, ball },
  };
}
