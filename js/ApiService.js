/**
 * API 통신 서비스 클래스
 * 백엔드와의 모든 API 통신을 담당
 */
export class ApiService {
    constructor(baseUrl = 'https://webifcviewer-1.onrender.com/api') {
        this.baseUrl = baseUrl;
    }

    /**
     * IFC 파일 업로드
     * @param {File} file - 업로드할 파일
     * @param {Function} onProgress - 진행률 콜백
     * @returns {Promise<Object>} 업로드 응답
     */
    async uploadFile(file, onProgress) {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`${this.baseUrl}/Upload`, {
            method: 'POST',
            body: formData,
            onUploadProgress: (progressEvent) => {
                if (onProgress) {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    onProgress(percentCompleted);
                }
            }
        });

        if (!response.ok) {
            throw new Error(`업로드 실패: ${response.statusText}`);
        }

        return await response.json();
    }

    /**
     * IFC 파일 파싱
     * @param {string} fileName - 파싱할 파일명
     * @returns {Promise<Object>} 파싱 응답
     */
    async parseIfcFile(fileName) {
        const response = await fetch(`${this.baseUrl}/IfcParser/parse/${fileName}`, {
            method: 'POST'
        });

        if (!response.ok) {
            throw new Error(`파싱 실패: ${response.statusText}`);
        }

        return await response.json();
    }

    /**
     * 업로드된 파일 목록 조회
     * @returns {Promise<Object>} 파일 목록
     */
    async getUploadedFiles() {
        const response = await fetch(`${this.baseUrl}/IfcParser/files`);

        if (!response.ok) {
            throw new Error(`파일 목록 조회 실패: ${response.statusText}`);
        }

        return await response.json();
    }

    /**
     * IFC Geometry 추출
     * @param {string} fileName - 파일명
     * @returns {Promise<Object>} Geometry 데이터
     */
    async extractGeometry(fileName) {
        const response = await fetch(`${this.baseUrl}/IfcGeometry/extract/${fileName}`, {
            method: 'POST'
        });

        if (!response.ok) {
            throw new Error(`Geometry 추출 실패: ${response.statusText}`);
        }

        return await response.json();
    }

    /**
     * IFC Geometry 정보 조회
     * @param {string} fileName - 파일명
     * @returns {Promise<Object>} Geometry 정보
     */
    async getGeometryInfo(fileName) {
        const response = await fetch(`${this.baseUrl}/IfcGeometry/info/${fileName}`);

        if (!response.ok) {
            throw new Error(`Geometry 정보 조회 실패: ${response.statusText}`);
        }

        return await response.json();
    }

    /**
     * IFC 파일의 속성정보 추출
     * @param {string} fileName - 속성정보를 추출할 파일명
     * @returns {Promise<Object>} 속성정보 응답
     */
    async extractProperties(fileName) {
        const response = await fetch(`${this.baseUrl}/IfcProperty/extract/${fileName}`, {
            method: 'POST'
        });

        if (!response.ok) {
            throw new Error(`속성정보 추출 실패: ${response.statusText}`);
        }

        return await response.json();
    }

}
