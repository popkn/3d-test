# 작업 기록 (로보로보 부품 구현)

대화가 압축돼도 이어서 작업할 수 있도록, 규칙 · 진행 상황 · 남은 일을 여기에 적는다.

## 작업 규칙 (사용자 지시)

1. **7호 키트 부품만 구현한다.** 기준은 `CHECKLIST.md` (사용자가 준 "7호 전체 부품목록" 사진).
2. 로보로보 쇼핑몰 카테고리 194 목록을 **한 페이지씩** 진행한다. 사용자가 "N페이지 진행해"라고 하면 그 페이지만 한다.
   - 목록: `https://roboroboshop.com/product/list.html?cate_no=194&page=N`
   - 상세: `https://roboroboshop.com/product/detail.html?product_no=번호&cate_no=194`
3. 페이지마다: 상품 목록 → 체크리스트와 대조 → 해당 부품만 규격 · 사진 확인 → 3D 모델 + 기능 구현 → 브라우저 확인 → 체크리스트 · README 갱신 → 커밋 · 푸시.
4. 소3 · 소4 · 소5 · 소8처럼 PCB와 플라스틱이 둘 다 있는 프레임은 **둘 다 구현** (사용자: 절반씩).
5. **쇼핑몰에서 아직 못 찾은 부품은 비슷한 것으로 대신 만들지 않는다** (다음 페이지에 나올 수 있음).
6. **애매하면 사용자에게 묻는다.** 체크리스트에 없는 부품은 만들지 않는다.
7. 답변은 **핵심만 짧게** (사용자 요청: 컨텍스트 절약).
8. 브랜치: `로보로보-3d-test` (main은 문어 로봇 프로젝트).

## 구현 규칙

- 단위 mm, 실제 크기. 상품 페이지 크기가 없으면 사진 · 표준 규격으로 추정하고 `spec.size.estimated: true` + `note`에 근거를 적는다.
- 부품 하나 = `src/catalog/parts/<id>/` (`spec.js`, `model.js`, `function.js`) + `src/catalog/index.js`에 등록.
- `model.js`의 `build()` → `{ object3d, labels, handles, frameWith? }`.
  - 시연용 물체(볼트, 공, 판 등)는 `userData.noBounds = true` (치수에서 뺌), 카메라에 담으려면 `frameWith`에 넣는다.
- `function.js`의 `create(model, ui)` → `ui.controls([...])`, `ui.readouts([...])`, `{ onControl, update, dispose }`.
- three.js 주의: `mesh.position`은 읽기 전용 → `Object.assign`으로 바꾸지 말고 `placed(mesh, x, y, z)` 또는 `position.set()`.
- 규격 찾기: `scratchpad/shop/fetch.py 번호...` → `batch.json`의 desc 이미지 내려받기 → 회색 제품 사진 띠 바로 아래 "크기" 줄을 잘라 확인 (OCR 없음).
- 프레임 생성: 줄·판 = `makeFrame({cols, rows, material, margin, marginZ, skip, cutouts})` + `cornerBolts` + `createFrameFunction` (예: `frame-s3-pcb`). L자 = `makeLFrame({a, b, w, angle})` (예: `l-frame-2x2`). PCB 여백 4, 플라스틱 여백 5.
- 공통 키트 (`src/kit/`): pcb, components, sBoard(22×32 S보드), ecvBoard(48×28 센서보드), motorCase(60×40×20), frame(10mm 구멍 격자 · L자), fasteners · boltSim · capNut · fastenSim, caterpillar, innerSponge, wheelGuide (휠가이드 원판 · 6구멍 · 허브 + 프레임 붙여 돌리기), wheelRim (휠 림 · 살 · D컷 허브 + 타이어 미리보기 · 속도 기능), ledBoardS, audio, battleFrame · battleSim (배틀무기: 흰 FR-4 + 빨간 무늬, 크기는 추정).

## 테스트 방법

- 이 환경에서는 CDN(jsDelivr)이 막혀 있어서, 로컬 three.js(`scratchpad/three-local`)를 `__three` 심볼릭 링크로 걸고 `index.html`의 CDN 주소를 바꾼 `__test.html`로 확인한다 (`__*` 파일은 `.gitignore`).
- `python3 -m http.server 8092` + playwright 스크린샷 (`?#부품id`), 콘솔 오류 확인.

