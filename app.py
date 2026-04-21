"""
PDF 기반 학습 자습서 생성기 Streamlit 앱입니다.
PDF 를 업로드하면 AI 가 분석하여 학습용 자습서를 생성합니다.
"""

import streamlit as st
import os
from dotenv import load_dotenv

# 커스텀 모듈 임포트
from pdf_extractor import extract_text_from_pdf, get_page_count
from study_guide_gen import create_study_guide, get_available_models

# .env 파일 로드 (로컬 환경용)
load_dotenv()

# 페이지 설정
st.set_page_config(
    page_title="PDF 학습 자습서 생성기",
    page_icon="📚",
    layout="wide"
)

# 세션 상태 초기화
if 'study_guide' not in st.session_state:
    st.session_state.study_guide = None
if 'pdf_name' not in st.session_state:
    st.session_state.pdf_name = None


def main():
    """메인 애플리케이션 함수"""
    
    # 사이드바 설정
    with st.sidebar:
        st.title("⚙️ 설정")
        
        # API 키 입력란
        st.header("API 설정")
        api_key_input = st.text_input(
            "API 키",
            type="password",
            placeholder="여기에 API 키를 입력하세요",
            help="OpenAI API 키 또는 Dashscope API 키를 입력합니다."
        )
        
        # API 제공자 선택
        api_provider = st.radio(
            "API 제공자",
            ["OpenAI", "Dashscope"],
            help="OpenAI 는 GPT 모델을, Dashscope 는 Qwen 모델을 사용합니다."
        )
        
        # 모델 선택
        use_dashscope = (api_provider == "Dashscope")
        available_models = get_available_models(use_dashscope)
        selected_model = st.selectbox(
            "모델 선택",
            available_models,
            help="사용할 AI 모델을 선택합니다."
        )
        
        # API 키 우선순위 결정
        api_key = api_key_input if api_key_input else None
        
        st.divider()
        
        # 사용법 안내
        st.header("📖 사용법")
        st.markdown("""
        1. 사이드바에서 API 키를 입력하거나
           .env 파일에 미리 설정하세요.
        2. 메인 화면에서 PDF 파일을 업로드하세요.
        3. '자습서 생성' 버튼을 클릭하세요.
        4. 생성된 자습서를 확인하고 다운로드하세요.
        """)
        
        st.divider()
        
        # 정보
        st.info("""
        **지원 형식**: 텍스트 기반 PDF
        **미지원**: 이미지 스캔 PDF (OCR 필요)
        """)
    
    # 메인 컨텐츠 영역
    st.title("📚 PDF 학습 자습서 생성기")
    st.markdown("""
    PDF 문서를 업로드하면 AI 가 분석하여 **학습용 자습서**를 생성합니다.
    학습 목표, 핵심 개념, 퀴즈까지 한번에!
    """)
    
    # 파일 업로더
    uploaded_file = st.file_uploader(
        "PDF 파일 업로드",
        type=["pdf"],
        help="텍스트 기반 PDF 파일을 업로드해주세요."
    )
    
    # 진행 상황 표시줄 (초기화)
    progress_bar = st.progress(0)
    status_text = st.empty()
    
    # 자습서 생성 버튼
    col1, col2 = st.columns([1, 4])
    with col1:
        generate_button = st.button(
            "✨ 자습서 생성",
            type="primary",
            disabled=(uploaded_file is None),
            use_container_width=True
        )
    
    # 버튼 클릭 시 처리
    if generate_button and uploaded_file:
        try:
            # 단계 1: PDF 텍스트 추출 (30%)
            status_text.text("📄 PDF 텍스트를 추출하는 중...")
            progress_bar.progress(30)
            
            extraction_result = extract_text_from_pdf(uploaded_file)
            
            if not extraction_result['success']:
                st.error(f"❌ {extraction_result['error_message']}")
                progress_bar.empty()
                status_text.empty()
                st.stop()
            
            # 단계 2: 자습서 생성 (70%)
            status_text.text("🤖 AI 가 자습서를 생성하는 중...")
            progress_bar.progress(70)
            
            study_guide_result = create_study_guide(
                text=extraction_result['full_text'],
                api_key=api_key,
                model=selected_model,
                use_dashscope=use_dashscope
            )
            
            # 단계 3: 완료 (100%)
            progress_bar.progress(100)
            status_text.text("✅ 완료!")
            
            if not study_guide_result['success']:
                st.error(f"❌ {study_guide_result['error_message']}")
            else:
                # 세션 상태에 저장
                st.session_state.study_guide = study_guide_result['study_guide']
                st.session_state.pdf_name = uploaded_file.name
                
                # 성공 메시지
                st.success("자습서가 성공적으로 생성되었습니다!")
                
        except Exception as e:
            st.error(f"오류 발생: {str(e)}")
            progress_bar.empty()
            status_text.empty()
    
    # 생성된 자습서 표시
    if st.session_state.study_guide:
        st.divider()
        
        # 파일 정보 표시
        st.subheader(f"📖 {st.session_state.pdf_name}의 학습 자습서")
        
        # 마크다운 렌더링
        st.markdown(st.session_state.study_guide)
        
        # 다운로드 버튼
        st.divider()
        st.download_button(
            label="📥 자습서 다운로드 (.md)",
            data=st.session_state.study_guide,
            file_name=f"{os.path.splitext(st.session_state.pdf_name)[0]}_자습서.md",
            mime="text/markdown",
            use_container_width=True
        )
    
    # 푸터
    st.divider()
    st.markdown("""
    <div style='text-align: center; color: gray;'>
        Made with ❤️ using Streamlit + OpenAI/Dashscope
    </div>
    """, unsafe_allow_html=True)


if __name__ == "__main__":
    main()
