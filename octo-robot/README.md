# OCTO Robot

three.js로 만드는 문어형 수중 로봇 시뮬레이터.

## 실행

```bash
npm install
npm run dev
```

## 진행 단계

- [x] 1단계: 기본 세팅 (화면, 조명, 바닥 그림자, 카메라, 마우스 조작)
- [x] 2단계: 재질과 공통 부품
- [x] 3단계: 몸체 부품 (맨틀, 눈, 사이펀, 부리)
- [x] 4단계: 팔
- [x] 5단계: 전체 조립
- [x] 6단계: 모드
- [x] 7단계: 진행 순서와 연출
- [ ] 8단계: 이름표
- [ ] 9단계: HUD
- [ ] 10단계: 마무리

## 구조 (현재)

- `index.html`: 3D 캔버스와 HUD 자리
- `src/main.js`: 시작점. 화면과 로봇을 만들고 실행 루프를 돌린다 (지금은 확인용 슬라이더 패널도 띄운다)
- `src/style.css`: 기본 페이지 스타일
- `src/scene/sceneConfig.js`: 색, 카메라, 조명, 바닥, 장식선 수치
- `src/scene/createScene.js`: 화면 환경 전체 조립
- `src/scene/createRenderer.js`: 렌더러 (그림자, 색 공간)
- `src/scene/createCamera.js`: 카메라
- `src/scene/createControls.js`: 마우스 회전/확대 조작
- `src/scene/createLights.js`: 스튜디오 조명
- `src/scene/createGround.js`: 그림자만 받는 바닥
- `src/scene/createBackdrop.js`: 바닥 궤도선, 표식, 뒤쪽 십자 격자
- `src/scene/loop.js`: 매 프레임 실행 루프
- `src/scene/createEnvironment.js`: 금속, 렌즈 반사용 환경맵
- `src/materials/palette.js`: 로봇 색상표
- `src/materials/materials.js`: 공유 재질 (껍데기, 빨간 포인트, 발광, 렌즈, 유리, 금속, 어두운 금속, 고무)
- `src/robot/parts/common/rivet.js`: 리벳 (하나 / 여러 개 한 번에)
- `src/robot/parts/common/bolt.js`: 볼트 (와셔 + 육각 머리)
- `src/robot/parts/common/cap.js`: 관절 캡 (볼록 원판 + 빨간 링 + 허브 + 둘레 볼트)
- `src/robot/parts/common/placement.js`: 원 둘레, 구 표면에 부품을 줄지어 배치하는 위치 계산
- `src/robot/parts/common/geometryCache.js`: 같은 도형 재사용
- `src/robot/config/bodyConfig.js`: 몸체 수치 (머리 반지름, 꽃잎판, 눈/사이펀/부리 위치, 팔 소켓)
- `src/robot/parts/common/spherePatch.js`: 구 표면 조각, 창문 뚫린 조각, 방향 계산
- `src/robot/parts/common/gear.js`: 톱니바퀴 도형
- `src/robot/parts/common/random.js`: 항상 같은 결과가 나오는 난수
- `src/robot/parts/mantle/`: 맨틀 (꽃잎판 8장 `shellPetal.js`, 정수리 `crown.js`, 적도 띠 `equatorBelt.js`, 아래 껍데기 `lowerShell.js`, 속 기계 `core.js`, 조립 `Mantle.js`)
- `src/robot/parts/optics/`: 눈 (소켓 `eyeSocket.js`, 적외선 링 `irRim.js`, 렌즈 덮개 `outerDome.js`, 조리개 `iris.js`, 조립 `Eye.js`)
- `src/robot/parts/siphon/`: 사이펀 (받침과 슬리브 `sleeve.js`, 4장 노즐 `nozzle.js`, 조립 `Siphon.js`)
- `src/robot/parts/beak/`: 부리 (덮개 `beakHousing.js`, 턱 `jaw.js`, 톱니 `radulaRing.js`, 조립 `Beak.js`)
- `src/robot/parts/hub/Hub.js`: 하부 허브 (팔 소켓 8개와 팔 부착 위치)
- `src/robot/config/armConfig.js`: 팔 수치 (이름, 마디 수, 굵기, 가늘어지는 비율, 유리 마디 위치, 기본 자세)
- `src/robot/parts/arm/`: 팔 (뿌리 구동부 `rootActuator.js`, 마디 `segment.js`, 빨판 바퀴 `sucker.js`, 연결부 `link.js`, 끝 마디 `tip.js`, 조립 `Arm.js`, 도형 합치기 `geometryBuckets.js`)
- `src/robot/rig/armRig.js`: 팔 리그 (말림, 끝 나선, 들기, 옆 휨, 흔들림 → 관절 각도)
- `src/robot/OctoRobot.js`: 로봇 전체 조립과 조작 메서드 (부위 열기, 팔 자세, 몸체 자세, 부위 이름표)
- `src/robot/config/robotConfig.js`: 떠 있는 높이, 전체 크기, 위아래 흔들림
- `src/robot/config/index.js`: 설정 파일 모음
- `src/dev/devPanel.js`: 확인용 패널 (재생/정지, 진행 막대, 모드 버튼, 카메라 연출 켜기). 9단계 HUD로 교체. URL: `?t=12` 12초부터, `?mode=teardown` 진행 멈추고 해당 모드, `?cam=0` 카메라 연출 끄기