## 진행 상황 (페이지)

| 페이지 | 상태 |
|---|---|
| 1 ~ 17 | 완료 (쇼핑몰 목록 끝, 18페이지 없음) (자세한 내용은 CHECKLIST.md 아래 표) |

## 다음 페이지에서 할 일 (이미 목록을 확인해 둔 것)

| 페이지 | 구현할 부품 (상품 번호) |
|---|---|

## 아직 쇼핑몰 목록에서 못 찾은 체크리스트 부품

블루투스 컨트롤러, 배터리케이스 커버, 고무줄, 탁구공, 주사위 → 17페이지(마지막)까지 확인 완료, 쇼핑몰 카테고리 194에 없음. 사용자에게 알림.

## 품질 개선 (1 ~ 5페이지 사진 대조)

사용자: 블루투스 컨트롤러 · 배터리케이스 커버 · 고무줄 · 탁구공 · 주사위는 구현하지 않는다.

상품 사진과 렌더를 나란히 놓고 비교 (`scratchpad/cmp.py 이름 id:상품번호 ...`) → 고친 것:

- 가장자리 물결 모양 (구멍마다 볼록): `makePcb` frame `scallop`, 일반 구멍용 `scallopOutline()` → CPU · 모터드라이브 연결 · 리모컨 수신 · 멜로디 · 센서 보드(ECV)
- CPU 8M: 포트마다 검은 박스 헤더, 투명 덮개를 사진처럼 넓게
- 컬러센서: 케이스를 36 × 36으로 키우고 네모 창 + 방향 홈
- Ø130 휠: 빨간 앞판에 살 사이 창
- 경첩: 축 마디 5개
- 너트프레임 소4: 육각 혹이 이어진 외곽
- 모터가이드: 고리 위쪽 육각 홈, 받침 테두리 턱
- 큰 택트 스위치(12mm, 리모컨 송신 · 멜로디): 검은 몸통 + 은색 덮개
- 볼트: 낮은 트러스 머리 + 파인 십자 홈, 2.6 × 10은 뾰족한 태핑 끝
- 모터드라이브 연결 보드: 전해 콘덴서 검정

## 품질 개선 (6 ~ 10페이지 사진 대조)

- 스폰지공: 노랑 + 검은 ROBOROBO 글자 (글자가 정면에 오게)
- 인너 Ø80 버기: 회색 스폰지
- 75mm 축: 은색 스테인리스 + 양 끝 널링
- 캐터필러 러버: 둥근 모서리 + 윗면 ROBOROBO 돋을새김 (`makeRubber`)
- 빅 메인프레임 12 × 16: 상세 이미지에서 구멍 259개 위치를 읽어 반영 (10mm 격자 + 가운데 5mm 사이 줄) → `makeFrame({ xs, zs, skip })`
- L자 6x6: 다리마다 구멍 6개 (길이 2 × 폭 3, 폭 방향 5mm) → `makeLFrame({ wPitch })`
- 버기 타이어: 촘촘한 블록 무늬 3줄
- 블루투스 모듈: 물결 가장자리

## 품질 개선 (11 ~ 15페이지 사진 대조)

- 구멍 배치 읽기: `scratchpad/band.py 이미지` (제품 사진 띠 찾기) → `scratchpad/holes.py 이미지 x0 y0 x1 y1 가로mm 세로mm 출력.json` (검은 판 안 밝은 구멍 중심 → mm). 세로 줄처럼 몰린 점은 실크 글자라 뺀다.
- 실제 구멍 배치 반영 (10mm 격자 + 5mm 사이 줄): 메인 PCB · 메인 플라스틱 (117개), 하프 PCB (63개), 중6 PCB (7 × 3), 중 PCB (9 × 3), 소7 PCB (11개), 소8 플라스틱 (9개), 중 플라스틱 (사이 구멍 + 큰 구멍 위치)
- 옵션 플라스틱: 가운데 작은 구멍
- 배틀무기: 빨강을 진하게, 불꽃 무늬를 촘촘한 소용돌이로, I · J는 사진처럼 한쪽 끝이 비스듬한 외곽 + 구멍 3줄 (`holesInside`)
- 모든 PCB 구멍 테: 금색 → 은색(HASL), 얇게

