/**
 * 파일 유효성 검사 클래스
 * 업로드 파일의 유효성을 검사
 */
export class FileValidator {
    constructor() {
        this.maxFileSize = 100 * 1024 * 1024; // 100MB
        this.allowedFileTypes = ['.ifc'];
    }

    /**
     * 파일 유효성 검사
     * @param {File} file - 검사할 파일
     * @returns {Object} 검사 결과
     */
    validateFile(file) {
        const result = {
            isValid: true,
            errors: []
        };

        // 파일 존재 확인
        if (!file) {
            result.isValid = false;
            result.errors.push('파일을 선택해주세요.');
            return result;
        }

        // 파일 크기 확인
        if (file.size > this.maxFileSize) {
            result.isValid = false;
            result.errors.push(`파일 크기가 너무 큽니다. (최대: ${this.formatFileSize(this.maxFileSize)})`);
        }

        // 파일 확장자 확인
        const fileExtension = this.getFileExtension(file.name);
        if (!this.allowedFileTypes.includes(fileExtension)) {
            result.isValid = false;
            result.errors.push(`지원하지 않는 파일 형식입니다. (지원: ${this.allowedFileTypes.join(', ')})`);
        }

        return result;
    }

    /**
     * 파일 확장자 추출
     * @param {string} fileName - 파일명
     * @returns {string} 확장자
     */
    getFileExtension(fileName) {
        return fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
    }

    /**
     * 파일 크기 포맷팅
     * @param {number} bytes - 바이트 크기
     * @returns {string} 포맷된 크기
     */
    formatFileSize(bytes) {
        const sizes = ['B', 'KB', 'MB', 'GB'];
        if (bytes === 0) return '0 B';
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
    }
}
