/**
 * 통합 사이드바 관리 클래스
 * 트리구조와 속성정보를 하나의 사이드바에서 2개 영역으로 동시 표시
 */
export class UnifiedSidebarManager {
    constructor() {
        this.unifiedSidebar = document.getElementById('unifiedSidebar');
        this.propertiesList = document.getElementById('propertiesList');
        this.resizeHandle = document.getElementById('sidebarResizeHandle');
        this.horizontalResizeHandle = document.getElementById('horizontalResizeHandle');
        this.treeSection = document.querySelector('.tree-section');
        this.propertiesSection = document.querySelector('.properties-section');
        this.verticalButtonPanel = document.querySelector('.vertical-button-panel');
        this.wireframeColorPanel = document.querySelector('.wireframe-color-panel');
        
        this.isVisible = true;
        this.isResizing = false;
        this.isHorizontalResizing = false;
        this.isTreeVisible = true;
        this.isPropertiesVisible = true;
        this.minWidth = 150;  // 더 작은 최소 너비
        this.maxWidth = window.innerWidth * 0.8; // 화면 너비의 80%
        this.minSectionWidth = 80; // 섹션 최소 너비 줄임
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateButtonState();
        this.updateButtonStates(); // A, B 버튼 상태 초기화
        this.updateResizeHandleVisibility(); // 리사이즈 핸들 상태 초기화
        this.updateSectionWidths(); // 섹션 너비 초기화
        this.updateButtonPanelPosition(); // 초기 위치 설정
    }

    setupEventListeners() {
        // 세로 리사이즈 핸들 이벤트 (사이드바 전체 너비)
        this.resizeHandle.addEventListener('mousedown', (e) => this.startResize(e));
        
        // 가로 리사이즈 핸들 이벤트 (트리구조와 속성정보 영역 간)
        this.horizontalResizeHandle.addEventListener('mousedown', (e) => this.startHorizontalResize(e));
        
        // 공통 이벤트
        document.addEventListener('mousemove', (e) => this.handleResize(e));
        document.addEventListener('mouseup', () => this.stopResize());
        
        // 창 크기 변경 시 최대 너비 업데이트
        window.addEventListener('resize', () => this.updateMaxWidth());
    }

    /**
     * 사이드바 토글
     */
    toggleSidebar() {
        this.isVisible = !this.isVisible;
        
        if (this.isVisible) {
            this.unifiedSidebar.classList.remove('hidden');
            this.updateButtonPanelPosition();
        } else {
            this.unifiedSidebar.classList.add('hidden');
            this.updateButtonPanelPosition();
        }
        
        this.updateButtonState();
        
        // 뷰어 크기 업데이트 (약간의 지연을 두어 CSS 전환이 완료된 후 실행)
        setTimeout(() => {
            this.updateViewerSize();
        }, 50);
    }


    /**
     * 버튼 상태 업데이트
     */
    updateButtonState() {
        // 토글 버튼은 이제 세로 패널에 있으므로 여기서는 상태만 관리
        // 실제 버튼 스타일은 script.js에서 관리
    }

    /**
     * A, B 버튼 상태 업데이트
     */
    updateButtonStates() {
        const toggleTreeBtn = document.getElementById('toggleTreeBtn');
        const togglePropertiesBtn = document.getElementById('togglePropertiesBtn');
        
        if (toggleTreeBtn) {
            if (this.isTreeVisible) {
                toggleTreeBtn.classList.add('active');
                toggleTreeBtn.title = '트리구조 숨기기';
            } else {
                toggleTreeBtn.classList.remove('active');
                toggleTreeBtn.title = '트리구조 보이기';
            }
        }
        
        if (togglePropertiesBtn) {
            if (this.isPropertiesVisible) {
                togglePropertiesBtn.classList.add('active');
                togglePropertiesBtn.title = '속성정보 숨기기';
            } else {
                togglePropertiesBtn.classList.remove('active');
                togglePropertiesBtn.title = '속성정보 보이기';
            }
        }
    }

    /**
     * 리사이즈 핸들 표시/숨김 업데이트
     */
    updateResizeHandleVisibility() {
        if (!this.horizontalResizeHandle) return;
        
        // 두 섹션이 모두 보일 때만 리사이즈 핸들 표시
        if (this.isTreeVisible && this.isPropertiesVisible) {
            this.horizontalResizeHandle.classList.remove('hidden');
        } else {
            this.horizontalResizeHandle.classList.add('hidden');
        }
    }

    /**
     * 섹션 너비 업데이트 (하나의 섹션만 보일 때 전체 너비 사용)
     */
    updateSectionWidths() {
        const visibleSections = [];
        
        if (this.isTreeVisible) {
            visibleSections.push(this.treeSection);
        }
        
        if (this.isPropertiesVisible) {
            visibleSections.push(this.propertiesSection);
        }
        
        // 모든 섹션의 single-section 클래스 제거
        this.treeSection.classList.remove('single-section');
        this.propertiesSection.classList.remove('single-section');
        
        // 하나의 섹션만 보이면 전체 너비 사용
        if (visibleSections.length === 1) {
            visibleSections[0].classList.add('single-section');
        }
    }

