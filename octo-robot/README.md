# OCTO Robot

three.js로 만드는 문어형 수중 로봇 시뮬레이터.

## 실행

```bash
npm install
npm run dev
```

## 진행 단계

- [x] 1단계: 기본 세팅 (화면, 조명, 바닥 그림자, 카메라, 마우스 조작)
- [ ] 2단계: 재질과 공통 부품
- [ ] 3단계: 몸체 부품 (맨틀, 눈, 사이펀, 부리)
- [ ] 4단계: 팔
- [ ] 5단계: 전체 조립
- [ ] 6단계: 모드
- [ ] 7단계: 진행 순서와 연출
- [ ] 8단계: 이름표
- [ ] 9단계: HUD
- [ ] 10단계: 마무리

## 구조 (현재)

- `index.html`: 3D 캔버스와 HUD 자리
- `src/main.js`: 시작점. 화면을 만들고 실행 루프를 돌린다
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
