"""
학습용 자습서를 생성하는 모듈입니다.
langchain TextSplitter 로 텍스트를 청크 분할 후 OpenAI API 를 호출하여 자습서를 생성합니다.
"""

import os
from typing import Optional
from langchain_text_splitters import RecursiveCharacterTextSplitter

# OpenAI 클라이언트 임포트
try:
    from openai import OpenAI
except ImportError:
    from openai import OpenAI


def create_study_guide(
    text: str,
    api_key: Optional[str] = None,
    model: str = "gpt-4o-mini",
    use_dashscope: bool = False
) -> dict:
    """
    텍스트를 기반으로 학습용 자습서를 생성합니다.
    
    Args:
        text: 학습할 내용 (텍스트)
        api_key: API 키 (None 인 경우 환경 변수에서 자동 로드)
        model: 사용할 모델명 (기본값: gpt-4o-mini)
        use_dashscope: Dashscope API 사용 여부 (기본값: False)
        
    Returns:
        dict: {
            'success': bool,
            'study_guide': str,      # 생성된 자습서 (마크다운 형식)
            'error_message': str     # 에러 메시지 (있는 경우)
        }
    """
    result = {
        'success': False,
        'study_guide': '',
        'error_message': ''
    }
    
    try:
        # API 키 설정
        if api_key:
            os.environ['OPENAI_API_KEY'] = api_key
        
        # 환경 변수에서 API 키 확인
        openai_api_key = os.getenv('OPENAI_API_KEY')
        dashscope_api_key = os.getenv('DASHSCOPE_API_KEY')
        
        if not openai_api_key and not dashscope_api_key:
            result['error_message'] = (
                "API 키가 설정되지 않았습니다.\n"
                ".env 파일에 OPENAI_API_KEY 또는 DASHSCOPE_API_KEY 를 설정하거나,\n"
                "사이드바에서 API 키를 입력해주세요."
            )
            return result
        
        # 텍스트 청크 분할 (1000 자 단위)
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,  # 한글 기준 약 1000 자
            chunk_overlap=200,  # 중복 허용 (문맥 유지를 위해)
            length_function=len,
            separators=["\n\n", "\n", " ", ""]
        )
        
        chunks = text_splitter.split_text(text)
        
        # 청크가 너무 많은 경우 경고
        if len(chunks) > 50:
            result['error_message'] = (
                f"텍스트가 너무 깁니다 (총 {len(chunks)}개 청크).\n"
                "PDF 를 더 작은 단위로 나누거나 요약본을 사용해주세요."
            )
            return result
        
        # 프롬프트 생성
        prompt = f"""다음 내용을 기반으로 학습용 자습서를 생성해줘. 
형식은 반드시 아래를 따를 것:

1) 학습 목표
2) 핵심 개념 요약
3) 중요 용어 설명
4) 이해도 확인 퀴즈 3 문제 (정답 포함)
5) 복습 팁

마크다운 형식으로 작성해줘.

[내용]
{chunks[0] if len(chunks) == 1 else chr(10).join(chunks[:3])}
"""
        
        # API 클라이언트 초기화
        if use_dashscope or (dashscope_api_key and not openai_api_key):
            # Dashscope 사용 (Alibaba Cloud)
            base_url = "https://dashscope.aliyuncs.com/compatible-mode/v1"
            api_key_to_use = dashscope_api_key
            model_to_use = model if model != "gpt-4o-mini" else "qwen-turbo"
        else:
            # OpenAI 사용
            base_url = None
            api_key_to_use = openai_api_key
            model_to_use = model
        
        client = OpenAI(
            api_key=api_key_to_use,
            base_url=base_url
        )
        
        # API 호출
        response = client.chat.completions.create(
            model=model_to_use,
            messages=[
                {
                    "role": "system",
                    "content": "당신은 교육 전문가입니다. 제공된 내용을 바탕으로 체계적이고 이해하기 쉬운 학습용 자습서를 생성합니다."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.7,
            max_tokens=4000
        )
        
        # 결과 추출
        study_guide = response.choices[0].message.content
        
        if not study_guide or study_guide.strip() == '':
            result['error_message'] = "자습서 생성에 실패했습니다. 다시 시도해주세요."
            return result
        
        result['study_guide'] = study_guide
        result['success'] = True
        
    except Exception as e:
        error_msg = str(e)
        if "API key" in error_msg or "apikey" in error_msg.lower():
            result['error_message'] = "유효하지 않은 API 키입니다. 키를 확인해주세요."
        elif "quota" in error_msg.lower() or "limit" in error_msg.lower():
            result['error_message'] = "API 사용 한도에 도달했습니다. 요금제를 확인해주세요."
        else:
            result['error_message'] = f"자습서 생성 중 오류 발생: {error_msg}"
    
    return result


def get_available_models(use_dashscope: bool = False) -> list:
    """
    사용 가능한 모델 목록을 반환합니다.
    
    Args:
        use_dashscope: Dashscope API 사용 여부
        
    Returns:
        list: 모델명 목록
    """
    if use_dashscope:
        return ["qwen-turbo", "qwen-plus", "qwen-max"]
    else:
        return ["gpt-4o-mini", "gpt-4o", "gpt-3.5-turbo"]
