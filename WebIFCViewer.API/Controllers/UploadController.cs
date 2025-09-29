using Microsoft.AspNetCore.Mvc;
using WebIFCViewer.API.Services;

namespace WebIFCViewer.API.Controllers;

/// <summary>
/// 파일 업로드 컨트롤러
/// IFC 파일 업로드 관련 API 엔드포인트를 제공
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class UploadController : ControllerBase
{
    private readonly IFileUploadService _fileUploadService;
    private readonly ILogger<UploadController> _logger;

    /// <summary>
    /// 업로드 컨트롤러 생성자
    /// </summary>
    /// <param name="fileUploadService">파일 업로드 서비스</param>
    /// <param name="logger">로거 인스턴스</param>
    public UploadController(IFileUploadService fileUploadService, ILogger<UploadController> logger)
    {
        _fileUploadService = fileUploadService;
        _logger = logger;
    }

    /// <summary>
    /// IFC 파일 업로드 엔드포인트
    /// </summary>
    /// <param name="file">업로드할 IFC 파일</param>
    /// <returns>업로드 결과</returns>
    [HttpPost]
    public async Task<IActionResult> UploadIfcFile(IFormFile? file)
    {
        if (file == null)
            return BadRequest(new { message = "파일이 선택되지 않았습니다." });

        try
        {
            _logger.LogInformation("IFC 파일 업로드 요청 수신: {FileName}", file.FileName);
            var result = await _fileUploadService.UploadIfcFileAsync(file);
            return result.Success ? Ok(result) : BadRequest(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "IFC 파일 업로드 처리 중 예외 발생");
            return StatusCode(500, new { message = "서버 내부 오류가 발생했습니다." });
        }
    }

    /// <summary>
    /// 업로드 상태 확인 엔드포인트
    /// </summary>
    /// <returns>서버 상태</returns>
    [HttpGet("status")]
    public IActionResult GetStatus()
    {
        return Ok(new { 
            status = "서버가 정상적으로 실행 중입니다.",
            timestamp = DateTime.UtcNow 
        });
    }
}
