/**
 * 이벤트 관리 모듈
 * 윈도우 리사이즈, 키보드, 마우스 이벤트를 관리
 */
import * as THREE from 'three';

export class EventManager {
    constructor(container, viewer) {
        this.container = container;
        this.viewer = viewer;
        this.eventListeners = new Map();
        
        // 드래그 상태 추적
        this.isDragging = false;
        this.dragThreshold = 5; // 5픽셀 이상 움직이면 드래그로 간주
        this.mouseDownPosition = { x: 0, y: 0 };
    }
    
    /**
     * 이벤트 리스너 설정
     */
    setupEventListeners() {
        // 윈도우 리사이즈 이벤트
        this.addEventListener(window, 'resize', () => this.onWindowResize());
        
        // 컨테이너 이벤트들
        this.addEventListener(this.container, 'mousedown', (e) => this.onMouseDown(e));
        this.addEventListener(this.container, 'mousemove', (e) => this.onMouseMove(e));
        this.addEventListener(this.container, 'mouseup', (e) => this.onMouseUp(e));
        this.addEventListener(this.container, 'wheel', (e) => this.onWheel(e));
        this.addEventListener(this.container, 'contextmenu', (e) => e.preventDefault());
        
        // 키보드 이벤트
        this.addEventListener(document, 'keydown', (e) => this.onKeyDown(e));
        this.addEventListener(document, 'keyup', (e) => this.onKeyUp(e));
    }
    
    /**
     * 이벤트 리스너 추가
     * @param {HTMLElement} element - 이벤트를 바인딩할 요소
     * @param {string} event - 이벤트 타입
     * @param {Function} handler - 이벤트 핸들러
     */
    addEventListener(element, event, handler) {
        element.addEventListener(event, handler);
        
        // 나중에 제거할 수 있도록 저장
        if (!this.eventListeners.has(element)) {
            this.eventListeners.set(element, new Map());
        }
        this.eventListeners.get(element).set(event, handler);
    }
    
    /**
     * 윈도우 리사이즈 처리
     */
    onWindowResize() {
        if (this.viewer.sceneManager) {
            this.viewer.sceneManager.onWindowResize();
        }
    }
    
    /**
     * 마우스 다운 이벤트
     * @param {MouseEvent} event - 마우스 이벤트
     */
    onMouseDown(event) {
        // 좌클릭인 경우에만 드래그 상태 추적
        if (event.button === 0) {
            this.isDragging = false;
            this.mouseDownPosition.x = event.clientX;
            this.mouseDownPosition.y = event.clientY;
        }
        
        if (this.viewer.controls) {
            this.viewer.controls.onMouseDown(event);
        }
    }
    
    /**
     * 마우스 이동 이벤트
     * @param {MouseEvent} event - 마우스 이벤트
     */
    onMouseMove(event) {
        // 좌클릭 상태에서만 드래그 상태 확인
        if (event.buttons === 1 && !this.isDragging) {
            const deltaX = Math.abs(event.clientX - this.mouseDownPosition.x);
            const deltaY = Math.abs(event.clientY - this.mouseDownPosition.y);
            
            if (deltaX > this.dragThreshold || deltaY > this.dragThreshold) {
                this.isDragging = true;
            }
        }
        
        if (this.viewer.controls) {
            this.viewer.controls.onMouseMove(event);
        }
    }
    
    /**
     * 마우스 업 이벤트
     * @param {MouseEvent} event - 마우스 이벤트
     */
    onMouseUp(event) {
        // 좌클릭이고 드래그가 아닌 경우에만 클릭으로 처리
        if (event.button === 0 && !this.isDragging) {
            this.handleModelClick(event);
        }
        
        // 드래그 상태 리셋
        this.isDragging = false;
        
        if (this.viewer.controls) {
            this.viewer.controls.onMouseUp(event);
        }
    }
    
