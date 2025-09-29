import { DOMUtils } from './utils/DOMUtils.js';
import { EventManager } from './utils/EventManager.js';

/**
 * IFC 트리 구조 관리 클래스
 * 트리 UI 생성, 표시, 제어를 담당
 */
export class TreeManager {
    constructor() {
        this.treeContent = DOMUtils.$('#treeContent');
        this.expandAllBtn = DOMUtils.$('#expandAllBtn');
        this.collapseAllBtn = DOMUtils.$('#collapseAllBtn');
        
        this.eventManager = new EventManager();
        this.nodeCache = new Map(); // 노드 캐시
        
        this.initializeEventListeners();
    }


    /**
     * 이벤트 리스너 초기화
     */
    initializeEventListeners() {
        this.eventManager.addEventListener(this.expandAllBtn, 'click', () => this.expandAllNodes());
        this.eventManager.addEventListener(this.collapseAllBtn, 'click', () => this.collapseAllNodes());
    }

    /**
     * 트리 구조 표시
     * @param {Array} parseDatas - 파싱된 트리 데이터
     */
    displayTreeStructure(parseDatas) {
        // 트리구조 데이터 저장
        this.treeData = parseDatas;
        
        if (!parseDatas || parseDatas.length === 0) {
            this.treeContent.innerHTML = '<p class="no-data">표시할 데이터가 없습니다.</p>';
            return;
        }

        this.treeContent.innerHTML = '';
        const treeList = document.createElement('ul');
        treeList.className = 'tree-node';

        parseDatas.forEach(node => {
            const treeItem = this.createTreeNode(node);
            treeList.appendChild(treeItem);
        });

        this.treeContent.appendChild(treeList);
    }

