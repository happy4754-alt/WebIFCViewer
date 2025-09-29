/**
 * 진행률 표시 관리 모듈
 * 프로그레스 바, 로딩 스피너 등을 관리
 */
export class ProgressManager {
    constructor() {
        this.progressBar = null;
        this.progressText = null;
        this.container = null;
        this.init();
    }
    
    /**
     * 진행률 시스템 초기화
     */
    init() {
        this.createProgressContainer();
    }
    
    /**
     * 진행률 컨테이너 생성
     */
    createProgressContainer() {
        // 기존 컨테이너가 있으면 제거
        const existing = document.getElementById('progress-container');
        if (existing) {
            existing.remove();
        }
        
        // 새 컨테이너 생성
        const container = document.createElement('div');
        container.id = 'progress-container';
        container.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            z-index: 10001;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            min-width: 300px;
            display: none;
        `;
        
        // 프로그레스 바 생성
        const progressBar = document.createElement('div');
        progressBar.id = 'progress-bar';
        progressBar.style.cssText = `
            width: 100%;
            height: 20px;
            background: #333;
            border-radius: 10px;
            overflow: hidden;
            margin: 10px 0;
        `;
        
        const progressFill = document.createElement('div');
        progressFill.id = 'progress-fill';
        progressFill.style.cssText = `
            height: 100%;
            background: linear-gradient(90deg, #4CAF50, #8BC34A);
            width: 0%;
            transition: width 0.3s ease;
        `;
        
        progressBar.appendChild(progressFill);
        
        // 진행률 텍스트 생성
        const progressText = document.createElement('div');
        progressText.id = 'progress-text';
        progressText.style.cssText = `
            font-size: 14px;
            margin-top: 10px;
        `;
        
        container.appendChild(progressBar);
        container.appendChild(progressText);
        
        document.body.appendChild(container);
        
        this.container = container;
        this.progressBar = progressFill;
        this.progressText = progressText;
    }
    
    /**
     * 진행률 표시
     * @param {string} message - 진행률 메시지
     * @param {number} percent - 진행률 (0-100)
     */
    show(message, percent = 0) {
        if (!this.container) {
            this.init();
        }
        
        this.progressText.textContent = message;
        this.progressBar.style.width = `${Math.max(0, Math.min(100, percent))}%`;
        this.container.style.display = 'block';
    }
    
    /**
     * 진행률 업데이트
     * @param {string} message - 진행률 메시지
     * @param {number} percent - 진행률 (0-100)
     */
    update(message, percent) {
        this.show(message, percent);
    }
    
    /**
     * 성공 완료 표시
     * @param {string} message - 완료 메시지
     */
    showSuccess(message) {
        this.progressText.textContent = message;
        this.progressBar.style.width = '100%';
        this.progressBar.style.background = 'linear-gradient(90deg, #4CAF50, #8BC34A)';
        
        // 2초 후 자동 숨김
        setTimeout(() => {
            this.hide();
        }, 2000);
    }
    
    /**
     * 오류 표시
     * @param {string} message - 오류 메시지
     */
    showError(message) {
        this.progressText.textContent = message;
        this.progressBar.style.width = '100%';
        this.progressBar.style.background = 'linear-gradient(90deg, #F44336, #FF5722)';
        
        // 3초 후 자동 숨김
        setTimeout(() => {
            this.hide();
        }, 3000);
    }
    
    /**
     * 진행률 숨기기
     */
    hide() {
        if (this.container) {
            this.container.style.display = 'none';
            // 진행률 초기화
            this.progressBar.style.width = '0%';
            this.progressBar.style.background = 'linear-gradient(90deg, #4CAF50, #8BC34A)';
        }
    }
    
    /**
     * 진행률 리셋
     */
    reset() {
        this.hide();
        this.progressText.textContent = '';
        this.progressBar.style.width = '0%';
    }
}
