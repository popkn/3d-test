# 로보로보 완성 로봇 — 안드로이드 앱

Capacitor 하이브리드 앱입니다. 앱 화면(`shell/`)은 APK 안에 있고, 로봇(`robots/`)은 GitHub `main`에서 자동으로 받아 휴대폰에 저장합니다.

## 만들기
```
npm install
node scripts/prepare.mjs      # shell + robots → www/ (three.js · 글꼴을 앱 안에)
npx cap sync android
cd android && ./gradlew assembleDebug    # Android SDK 필요 (GitHub Actions가 대신 빌드)
```

## 구조
- `shell/main.js`: 모바일 디자인 화면. 로봇은 `makeAdapter(id)` → `robots.js`가 로봇 파일을 불러와 `mod.makeAdapter({ view, st, onProgress })` 호출
- `shell/robots.js`: 로봇 불러오기 순서 (단일 HTML 안 코드 → 휴대폰 저장본 → APK 기본본 → GitHub) · 자동 업데이트 (`index.json` 버전 비교, 바뀐 것만 받음)
- 로봇 하나 HTML 내려받기: 그 로봇 파일 코드를 HTML 안에 넣어서 인터넷 없이도 그 로봇은 열린다 (three.js만 인터넷)
- `web/native.js`: 뒤로 가기, 바깥 링크는 앱 안 브라우저, HTML 내려받기는 파일 저장 + 공유
- 권한: 마이크 (소리 센서 기능), 진동 · 아이콘: `python3 scripts/icons.py`
