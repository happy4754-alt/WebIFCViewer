/**
 * WebIFCViewer 메인 애플리케이션
 * 모듈화된 컴포넌트들을 조합하여 전체 애플리케이션을 관리
 */
import { TreeManager } from './js/TreeManager.js';
import { ApiService } from './js/ApiService.js';
import { FileValidator } from './js/FileValidator.js';
import { ThreeJSViewer } from './js/ThreeJSViewer.js';
import { DOMUtils } from './js/utils/DOMUtils.js';
import { EventManager } from './js/utils/EventManager.js';
import { UnifiedSidebarManager } from './js/UnifiedSidebarManager.js';

class WebIFCViewerApp {
    constructor() {
        this.apiService = new ApiService();
        this.fileValidator = new FileValidator();
        this.treeManager = new TreeManager();
        this.threeViewer = new ThreeJSViewer('viewer3D');
        this.eventManager = new EventManager();
        this.unifiedSidebarManager = new UnifiedSidebarManager();
        this.messageTimer = null; // 메시지 타이머 초기화
        this.ifcGeometryData = null; // IFC Geometry 데이터 저장용
        this.ifcPropertyData = null; // IFC Property 데이터 저장용
        
        // 전역 접근을 위해 window에 할당
        window.threeViewer = this.threeViewer;
        window.webIFCViewerApp = this;
        
        this.initializeElements();
        this.attachEventListeners();
    }

    /**
     * DOM 요소들을 초기화하고 참조를 저장
     */
    initializeElements() {
        this.uploadArea = DOMUtils.$('#uploadArea');
        this.fileInput = DOMUtils.$('#fileInput');
        this.selectFileBtn = DOMUtils.$('#selectFileBtn');
        this.uploadProgress = DOMUtils.$('#uploadProgress');
        this.progressFill = DOMUtils.$('#progressFill');
        this.progressText = DOMUtils.$('#progressText');
        this.uploadResult = DOMUtils.$('#uploadResult');
        this.resultMessage = DOMUtils.$('#resultMessage');
        // 새로운 아이콘 버튼들
        this.selectFileBtn = DOMUtils.$('#selectFileBtn');
        this.fitCameraBtn = DOMUtils.$('#fitCameraBtn');
        this.toggleOriginBtn = DOMUtils.$('#toggleOriginBtn');
        this.toggleSectionBoxBtn = DOMUtils.$('#toggleSectionBoxBtn');
        this.toggleWireframeBtn = DOMUtils.$('#toggleWireframeBtn');
        this.toggleSidebarBtn = DOMUtils.$('#toggleSidebarBtn');
        this.toggleTreeBtn = DOMUtils.$('#toggleTreeBtn');
        this.togglePropertiesBtn = DOMUtils.$('#togglePropertiesBtn');
        
        // 윤곽선 색상 선택 버튼들
        this.wireframeBlackBtn = DOMUtils.$('#wireframeBlackBtn');
        this.wireframeWhiteBtn = DOMUtils.$('#wireframeWhiteBtn');
        this.wireframeRedBtn = DOMUtils.$('#wireframeRedBtn');
        this.wireframeColorPanel = DOMUtils.$('#wireframeColorPanel');
    }

    /**
     * 이벤트 리스너들을 등록
     */
    attachEventListeners() {
        // 파일 선택 버튼 클릭 이벤트
        this.eventManager.addEventListener(this.selectFileBtn, 'click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.fileInput?.click();
        });
        
        // 파일 입력 변경 이벤트
        this.eventManager.addEventListener(this.fileInput, 'change', (e) => this.handleFileSelect(e));
        
        // 드래그 앤 드롭 이벤트들 제거됨
        