    /**
     * 휠 이벤트
     * @param {WheelEvent} event - 휠 이벤트
     */
    onWheel(event) {
        if (this.viewer.controls) {
            this.viewer.controls.onWheel(event);
        }
    }
    
    /**
     * 키 다운 이벤트
     * @param {KeyboardEvent} event - 키보드 이벤트
     */
    onKeyDown(event) {
        if (this.viewer.controls && this.viewer.controls.onKeyDown) {
            this.viewer.controls.onKeyDown(event);
        }
    }
    
    /**
     * 키 업 이벤트
     * @param {KeyboardEvent} event - 키보드 이벤트
     */
    onKeyUp(event) {
        if (this.viewer.controls && this.viewer.controls.onKeyUp) {
            this.viewer.controls.onKeyUp(event);
        }
    }
    
    /**
     * 모든 이벤트 리스너 제거
     */
    removeAllEventListeners() {
        this.eventListeners.forEach((elementListeners, element) => {
            elementListeners.forEach((handler, event) => {
                element.removeEventListener(event, handler);
            });
        });
        this.eventListeners.clear();
    }
    
    /**
     * 3D 모델 클릭 처리
     * @param {MouseEvent} event - 마우스 이벤트
     */
    handleModelClick(event) {
        if (!this.viewer.camera || !this.viewer.scene) return;
        
        // 마우스 좌표를 정규화된 디바이스 좌표로 변환
        const rect = this.container.getBoundingClientRect();
        const mouse = new THREE.Vector2();
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        
        // 레이캐스터 생성
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, this.viewer.camera);
        
        // IFC 객체들과 교차점 계산 (모든 자식 객체 포함)
        const ifcObjects = this.viewer.scene.children.filter(child => 
            child.userData && child.userData.globalId
        );
        
        // 더 정확한 교차점 계산을 위해 recursive: true 사용
        const intersects = raycaster.intersectObjects(ifcObjects, true);
        
        // 투명한 객체도 선택할 수 있도록 정렬
        intersects.sort((a, b) => {
            // 투명한 객체는 우선순위를 낮춤
            const aTransparent = a.object.material && a.object.material.transparent;
            const bTransparent = b.object.material && b.object.material.transparent;
            
            if (aTransparent && !bTransparent) return 1;
            if (!aTransparent && bTransparent) return -1;
            return a.distance - b.distance;
        });
        
