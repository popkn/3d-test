# 📚 PDF 학습 자습서 생성기

PDF 문서를 업로드하면 AI 가 분석하여 **학습용 자습서**를 생성하는 개인용 웹 앱입니다.

## ✨ 기능

- 📄 **PDF 텍스트 추출**: pdfplumber 를 사용하여 텍스트 기반 PDF 에서 내용 추출
- 🤖 **AI 자습서 생성**: OpenAI GPT-4o-mini 또는 Alibaba Qwen 모델로 학습용 자습서 자동 생성
- 📝 **마크다운 형식**: 학습 목표, 핵심 개념, 용어 설명, 퀴즈, 복습 팁 포함
- 💾 **다운로드**: 생성된 자습서를 .md 파일로 다운로드 가능

## 📋 생성되는 자습서 형식

1. **학습 목표**: 해당 문서의 주요 학습 목표
2. **핵심 개념 요약**: 중요한 개념들의 간결한 요약
3. **중요 용어 설명**: 필수 용어들의 상세 설명
4. **이해도 확인 퀴즈**: 3 문제 (정답 포함)
5. **복습 팁**: 효과적인 복습을 위한 팁

---

## 🚀 로컬 실행 방법

### 1. 저장소 클론 및 이동

```bash
cd /workspace
```

### 2. 가상 환경 생성 (선택사항)

```bash
# Python 가상환경 생성
python -m venv venv

# 가상환경 활성화
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate
```

### 3. 의존성 설치

```bash
pip install -r requirements.txt
```

### 4. API 키 설정

`.env` 파일을 편집하여 API 키를 설정하세요:

```bash
# .env 파일 편집
OPENAI_API_KEY=sk-your-actual-api-key-here
```

또는 Dashscope(Alibaba Cloud) 사용:

```bash
DASHSCOPE_API_KEY=your-dashscope-api-key
```

> 💡 **API 키 발급처:**
> - OpenAI: https://platform.openai.com/api-keys
> - Dashscope: https://dashscope.console.aliyun.com/

### 5. Streamlit 앱 실행

```bash
streamlit run app.py
```

브라우저에서 `http://localhost:8501`로 접속합니다.

---

## ☁️ Streamlit Cloud 배포 가이드

### 1. GitHub 에 코드 업로드

```bash
# Git 초기화 (이미 되어있으면 생략)
git init
git add .
git commit -m "Initial commit: PDF 학습 자습서 생성기"

# GitHub 원격 저장소 추가
git remote add origin https://github.com/YOUR_USERNAME/your-repo-name.git
git push -u origin main
```

### 2. Streamlit Cloud 에서 앱 생성

1. [Streamlit Cloud](https://streamlit.io/cloud)에 접속
2. GitHub 계정으로 로그인
3. **"New App"** 클릭
4. 업로드한 저장소 선택
5. 메인 파일 경로: `app.py`
6. **"Deploy!"** 클릭

### 3. API 키 설정 (Secrets)

Streamlit Cloud 대시보드에서:

1. 앱 설정 → **Secrets** 탭 클릭
2. 다음 내용 추가:

```toml
[openai]
api_key = "sk-your-actual-api-key-here"

# 또는 Dashscope 사용 시
[dashscope]
api_key = "your-dashscope-api-key"
```

3. 저장 후 앱 재배포

### 4. `.streamlit/secrets.toml` 로컬 테스트 (선택사항)

로컬에서 Secrets 테스트:

```bash
mkdir -p .streamlit
```

`.streamlit/secrets.toml` 파일 생성:

```toml
[openai]
api_key = "sk-your-actual-api-key-here"
```

---

## ⚙️ 설정 옵션

### API 제공자 선택

앱 사이드바에서 **OpenAI** 또는 **Dashscope**를 선택할 수 있습니다:

- **OpenAI**: GPT-4o-mini, GPT-4o, GPT-3.5-turbo 모델 사용
- **Dashscope**: Qwen-turbo, Qwen-plus, Qwen-max 모델 사용

### 모델 변경

사이드바에서 원하는 모델을 선택하세요:

| 제공자 | 모델 | 특징 |
|--------|------|------|
| OpenAI | gpt-4o-mini | 빠르고 경제적 |
| OpenAI | gpt-4o | 최고 성능 |
| Dashscope | qwen-turbo | 빠른 응답 |
| Dashscope | qwen-max | 고정밀 작업 |

---

## ⚠️ 제한사항

- **텍스트 기반 PDF 만 지원**: 이미지 스캔 PDF 는 OCR 기능이 없어 추출 불가
- **파일 크기 제한**: 너무 큰 PDF 는 청크 수가 제한됨 (최대 50 개 청크)
- **API 비용**: OpenAI/Dashscope API 사용량에 따라 과금됨

---

## 🛠️ 기술 스택

- **Python**: 프로그래밍 언어
- **Streamlit**: 웹 앱 프레임워크
- **pdfplumber**: PDF 텍스트 추출
- **langchain-text-splitters**: 텍스트 청킹
- **openai**: OpenAI API 클라이언트
- **python-dotenv**: 환경 변수 관리

---

## 📄 라이선스

MIT License

---

## 🙏 기여

이슈 및 PR 환영합니다!