    /**
     * 속성정보 표시
     * @param {Array} properties - 속성정보 배열
     */
    showProperties(properties) {
        if (!properties || properties.length === 0) {
            this.showEmptyProperties();
            return;
        }

        // 속성정보를 그룹별로 정리
        const groupedProperties = this.groupProperties(properties);
        
        // 기존 내용 제거
        this.propertiesList.innerHTML = '';
        
        // 그룹별로 속성정보 표시
        Object.keys(groupedProperties).forEach(title => {
            const group = groupedProperties[title];
            const groupElement = this.createPropertyGroup(title, group);
            this.propertiesList.appendChild(groupElement);
        });
    }

    /**
     * 속성정보를 그룹별로 정리
     * @param {Array} properties - 속성정보 배열
     * @returns {Object} 그룹별로 정리된 속성정보
     */
    groupProperties(properties) {
        const grouped = {};
        
        properties.forEach(property => {
            const title = property.title || '기타';
            
            if (!grouped[title]) {
                grouped[title] = [];
            }
            
            grouped[title].push(property);
        });
        
        return grouped;
    }

    /**
     * 속성 그룹 요소 생성
     * @param {string} title - 그룹 제목
     * @param {Array} properties - 속성 배열
     * @returns {HTMLElement} 그룹 요소
     */
    createPropertyGroup(title, properties) {
        const groupDiv = document.createElement('div');
        groupDiv.className = 'property-group';
        
        // 그룹 헤더
        const headerDiv = document.createElement('div');
        headerDiv.className = 'property-group-header';
        headerDiv.innerHTML = `<h4 class="property-group-title">${title}</h4>`;
        
        // 그룹 내용
        const contentDiv = document.createElement('div');
        contentDiv.className = 'property-group-content';
        
        properties.forEach(property => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'property-item';
            
            itemDiv.innerHTML = `
                <div class="property-subtitle">${property.subTitle || ''}</div>
                <div class="property-value">${property.value || ''}</div>
            `;
            
            contentDiv.appendChild(itemDiv);
        });
        
        groupDiv.appendChild(headerDiv);
        groupDiv.appendChild(contentDiv);
        