        // 파일 선택 이벤트
        this.eventManager.addEventListener(this.selectFileBtn, 'click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.fileInput.click();
        });
        
        // 3D 뷰어 이벤트
        this.eventManager.addEventListener(this.fitCameraBtn, 'click', () => this.threeViewer.fitCameraToModel());
        this.eventManager.addEventListener(this.toggleOriginBtn, 'click', () => this.toggleOrigin());
        this.eventManager.addEventListener(this.toggleSectionBoxBtn, 'click', () => this.toggleSectionBox());
        this.eventManager.addEventListener(this.toggleWireframeBtn, 'click', () => this.toggleWireframe());
        this.eventManager.addEventListener(this.toggleSidebarBtn, 'click', () => this.toggleSidebar());
        this.eventManager.addEventListener(this.toggleTreeBtn, 'click', () => this.toggleTree());
        this.eventManager.addEventListener(this.togglePropertiesBtn, 'click', () => this.toggleProperties());
        
        // 윤곽선 색상 선택 이벤트
        this.eventManager.addEventListener(this.wireframeBlackBtn, 'click', () => this.setWireframeColor(0x000000));
        this.eventManager.addEventListener(this.wireframeWhiteBtn, 'click', () => this.setWireframeColor(0xffffff));
        this.eventManager.addEventListener(this.wireframeRedBtn, 'click', () => this.setWireframeColor(0xff0000));
    }

    // 드래그 업로드 관련 메서드들 제거됨

    /**
     * 파일 선택 이벤트 처리
     */
    handleFileSelect(event) {
        const file = event.target.files[0];
        if (file) {
            this.processFile(file);
        }
    }

    /**
     * 파일 처리 (유효성 검사 및 업로드)
     */
    async processFile(file) {
        // 파일 유효성 검사
        const validation = this.fileValidator.validateFile(file);
        if (!validation.isValid) {
            this.showError(validation.errors.join(' '));
            return;
        }

        try {
            await this.uploadFile(file);
        } catch (error) {
            console.error('파일 처리 오류:', error);
            this.showError('파일 처리 중 오류가 발생했습니다.');
        }
    }

    /**
     * 파일 업로드
     */
    async uploadFile(file) {
        this.showProgress('업로드 중...');
        
        try {
            const response = await this.apiService.uploadFile(file, (progress) => {
                this.updateProgress(progress, '업로드 중...');
            });
            
            await this.handleUploadSuccess(response);
        } catch (error) {
            console.error('업로드 오류:', error);
            this.showError(`업로드 실패: ${error.message}`);
        } finally {
            this.hideProgress();
        }
    }

    /**
     * 업로드 성공 처리
     */
    async handleUploadSuccess(response) {
        this.showSuccess(`파일이 성공적으로 업로드되었습니다! (${response.fileName})`);
        
        // 업로드 성공 후 자동으로 IFC 파싱 실행
        await this.parseIfcFile(response.fileName);
    }

    /**
     * IFC 파일 파싱
     */
    async parseIfcFile(fileName) {
        try {
            this.showProgress('IFC 파일 파싱 중...');
            
            const response = await this.apiService.parseIfcFile(fileName);
            
            if (response.success) {
                this.treeManager.displayTreeStructure(response.parseDatas);
                this.showSuccess(`IFC 파일이 성공적으로 파싱되었습니다! (${response.objectCount}개 객체)`);
                
                // Geometry 추출 및 3D 렌더링
                await this.extractAndRenderGeometry(fileName);
                
                // Property 데이터 추출 및 저장
                await this.extractAndStoreProperties(fileName);
            } else {
                this.showError(`파싱 실패: ${response.errorMessage}`);
            }
        } catch (error) {
            console.error('IFC 파싱 오류:', error);
            this.showError('IFC 파일 파싱 중 오류가 발생했습니다.');
        } finally {
            this.hideProgress();
        }
    }

    /**
     * IFC Geometry 추출 및 3D 렌더링
     * @param {string} fileName - 파일명
     */
    async extractAndRenderGeometry(fileName) {
        try {
            console.log(`IFC Geometry 추출 시작: ${fileName}`);
            this.showProgress('3D 모델 렌더링 중...');
            
            // 기존 IFC 객체 제거
            this.threeViewer.clearIfcObjects();
            
            // Geometry 추출
            const geometryResult = await this.apiService.extractGeometry(fileName);
            console.log('IFC Geometry 추출 결과:', geometryResult);
            
            if (geometryResult.geometries && geometryResult.geometries.length > 0) {
                // IFC Geometry 데이터를 전역에서 접근 가능하도록 저장
                this.ifcGeometryData = geometryResult;
                
                // 3D 렌더링
                this.threeViewer.addIfcGeometries(geometryResult.geometries);
                this.showSuccess(`3D 모델 렌더링 완료: ${geometryResult.geometries.length}개 객체`);
            } else {
                this.showError('렌더링할 Geometry 데이터가 없습니다.');
            }
        } catch (error) {
            console.error('IFC Geometry 추출/렌더링 오류:', error);
            this.showError('3D 모델 렌더링 중 오류가 발생했습니다.');
        } finally {
            this.hideProgress();
        }
    }

    /**
     * 진행 상태 표시
     */
    showProgress(text) {
        this.progressText.textContent = text;
        this.uploadProgress.classList.remove('hidden');
    }

    /**
     * 진행률 업데이트
     */
    updateProgress(percent, text) {
        this.progressFill.style.width = `${percent}%`;
        this.progressText.textContent = text;
    }

    /**
     * 진행 상태 숨기기
     */
    hideProgress() {
        this.uploadProgress.classList.add('hidden');
        this.progressFill.style.width = '100%';
    }

    /**
     * 성공 메시지 표시
     */
    showSuccess(message) {
        this.showResult(message, 'success');
    }

    /**
     * 에러 메시지 표시
     */
    showError(message) {
        this.showResult(message, 'error');
    }

    /**
     * 결과 메시지 표시 (화면 중앙, 자동 사라짐)
     */
    showResult(message, type) {
        // 기존 타이머가 있다면 제거
        if (this.messageTimer) {
            clearTimeout(this.messageTimer);
        }
        
        // 메시지 설정
        this.resultMessage.textContent = message;
        this.resultMessage.className = `result-message ${type}`;
        
        // 메시지 표시 (부드러운 페이드 인)
        this.uploadResult.classList.remove('hidden');
        
        // 3초 후 자동으로 사라지게 함 (부드러운 페이드 아웃)
        this.messageTimer = setTimeout(() => {
            this.uploadResult.classList.add('hidden');
        }, 3000);
    }
    
    /**
     * 윤곽선 표시/숨김 토글
     */
    toggleWireframe() {
        if (this.threeViewer) {
            // 현재 윤곽선 표시 상태를 확인
            const isCurrentlyVisible = this.threeViewer.modelRenderer ? this.threeViewer.modelRenderer.showWireframe : false;
            this.threeViewer.toggleWireframe(!isCurrentlyVisible);
            
            if (isCurrentlyVisible) {
                this.toggleWireframeBtn.title = '윤곽선 표시';
                this.wireframeColorPanel.classList.add('hidden');
            } else {
                this.toggleWireframeBtn.title = '윤곽선 숨김';
                this.wireframeColorPanel.classList.remove('hidden');
            }
        }
    }

    /**
     * 사이드바 토글
     */
    toggleSidebar() {
        if (this.unifiedSidebarManager) {
            this.unifiedSidebarManager.toggleSidebar();
        }
    }

    /**
     * 트리구조 토글 (A 버튼)
     */
    toggleTree() {
        if (this.unifiedSidebarManager) {
            this.unifiedSidebarManager.toggleTreeSection();
        }
    }

    /**
     * 속성정보 토글 (B 버튼)
     */
    toggleProperties() {
        if (this.unifiedSidebarManager) {
            this.unifiedSidebarManager.togglePropertiesSection();
        }
    }

    /**
     * 속성정보 표시
     * @param {Array} properties - 속성정보 배열
     */
    showProperties(properties) {
        if (this.unifiedSidebarManager) {
            this.unifiedSidebarManager.showProperties(properties);
        }
    }

    /**
     * 속성정보 추출 및 저장
     * @param {string} fileName - 파일명
     */
    async extractAndStoreProperties(fileName) {
        try {
            const response = await this.apiService.extractProperties(fileName);
            
            if (response.success && response.properties) {
                // IFC Property 데이터를 전역에서 접근 가능하도록 저장
                this.ifcPropertyData = response;
                console.log('IFC Property 데이터 저장 완료:', response.properties.length, '개 속성');
            } else {
                console.warn('속성정보 추출 실패 또는 속성정보 없음:', response.errorMessage);
            }
        } catch (error) {
            console.error('속성정보 추출 오류:', error);
            // 속성정보 추출 실패는 치명적이지 않으므로 에러 메시지를 표시하지 않음
        }
    }
    
    /**
     * 원점 표시/숨김 토글
     */
    toggleOrigin() {
        if (this.threeViewer) {
            const isCurrentlyVisible = this.toggleOriginBtn.textContent === '⚫';
            if (isCurrentlyVisible) {
                this.threeViewer.clearOrigin();
                this.toggleOriginBtn.textContent = '⚪';
                this.toggleOriginBtn.title = '원점 표시';
            } else {
                this.threeViewer.showOrigin();
                this.toggleOriginBtn.textContent = '⚫';
                this.toggleOriginBtn.title = '원점 숨김';
            }
        }
    }
    
    /**
     * 섹션박스 표시/제거 토글
     */
    toggleSectionBox() {
        if (this.threeViewer) {
            const isCurrentlyVisible = this.toggleSectionBoxBtn.textContent === '📦';
            if (isCurrentlyVisible) {
                this.threeViewer.clearSectionBox();
                this.toggleSectionBoxBtn.textContent = '📭';
                this.toggleSectionBoxBtn.title = '섹션박스 생성';
            } else {
                this.threeViewer.createSectionBox();
                this.toggleSectionBoxBtn.textContent = '📦';
                this.toggleSectionBoxBtn.title = '섹션박스 제거';
            }
        }
    }
    
    /**
     * 윤곽선 색상 변경
     */
    setWireframeColor(color) {
        if (this.threeViewer) {
            this.threeViewer.setWireframeColor(color);
            console.log('윤곽선 색상 변경됨:', color);
        }
    }
}

// 페이지 로드 시 애플리케이션 초기화
document.addEventListener('DOMContentLoaded', () => {
    new WebIFCViewerApp();
});