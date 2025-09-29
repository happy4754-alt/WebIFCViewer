/**
 * 이벤트 관리 유틸리티 클래스
 * 이벤트 리스너 등록, 해제, 중복 방지를 담당
 */
export class EventManager {
    constructor() {
        this.listeners = new Map();
    }

    /**
     * 이벤트 리스너 등록 (중복 방지)
     * @param {HTMLElement} element - 이벤트를 등록할 요소
     * @param {string} event - 이벤트 타입
     * @param {Function} handler - 이벤트 핸들러
     * @param {Object} options - 이벤트 옵션
     */
    addEventListener(element, event, handler, options = {}) {
        if (!element) return;

        const key = `${element.id || element.tagName}_${event}`;
        
        // 기존 리스너가 있다면 제거
        if (this.listeners.has(key)) {
            this.removeEventListener(element, event);
        }

        element.addEventListener(event, handler, options);
        this.listeners.set(key, { element, event, handler, options });
    }

    /**
     * 이벤트 리스너 제거
     * @param {HTMLElement} element - 이벤트를 제거할 요소
     * @param {string} event - 이벤트 타입
     */
    removeEventListener(element, event) {
        if (!element) return;

        const key = `${element.id || element.tagName}_${event}`;
        const listener = this.listeners.get(key);
        
        if (listener) {
            element.removeEventListener(event, listener.handler, listener.options);
            this.listeners.delete(key);
        }
    }

    /**
     * 모든 이벤트 리스너 제거
     */
    removeAllListeners() {
        for (const [key, listener] of this.listeners) {
            listener.element.removeEventListener(
                listener.event, 
                listener.handler, 
                listener.options
            );
        }
        this.listeners.clear();
    }

    /**
     * 이벤트 위임을 통한 리스너 등록
     * @param {HTMLElement} parent - 부모 요소
     * @param {string} selector - 자식 요소 선택자
     * @param {string} event - 이벤트 타입
     * @param {Function} handler - 이벤트 핸들러
     */
    delegate(parent, selector, event, handler) {
        if (!parent) return;

        const delegatedHandler = (e) => {
            if (e.target.matches(selector)) {
                handler.call(e.target, e);
            }
        };

        this.addEventListener(parent, event, delegatedHandler);
    }
}