## 품질 개선 (16 ~ 17페이지 사진 대조)

- 중16 PCB: 실제 구멍 배치 (17 × 3, 가운데 줄 · 열 5mm)
- 휠 Ø80 버기: 사진처럼 Y자 살 5개 + 림 바깥 볼록 띠 4줄 (`makeRim({ ySpoke, ribs })`)
- 휠 Ø50[V2] (타이어 미리보기 휠 포함): Y자 살 8개
- 휠가이드 Ø40 노랑: 윗면 평평, 허브는 아랫면 (시연 프레임은 윗면에)

## 부품 제외 · 조립 지침서 준비

- 컬러볼 · 압축공은 로봇 제작 부품이 아니라서 삭제 (사용자 요청). 독수리 · 기차 설계에서도 뺐다. 체크리스트에는 `[-]` 제외로 표시.
- 조립 지침서에 들어갈 내용 분석: `ASSEMBLY_GUIDE_CONTENTS.md` (위치 고정 → 연결점 · 조인트 규칙 · 조립 트리 · 검사).
- 조립 규칙 지침서: `ASSEMBLY_GUIDE.md` (원칙 · 표준 좌표 · 연결점 · 체결 규칙 · 볼트 선택 · 조립 트리 형식 · 위치 계산 · 관절 · 전기 · 검사 · 금지 + 부품별 연결점 부록). 데이터: `src/catalog/connectors.json` (89개 부품, 연결점 1382개). 다시 만들기: `node tools/extract_connectors.cjs tools/connectors_auto.json` → `python3 tools/assembly_guide.py`.

## 기차를 조립 규칙으로 다시 조립 (ASSEMBLY_GUIDE.md 적용)
- `src/assembly/solver.js`: 조립 계산기. 기준 부품 하나만 좌표로 놓고, 나머지는 `attach(내 연결점 ↔ 부모 연결점)`으로 위치 · 방향을 계산. 구멍 어긋남 > 0.2 mm · 방향 틀림 · 볼트 1개 = 오류, 근사 연결점 · 1곳 체결 = 경고. 볼트 길이 (겹친 두께 + 너트) 자동 선택. `either()`로 구멍 짝 순서를 모를 때 두 가지를 시험.
- `src/train/tree.js`: 기차 조립 트리. 칸마다 바닥판만 좌표, 203개 부품 모두 연결점 짝. 결과 오류 0 · 경고 8 (모터 귀 · 배터리 구멍 근사, 블루투스 1곳 체결).
- 높이 맞춤: 세운 DC 모터는 귀 ↔ 축이 15 mm라 축이 40 mm → 뒤 구동 바퀴를 Ø80 버기로 (기관차의 큰 동륜 모양), 앞은 L자 6×6 두 개에 75 mm 축 + Ø50 헛도는 바퀴 (축 25 mm).
- 차체: 기관차 (m PCB 보일러 · 노란 연기실 문 · 굴뚝 · 증기 돔 · 2단 운전실 · 배틀 G/J/I/U), 객차 (메인 PCB 벽 · 창 4 · 배틀 G 띠 · 난간 · 빅 메인 지붕), 화물칸 (m16 2단 벽 · 5×13 끝벽 · 브레이크 휠 · 배틀 J). 벽은 L자로 세우고 지붕은 벽 위에 거꾸로 건 L자에 얹음.
- 화면 `#train`: 조립 트리 행렬로 부품을 놓고, 바퀴는 관절(축 둘레)로 돌림. 연결봉은 트리 모양 그대로 두 칸의 핀 구멍에 맞춰 옮김. "볼트 · 너트 보기" 토글 (계산된 641개), 패널에 규칙 검사 결과.
- 기능은 그대로 (칸마다 CPU · 블루투스 · 배터리 · 모터 2, 연결봉). `train/BLUEPRINT.md` 도면은 예전 좌표식 그대로 (3D는 트리 기준).

