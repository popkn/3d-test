# 로보로보 완성 로봇 (main)

로보로보 부품으로 만든 **완성 로봇**을 보여 주는 안드로이드 앱입니다.
- 이 브랜치(`main`): 앱 + 완성 로봇 파일만
- 부품 87개 · 조립 규칙 · 도면 · 로봇 제작 도구: **`parts` 브랜치**

## 앱 받기
휴대폰에서 내려받아 설치합니다 (처음 한 번 "출처를 알 수 없는 앱 설치" 허용):
https://github.com/popkn/3d-test/releases/download/android-latest/roborobo-assembly.apk

## 자동 업데이트
- 앱을 열면 이 브랜치의 `app/robots/index.json`을 확인해서, 새 로봇 · 바뀐 로봇만 받아 휴대폰에 저장합니다 (다음부터는 인터넷 없이 열림).
- 인터넷이 없으면 저장해 둔 로봇, 그것도 없으면 APK에 들어 있는 기본 로봇을 씁니다.
- GitHub 쪽 캐시 때문에 올린 뒤 5분쯤 늦게 보일 수 있습니다.

## 로봇 추가하기
1. `parts` 브랜치에서 로봇을 만들고 `node tools/build-robots.mjs <출력 폴더>` → 로봇 파일 + `index.json`
2. 그 파일들을 이 브랜치의 `app/robots/`에 넣고 푸시
3. 휴대폰 앱이 다음에 열릴 때 자동으로 받습니다. (APK도 자동으로 새로 만들어지지만, 다시 설치하지 않아도 됩니다)

## 폴더
| 폴더 | 내용 |
|---|---|
| `app/shell/` | 앱 화면 (모바일 디자인) · 로봇 불러오기 · 자동 업데이트 |
| `app/robots/` | 완성 로봇 파일 (로봇마다 JS 하나: 조립 데이터 + 쓰인 부품 모양 + 기능) |
| `app/web/native.js` | 안드로이드 연결 (뒤로 가기 · 공유 · 바깥 링크) |
| `app/android/` | 안드로이드 프로젝트 (Capacitor) |
| `.github/workflows/android-apk.yml` | 푸시하면 APK 빌드 → Releases |
