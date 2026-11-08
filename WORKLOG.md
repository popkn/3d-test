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
   - 예외: `frame-4x12-pcb` (4×12 PCB)는 5×13프레임 대신 이미 만들어 둠 → **5×13프레임이 나오면 그때 4×12를 삭제**한다.
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
- 공통 키트 (`src/kit/`): pcb, components, sBoard(22×32 S보드), ecvBoard(48×28 센서보드), motorCase(60×40×20), frame(10mm 구멍 격자 · L자), fasteners · boltSim · capNut · fastenSim, caterpillar, innerSponge, ledBoardS, audio, battleFrame · battleSim (배틀무기: 흰 FR-4 + 빨간 무늬, 크기는 추정).

## 테스트 방법

- 이 환경에서는 CDN(jsDelivr)이 막혀 있어서, 로컬 three.js(`scratchpad/three-local`)를 `__three` 심볼릭 링크로 걸고 `index.html`의 CDN 주소를 바꾼 `__test.html`로 확인한다 (`__*` 파일은 `.gitignore`).
- `python3 -m http.server 8092` + playwright 스크린샷 (`?#부품id`), 콘솔 오류 확인.

## 진행 상황 (페이지)

| 페이지 | 상태 |
|---|---|
| 1 ~ 15 | 완료 (자세한 내용은 CHECKLIST.md 아래 표) |
| 16 ~ 17 | 남음 |

## 다음 페이지에서 할 일 (이미 목록을 확인해 둔 것)

| 페이지 | 구현할 부품 (상품 번호) |
|---|---|
| 16 | 소12 PCB(146), 중16 PCB(145), 3핀 헤더핀(184), S후크 35mm(102, 노랑), 버기 휠 Ø80(91, 80×80×33), **휠 Ø50[V2](84, Ø50×14 ABS 흰색) → "바퀴" 완료** |
| 17 | 서보 휠가이드 Ø30(167, Ø30×8), 노랑 휠가이드 Ø40(164), **검정 휠가이드 Ø30 나일론(87) → 3페이지에서 Ø130 세트로 잘못 완료 처리한 것 바로잡기** |

## 아직 쇼핑몰 목록에서 못 찾은 체크리스트 부품

5×13프레임 (4×12로 임시 구현), 블루투스 컨트롤러, 배터리케이스 커버, 고무줄, 탁구공, 주사위 → 17페이지까지 끝나면 사용자에게 알린다.
