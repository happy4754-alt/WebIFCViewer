namespace WebIFCViewer.API.Models;

/// <summary>
/// 파일 업로드 응답 모델
/// 업로드 결과 정보를 담는 데이터 전송 객체
/// </summary>
public class UploadResponse
{
    /// <summary>
    /// 업로드 성공 여부
    /// </summary>
    public bool Success { get; set; }

    /// <summary>
    /// 업로드된 파일명
    /// </summary>
    public string FileName { get; set; } = string.Empty;

    /// <summary>
    /// 파일 크기 (바이트)
    /// </summary>
    public long FileSize { get; set; }

    /// <summary>
    /// 파일 저장 경로
    /// </summary>
    public string FilePath { get; set; } = string.Empty;

    /// <summary>
    /// 응답 메시지
    /// </summary>
    public string Message { get; set; } = string.Empty;

    /// <summary>
    /// 업로드 시간
    /// </summary>
    public DateTime UploadTime { get; set; } = DateTime.UtcNow;
}
