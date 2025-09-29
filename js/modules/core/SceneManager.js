/**
 * 씬 관리 모듈
 * 씬, 렌더러, 조명, 애니메이션 루프를 관리
 */
import * as THREE from 'three';

export class SceneManager {
    constructor(container) {
        this.container = container;
        this.scene = null;
        this.renderer = null;
        this.animationId = null;
        this.onRender = null; // 렌더 콜백 함수
    }
    
    /**
     * 씬 초기화
     */
    init() {
        this.createScene();
        this.createRenderer();
        this.createLights();
    }
    
    /**
     * 3D 씬 생성
     */
    createScene() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x1a1a1a); // 블랙모드 배경
    }
    
    /**
     * 렌더러 생성
     */
    createRenderer() {
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true,
            alpha: false  // 애니메이션 스타일을 위해 투명도 비활성화
        });
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.renderer.shadowMap.enabled = false; // 그림자 비활성화
        this.renderer.setClearColor(0x1a1a1a, 1.0); // 블랙모드 배경
        this.renderer.toneMapping = THREE.NoToneMapping; // 톤 매핑 비활성화
        this.renderer.outputEncoding = THREE.sRGBEncoding; // 애니메이션 스타일 색상
        this.container.appendChild(this.renderer.domElement);
    }
    
    /**
     * 조명 생성 - 다크 테마 최적화
     */
    createLights() {
        // 애니메이션 스타일 - 조명 없음 (완전한 플랫 색상)
        // 조명을 추가하지 않음
    }
    
    /**
     * 애니메이션 루프 시작
     * @param {Function} onRender - 렌더 콜백 함수
     */
    startAnimation(onRender) {
        this.onRender = onRender;
        this.animate();
    }
    
    /**
     * 애니메이션 루프
     */
    animate() {
        this.animationId = requestAnimationFrame(() => this.animate());
        
        // 렌더 콜백 실행
        if (this.onRender) {
            this.onRender();
        }
        
        // 렌더링
        this.render();
    }
    
    /**
     * 렌더링 실행
     */
    render() {
        if (this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
        }
    }
    
    /**
     * 윈도우 리사이즈 처리
     */
    onWindowResize() {
        if (!this.renderer || !this.camera) return;
        
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;
        
        // 렌더러 크기 업데이트
        this.renderer.setSize(width, height);
        
        // 카메라 업데이트는 ThreeJSViewer에서 처리
        // 여기서는 렌더러 크기만 설정
    }
    
    /**
     * 카메라 설정
     * @param {THREE.Camera} camera - 카메라 객체
     * @param {number} frustumSize - 직교 카메라용 frustum 크기
     */
    setCamera(camera, frustumSize = 20) {
        this.camera = camera;
        this.frustumSize = frustumSize;
        
        // 카메라 설정은 ThreeJSViewer에서 처리
        // 여기서는 참조만 저장
    }
    
    /**
     * 애니메이션 중지
     */
    stopAnimation() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }
    
    /**
     * 리소스 정리
     */
    dispose() {
        this.stopAnimation();
        
        if (this.renderer) {
            this.renderer.dispose();
            this.renderer = null;
        }
        
        if (this.scene) {
            this.scene.clear();
            this.scene = null;
        }
    }
}