## 로봇 조작 (OctoRobot)

- `setMantle(t)`, `setOptics(t)`, `setSiphon(t)`, `setBeak(t)`: 0 = 닫힘, 1 = 열림
- `setArmPose(pose, names)`: 팔 자세. names는 `'R2'`, `['L1','L2']`, 생략하면 전체
- `setExplode(t)`: 분해 정도 (꽃잎판, 눈, 사이펀, 부리, 팔이 바깥으로 흩어진다)
- `setBodyPose({ x, y, z, pitch, yaw, roll })`: 몸체 위치와 기울기
- `parts`: 부위 이름 → 3D 물체 (부위 선택, 이름표용)
- `state`: 현재 상태 (HUD가 읽는다)
- `src/modes/`: 모드 파일 (모드 하나에 파일 하나: `holding`, `jetting`, `mantleOpen`, `opticsOpen`, `siphonOpen`, `beakOpen`, `armApart`, `teardown`, `departing`)
- `src/modes/ModeController.js`: 현재 모드의 목표 자세로 로봇을 부드럽게 옮긴다
- `src/modes/index.js`: 모드 목록과 순서

## 모드 파일 형식

```js
export default {
  id: 'beakOpen',              // 이름
  label: 'BEAK OPEN',          // 화면 표시
  description: '...',          // 부가 설명
  parts: { beak: 1 },          // mantle, optics, siphon, beak, explode (0~1)
  body: { y: 0.7, pitch: -1.15 }, // 몸체 위치/기울기
  arms: { all: {...}, R2: {...} }, // 팔 자세 (전체 + 팔별 덮어쓰기)
  motion(elapsed) { return { x: ... }; }, // 시간에 따른 추가 움직임 (선택)
  blend: 1.3,                  // 넘어가는 빠르기
};
```
적지 않은 값은 대기(holding) 모드 값을 쓴다.
- `src/sequence/timeline.js`: 진행표 (모드 순서, 시작 시각, 구간별 카메라 자리, 25.5초 반복)
- `src/sequence/Sequencer.js`: 재생/정지/구간 이동/반복
- `src/sequence/cameraDirector.js`: 구간마다 카메라를 천천히 옮긴다 (마우스로 돌리면 5초간 양보)
- `src/effects/jetWake.js`: 분사할 때 사이펀에서 나오는 거품 물살
- `src/effects/explodeGuides.js`: 분해할 때 부품까지 이어지는 점선과 궤도 고리
