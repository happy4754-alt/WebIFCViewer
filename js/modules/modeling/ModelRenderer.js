/**
 * 모델 렌더링 모듈
 * IFC 모델을 3D로 렌더링하는 기능
 */
import * as THREE from 'three';

export class ModelRenderer {
    constructor(scene) {
        this.scene = scene;
        this.ifcObjects = [];
        this.wireframeObjects = []; // 윤곽선 객체들
        this.modelCenter = new THREE.Vector3(0, 0, 0);
        this.showWireframe = false; // 윤곽선 표시 여부
    }
    
    /**
     * IFC Geometry 데이터를 Three.js로 렌더링
     * @param {Object} geometryData - 백엔드에서 받은 Geometry 데이터
     */
    addIfcGeometry(geometryData) {
        try {
            if (!this.scene) {
                return null;
            }
            
            // 정점 및 면 데이터 추출
            const vertices = new Float32Array(geometryData.vertices);
            const indices = new Uint32Array(geometryData.faces);
            

            // IFC 좌표계를 Three.js 좌표계로 변환 (Z-Up → Y-Up)
            const convertedVertices = this.convertIFCToThreeJS(vertices);

            // BufferGeometry 생성
            const geometry = new THREE.BufferGeometry();
            geometry.setAttribute('position', new THREE.BufferAttribute(convertedVertices, 3));
            geometry.setIndex(new THREE.BufferAttribute(indices, 1));
            geometry.computeVertexNormals();

            // 백엔드에서 받은 색상 정보 사용 (단일 값)
            let material;
            
            if (geometryData.colorHEX) {
                // 백엔드에서 받은 색상 정보가 있는 경우
                const color = new THREE.Color(`#${geometryData.colorHEX}`);
                
                material = new THREE.MeshBasicMaterial({
                    color: color
                });
                
                // 투명도 정보가 있는 경우 적용
                if (geometryData.transparency !== undefined) {
                    const opacity = 1 - geometryData.transparency;
                    if (opacity < 1) {
                        material.transparent = true;
                        material.opacity = opacity;
                    }
                }
                
            } else {
                // 백엔드에서 색상 정보가 없는 경우 기본 색상 사용
                const color = this.getColorByIfcType(geometryData.ifcType);
                material = new THREE.MeshBasicMaterial({
                    color: color
                });
                
                // 창문은 반투명으로 설정 (기본값)
                if (geometryData.ifcType.includes('Window')) {
                    material.color = new THREE.Color(0x54a000);
                    material.transparent = true;
                    material.opacity = 0.7;
                }
            }

            // 메시 생성
            const mesh = new THREE.Mesh(geometry, material);
            mesh.userData = {
                globalId: geometryData.globalId,
                ifcType: geometryData.ifcType
            };

            // IFC 데이터는 mm 단위이므로 m로 변환
            mesh.scale.setScalar(0.001);
            this.scene.add(mesh);
            
            // IFC 객체 목록에 추가
            this.ifcObjects.push(mesh);
            
            // 윤곽선 생성 (옵션)
            if (this.showWireframe) {
                this.createWireframe(mesh);
            }
            
            return mesh;
        } catch (error) {
            return null;
        }
    }
    
    /**
     * IFC 좌표를 Three.js 좌표로 변환
     * @param {Float32Array} vertices - IFC 정점 데이터
     * @returns {Float32Array} 변환된 정점 데이터
     */
    convertIFCToThreeJS(vertices) {
        const converted = new Float32Array(vertices.length);
        
        for (let i = 0; i < vertices.length; i += 3) {
            // IFC2X3: X(동), Y(북), Z(위) → Three.js: X(동), Y(위), Z(남)
            // 단순 변환: Y와 Z만 교환하고 Y를 음수로
            converted[i] = vertices[i];     // X: X → X (동)
            converted[i + 1] = vertices[i + 2]; // Y: Z → Y (위)
            converted[i + 2] = -vertices[i + 1]; // Z: -Y → Z (남)
        }
        
        return converted;
    }
    
    /**
     * IFC 타입에 따른 색상 생성
     * @param {string} ifcType - IFC 타입 (예: IfcWall, IfcWindow, IfcDoor 등)
     * @returns {THREE.Color} 타입별 색상
     */
    getColorByIfcType(ifcType) {
        const colorMap = {
            // 벽체 관련 - 애니메이션 스타일 밝은 색상
            'IfcWall': 0x4ecdc4,           // 터콰이즈
            'IfcWallStandardCase': 0x4ecdc4,
            'IfcCurtainWall': 0x45b7d1,    // 스카이 블루
            
            // 창문 관련
            'IfcWindow': 0x54a0ff,         // 밝은 파란색
            'IfcWindowStyle': 0x54a0ff,
            
            // 문 관련
            'IfcDoor': 0xfeca57,           // 골든 옐로우
            'IfcDoorStyle': 0xfeca57,
            
            // 지붕 관련
            'IfcRoof': 0xff6b6b,           // 밝은 빨간색
            'IfcSlab': 0xff6b6b,
            'IfcRoofType': 0xff6b6b,
            
            // 바닥 관련
            'IfcFloor': 0x96ceb4,          // 민트 그린
            'IfcFloorType': 0x96ceb4,
            
            // 기둥 관련
            'IfcColumn': 0xff9f43,         // 오렌지
            'IfcColumnType': 0xff9f43,
            
            // 보 관련
            'IfcBeam': 0x5f27cd,           // 퍼플
            'IfcBeamType': 0x5f27cd,
            
            // 기타 구조물
            'IfcStair': 0x00d2d3,          // 시안
            'IfcRailing': 0xff9ff3,        // 핑크
            'IfcSpace': 0xddd6fe,          // 라벤더
            'IfcZone': 0xddd6fe,
            
            // 기본값
            'default': 0xee5a24            // 주황색
        };
        
        const colorHex = colorMap[ifcType] || colorMap['default'];
        return new THREE.Color(colorHex);
    }
    
