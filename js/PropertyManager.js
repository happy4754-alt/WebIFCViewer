/**
 * 속성정보 관리 클래스
 */
export class PropertyManager {
    constructor() {
        this.propertiesSidebar = document.getElementById('propertiesSidebar');
        this.propertiesList = document.getElementById('propertiesList');
        this.togglePropertiesBtn = document.getElementById('togglePropertiesBtn');
        this.isVisible = false;
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateButtonState();
    }

    setupEventListeners() {
        // 토글 버튼 클릭 이벤트
        this.togglePropertiesBtn.addEventListener('click', () => {
            this.toggleProperties();
        });
    }

    /**
     * 속성정보 사이드바 토글
     */
    toggleProperties() {
        this.isVisible = !this.isVisible;
        
        if (this.isVisible) {
            this.propertiesSidebar.classList.add('visible');
            this.adjustButtonPanelPosition(true);
        } else {
            this.propertiesSidebar.classList.remove('visible');
            this.adjustButtonPanelPosition(false);
        }
        
        this.updateButtonState();
    }

    /**
     * 버튼 상태 업데이트
     */
    updateButtonState() {
        if (this.isVisible) {
            this.togglePropertiesBtn.style.background = 'var(--accent-gradient)';
            this.togglePropertiesBtn.title = '속성정보 숨기기';
        } else {
            this.togglePropertiesBtn.style.background = 'var(--primary-gradient)';
            this.togglePropertiesBtn.title = '속성정보 보기';
        }
    }

    /**
     * 세로버튼 패널 위치 조정
     * @param {boolean} isPropertiesVisible - 속성정보 사이드바가 보이는지 여부
     */
    adjustButtonPanelPosition(isPropertiesVisible) {
        const buttonPanel = document.querySelector('.vertical-button-panel');
        if (buttonPanel) {
            if (isPropertiesVisible) {
                // 속성정보 사이드바가 열릴 때: 625px (속성정보 사이드바 300px + 기존 사이드바 300px + 마진 25px)
                buttonPanel.style.left = '625px';
            } else {
                // 속성정보 사이드바가 닫힐 때: 325px (기존 사이드바 300px + 마진 25px)
                buttonPanel.style.left = '325px';
            }
        }
    }

    /**
     * 속성정보 표시
     * @param {Array} properties - 속성정보 배열
     */
    showProperties(properties) {
        if (!properties || properties.length === 0) {
            this.showEmptyState();
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
     * 빈 상태 표시
     */
    showEmptyState() {
        this.propertiesList.innerHTML = `
            <div class="properties-empty">
                <div class="properties-empty-icon">📋</div>
                <div class="properties-empty-text">
                    속성정보가 없습니다.<br>
                    트리 구조나 모델링을 클릭해보세요.
                </div>
            </div>
        `;
    }

    /**
     * 속성정보 숨기기
     */
    hideProperties() {
        this.isVisible = false;
        this.propertiesSidebar.classList.remove('visible');
        this.adjustButtonPanelPosition(false);
        this.updateButtonState();
    }

    /**
     * 속성정보 표시
     */
    showPropertiesSidebar() {
        this.isVisible = true;
        this.propertiesSidebar.classList.add('visible');
        this.adjustButtonPanelPosition(true);
        this.updateButtonState();
    }
}
