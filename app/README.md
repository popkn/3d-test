# 로보로보 조립 — 안드로이드 앱

`src/index.source.html`(모바일 디자인)을 Capacitor로 감싼 하이브리드 앱입니다. 인터넷 없이 동작합니다 (three.js · 글꼴을 앱 안에 넣음).

## APK 받기
- `app/`을 바꿔 `로보로보-3d-test` 브랜치에 푸시하면 GitHub Actions가 APK를 만들어 **Releases → android-latest**에 올립니다.
- 휴대폰에서 `roborobo-assembly.apk`를 내려받아 설치 ("출처를 알 수 없는 앱" 허용).

## 직접 빌드 (Android SDK 필요)
```
npm install
npm run apk        # → android/app/build/outputs/apk/debug/app-debug.apk
```

## 디자인 바꾸기
`src/index.source.html`만 바꾸고 다시 빌드합니다. `scripts/prepare.mjs`가 앱용으로 바꿉니다:
- three.js CDN → 앱 안 (`www/vendor/three`), 글꼴 → JetBrains Mono 앱 안 + 한글은 안드로이드 기본 Noto Sans CJK
- `web/native.js`: 뒤로 가기 버튼 (시트 닫기 → 목록 → 종료), 상품 링크는 앱 안 브라우저, "조립 보기 HTML 내려받기"는 파일 저장 후 공유 창
- 권한: 마이크 (소리 센서 기능), 진동

## 아이콘
`python3 scripts/icons.py` (빨강 바탕 흰 로봇 얼굴, 시작 화면 포함)
