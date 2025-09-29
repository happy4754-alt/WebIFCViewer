/**
 * 알림 메시지 관리 모듈
 * 토스트 알림, 모달 등의 UI 알림을 관리
 */
export class NotificationManager {
    constructor() {
        this.notifications = [];
        this.init();
    }
    
    /**
     * 알림 시스템 초기화
     */
    init() {
        // 알림 컨테이너 생성
        this.createNotificationContainer();
    }
    
    /**
     * 알림 컨테이너 생성
     */
    createNotificationContainer() {
        // 기존 컨테이너가 있으면 제거
        const existing = document.getElementById('notification-container');
        if (existing) {
            existing.remove();
        }
        
        // 새 컨테이너 생성
        const container = document.createElement('div');
        container.id = 'notification-container';
        container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            pointer-events: none;
        `;
        
        document.body.appendChild(container);
        this.container = container;
    }
    
    /**
     * 성공 알림 표시
     * @param {string} message - 알림 메시지
     * @param {number} duration - 표시 시간 (밀리초)
     */
    success(message, duration = 3000) {
        this.showNotification(message, 'success', duration);
    }
    
    /**
     * 오류 알림 표시
     * @param {string} message - 알림 메시지
     * @param {number} duration - 표시 시간 (밀리초)
     */
    error(message, duration = 5000) {
        this.showNotification(message, 'error', duration);
    }
    
    /**
     * 정보 알림 표시
     * @param {string} message - 알림 메시지
     * @param {number} duration - 표시 시간 (밀리초)
     */
    info(message, duration = 3000) {
        this.showNotification(message, 'info', duration);
    }
    
    /**
     * 경고 알림 표시
     * @param {string} message - 알림 메시지
     * @param {number} duration - 표시 시간 (밀리초)
     */
    warning(message, duration = 4000) {
        this.showNotification(message, 'warning', duration);
    }
    
    /**
     * 알림 표시
     * @param {string} message - 알림 메시지
     * @param {string} type - 알림 타입 (success, error, info, warning)
     * @param {number} duration - 표시 시간 (밀리초)
     */
    showNotification(message, type = 'info', duration = 3000) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.style.cssText = `
            background: ${this.getBackgroundColor(type)};
            color: white;
            padding: 12px 20px;
            margin-bottom: 10px;
            border-radius: 4px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
            pointer-events: auto;
            cursor: pointer;
            transform: translateX(100%);
            transition: transform 0.3s ease;
            max-width: 300px;
            word-wrap: break-word;
        `;
        
        notification.textContent = message;
        
        // 클릭으로 닫기
        notification.addEventListener('click', () => {
            this.hideNotification(notification);
        });
        
        this.container.appendChild(notification);
        
        // 애니메이션으로 표시
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 10);
        
        // 자동 제거
        if (duration > 0) {
            setTimeout(() => {
                this.hideNotification(notification);
            }, duration);
        }
        
        this.notifications.push(notification);
    }
    
    /**
     * 알림 숨기기
     * @param {HTMLElement} notification - 숨길 알림 요소
     */
    hideNotification(notification) {
        if (!notification || !notification.parentNode) return;
        
        notification.style.transform = 'translateX(100%)';
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
            
            // 배열에서 제거
            const index = this.notifications.indexOf(notification);
            if (index > -1) {
                this.notifications.splice(index, 1);
            }
        }, 300);
    }
    
    /**
     * 모든 알림 제거
     */
    clearAll() {
        this.notifications.forEach(notification => {
            this.hideNotification(notification);
        });
        this.notifications = [];
    }
    
    /**
     * 타입별 배경색 반환
     * @param {string} type - 알림 타입
     * @returns {string} 배경색
     */
    getBackgroundColor(type) {
        const colors = {
            success: '#4CAF50',
            error: '#F44336',
            warning: '#FF9800',
            info: '#2196F3'
        };
        return colors[type] || colors.info;
    }
}