    /**
     * IFC 객체들을 모두 제거
     */
    clearIfcObjects() {
        if (!this.scene) {
            return;
        }
        
        const objectsToRemove = [];
        
        this.scene.traverse((object) => {
            if (object.isMesh && object.userData.globalId) { // IFC 객체만
                objectsToRemove.push(object);
            }
        });
        
        objectsToRemove.forEach(object => {
            this.scene.remove(object);
            // 메모리 정리
            if (object.geometry) {
                object.geometry.dispose();
            }
            if (object.material) {
                if (Array.isArray(object.material)) {
                    object.material.forEach(material => material.dispose());
                } else {
                    object.material.dispose();
                }
            }
        });
        
        // 윤곽선도 함께 제거
        this.clearWireframes();
        
        this.ifcObjects = [];
    }
    
    /**
     * 모델 센터점 계산
     * @returns {THREE.Vector3} 모델 센터점
     */
    getModelCenter() {
        const box = new THREE.Box3();
        this.scene.traverse((object) => {
            if (object.isMesh && object.userData.globalId) { // IFC 객체만
                box.expandByObject(object);
            }
        });
        
        if (box.isEmpty()) {
            return new THREE.Vector3(0, 0, 0);
        }
        
        const center = box.getCenter(new THREE.Vector3());
        this.modelCenter.copy(center);
        return center;
    }
    
    /**
     * 여러 IFC Geometry 데이터를 한번에 렌더링
     * @param {Array} geometries - Geometry 데이터 배열
     */
    addIfcGeometries(geometries) {
        if (!this.scene) {
            return;
        }
        
        if (!Array.isArray(geometries)) {
            return;
        }

        
        // 모든 RawData 그대로 표시 (필터링 없음)
        const allGeometries = geometries;
        
        
        // RawData 그대로 렌더링 (중복 제거 없음)
        const typeStats = {}; // IfcType별 통계
        
        allGeometries.forEach(geometryData => {
            const ifcType = geometryData.ifcType;
            
            // 타입별 통계 수집
            if (!typeStats[ifcType]) {
                typeStats[ifcType] = 0;
            }
            typeStats[ifcType]++;
            
            // 색상 정보 로그 출력
            
            // 모든 Shape를 그대로 렌더링
            this.addIfcGeometry(geometryData);
        });
        
    }
    
    /**
     * 메시에 대한 윤곽선 생성
     * @param {THREE.Mesh} mesh - 윤곽선을 생성할 메시
     */
    createWireframe(mesh) {
        try {
            // EdgeGeometry를 사용한 윤곽선 추출
            const edges = new THREE.EdgesGeometry(mesh.geometry);
            const wireframeMaterial = new THREE.LineBasicMaterial({
                color: 0x000000, // 검은색 윤곽선
                linewidth: 1,
                transparent: true,
                opacity: 0.8
            });
            
            const wireframe = new THREE.LineSegments(edges, wireframeMaterial);
            wireframe.userData = {
                globalId: mesh.userData.globalId + '_wireframe',
                ifcType: mesh.userData.ifcType + '_wireframe',
                parentMesh: mesh
            };
            
            // 메시와 동일한 변환 적용
            wireframe.position.copy(mesh.position);
            wireframe.rotation.copy(mesh.rotation);
            wireframe.scale.copy(mesh.scale);
            
            this.scene.add(wireframe);
            this.wireframeObjects.push(wireframe);
            
        } catch (error) {
            // 윤곽선 생성 실패 시 무시
        }
    }
    
    /**
     * 윤곽선 표시/숨김 토글
     * @param {boolean} show - 윤곽선 표시 여부
     */
    toggleWireframe(show) {
        this.showWireframe = show;
        
        if (show) {
            // 기존 메시들에 대해 윤곽선 생성
            this.ifcObjects.forEach(mesh => {
                this.createWireframe(mesh);
            });
        } else {
            // 윤곽선 제거
            this.clearWireframes();
        }
    }
    
    /**
     * 모든 윤곽선 제거
     */
    clearWireframes() {
        this.wireframeObjects.forEach(wireframe => {
            this.scene.remove(wireframe);
            if (wireframe.geometry) {
                wireframe.geometry.dispose();
            }
            if (wireframe.material) {
                wireframe.material.dispose();
            }
        });
        this.wireframeObjects = [];
    }
    
    /**
     * 윤곽선 색상 변경
     * @param {string|number} color - 색상 (hex string 또는 number)
     */
    setWireframeColor(color) {
        this.wireframeObjects.forEach(wireframe => {
            if (wireframe.material) {
                wireframe.material.color.setHex(typeof color === 'string' ? parseInt(color.replace('#', ''), 16) : color);
            }
        });
    }
    
    /**
     * 윤곽선 두께 변경
     * @param {number} width - 선 두께
     */
    setWireframeWidth(width) {
        this.wireframeObjects.forEach(wireframe => {
            if (wireframe.material) {
                wireframe.material.linewidth = width;
            }
        });
    }
}