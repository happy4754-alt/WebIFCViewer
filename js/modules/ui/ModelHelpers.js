/**
 * 3D 모델 헬퍼 객체 관리 모듈
 * 원점, 축, 섹션박스 등 3D 헬퍼 객체들을 관리
 */
import * as THREE from 'three';

export class ModelHelpers {
    constructor(scene) {
        this.scene = scene;
        this.originMarker = null;
        this.axesHelper = null;
        this.sectionBox = null;
    }
    
    /**
     * 원점 (0, 0, 0) 위치 표시
     */
    showOrigin() {
        // 기존 원점 표시 제거
        this.clearOrigin();
        
        // 원점에 빨간색 구체 추가
        const geometry = new THREE.SphereGeometry(0.5, 16, 16);
        const material = new THREE.MeshBasicMaterial({ 
            color: 0xff0000, // 빨간색
            transparent: true,
            opacity: 0.8
        });
        
        this.originMarker = new THREE.Mesh(geometry, material);
        this.originMarker.position.set(0, 0, 0);
        this.originMarker.userData = { type: 'origin' };
        
        this.scene.add(this.originMarker);
        
        // 원점에 좌표축 표시
        this.showAxes();
    }
    
    /**
     * 원점 표시 제거
     */
    clearOrigin() {
        if (this.originMarker) {
            this.scene.remove(this.originMarker);
            this.originMarker = null;
        }
        
        // 좌표축도 함께 제거
        this.clearAxes();
    }
    
    /**
     * 좌표축 표시
     */
    showAxes() {
        // 기존 좌표축 제거
        if (this.axesHelper) {
            this.scene.remove(this.axesHelper);
        }
        
        // 좌표축 헬퍼 생성 (크기: 2)
        this.axesHelper = new THREE.AxesHelper(2);
        this.axesHelper.userData = { type: 'axes' };
        
        this.scene.add(this.axesHelper);
    }
    
    /**
     * 좌표축 제거
     */
    clearAxes() {
        if (this.axesHelper) {
            this.scene.remove(this.axesHelper);
            this.axesHelper = null;
        }
    }
    
    /**
     * 섹션박스 생성
     * @param {Object} options - 섹션박스 옵션
     * @param {THREE.Vector3} options.position - 섹션박스 위치
     * @param {THREE.Vector3} options.size - 섹션박스 크기
     * @param {THREE.Vector3} options.rotation - 섹션박스 회전
     */
    createSectionBox(options = {}) {
        // 기본값 설정
        const position = options.position ? 
            (options.position instanceof THREE.Vector3 ? options.position : new THREE.Vector3(options.position.x, options.position.y, options.position.z)) :
            new THREE.Vector3(0, 0, 0);
        const size = options.size ? 
            (options.size instanceof THREE.Vector3 ? options.size : new THREE.Vector3(options.size.x, options.size.y, options.size.z)) :
            new THREE.Vector3(10, 10, 10);
        const rotation = options.rotation ? 
            (options.rotation instanceof THREE.Vector3 ? options.rotation : new THREE.Vector3(options.rotation.x, options.rotation.y, options.rotation.z)) :
            new THREE.Vector3(0, 0, 0);
        
        // 기존 섹션박스 제거
        this.clearSectionBox();
        
        // 섹션박스 그룹 생성
        this.sectionBox = new THREE.Group();
        this.sectionBox.userData = { type: 'sectionBox' };
        
        // 와이어프레임 박스 생성
        const boxGeometry = new THREE.BoxGeometry(size.x, size.y, size.z);
        const boxMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x00ff00, // 초록색
            wireframe: true,
            transparent: true,
            opacity: 0.8
        });
        
        const boxMesh = new THREE.Mesh(boxGeometry, boxMaterial);
        this.sectionBox.add(boxMesh);
        
        // 섹션박스 위치 및 회전 설정
        this.sectionBox.position.copy(position);
        this.sectionBox.rotation.set(rotation.x, rotation.y, rotation.z);
        
        this.scene.add(this.sectionBox);
        
    }
    
    /**
     * 섹션박스 제거
     */
    clearSectionBox() {
        if (this.sectionBox) {
            this.scene.remove(this.sectionBox);
            this.sectionBox = null;
        }
    }
    
    /**
     * 섹션박스 크기 조정
     * @param {THREE.Vector3} size - 새로운 크기
     */
    resizeSectionBox(size) {
        if (this.sectionBox) {
            const currentPosition = this.sectionBox.position.clone();
            const currentRotation = this.sectionBox.rotation.clone();
            this.clearSectionBox();
            
            const sizeVector = size instanceof THREE.Vector3 ? size : new THREE.Vector3(size.x, size.y, size.z);
            const rotationVector = new THREE.Vector3(currentRotation.x, currentRotation.y, currentRotation.z);
            
            this.createSectionBox({ 
                position: currentPosition, 
                size: sizeVector, 
                rotation: rotationVector 
            });
        }
    }
    
    /**
     * 모든 헬퍼 객체 제거
     */
    clearAll() {
        this.clearOrigin();
        this.clearSectionBox();
    }
}
