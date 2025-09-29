using Microsoft.AspNetCore.Mvc;
using WebIFCViewer.API.Services;

namespace WebIFCViewer.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class IfcParserController : ControllerBase
{
    private readonly ILogger<IfcParserController> _logger;
    private readonly IfcParsingService _ifcParsingService;

    public IfcParserController(ILogger<IfcParserController> logger, IfcParsingService ifcParsingService)
    {
        _logger = logger;
        _ifcParsingService = ifcParsingService;
    }

    /// <summary>
    /// IFC 파일을 파싱합니다.
    /// </summary>
    /// <param name="fileName">업로드된 IFC 파일명</param>
    /// <returns>파싱된 IFC 정보</returns>
    [HttpPost("parse/{fileName}")]
    public async Task<IActionResult> ParseIfcFile(string fileName)
    {
        if (string.IsNullOrWhiteSpace(fileName))
        {
            _logger.LogWarning("파일명이 비어있습니다.");
            return BadRequest(new { message = "파일명이 필요합니다." });
        }

        try
        {
            var filePath = Path.Combine(Directory.GetCurrentDirectory(), "uploads", fileName);
            
            if (!System.IO.File.Exists(filePath))
            {
                _logger.LogWarning("파일을 찾을 수 없습니다: {FileName}", fileName);
                return NotFound(new { message = $"파일을 찾을 수 없습니다: {fileName}" });
            }

            _logger.LogInformation("IFC 파일 파싱 요청 시작: {FileName}", fileName);
            var startTime = DateTime.UtcNow;
            
            // 실제 IFC 파싱 실행
            var result = await _ifcParsingService.ParseIfcFileAsync(filePath);
            
            var duration = DateTime.UtcNow - startTime;
            _logger.LogInformation("IFC 파일 파싱 완료: {FileName}, 소요시간: {Duration}ms, 객체수: {ObjectCount}", 
                fileName, duration.TotalMilliseconds, result.ObjectCount);
            
            if (result.Success)
            {
                return Ok(result);
            }
            else
            {
                _logger.LogError("IFC 파일 파싱 실패: {FileName}, 오류: {Error}", fileName, result.ErrorMessage);
                return BadRequest(new { message = result.ErrorMessage });
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "IFC 파일 파싱 처리 중 예외 발생: {FileName}", fileName);
            return StatusCode(500, new { message = "서버 내부 오류가 발생했습니다." });
        }
    }

    /// <summary>
    /// 업로드된 IFC 파일 목록을 조회합니다.
    /// </summary>
    /// <returns>업로드된 IFC 파일 목록</returns>
    [HttpGet("files")]
    public IActionResult GetUploadedFiles()
    {
        try
        {
            var uploadsPath = Path.Combine(Directory.GetCurrentDirectory(), "uploads");
            
            if (!Directory.Exists(uploadsPath))
            {
                _logger.LogInformation("업로드 디렉토리가 존재하지 않습니다: {UploadsPath}", uploadsPath);
                return Ok(new { files = new List<object>(), count = 0 });
            }

            var files = Directory.GetFiles(uploadsPath, "*.ifc")
                .Select(filePath =>
                {
                    var fileInfo = new FileInfo(filePath);
                    return new
                    {
                        fileName = Path.GetFileName(filePath),
                        fileSize = fileInfo.Length,
                        fileSizeFormatted = FormatFileSize(fileInfo.Length),
                        lastModified = System.IO.File.GetLastWriteTime(filePath),
                        created = fileInfo.CreationTime
                    };
                })
                .OrderByDescending(f => f.lastModified)
                .ToList();

            _logger.LogInformation("업로드된 IFC 파일 목록 조회 완료: {FileCount}개 파일", files.Count);
            return Ok(new { files, count = files.Count });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "업로드된 파일 목록 조회 중 오류 발생");
            return StatusCode(500, new { message = "파일 목록을 조회할 수 없습니다." });
        }
    }

    /// <summary>
    /// 파일 크기를 읽기 쉬운 형식으로 포맷팅합니다.
    /// </summary>
    private static string FormatFileSize(long bytes)
    {
        string[] sizes = { "B", "KB", "MB", "GB", "TB" };
        double len = bytes;
        int order = 0;
        while (len >= 1024 && order < sizes.Length - 1)
        {
            order++;
            len = len / 1024;
        }
        return $"{len:0.##} {sizes[order]}";
    }
}