        return groupDiv;
    }

    /**
     * 빈 속성정보 상태 표시
     */
    showEmptyProperties() {
        this.propertiesList.innerHTML = `
            <div class="properties-empty">
                <div class="properties-empty-icon">📋</div>
                <div class="properties-empty-text">
                    속성정보가 없습니다.<br>
                    IFC 파일을 업로드해보세요.
                </div>
            </div>
        `;
    }


    /**
     * 사이드바 숨기기
     */
    hideSidebar() {
        this.isVisible = false;
        this.unifiedSidebar.classList.add('hidden');
        this.updateButtonState();
    }

    /**
     * 사이드바 보이기
     */
    showSidebar() {
        this.isVisible = true;
        this.unifiedSidebar.classList.remove('hidden');
        this.updateButtonState();
    }

    /**
     * 트리구조 섹션 토글
     */
    toggleTreeSection() {
        this.isTreeVisible = !this.isTreeVisible;
        
        if (this.isTreeVisible) {
            this.treeSection.style.display = 'flex';
        } else {
            this.treeSection.style.display = 'none';
        }
        
        this.updateButtonStates();
        this.updateResizeHandleVisibility();
        this.updateSectionWidths();
    }

    /**
     * 속성정보 섹션 토글
     */
    togglePropertiesSection() {
        this.isPropertiesVisible = !this.isPropertiesVisible;
        
        if (this.isPropertiesVisible) {
            this.propertiesSection.style.display = 'flex';
        } else {
            this.propertiesSection.style.display = 'none';
        }
        
        this.updateButtonStates();
        this.updateResizeHandleVisibility();
        this.updateSectionWidths();
    }

    /**
     * 최대 너비 업데이트
     */
    updateMaxWidth() {
        this.maxWidth = window.innerWidth * 0.8;
        
        // 현재 사이드바 너비가 새로운 최대 너비를 초과하면 조정
        const currentWidth = this.unifiedSidebar.offsetWidth;
        if (currentWidth > this.maxWidth) {
            this.unifiedSidebar.style.width = `${this.maxWidth}px`;
            this.updateButtonPanelPosition();
        }
    }

    /**
     * 세로 리사이즈 시작 (사이드바 전체 너비)
     */
    startResize(e) {
        e.preventDefault();
        this.isResizing = true;
        this.isHorizontalResizing = false;
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
    }

    /**
     * 가로 리사이즈 시작 (트리구조와 속성정보 영역 간)
     */
    startHorizontalResize(e) {
        e.preventDefault();
        this.isHorizontalResizing = true;
        this.isResizing = false;
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
    }

    /**
     * 리사이즈 처리
     */
    handleResize(e) {
        if (this.isResizing) {
            // 세로 리사이즈 (사이드바 전체 너비)
            e.preventDefault();
            
            const newWidth = e.clientX;
            // 더 넓은 범위로 리사이즈 허용
            const clampedWidth = Math.max(this.minWidth, Math.min(this.maxWidth, newWidth));
            
            this.unifiedSidebar.style.width = `${clampedWidth}px`;
            
            // 세로 버튼 패널 위치를 실시간으로 업데이트
            this.updateButtonPanelPositionRealtime(clampedWidth);
            
            // 뷰어 크기 업데이트는 부드럽게
            requestAnimationFrame(() => {
                this.updateViewerSize();
            });
        } else if (this.isHorizontalResizing) {
            // 가로 리사이즈 (트리구조와 속성정보 영역 간)
            e.preventDefault();
            
            const sidebarRect = this.unifiedSidebar.getBoundingClientRect();
            const mouseX = e.clientX - sidebarRect.left;
            const sidebarWidth = sidebarRect.width;
            
            // 트리구조 영역의 새로운 너비 계산
            const newTreeWidth = Math.max(this.minSectionWidth, Math.min(sidebarWidth - this.minSectionWidth - 10, mouseX));
            
            // flex-basis로 너비 설정
            this.treeSection.style.flex = `0 0 ${newTreeWidth}px`;
            this.propertiesSection.style.flex = '1 1 auto';
        }
    }

    /**
     * 리사이즈 종료
     */
    stopResize() {
        if (this.isResizing || this.isHorizontalResizing) {
            this.isResizing = false;
            this.isHorizontalResizing = false;
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
            
            // 세로 리사이즈인 경우에만 버튼 패널 위치 조정
            if (this.isResizing) {
                this.updateButtonPanelPosition();
            }
        }
    }

    /**
     * 세로 버튼 패널 위치 업데이트 (일반)
     */
    updateButtonPanelPosition() {
        if (!this.verticalButtonPanel) return;
        
        if (this.isVisible) {
            // 사이드바가 보일 때: 사이드바 너비 + 뷰포트 마진(20px) + 여백(5px)
            const sidebarWidth = this.unifiedSidebar.offsetWidth || 300;
            const leftPosition = sidebarWidth + 25;
            
            this.verticalButtonPanel.style.left = `${leftPosition}px`;
            
            // 윤곽선 색상 패널도 함께 이동
            if (this.wireframeColorPanel) {
                this.wireframeColorPanel.style.left = `${leftPosition + 60}px`; // 세로 버튼 패널 오른쪽
            }
        } else {
            // 사이드바가 숨겨질 때: 뷰포트 마진(20px) + 여백(5px)
            this.verticalButtonPanel.style.left = '25px';
            
            // 윤곽선 색상 패널도 함께 이동
            if (this.wireframeColorPanel) {
                this.wireframeColorPanel.style.left = '85px';
            }
        }
    }

    /**
     * 세로 버튼 패널 위치 실시간 업데이트 (리사이즈 중)
     */
    updateButtonPanelPositionRealtime(sidebarWidth) {
        if (!this.verticalButtonPanel || !this.isVisible) return;
        
        // 실시간으로 계산된 사이드바 너비 사용
        const leftPosition = sidebarWidth + 25;
        
        // transition을 일시적으로 비활성화하여 즉시 이동
        const originalTransition = this.verticalButtonPanel.style.transition;
        this.verticalButtonPanel.style.transition = 'none';
        
        this.verticalButtonPanel.style.left = `${leftPosition}px`;
        
        // 윤곽선 색상 패널도 함께 이동
        if (this.wireframeColorPanel) {
            const colorPanelOriginalTransition = this.wireframeColorPanel.style.transition;
            this.wireframeColorPanel.style.transition = 'none';
            this.wireframeColorPanel.style.left = `${leftPosition + 60}px`;
            this.wireframeColorPanel.style.transition = colorPanelOriginalTransition;
        }
        
        // transition 복원
        this.verticalButtonPanel.style.transition = originalTransition;
    }

    /**
     * 뷰어 크기 업데이트
     */
    updateViewerSize() {
        if (window.threeViewer && window.threeViewer.onWindowResize) {
            // 뷰어 컨테이너 크기 강제 업데이트
            const viewerContainer = document.getElementById('viewer3D');
            if (viewerContainer) {
                // 컨테이너 크기 재계산을 위해 강제 리플로우
                viewerContainer.style.width = viewerContainer.offsetWidth + 'px';
                viewerContainer.style.width = '';
            }
            
            // 줌 상태를 보존하면서 크기 업데이트
            requestAnimationFrame(() => {
                window.threeViewer.onWindowResize();
            });
        }
    }
}
