/**
 * 간단한 OrbitControls 구현
 */
import * as THREE from 'three';

export class SimpleOrbitControls {
    constructor(camera, domElement, viewer) {
        this.camera = camera;
        this.domElement = domElement;
        this.viewer = viewer; // ThreeJSViewer 참조 추가
        this.target = new THREE.Vector3();
        
        // 마우스 상태
        this.mouseButtons = {
            LEFT: 0,
            MIDDLE: 1,
            RIGHT: 2
        };
        
        this.state = {
            leftButton: false,
            rightButton: false,
            middleButton: false,
            panMode: false,
            mouseX: 0,
            mouseY: 0,
            mouseXPrev: 0,
            mouseYPrev: 0
        };
        
        // 설정
        this.enableDamping = true;
        this.dampingFactor = 0.05;
        this.enableZoom = true;
        this.enablePan = true;
        this.enableRotate = true;
        this.autoRotate = false;
        this.autoRotateSpeed = 0.5;
        this.minDistance = 1;
        this.maxDistance = 1000;
        this.maxPolarAngle = Infinity;  // 위아래 무한 회전
        this.minPolarAngle = -Infinity; // 위아래 무한 회전
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        this.domElement.addEventListener('mousedown', this.onMouseDown.bind(this));
        this.domElement.addEventListener('mousemove', this.onMouseMove.bind(this));
        this.domElement.addEventListener('mouseup', this.onMouseUp.bind(this));
        this.domElement.addEventListener('wheel', this.onWheel.bind(this));
        this.domElement.addEventListener('contextmenu', (e) => e.preventDefault());
        
        // 키보드 이벤트 리스너 추가 (Shift 키 감지용)
        document.addEventListener('keyup', this.onKeyUp.bind(this));
    }
    
    onMouseDown(event) {
        event.preventDefault();
        
        switch (event.button) {
            case this.mouseButtons.LEFT:
                this.state.leftButton = true;
                break;
            case this.mouseButtons.RIGHT:
                this.state.rightButton = true;
                break;
            case this.mouseButtons.MIDDLE:
                this.state.middleButton = true;
                break;
        }
        
        // 우클릭으로 팬 모드 (간단한 방법)
        if (event.button === 2) {
            this.state.panMode = true;
        }
        
        this.state.mouseX = event.clientX;
        this.state.mouseY = event.clientY;
        this.state.mouseXPrev = event.clientX;
        this.state.mouseYPrev = event.clientY;
    }
    
    onMouseMove(event) {
        if (!this.state.leftButton && !this.state.rightButton && !this.state.middleButton) return;
        
        event.preventDefault();
        
        this.state.mouseX = event.clientX;
        this.state.mouseY = event.clientY;
        
        const deltaX = this.state.mouseX - this.state.mouseXPrev;
        const deltaY = this.state.mouseY - this.state.mouseYPrev;
        
        // 좌클릭으로 회전 (범위 제한 있지만 범위로 돌아올 수 있도록 허용)
        if (this.state.leftButton && this.enableRotate) {
            // 현재 카메라의 phi 각도 확인
            const modelCenter = this.viewer.getModelCenter();
            const spherical = new THREE.Spherical();
            spherical.setFromVector3(this.camera.position.clone().sub(modelCenter));
            
            const minPhi = 0.01; // 약 0.6도
            const maxPhi = Math.PI - 0.01; // 약 179.4도
            
            // 범위 밖에 있더라도 범위로 돌아올 수 있는 방향으로는 회전 허용
            let allowRotation = true;
            
            if (spherical.phi <= minPhi) {
                // 최소값에 도달한 경우: 위로 회전만 허용 (deltaY < 0)
                allowRotation = deltaY < 0;
                if (!allowRotation) {
                    // 회전 제한됨
                }
            } else if (spherical.phi >= maxPhi) {
                // 최대값에 도달한 경우: 아래로 회전만 허용 (deltaY > 0)
                allowRotation = deltaY > 0;
                if (!allowRotation) {
                    // 회전 제한됨
                }
            }
            
            if (allowRotation) {
                this.rotate(deltaX, deltaY);
            }
        }
        
        // 우클릭으로 팬 (화면 이동)
        if (this.state.rightButton && this.enablePan) {
            this.pan(deltaX, deltaY);
        }
        
        this.state.mouseXPrev = this.state.mouseX;
        this.state.mouseYPrev = this.state.mouseY;
    }
    
    onMouseUp(event) {
        this.state.leftButton = false;
        this.state.rightButton = false;
        this.state.middleButton = false;
        this.state.panMode = false;
    }
    
    onKeyUp(event) {
        // Shift 키를 놓으면 panMode 상태 초기화
        if (event.key === 'Shift') {
            this.state.panMode = false;
        }
    }
    
    onWheel(event) {
        if (!this.enableZoom) return;
        
        event.preventDefault();
        
        if (this.camera.isOrthographicCamera) {
            this.zoomOrthographic(event.deltaY);
        } else {
            this.zoomPerspective(event.deltaY);
        }
    }
    
