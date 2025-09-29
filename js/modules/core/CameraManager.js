/**
 * 카메라 관리 모듈
 * 카메라 생성, 설정, 리셋을 관리
 */
import * as THREE from 'three';

export class CameraManager {
    constructor(container) {
        this.container = container;
        this.camera = null;
        this.frustumSize = 20;
    }
    
    /**
     * 직교 카메라 생성
     * @param {number} frustumSize - frustum 크기
     * @returns {THREE.OrthographicCamera} 생성된 카메라
     */
    createOrthographicCamera(frustumSize = 20) {
        // 컨테이너 크기 가져오기 (더 안전한 방법)
        const rect = this.container.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        
        // 안전성 검사
        if (width <= 0 || height <= 0 || !isFinite(width) || !isFinite(height)) {
            // 기본값 사용 (3D 툴과 동일한 방식)
            const defaultAspect = 16 / 9; // 기본 aspect ratio
            const halfHeight = frustumSize * 0.5;
            const halfWidth = halfHeight * defaultAspect;
            
            this.camera = new THREE.OrthographicCamera(
                -halfWidth, halfWidth,
                halfHeight, -halfHeight,
                0.1, 1000
            );
        } else {
            const aspect = width / height;
            this.frustumSize = frustumSize;
            
            // 3D 툴과 동일한 방식: 정사각형 기준으로 설정
            const halfHeight = frustumSize * 0.5;
            const halfWidth = halfHeight * aspect;
            
            this.camera = new THREE.OrthographicCamera(
                -halfWidth, halfWidth,
                halfHeight, -halfHeight,
                0.1, 1000
            );
            
        }
        
        // 초기 카메라 위치 설정
        this.camera.position.set(10, 10, 10);
        this.camera.lookAt(0, 0, 0);
        
        return this.camera;
    }
    
    /**
     * 원근 카메라 생성
     * @param {number} fov - 시야각
     * @param {number} near - 근거리 클리핑
     * @param {number} far - 원거리 클리핑
     * @returns {THREE.PerspectiveCamera} 생성된 카메라
     */
    createPerspectiveCamera(fov = 75, near = 0.1, far = 1000) {
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;
        const aspect = width / height;
        
        this.camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
        
        // 초기 카메라 위치 설정
        this.camera.position.set(10, 10, 10);
        this.camera.lookAt(0, 0, 0);
        
        return this.camera;
    }
    
    /**
     * 카메라를 모델에 맞게 조정
     * @param {THREE.Vector3} modelCenter - 모델 중심점
     * @param {THREE.Box3} modelBounds - 모델 경계
     * @param {THREE.Vector3} target - 카메라 타겟
     */
    fitToModel(modelCenter, modelBounds, target) {
        if (!this.camera || !modelBounds) return;
        
        const size = modelBounds.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        
        if (this.camera.isOrthographicCamera) {
            // 직교 카메라의 경우
            const scaledMaxDim = maxDim;
            const scaledCenter = modelCenter;
            
            const cameraDistance = scaledMaxDim * 3; // 충분한 거리
            this.camera.position.set(cameraDistance, cameraDistance, cameraDistance);
            this.camera.lookAt(scaledCenter.x, scaledCenter.y, scaledCenter.z);
            
            // 타겟 설정
            target.copy(scaledCenter);
            
            // 컨테이너 크기 가져오기 (더 안전한 방법)
            const rect = this.container.getBoundingClientRect();
            const width = rect.width;
            const height = rect.height;
            
            let aspect;
            if (width <= 0 || height <= 0 || !isFinite(width) || !isFinite(height)) {
                aspect = 16 / 9; // 기본 aspect ratio
            } else {
                aspect = width / height;
            }
            
            // 모델에 맞는 frustumSize 설정 (한 번만 설정)
            this.frustumSize = Math.max(scaledMaxDim * 1.5, 5);
            
            // 3D 툴과 동일한 방식: 정사각형 기준으로 설정
            const halfHeight = this.frustumSize * 0.5;
            const halfWidth = halfHeight * aspect;
            
            this.camera.left = -halfWidth;
            this.camera.right = halfWidth;
            this.camera.top = halfHeight;
            this.camera.bottom = -halfHeight;
            this.camera.updateProjectionMatrix();
            
            
        } else {
            // 원근 카메라의 경우
            const distance = maxDim * 2;
            const direction = this.camera.position.clone().sub(modelCenter).normalize();
            this.camera.position.copy(modelCenter).add(direction.multiplyScalar(distance));
            this.camera.lookAt(modelCenter);
            
            target.copy(modelCenter);
        }
    }
    
    /**
     * 카메라 위치 설정
     * @param {THREE.Vector3} position - 카메라 위치
     * @param {THREE.Vector3} target - 카메라가 바라볼 지점
     */
    setPosition(position, target) {
        if (!this.camera) return;
        
        this.camera.position.copy(position);
        this.camera.lookAt(target);
    }
    
    /**
     * 카메라 리셋
     * @param {THREE.Vector3} target - 카메라가 바라볼 지점
     */
    reset(target = new THREE.Vector3(0, 0, 0)) {
        if (!this.camera) return;
        
        this.camera.position.set(10, 10, 10);
        this.camera.lookAt(target);
        
        // 카메라 frustum 업데이트는 ThreeJSViewer에서 처리
        // 여기서는 위치와 타겟만 설정
    }
    
    /**
     * 카메라 줌 설정 (직교 카메라용)
     * @param {number} zoomLevel - 줌 레벨
     */
    setZoom(zoomLevel) {
        if (!this.camera || !this.camera.isOrthographicCamera) return;
        
        // 줌 레벨에 따라 frustumSize 조정 (기본값 대비 비율)
        const baseFrustumSize = 20; // 기본 frustumSize
        this.frustumSize = baseFrustumSize / zoomLevel;
        
        // 카메라 업데이트는 ThreeJSViewer의 onWindowResize에서 처리
    }
    
    /**
     * 현재 카메라 반환
     * @returns {THREE.Camera} 현재 카메라
     */
    getCamera() {
        return this.camera;
    }
    
    /**
     * 현재 frustum 크기 반환
     * @returns {number} frustum 크기
     */
    getFrustumSize() {
        // 고정된 frustumSize 반환 (카메라 업데이트와 무관)
        return this.frustumSize;
    }
}
