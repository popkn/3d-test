# OCTO-8 Field Simulator

three.js로 만든 문어형 수중 로봇 시뮬레이터.
모든 부품은 외부 3D 파일 없이 코드로 만들고, 25.5초 동안 모드가 차례로 바뀌며 반복된다.

분사 이동 → 눈 확장 → 맨틀 열기 → 대기 → R2 팔 분리 → 사이펀 열기 → 부리 열기 → 전체 분해 → 대기 → 출발

## 실행

```bash
npm install
npm run dev
```

빌드 (결과는 `dist/`, 상대 경로라 어느 주소에 올려도 동작):

```bash
npm run build
npm run preview
```

## GitHub 연동 HTML (설치 없이 보기)

`github.html` 파일 하나만 브라우저로 열면, 로봇 코드를 GitHub(main 브랜치)에서 바로 불러와 실행한다.
GitHub의 코드를 고치면 이 파일은 그대로 두어도 반영된다.

- 레포가 **공개**여야 한다 (비공개면 불러오지 못한다).
- 코드는 jsDelivr(GitHub 파일 중계 CDN)를 거쳐 불러온다. 고친 내용이 반영되기까지 최대 12시간 걸릴 수 있다.
  바로 보려면 `github.html`의 `@main`을 커밋 번호(예: `@d6d1fd9`)로 바꾼다.

## 조작

| 조작 | 하는 일 |
|---|---|
| 마우스 끌기 / 휠 | 화면 회전 / 확대 (5초 뒤 카메라 연출로 돌아감) |
| 스페이스 | 재생 / 정지 |
| OPERATION LOG 진행 막대 | 누르거나 끌어서 원하는 시각으로 이동 |
| ASSEMBLIES | 그 부위를 보여주는 구간으로 이동 |
| DISPLAY | LABELS 이름표 · EXPLODED 분해 보기 · JET WAKE 물살 · TURNTABLE 회전 보기 |

URL 옵션: `?t=12` 12초부터 시작 · `?pause=1` 정지 상태로 시작 · `?cam=0` 카메라 연출 끄기

## 폴더 구조

```
octo-robot/
├── index.html              3D 캔버스 + HUD 자리 (npm run dev 용)
├── github.html             GitHub에서 코드를 불러와 실행하는 HTML (설치 없이 열기)
├── vite.config.js          빌드 설정
└── src/
    ├── main.js             모든 부분을 연결하고 실행 루프를 돌린다
    ├── loadCss.js          CSS를 <link>로 불러온다 (빌드 없이 실행할 때도 동작)
    ├── style.css           기본 페이지 스타일
    ├── scene/              화면 환경 (렌더러, 카메라, 조작, 조명, 반사 환경, 바닥, 장식선, 루프, 자동 해상도)
    ├── materials/          색상표와 공유 재질
    ├── robot/
    │   ├── OctoRobot.js    로봇 전체 조립과 조작 메서드
    │   ├── config/         수치 (robotConfig 전체, bodyConfig 몸체, armConfig 팔)
    │   ├── parts/
    │   │   ├── common/     리벳, 볼트, 관절 캡, 톱니, 구 표면 조각, 배치 계산
    │   │   ├── mantle/     머리: 꽃잎판 8장, 정수리, 적도 띠, 아래 껍데기, 속 기계
    │   │   ├── optics/     눈: 소켓, 적외선 링, 렌즈 덮개, 조리개
    │   │   ├── siphon/     사이펀: 받침과 슬리브, 4장 노즐
    │   │   ├── beak/       부리: 덮개, 턱, 톱니 링
    │   │   ├── hub/        하부 허브: 팔 소켓 8개
    │   │   └── arm/        팔: 뿌리 구동부, 마디, 빨판 바퀴, 연결부, 끝 마디
    │   └── rig/            팔 리그: 자세 값 → 관절 각도
    ├── modes/              모드 9개 (파일 하나에 모드 하나) + 모드 컨트롤러
    ├── sequence/           진행표, 재생 관리, 카메라 연출
    ├── effects/            분사 물살, 분해 안내선
    ├── labels/             부품 이름표와 연결선
    ├── state/              시뮬레이터 상태 (HUD가 읽는 숫자)
    └── hud/
        ├── Hud.js          HUD 조립
        ├── panels/         패널 하나에 파일 하나
        └── styles/         색상/글꼴, 배치
```

조립 순서는 **부품 → 부위 → 로봇** 이다. 부품 하나는 파일 하나이고, 크기·위치·색은 `config/`와 `materials/palette.js`에서 바꾼다.

## 로봇 조작 (OctoRobot)

- `setMantle(t)`, `setOptics(t)`, `setSiphon(t)`, `setBeak(t)`: 0 = 닫힘, 1 = 열림
- `setExplode(t)`: 분해 정도
- `setArmPose(pose, names)`: 팔 자세. names는 `'R2'`, `['L1','L2']`, 생략하면 전체
  - pose: `curl` 전체 말림, `spiral` 끝 나선(- 위로, + 아래로), `lift` 뿌리 들기, `side` 옆 휨, `wave` 흔들림, `waveSpeed`, `spread` 마디 분리
- `setBodyPose({ x, y, z, pitch, yaw, roll })`: 몸체 위치와 기울기
- `parts`, `state`: 부위 이름표, 현재 상태

## 늘리는 방법

**모드 추가**: `src/modes/`에 파일을 만들고 `modes/index.js` 목록에 넣는다. 적지 않은 값은 대기 모드 값을 쓴다.

```js
export default {
  id: 'wave',
  label: 'WAVE',
  description: 'GREETING · ARM L1',
  parts: { optics: 0.5 },                  // mantle, optics, siphon, beak, explode (0~1)
  body: { yaw: 0.3 },                      // 몸체 위치/기울기
  arms: { all: { wave: 0.3 }, L1: { lift: 0.9, curl: 0, spiral: -1 } },
  motion(elapsed) { return { roll: Math.sin(elapsed) * 0.05 }; }, // 시간 움직임 (선택)
  wake: 0,                                 // 분사 물살 세기 (선택)
  blend: 1.5,                              // 넘어가는 빠르기
};
```

**진행 순서 바꾸기**: `src/sequence/timeline.js`에서 구간(모드, 시작 시각, 카메라 자리)을 고친다.

**이름표 추가**: `src/labels/labelDefs.js`에 글자, 붙일 부품, 화면 방향, 나타날 모드를 적는다.

**부품 추가**: 해당 부위 폴더에 부품 파일을 만들고 그 부위의 조립 파일(`Mantle.js`, `Eye.js` 등)에서 붙인다. 재질은 `materials`에서 가져다 쓴다.

## 성능

- 팔 마디는 같은 종류끼리 `InstancedMesh` 하나로 묶어 그린다 (마디 수백 개 → 재질 수만큼).
- 작은 부품(리벳, 볼트, 축, 스프링), 안쪽 면, 유리는 그림자를 만들지 않는다.
- 프레임이 느리면 픽셀 밀도를 자동으로 낮춘다 (`scene/adaptiveResolution.js`).
- 한 프레임: 그리기 약 600회, 삼각형 약 78만 개 (그림자 포함).

## 개발용 콘솔 도구

`__robot` 로봇 · `__modes` 모드 컨트롤러 · `__seq` 진행 · `__state` 상태 · `__cam(x, y, z)` 카메라 위치 · `__info()` 그리기 통계

## 참고

HUD와 이름표의 수치(압력, 토크, 지름 등)는 화면 연출용 가짜 값이다.