    /**
     * 트리 노드 생성
     * @param {Object} node - 노드 데이터
     * @returns {HTMLElement} 생성된 트리 아이템 요소
     */
    createTreeNode(node) {
        const li = document.createElement('li');
        li.className = 'tree-item';
        li.setAttribute('data-type', node.type);
        li.dataset.guid = node.guid || ''; // GUID 저장

        const content = document.createElement('div');
        content.className = 'tree-item-content';

        // 토글 버튼 (자식이 있는 경우에만)
        const toggle = document.createElement('div');
        toggle.className = node.children && node.children.length > 0 ? 'tree-toggle collapsed' : 'tree-toggle leaf';
        content.appendChild(toggle);

        // 타입 컨테이너 (라운드 네모 + 텍스트 오버랩)
        const typeContainer = document.createElement('div');
        typeContainer.className = 'tree-type-container';

        // 라운드 네모 배경 + 텍스트 오버랩 컨테이너
        const typeWrapper = document.createElement('div');
        typeWrapper.className = 'tree-type-wrapper';
        typeWrapper.style.backgroundColor = this.getTypeColor(node.type);

        // 타입 텍스트 (배경과 같은 컨테이너에)
        const typeText = document.createElement('div');
        typeText.className = 'tree-type-text';
        typeText.textContent = node.type;
        typeWrapper.appendChild(typeText);

        typeContainer.appendChild(typeWrapper);

        // 이름 (아래쪽, Guid 제외)
        const name = document.createElement('div');
        name.className = 'tree-name';
        name.textContent = node.name || '';
        typeContainer.appendChild(name);

        content.appendChild(typeContainer);

        // 클릭 이벤트 추가
        content.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleNode(li);
            
            // 객체 클릭 시 하이라이트 및 속성정보 표시
            if (node.guid) {
                this.selectNode(li, node.guid);
            }
        });

        li.appendChild(content);

        // 자식 노드들
        if (node.children && node.children.length > 0) {
            const childrenContainer = document.createElement('ul');
            childrenContainer.className = 'tree-children hidden';

            node.children.forEach(child => {
                const childItem = this.createTreeNode(child);
                childrenContainer.appendChild(childItem);
            });

            li.appendChild(childrenContainer);

            // 토글 이벤트
            content.addEventListener('click', () => this.toggleNode(content, childrenContainer, toggle));
        }

        return li;
    }

    /**
     * IFC 타입별 색상 반환
     * @param {string} type - IFC 타입
     * @returns {string} 색상 코드
     */
    getTypeColor(type) {
        const colorMap = {
            // 프로젝트 관련
            'IfcProject': '#4ecdc4',           // 터콰이즈
            'IfcSite': '#45b7d1',              // 스카이 블루
            'IfcBuilding': '#96ceb4',          // 민트 그린
            'IfcBuildingStorey': '#feca57',    // 골든 옐로우
            
            // 벽체 관련
            'IfcWall': '#ff6b6b',              // 밝은 빨간색
            'IfcWallStandardCase': '#ff6b6b',
            'IfcCurtainWall': '#ff9f43',       // 오렌지
            
            // 창문/문 관련
            'IfcWindow': '#54a0ff',            // 밝은 파란색
            'IfcWindowStyle': '#54a0ff',
            'IfcDoor': '#5f27cd',              // 퍼플
            'IfcDoorStyle': '#5f27cd',
            
            // 지붕/바닥 관련
            'IfcRoof': '#ff9ff3',              // 핑크
            'IfcSlab': '#00d2d3',              // 시안
            'IfcFloor': '#ddd6fe',             // 라벤더
            
            // 구조 관련
            'IfcColumn': '#ff9f43',            // 오렌지
            'IfcBeam': '#5f27cd',              // 퍼플
            'IfcStair': '#00d2d3',             // 시안
            'IfcRailing': '#ff9ff3',           // 핑크
            
            // 공간 관련
            'IfcSpace': '#ddd6fe',             // 라벤더
            'IfcZone': '#ddd6fe',
            
            // 기본값
            'default': '#ee5a24'               // 주황색
        };
        
        return colorMap[type] || colorMap['default'];
    }

    /**
     * 노드 펼치기/접기 토글
     */
    toggleNode(liElement) {
        const content = liElement.querySelector('.tree-item-content');
        const childrenContainer = liElement.querySelector('.tree-children');
        const toggle = liElement.querySelector('.tree-toggle');
        
        // 자식이 없는 경우 토글하지 않음
        if (!childrenContainer || !toggle || toggle.classList.contains('leaf')) {
            return;
        }
        
        const isExpanded = !childrenContainer.classList.contains('hidden');
        
        if (isExpanded) {
            childrenContainer.classList.add('hidden');
            toggle.classList.remove('expanded');
            toggle.classList.add('collapsed');
            content.classList.remove('expanded');
        } else {
            childrenContainer.classList.remove('hidden');
            toggle.classList.remove('collapsed');
            toggle.classList.add('expanded');
            content.classList.add('expanded');
        }
    }

    /**
     * 모든 노드 펼치기
     */
    expandAllNodes() {
        const toggles = this.treeContent.querySelectorAll('.tree-toggle');
        const childrenContainers = this.treeContent.querySelectorAll('.tree-children');
        const contents = this.treeContent.querySelectorAll('.tree-item-content');

        toggles.forEach(toggle => {
            if (!toggle.classList.contains('leaf')) {
                toggle.classList.remove('collapsed');
                toggle.classList.add('expanded');
            }
        });

        childrenContainers.forEach(container => {
            container.classList.remove('hidden');
        });

        contents.forEach(content => {
            if (content.querySelector('.tree-toggle.expanded')) {
                content.classList.add('expanded');
            }
        });
    }

    /**
     * 모든 노드 접기
     */
    collapseAllNodes() {
        const toggles = this.treeContent.querySelectorAll('.tree-toggle');
        const childrenContainers = this.treeContent.querySelectorAll('.tree-children');
        const contents = this.treeContent.querySelectorAll('.tree-item-content');

        toggles.forEach(toggle => {
            if (!toggle.classList.contains('leaf')) {
                toggle.classList.remove('expanded');
                toggle.classList.add('collapsed');
            }
        });

        childrenContainers.forEach(container => {
            container.classList.add('hidden');
        });

        contents.forEach(content => {
            content.classList.remove('expanded');
        });
    }

    /**
     * 노드 선택 및 하이라이트
     * @param {HTMLElement} nodeElement - 선택된 노드 요소
     * @param {string} guid - 선택된 객체의 GUID
     */
    selectNode(nodeElement, guid) {
        // 기존 선택 제거
        this.clearSelection();
        
        // 새 노드 선택
        nodeElement.classList.add('selected');
        
        // 속성정보 요청
        this.requestProperties(guid);
    }

    /**
     * 선택 상태 초기화
     */
    clearSelection() {
        const selectedNodes = this.treeContent.querySelectorAll('.tree-item.selected');
        selectedNodes.forEach(node => {
            node.classList.remove('selected');
        });
    }

    /**
     * 속성정보 요청 (프론트엔드 방식)
     * @param {string} guid - 객체 GUID
     */
    async requestProperties(guid) {
        try {
            // IFC Property 데이터에서 해당 GUID의 모든 속성정보 찾기
            const properties = this.findPropertiesByGuid(guid);
            
            if (properties && properties.length > 0) {
                // 속성정보 표시
                if (window.webIFCViewerApp) {
                    window.webIFCViewerApp.showProperties(properties);
                }
            } else {
                console.warn('GUID에 해당하는 속성정보를 찾을 수 없습니다:', guid);
                this.showEmptyProperties();
            }
        } catch (error) {
            console.error('속성정보 처리 오류:', error);
            this.showEmptyProperties();
        }
    }

    /**
     * GUID로 속성정보 찾기
     * @param {string} guid - 찾을 GUID
     * @returns {Array} 속성정보 배열
     */
    findPropertiesByGuid(guid) {
        if (window.webIFCViewerApp && window.webIFCViewerApp.ifcPropertyData) {
            const allProperties = window.webIFCViewerApp.ifcPropertyData.properties || [];
            
            // 해당 GUID의 모든 속성정보 필터링
            const guidProperties = allProperties.filter(item => item.guid === guid);
            
            return guidProperties;
        }
        
        return [];
    }



    /**
     * 빈 속성정보 표시
     */
    showEmptyProperties() {
        if (window.webIFCViewerApp) {
            window.webIFCViewerApp.showProperties([]);
        }
    }

    /**
     * GUID로 노드 찾기 및 선택
     * @param {string} guid - 찾을 GUID
     */
    selectNodeByGuid(guid) {
        const nodeElement = this.treeContent.querySelector(`[data-guid="${guid}"]`);
        if (nodeElement) {
            this.selectNode(nodeElement, guid);
        }
        
        // 3D 모델에서도 하이라이트
        this.highlightObjectIn3D(guid);
    }
    
    /**
     * 3D 모델에서 객체 하이라이트
     * @param {string} guid - 객체 GUID
     */
    highlightObjectIn3D(guid) {
        if (window.webIFCViewerApp && window.webIFCViewerApp.threeViewer && window.webIFCViewerApp.threeViewer.eventManager) {
            window.webIFCViewerApp.threeViewer.eventManager.highlightObject(guid);
        }
    }


}