    zoomOrthographic(delta) {
        const zoomSpeed = 0.05;
        const minFrustumSize = 0.1;
        const maxFrustumSize = 1000;
        
        const zoomFactor = delta < 0 ? (1 - zoomSpeed) : (1 + zoomSpeed);
        const newTop = this.camera.top * zoomFactor;
        
        if (newTop > minFrustumSize && newTop < maxFrustumSize) {
            this.camera.top = newTop;
            this.camera.bottom *= zoomFactor;
            this.camera.left *= zoomFactor;
            this.camera.right *= zoomFactor;
            this.camera.updateProjectionMatrix();
        }
    }
    
    zoomPerspective(delta) {
        const distance = this.camera.position.distanceTo(this.target);
        const newDistance = Math.max(this.minDistance, Math.min(this.maxDistance, distance - delta * 0.01));
        
        const direction = this.camera.position.clone().sub(this.target).normalize();
        this.camera.position.copy(this.target).add(direction.multiplyScalar(newDistance));
    }
    
    rotate(deltaX, deltaY) {
        const modelCenter = this.viewer.getModelCenter();
        
        // 구면 좌표계 사용 (카메라 중심 회전)
        const spherical = new THREE.Spherical();
        spherical.setFromVector3(this.camera.position.clone().sub(modelCenter));
        
        // 회전 적용 (상하 반대 수정)
        spherical.theta -= deltaX * 0.01; // 좌우 회전
        spherical.phi -= deltaY * 0.01;   // 위아래 회전 (부호 변경)
        
        // 위아래 회전 범위 제한: 0° < phi < 180° (0 < phi < π)
        const minPhi = 0.01; // 약 0.6도
        const maxPhi = Math.PI - 0.01; // 약 179.4도
        
        // 범위 제한 적용 (부드럽게 제한)
        if (spherical.phi < minPhi) {
            spherical.phi = minPhi; // 최소값 고정
        } else if (spherical.phi > maxPhi) {
            spherical.phi = maxPhi; // 최대값 고정
        }
        
        // 새로운 카메라 위치 계산
        const newPosition = new THREE.Vector3();
        newPosition.setFromSpherical(spherical).add(modelCenter);
        this.camera.position.copy(newPosition);
        
        // 카메라는 모델 센터를 바라봄
        this.camera.lookAt(modelCenter);
        
        // 타겟도 모델 센터로 설정
        this.target.copy(modelCenter);
    }
    
    
    pan(deltaX, deltaY) {
        const panVector = this.calculatePanVector(deltaX, deltaY);
        
        this.camera.position.add(panVector);
        this.target.add(panVector);
    }
    
    calculatePanVector(deltaX, deltaY) {
        const right = new THREE.Vector3();
        this.camera.getWorldDirection(right);
        right.cross(this.camera.up).normalize();
        
        const panVector = new THREE.Vector3();
        
        if (this.camera.isOrthographicCamera) {
            const frustumHeight = this.camera.top - this.camera.bottom;
            const frustumWidth = this.camera.right - this.camera.left;
            
            const moveX = (-deltaX / this.domElement.clientWidth) * frustumWidth;
            const moveY = (deltaY / this.domElement.clientHeight) * frustumHeight;
            
            panVector.addScaledVector(right, moveX);
            panVector.addScaledVector(this.camera.up, moveY);
        } else {
            const distance = this.camera.position.distanceTo(this.target);
            const panSpeed = distance * 0.001;
            
            panVector.addScaledVector(right, -deltaX * panSpeed);
            panVector.addScaledVector(this.camera.up, deltaY * panSpeed);
        }
        
        return panVector;
    }
    
    update() {
        if (this.autoRotate) {
            const spherical = new THREE.Spherical();
            spherical.setFromVector3(this.camera.position.clone().sub(this.target));
            spherical.theta += this.autoRotateSpeed * 0.01;
            this.camera.position.setFromSpherical(spherical).add(this.target);
            this.camera.lookAt(this.target);
        }
    }
    
    set(target) {
        this.target.copy(target);
    }
    
    /**
     * 현재 줌 레벨 가져오기
     */
    getZoom() {
        if (this.camera.isOrthographicCamera) {
            return this.camera.top;
        } else {
            return this.camera.position.distanceTo(this.target);
        }
    }
    
    /**
     * 줌 레벨 설정
     */
    setZoom(zoom) {
        if (this.camera.isOrthographicCamera) {
            const aspect = this.camera.right / this.camera.top;
            this.camera.top = zoom;
            this.camera.bottom = -zoom;
            this.camera.left = -zoom * aspect;
            this.camera.right = zoom * aspect;
            this.camera.updateProjectionMatrix();
        } else {
            const direction = this.camera.position.clone().sub(this.target).normalize();
            this.camera.position.copy(this.target).add(direction.multiplyScalar(zoom));
        }
    }
}
