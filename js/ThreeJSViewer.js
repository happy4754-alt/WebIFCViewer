/**
 * Three.js 3D 뷰어 클래스
 * IFC 모델을 3D로 렌더링하는 기본 기능 제공
 */
import * as THREE from 'three';
import { SceneManager, CameraManager, EventManager } from './modules/core/index.js';
import { SimpleOrbitControls } from './modules/camera/index.js';
import { ModelRenderer } from './modules/modeling/index.js';

export class ThreeJSViewer {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.animationId = null;
        
        // 직교 카메라용 frustum 크기
        this.frustumSize = 20;
        
        // 매니저들 초기화
        this.sceneManager = null;
        this.cameraManager = null;
        this.eventManager = null;
        this.modelRenderer = null;
        
        this.init();
    }

    /**
     * Three.js 초기화
     */
    init() {
        if (!this.container) {
            return;
        }

        // 매니저들 초기화
        this.sceneManager = new SceneManager(this.container);
        this.cameraManager = new CameraManager(this.container);
        this.eventManager = new EventManager(this.container, this);
        
        // 씬 초기화
        this.sceneManager.init();
        this.scene = this.sceneManager.scene;
        this.renderer = this.sceneManager.renderer;
        
        // ModelRenderer 초기화 (scene이 설정된 후)
        this.modelRenderer = new ModelRenderer(this.scene);
        
        // 카메라 생성
        this.camera = this.cameraManager.createOrthographicCamera(this.frustumSize);
        this.sceneManager.setCamera(this.camera, this.frustumSize);
        
        // frustumSize 고정 설정 (리사이즈와 무관)
        this.frustumSize = this.cameraManager.getFrustumSize();
        
        // 초기 카메라 설정 (일관된 방식으로)
        this.updateCameraFrustum();
        
        // 타겟 초기화
        this.target = new THREE.Vector3(0, 0, 0);
        
        // 컨트롤 생성
        this.controls = new SimpleOrbitControls(this.camera, this.renderer.domElement, this);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.enableZoom = true;
        this.controls.enablePan = true;
        this.controls.enableRotate = true;
        this.controls.autoRotate = false;
        this.controls.autoRotateSpeed = 0.5;
        this.controls.minDistance = 1;
        this.controls.maxDistance = 1000;
        this.controls.maxPolarAngle = Infinity;
        this.controls.minPolarAngle = -Infinity;
        
        // 이벤트 리스너 설정
        this.eventManager.setupEventListeners();
        
        // 애니메이션 시작
        this.sceneManager.startAnimation(() => this.onRender());
        
    }

    /**
     * 렌더 콜백 함수
     */
    onRender() {
        // OrbitControls 업데이트
        if (this.controls) {
            this.controls.update();
        }
    }

    /**
     * 카메라 생성 (직교 투영)
     */
    createCamera() {
        // CameraManager에서 처리됨
    }

    /**
     * 렌더러 생성
     */
    createRenderer() {
        // SceneManager에서 처리됨
    }

    /**
     * 조명 생성 - 다크 테마 최적화
     */
    createLights() {
        // SceneManager에서 처리됨
    }

    /**
     * 이벤트 리스너 설정
     */
    setupEventListeners() {
        // EventManager에서 처리됨
    }


    /**
     * 카메라 frustum 업데이트 (3D 툴과 동일한 방식)
     */
    updateCameraFrustum() {
        if (!this.camera || !this.camera.isOrthographicCamera) return;
        
        // 컨테이너 크기 가져오기 (더 안전한 방법)
        const rect = this.container.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        
        // 안전성 검사
        if (width <= 0 || height <= 0 || !isFinite(width) || !isFinite(height)) {
            return;
        }
        
        const aspect = width / height;
        
        // 고정된 frustumSize 사용 (리사이즈 시 변경하지 않음)
        const safeFrustumSize = this.frustumSize || 20;
        
        // 3D 툴과 동일한 방식: 정사각형 기준으로 설정
        // 높이를 기준으로 하고, 너비는 aspect ratio에 따라 조정
        const halfHeight = safeFrustumSize * 0.5;
        const halfWidth = halfHeight * aspect;
        
        this.camera.left = -halfWidth;
        this.camera.right = halfWidth;
        this.camera.top = halfHeight;
        this.camera.bottom = -halfHeight;
        
        this.camera.updateProjectionMatrix();
    }

    /**
     * 윈도우 리사이즈 처리
     */
    onWindowResize() {
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;
        
        // 현재 줌 상태 저장
        const currentZoom = this.controls ? this.controls.getZoom() : 1;
        
        // 카메라 frustum 업데이트
        this.updateCameraFrustum();
        
        // 줌 상태 복원
        if (this.controls) {
            this.controls.setZoom(currentZoom);
        }
        
        // 렌더러 크기 업데이트
        this.renderer.setSize(width, height);
    }

    /**
     * 애니메이션 루프
     */
    animate() {
        // SceneManager에서 처리됨
    }


    /**
     * IFC Geometry 데이터를 Three.js로 렌더링
     * @param {Object} geometryData - 백엔드에서 받은 Geometry 데이터
     */
    addIfcGeometry(geometryData) {
        return this.modelRenderer.addIfcGeometry(geometryData);
    }

    /**
     * IFC 좌표계를 Three.js 좌표계로 변환 (Z-Up → Y-Up)
     * @param {Float32Array} vertices - 원본 정점 데이터
     * @returns {Float32Array} 변환된 정점 데이터
     */
    convertIFCToThreeJS(vertices) {
        return this.modelRenderer.convertIFCToThreeJS(vertices);
    }

    /**
     * IFC 타입에 따른 색상 생성
     * @param {string} ifcType - IFC 타입 (예: IfcWall, IfcWindow, IfcDoor 등)
     * @returns {THREE.Color} 타입별 색상
     */
    getColorByIfcType(ifcType) {
        return this.modelRenderer.getColorByIfcType(ifcType);
    }

    /**
     * IFC 객체들을 모두 제거
     */
    clearIfcObjects() {
        return this.modelRenderer.clearIfcObjects();
    }

    /**
     * 모델의 센터점 계산
     * @returns {THREE.Vector3} 모델 센터점
     */
    getModelCenter() {
        return this.modelRenderer.getModelCenter();
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
        
        
        if (this.axesHelper) {
            this.scene.remove(this.axesHelper);
            this.axesHelper = null;
        }
        
    }
    
    /**
     * 좌표축 표시
     */
    showAxes() {
        // 기존 좌표축 제거
        if (this.axesHelper) {
            this.scene.remove(this.axesHelper);
        }
        
        // 좌표축 그룹 생성
        this.axesHelper = new THREE.Group();
        
        // X축 (빨간색) - 오른쪽 방향
        const xGeometry = new THREE.CylinderGeometry(0.05, 0.05, 5, 8);
        const xMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        const xAxis = new THREE.Mesh(xGeometry, xMaterial);
        xAxis.rotation.z = -Math.PI / 2; // X축 방향으로 회전
        xAxis.position.x = 2.5;
        this.axesHelper.add(xAxis);
        
        // X축 화살표
        const xArrowGeometry = new THREE.ConeGeometry(0.2, 0.5, 8);
        const xArrow = new THREE.Mesh(xArrowGeometry, xMaterial);
        xArrow.rotation.z = -Math.PI / 2;
        xArrow.position.x = 5;
        this.axesHelper.add(xArrow);
        
        // Y축 (초록색) - 위쪽 방향 (Three.js 기본)
        const yGeometry = new THREE.CylinderGeometry(0.05, 0.05, 5, 8);
        const yMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
        const yAxis = new THREE.Mesh(yGeometry, yMaterial);
        yAxis.position.y = 2.5;
        this.axesHelper.add(yAxis);
        
        // Y축 화살표
        const yArrowGeometry = new THREE.ConeGeometry(0.2, 0.5, 8);
        const yArrow = new THREE.Mesh(yArrowGeometry, yMaterial);
        yArrow.position.y = 5;
        this.axesHelper.add(yArrow);
        
        // Z축 (파란색) - 앞쪽 방향 (Three.js 기본)
        const zGeometry = new THREE.CylinderGeometry(0.05, 0.05, 5, 8);
        const zMaterial = new THREE.MeshBasicMaterial({ color: 0x0000ff });
        const zAxis = new THREE.Mesh(zGeometry, zMaterial);
        zAxis.rotation.x = Math.PI / 2; // Z축 방향으로 회전
        zAxis.position.z = 2.5;
        this.axesHelper.add(zAxis);
        
        // Z축 화살표
        const zArrowGeometry = new THREE.ConeGeometry(0.2, 0.5, 8);
        const zArrow = new THREE.Mesh(zArrowGeometry, zMaterial);
        zArrow.rotation.x = Math.PI / 2;
        zArrow.position.z = 5;
        this.axesHelper.add(zArrow);
        
        this.scene.add(this.axesHelper);
        
    }

    /**
     * 랜덤 색상 생성 (기존 방식 유지)
     * @returns {THREE.Color} 랜덤 색상
     */
    generateRandomColor() {
        // 애니메이션 스타일 밝고 선명한 색상 팔레트
        const colors = [
            0xff6b6b, // 밝은 빨강
            0x4ecdc4, // 터콰이즈
            0x45b7d1, // 스카이 블루
            0x96ceb4, // 민트 그린
            0xfeca57, // 골든 옐로우
            0xff9ff3, // 핑크
            0x54a0ff, // 블루
            0x5f27cd, // 퍼플
            0x00d2d3, // 시안
            0xff9f43, // 오렌지
            0x10ac84, // 에메랄드
            0xee5a24  // 코랄
        ];
        
        const randomIndex = Math.floor(Math.random() * colors.length);
        return new THREE.Color(colors[randomIndex]);
    }


    /**
     * 여러 IFC Geometry 데이터를 한번에 렌더링
     * @param {Array} geometries - Geometry 데이터 배열
     */
    addIfcGeometries(geometries) {
        this.modelRenderer.addIfcGeometries(geometries);
        
        // 카메라를 전체 모델에 맞게 조정
        this.fitCameraToModel();
    }

    /**
     * 카메라를 전체 모델에 맞게 조정
     */
    fitCameraToModel() {
        const box = new THREE.Box3();
        this.scene.traverse((object) => {
            if (object.isMesh) {
                box.expandByObject(object);
            }
        });

        if (box.isEmpty()) {
            return;
        }

        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        
        // IFC 데이터는 mm 단위이므로 적절한 스케일 적용
        const scale = maxDim > 1000 ? 0.001 : 1;
        const scaledMaxDim = maxDim * scale;
        const scaledCenter = center.clone().multiplyScalar(scale);
        
        // CameraManager에 위임
        this.cameraManager.fitToModel(scaledCenter, box, this.target);
        
        // frustumSize 고정 설정 (모델에 맞게 한 번만 설정)
        this.frustumSize = this.cameraManager.getFrustumSize();
        
        // 카메라 frustum 업데이트 (일관된 방식으로)
        this.updateCameraFrustum();
        
        // OrbitControls 타겟 설정 (모델 센터로)
        if (this.controls) {
            this.controls.target.copy(scaledCenter);
            this.controls.update();
        }
        
        // IFC 로드 후 자동으로 원점 표시
        this.showOrigin();
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
        
        // 6개 면 생성 (각 면마다 다른 색상)
        const colors = [
            0xff0000, // X+ (빨강)
            0x00ff00, // X- (초록)
            0x0000ff, // Y+ (파랑)
            0xffff00, // Y- (노랑)
            0xff00ff, // Z+ (마젠타)
            0x00ffff  // Z- (시안)
        ];
        
        const directions = [
            { axis: 'x', sign: 1, normal: [1, 0, 0] },
            { axis: 'x', sign: -1, normal: [-1, 0, 0] },
            { axis: 'y', sign: 1, normal: [0, 1, 0] },
            { axis: 'y', sign: -1, normal: [0, -1, 0] },
            { axis: 'z', sign: 1, normal: [0, 0, 1] },
            { axis: 'z', sign: -1, normal: [0, 0, -1] }
        ];
        
        directions.forEach((dir, index) => {
            const geometry = new THREE.PlaneGeometry(
                dir.axis === 'x' ? size.y : size.x,
                dir.axis === 'z' ? size.y : size.z
            );
            
            const material = new THREE.MeshBasicMaterial({
                color: colors[index],
                transparent: true,
                opacity: 0.3,
                side: THREE.DoubleSide
            });
            
            const plane = new THREE.Mesh(geometry, material);
            
            // 위치 설정
            const offset = size.clone().multiplyScalar(0.5);
            if (dir.axis === 'x') {
                plane.position.set(dir.sign * offset.x, 0, 0);
                plane.rotation.y = dir.sign * Math.PI / 2;
            } else if (dir.axis === 'y') {
                plane.position.set(0, dir.sign * offset.y, 0);
                plane.rotation.x = -dir.sign * Math.PI / 2;
            } else if (dir.axis === 'z') {
                plane.position.set(0, 0, dir.sign * offset.z);
            }
            
            this.sectionBox.add(plane);
        });
        
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
     * 섹션박스 위치 업데이트
     * @param {THREE.Vector3} position - 새로운 위치
     */
    updateSectionBoxPosition(position) {
        if (this.sectionBox) {
            this.sectionBox.position.copy(position);
        }
    }
    
    /**
     * 섹션박스 크기 업데이트
     * @param {THREE.Vector3} size - 새로운 크기
     */
    updateSectionBoxSize(size) {
        if (this.sectionBox) {
            // 기존 섹션박스 제거 후 새로 생성
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
se((object) => {
            if (object.isMesh && object.userData.globalId) {
                objectsToRemove.push(object);
            }
        });
        
        objectsToRemove.forEach(object => {
            this.scene.remove(object);
            if (object.geometry) object.geometry.dispose();
            if (object.material) object.material.dispose();
        });
        
    }



    /**
     * 윤곽선 표시/숨김 토글
     * @param {boolean} show - 윤곽선 표시 여부
     */
    toggleWireframe(show) {
        if (this.modelRenderer) {
            this.modelRenderer.toggleWireframe(show);
        }
    }
    
    /**
     * 윤곽선 색상 변경
     * @param {string|number} color - 색상 (hex string 또는 number)
     */
    setWireframeColor(color) {
        if (this.modelRenderer) {
            this.modelRenderer.setWireframeColor(color);
        }
    }
    
    /**
     * 윤곽선 두께 변경
     * @param {number} width - 선 두께
     */
    setWireframeWidth(width) {
        if (this.modelRenderer) {
            this.modelRenderer.setWireframeWidth(width);
        }
    }

    /**
     * 정리
     */
    dispose() {
        // 매니저들 정리
        if (this.sceneManager) {
            this.sceneManager.dispose();
        }
        
        if (this.eventManager) {
            this.eventManager.removeAllEventListeners();
        }
    }
}
