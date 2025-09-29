using WebIFCViewer.API.Models;

namespace WebIFCViewer.API.Services;

/// <summary>
/// 파일 업로드 서비스 인터페이스
/// 파일 업로드 관련 비즈니스 로직을 정의
/// </summary>
public interface IFileUploadService
{
    /// <summary>
    /// IFC 파일을 업로드하고 처리
    /// </summary>
    /// <param name="file">업로드할 파일</param>
    /// <returns>업로드 결과</returns>
    Task<UploadResponse> UploadIfcFileAsync(IFormFile file);

    /// <summary>
    /// 파일 유효성 검사
    /// </summary>
    /// <param name="file">검사할 파일</param>
    /// <returns>유효성 검사 결과</returns>
    bool ValidateFile(IFormFile file);
}
