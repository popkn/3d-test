"""
PDF 파일에서 텍스트를 추출하는 모듈입니다.
pdfplumber 를 사용하여 텍스트 기반 PDF 에서 텍스트를 추출합니다.
이미지 기반 PDF 는 현재 지원하지 않습니다.
"""

import pdfplumber
from typing import List, Dict


def extract_text_from_pdf(pdf_file) -> Dict:
    """
    PDF 파일에서 텍스트를 추출하여 페이지별 또는 단락별로 분리합니다.
    
    Args:
        pdf_file: 업로드된 PDF 파일 객체
        
    Returns:
        dict: {
            'success': bool,
            'text_by_page': List[str],  # 페이지별 텍스트
            'full_text': str,           # 전체 텍스트
            'error_message': str        # 에러 메시지 (있는 경우)
        }
    """
    result = {
        'success': False,
        'text_by_page': [],
        'full_text': '',
        'error_message': ''
    }
    
    try:
        # PDF 파일 열기
        with pdfplumber.open(pdf_file) as pdf:
            # 페이지가 없는 경우 처리
            if not pdf.pages:
                result['error_message'] = "PDF 에 페이지가 없습니다."
                return result
            
            text_by_page = []
            
            for page in pdf.pages:
                # 텍스트 추출
                text = page.extract_text()
                
                # 텍스트가 없는 경우 (이미지 기반 PDF 일 가능성)
                if text is None or text.strip() == '':
                    result['error_message'] = (
                        "이미지 기반 PDF 는 현재 지원하지 않습니다.\n"
                        "텍스트 기반 PDF 만 추출 가능합니다.\n"
                        "OCR 기능이 필요한 경우 추가 구현이 필요합니다."
                    )
                    return result
                
                text_by_page.append(text)
            
            # 결과 저장
            result['text_by_page'] = text_by_page
            result['full_text'] = '\n\n'.join(text_by_page)
            result['success'] = True
            
    except Exception as e:
        result['error_message'] = f"PDF 추출 중 오류 발생: {str(e)}"
    
    return result


def get_page_count(pdf_file) -> int:
    """
    PDF 의 페이지 수를 반환합니다.
    
    Args:
        pdf_file: 업로드된 PDF 파일 객체
        
    Returns:
        int: 페이지 수
    """
    try:
        with pdfplumber.open(pdf_file) as pdf:
            return len(pdf.pages)
    except Exception:
        return 0