        if (intersects.length > 0) {
            // 창문이나 투명한 객체를 우선적으로 선택
            let selectedGlobalId = null;
            
            // 먼저 불투명한 객체 찾기
            for (const intersect of intersects) {
                const globalId = this.findGlobalId(intersect.object);
                if (globalId && (!intersect.object.material || !intersect.object.material.transparent)) {
                    selectedGlobalId = globalId;
                    break;
                }
            }
            
            // 불투명한 객체가 없으면 투명한 객체 선택
            if (!selectedGlobalId) {
                for (const intersect of intersects) {
                    const globalId = this.findGlobalId(intersect.object);
                    if (globalId) {
                        selectedGlobalId = globalId;
                        break;
                    }
                }
            }
            
            if (selectedGlobalId) {
                this.selectObjectByGuid(selectedGlobalId);
            }
        }
    }
    
    /**
     * 객체에서 GUID 찾기
     * @param {THREE.Object3D} object - Three.js 객체
     * @returns {string|null} GUID 또는 null
     */
    findGlobalId(object) {
        let current = object;
        while (current) {
            if (current.userData && current.userData.globalId) {
                return current.userData.globalId;
            }
            current = current.parent;
        }
        return null;
    }
    
    /**
     * GUID로 객체 선택
     * @param {string} globalId - 객체 GUID
     */
    selectObjectByGuid(globalId) {
        // 3D 모델에서 객체 하이라이트
        this.highlightObject(globalId);
        
        // 전역 앱 인스턴스에서 트리 매니저 호출
        if (window.webIFCViewerApp && window.webIFCViewerApp.treeManager) {
            window.webIFCViewerApp.treeManager.selectNodeByGuid(globalId);
        }
    }
    
    /**
     * 3D 모델에서 객체 하이라이트
     * @param {string} globalId - 객체 GUID
     */
    highlightObject(globalId) {
        if (!this.viewer.scene) return;
        
        // 이전 하이라이트 제거
        this.clearHighlight();
        
        // 해당 GUID의 모든 객체 찾기
        const targetObjects = this.findAllObjectsByGlobalId(globalId);
        
        if (targetObjects.length > 0) {
            // 모든 객체에 하이라이트 효과 적용
            targetObjects.forEach(targetObject => {
                this.highlightSingleObject(targetObject);
            });
        }
    }
    
    /**
     * 단일 객체 하이라이트
     * @param {THREE.Object3D} targetObject - 대상 객체
     */
    highlightSingleObject(targetObject) {
        // 하이라이트 효과 적용
        targetObject.userData.isHighlighted = true;
        
        // 원본 재질 저장
        if (!targetObject.userData.originalMaterial) {
            targetObject.userData.originalMaterial = targetObject.material.clone();
        }
        
        // 현재 윤곽선 상태 확인
        const isWireframeActive = this.viewer.modelRenderer ? this.viewer.modelRenderer.showWireframe : false;
        
        if (isWireframeActive) {
            // 윤곽선이 활성화된 상태: 색상만 변경
            const highlightMaterial = targetObject.material.clone();
            highlightMaterial.color = new THREE.Color(0x00ff88); // 초록색
            targetObject.material = highlightMaterial;
        } else {
            // 윤곽선이 비활성화된 상태: 색상만 변경
            const highlightMaterial = targetObject.material.clone();
            highlightMaterial.color = new THREE.Color(0x00ff88); // 초록색
            targetObject.material = highlightMaterial;
        }
    }
    
    
    /**
     * GUID로 3D 객체 찾기 (첫 번째만)
     * @param {string} globalId - 객체 GUID
     * @returns {THREE.Object3D|null} 찾은 객체 또는 null
     */
    findObjectByGlobalId(globalId) {
        const findInChildren = (object) => {
            if (object.userData && object.userData.globalId === globalId) {
                return object;
            }
            
            for (const child of object.children) {
                const found = findInChildren(child);
                if (found) return found;
            }
            
            return null;
        };
        
        return findInChildren(this.viewer.scene);
    }
    
    /**
     * GUID로 3D 객체 모두 찾기
     * @param {string} globalId - 객체 GUID
     * @returns {THREE.Object3D[]} 찾은 객체 배열
     */
    findAllObjectsByGlobalId(globalId) {
        const foundObjects = [];
        
        const findInChildren = (object) => {
            if (object.userData && object.userData.globalId === globalId) {
                foundObjects.push(object);
            }
            
            for (const child of object.children) {
                findInChildren(child);
            }
        };
        
        findInChildren(this.viewer.scene);
        return foundObjects;
    }
    
    /**
     * 모든 하이라이트 제거
     */
    clearHighlight() {
        if (!this.viewer.scene) return;
        
        const clearInChildren = (object) => {
            if (object.userData && object.userData.isHighlighted) {
                object.userData.isHighlighted = false;
                
                // 원본 재질 복원
                if (object.userData.originalMaterial) {
                    object.material = object.userData.originalMaterial;
                }
            }
            
            for (const child of object.children) {
                clearInChildren(child);
            }
        };
        
        clearInChildren(this.viewer.scene);
    }

    /**
     * 특정 요소의 이벤트 리스너 제거
     * @param {HTMLElement} element - 요소
     * @param {string} event - 이벤트 타입
     */
    removeEventListener(element, event) {
        if (this.eventListeners.has(element)) {
            const elementListeners = this.eventListeners.get(element);
            if (elementListeners.has(event)) {
                const handler = elementListeners.get(event);
                element.removeEventListener(event, handler);
                elementListeners.delete(event);
            }
        }
    }
}