## 세트 부품 · 구멍 통일 · 단계별 조립 모션
- 지침서의 세세한 규칙은 일단 무시 (사용자 요청). 세트로 쓰는 부품을 처음부터 한 부품으로: `wheel-50-set`, `wheel-80-buggy-set`, `axle-wheel-50-set` (setWheels(1)로 한쪽 바퀴), `caterpillar-track` (setDistance), `motor-drive-set`. 목록 89 → 87.
- 볼트 구멍을 모두 Ø3.2 · 5 mm 격자로 통일 (경첩 포함). 연결점 다시 뽑음 (`tools/extract_connectors.cjs` → `tools/assembly_guide.py`).
- 조립 계산기에 단계 · 모듈: `A.begin(이름)` ~ `A.end()` = 모듈 (작업대에서 따로 조립 → 끼우기). 볼트는 두 부품이 같은 작업대에 있을 때, 모듈 밖과 잇는 볼트는 끼우는 단계에 (`finalize()`).
- `src/train/build.js` + 화면 `#train-build`: 227단계 재생 · 이전/다음 · 단계 이동 · 속도 · 카메라 따라가기. 부품은 맞댈 면 방향(끼움은 축 방향)에서 들어오고, 볼트는 돌며 들어가고 너트는 반대편에서.
- 기차: 바퀴 세트로 부품 203 → 188개. 블루투스 구멍이 격자에 맞아 볼트 2개 (CPU 위 2층, 서포트 30). CPU 받침 간격 50.
- 공용 그리기: `src/assembly/render.js` (달리기 화면과 단계 화면이 함께 씀).

## 기본 조립 규칙 정리
- `ASSEMBLY_RULES.md`를 기본 규칙으로 다시 씀 (세세한 규칙은 뺌). 새로 넣은 것: 제어부 CPU 1대당 1개, 모터 연결 (CPU 최대 6 = 조작 4 + 계속 회전 2), 확장 보드로 +4, 수량 (130 × 4 · 400 × 2 · 확장 보드 × 1), 배틀 무기는 400 모터.
- 구멍 통일 · 세트 부품 · 단계별 조립도 반영.
- 검사: `src/assembly/rules.js` `checkRobot()`. 기차 3칸 · 배틀로봇 · 독수리 모두 통과. `#train-build` 패널에 칸별 결과.

## 전기 연결 수정 · 파트별 단계 조립
- 규칙 7장: 입력 IN = 접촉 · 적외선 · 소리 센서, 출력 OUT = 서보 · LED (주황 · 빨강 · 초록) · 부저, 포트 하나에 부품 하나. 9장에 파트 나눠 조립 · 분해 확인 추가.
- `src/assembly/staged.js` `createStaged(root, { stages, stageOf })`: 어느 로봇이든 파트별로 한 단계씩 조립 → 분해 슬라이더 → 최종 연결 (파트가 대기 자리에서 하나씩 제자리로). 같은 부품이 이어지거나 번갈아 나오면(마디 · 러버) 한 단계로 묶음.
- 화면: `#stage-eagle` (받침대 · 다리 · 몸통 · 얼굴 · 날개 · 꼬리), `#stage-battlebot` (도면 6파트), `#stage-train` (칸마다 차대 · 차체 + 연결봉, `buildTrainStaged`).

## 안드로이드 앱 (하이브리드 · Capacitor)
- `app/`: 사용자가 준 모바일 디자인(`app/src/index.source.html`)을 Capacitor 7로 감싼 앱. `scripts/prepare.mjs`가 three.js · 글꼴을 앱 안에 넣어 인터넷 없이 동작하게 하고, `web/native.js`를 붙인다 (뒤로 가기, 바깥 링크 → 앱 안 브라우저, HTML 내려받기 → 파일 저장 + 공유).
- 권한: 마이크 (소리 센서), 진동. 아이콘 · 시작 화면: `scripts/icons.py`.
- APK: `.github/workflows/android-apk.yml` (푸시하면 빌드 → Releases `android-latest`). 이 컨테이너에서는 Android SDK 라이선스 자동 동의가 막혀 직접 빌드하지 않음.
