/**
 * DOM 조작 유틸리티 클래스
 * 자주 사용되는 DOM 조작 기능들을 모아놓은 헬퍼 클래스
 */
export class DOMUtils {
    /**
     * 요소 선택 (단일)
     * @param {string} selector - CSS 선택자
     * @param {HTMLElement} parent - 부모 요소 (기본값: document)
     * @returns {HTMLElement|null} 선택된 요소
     */
    static $(selector, parent = document) {
        return parent.querySelector(selector);
    }

    /**
     * 요소 선택 (복수)
     * @param {string} selector - CSS 선택자
     * @param {HTMLElement} parent - 부모 요소 (기본값: document)
     * @returns {NodeList} 선택된 요소들
     */
    static $$(selector, parent = document) {
        return parent.querySelectorAll(selector);
    }

    /**
     * 요소 생성
     * @param {string} tag - 태그명
     * @param {Object} attributes - 속성 객체
     * @param {string} textContent - 텍스트 내용
     * @returns {HTMLElement} 생성된 요소
     */
    static createElement(tag, attributes = {}, textContent = '') {
        const element = document.createElement(tag);
        
        Object.entries(attributes).forEach(([key, value]) => {
            if (key === 'className') {
                element.className = value;
            } else if (key === 'innerHTML') {
                element.innerHTML = value;
            } else {
                element.setAttribute(key, value);
            }
        });

        if (textContent) {
            element.textContent = textContent;
        }

        return element;
    }

    /**
     * 클래스 토글
     * @param {HTMLElement} element - 대상 요소
     * @param {string} className - 클래스명
     * @param {boolean} force - 강제 설정 (선택사항)
     */
    static toggleClass(element, className, force) {
        if (!element) return;
        element.classList.toggle(className, force);
    }

    /**
     * 클래스 추가
     * @param {HTMLElement} element - 대상 요소
     * @param {...string} classNames - 추가할 클래스명들
     */
    static addClass(element, ...classNames) {
        if (!element) return;
        element.classList.add(...classNames);
    }

    /**
     * 클래스 제거
     * @param {HTMLElement} element - 대상 요소
     * @param {...string} classNames - 제거할 클래스명들
     */
    static removeClass(element, ...classNames) {
        if (!element) return;
        element.classList.remove(...classNames);
    }

    /**
     * 요소 표시/숨김
     * @param {HTMLElement} element - 대상 요소
     * @param {boolean} show - 표시 여부
     */
    static toggleVisibility(element, show) {
        if (!element) return;
        DOMUtils.toggleClass(element, 'hidden', !show);
    }

    /**
     * 요소에 이벤트 리스너 추가 (간편 버전)
     * @param {HTMLElement} element - 대상 요소
     * @param {string} event - 이벤트 타입
     * @param {Function} handler - 이벤트 핸들러
     * @param {Object} options - 이벤트 옵션
     */
    static on(element, event, handler, options = {}) {
        if (!element) return;
        element.addEventListener(event, handler, options);
    }

    /**
     * 요소에서 이벤트 리스너 제거 (간편 버전)
     * @param {HTMLElement} element - 대상 요소
     * @param {string} event - 이벤트 타입
     * @param {Function} handler - 이벤트 핸들러
     */
    static off(element, event, handler) {
        if (!element) return;
        element.removeEventListener(event, handler);
    }

    /**
     * 요소의 부모 요소 찾기
     * @param {HTMLElement} element - 시작 요소
     * @param {string} selector - 부모 선택자
     * @returns {HTMLElement|null} 찾은 부모 요소
     */
    static closest(element, selector) {
        if (!element) return null;
        return element.closest(selector);
    }

    /**
     * 요소가 특정 클래스를 가지고 있는지 확인
     * @param {HTMLElement} element - 확인할 요소
     * @param {string} className - 클래스명
     * @returns {boolean} 클래스 보유 여부
     */
    static hasClass(element, className) {
        if (!element) return false;
        return element.classList.contains(className);
    }

    /**
     * 요소의 스타일 설정
     * @param {HTMLElement} element - 대상 요소
     * @param {Object} styles - 스타일 객체
     */
    static setStyles(element, styles) {
        if (!element) return;
        Object.assign(element.style, styles);
    }

    /**
     * 요소의 텍스트 내용 설정
     * @param {HTMLElement} element - 대상 요소
     * @param {string} text - 설정할 텍스트
     */
    static setText(element, text) {
        if (!element) return;
        element.textContent = text;
    }

    /**
     * 요소의 HTML 내용 설정
     * @param {HTMLElement} element - 대상 요소
     * @param {string} html - 설정할 HTML
     */
    static setHTML(element, html) {
        if (!element) return;
        element.innerHTML = html;
    }
}
