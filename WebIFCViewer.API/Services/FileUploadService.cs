using WebIFCViewer.API.Models;

namespace WebIFCViewer.API.Services;

/// <summary>
/// 파일 업로드 서비스 구현체
/// IFC 파일 업로드 및 검증 로직을 담당
/// </summary>
public class FileUploadService : IFileUploadService
{
    private readonly ILogger<FileUploadService> _logger;
    private readonly string _uploadPath;
    private readonly long _maxFileSize;
    private readonly string[] _allowedExtensions;

    /// <summary>
    /// 파일 업로드 서비스 생성자
    /// </summary>
    /// <param name="logger">로거 인스턴스</param>
    public FileUploadService(ILogger<FileUploadService> logger)
    {
        _logger = logger;
        _uploadPath = Path.Combine(Directory.GetCurrentDirectory(), "uploads");
        _maxFileSize = 100 * 1024 * 1024; // 100MB
        _allowedExtensions = [".ifc"];

        EnsureUploadDirectoryExists();
    }

    /// <summary>
    /// IFC 파일 업로드 처리
    /// </summary>
    /// <param name="file">업로드할 파일</param>
    /// <returns>업로드 결과</returns>
    public async Task<UploadResponse> UploadIfcFileAsync(IFormFile file)
    {
        try
        {
            // 파일 유효성 검사
            if (!ValidateFile(file))
            {
                return CreateErrorResponse("유효하지 않은 파일입니다.");
            }

            // 고유한 파일명 생성
            var fileName = GenerateUniqueFileName(file.FileName);
            var filePath = Path.Combine(_uploadPath, fileName);

            // 파일 저장
            await SaveFileAsync(file, filePath);

            // 업로드 성공 로그
            _logger.LogInformation("IFC 파일 업로드 성공: {FileName}, 크기: {FileSize} bytes", 
                fileName, file.Length);

            return CreateSuccessResponse(fileName, file.Length, filePath);

        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "IFC 파일 업로드 중 오류 발생");
            return CreateErrorResponse($"업로드 중 오류가 발생했습니다: {ex.Message}");
        }
    }

    /// <summary>
    /// 파일 유효성 검사
    /// </summary>
    /// <param name="file">검사할 파일</param>
    /// <returns>유효성 검사 결과</returns>
    public bool ValidateFile(IFormFile file)
    {
        // 파일 존재 여부 확인
        if (file == null || file.Length == 0)
        {
            _logger.LogWarning("빈 파일이 업로드되었습니다.");
            return false;
        }

        // 파일 크기 확인
        if (file.Length > _maxFileSize)
        {
            _logger.LogWarning("파일 크기 초과: {FileSize} bytes (최대: {MaxSize} bytes)", 
                file.Length, _maxFileSize);
            return false;
        }

        // 파일 확장자 확인
        var fileExtension = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!_allowedExtensions.Contains(fileExtension))
        {
            _logger.LogWarning("허용되지 않은 파일 확장자: {Extension}", fileExtension);
            return false;
        }

        return true;
    }

    /// <summary>
    /// 업로드 디렉토리 존재 확인 및 생성
    /// </summary>
    private void EnsureUploadDirectoryExists()
    {
        if (!Directory.Exists(_uploadPath))
        {
            Directory.CreateDirectory(_uploadPath);
            _logger.LogInformation("업로드 디렉토리 생성: {UploadPath}", _uploadPath);
        }
    }

    /// <summary>
    /// 고유한 파일명 생성
    /// </summary>
    /// <param name="originalFileName">원본 파일명</param>
    /// <returns>고유한 파일명</returns>
    private string GenerateUniqueFileName(string originalFileName)
    {
        var extension = Path.GetExtension(originalFileName);
        var fileNameWithoutExtension = Path.GetFileNameWithoutExtension(originalFileName);
        var timestamp = DateTime.UtcNow.ToString("yyyyMMdd_HHmmss");
        var guid = Guid.NewGuid().ToString("N")[..8];
        
        return $"{fileNameWithoutExtension}_{timestamp}_{guid}{extension}";
    }

    /// <summary>
    /// 파일을 지정된 경로에 저장
    /// </summary>
    /// <param name="file">저장할 파일</param>
    /// <param name="filePath">저장 경로</param>
    private async Task SaveFileAsync(IFormFile file, string filePath)
    {
        using var stream = new FileStream(filePath, FileMode.Create);
        await file.CopyToAsync(stream);
    }

    /// <summary>
    /// 성공 응답 생성
    /// </summary>
    /// <param name="fileName">파일명</param>
    /// <param name="fileSize">파일 크기</param>
    /// <param name="filePath">파일 경로</param>
    /// <returns>성공 응답</returns>
    private UploadResponse CreateSuccessResponse(string fileName, long fileSize, string filePath)
    {
        return new UploadResponse
        {
            Success = true,
            FileName = fileName,
            FileSize = fileSize,
            FilePath = filePath,
            Message = "파일이 성공적으로 업로드되었습니다."
        };
    }

    /// <summary>
    /// 에러 응답 생성
    /// </summary>
    /// <param name="message">에러 메시지</param>
    /// <returns>에러 응답</returns>
    private UploadResponse CreateErrorResponse(string message)
    {
        return new UploadResponse
        {
            Success = false,
            Message = message
        };
    }
}
