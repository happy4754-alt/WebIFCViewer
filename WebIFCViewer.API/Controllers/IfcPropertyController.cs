using Microsoft.AspNetCore.Mvc;
using WebIFCViewer.API.Models;
using WebIFCViewer.API.Services;
using Xbim.Ifc;

namespace WebIFCViewer.API.Controllers
{
    /// <summary>
    /// IFC 속성정보 추출 API 컨트롤러
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    public class IfcPropertyController : ControllerBase
    {
        private readonly IfcPropertyExtractor _propertyExtractor;
        private readonly ILogger<IfcPropertyController> _logger;

        public IfcPropertyController(IfcPropertyExtractor propertyExtractor, ILogger<IfcPropertyController> logger)
        {
            _propertyExtractor = propertyExtractor;
            _logger = logger;
        }

        /// <summary>
        /// IFC 파일의 모든 속성정보를 추출하여 JSON으로 반환
        /// </summary>
        /// <param name="fileName">IFC 파일명</param>
        /// <returns>속성정보 JSON</returns>
        [HttpPost("extract/{fileName}")]
        public async Task<ActionResult<IfcPropertyResult>> ExtractProperties(string fileName)
        {
            if (string.IsNullOrWhiteSpace(fileName))
            {
                _logger.LogWarning("파일명이 비어있습니다.");
                return BadRequest(new IfcPropertyResult
                {
                    Success = false,
                    ErrorMessage = "파일명이 필요합니다."
                });
            }

            try
            {
                var filePath = Path.Combine(Directory.GetCurrentDirectory(), "uploads", fileName);
                
                if (!System.IO.File.Exists(filePath))
                {
                    _logger.LogWarning("파일을 찾을 수 없습니다: {FileName}", fileName);
                    return NotFound(new IfcPropertyResult
                    {
                        Success = false,
                        ErrorMessage = $"파일을 찾을 수 없습니다: {fileName}"
                    });
                }

                _logger.LogInformation("IFC 속성정보 추출 요청 시작: {FileName}", fileName);
                var startTime = DateTime.UtcNow;
                
                using var ifcStore = IfcStore.Open(filePath);
                var result = await _propertyExtractor.ExtractPropertiesAsync(ifcStore);
                
                var duration = DateTime.UtcNow - startTime;
                _logger.LogInformation("IFC 속성정보 추출 완료: {FileName}, 소요시간: {Duration}ms, 속성수: {TotalCount}", 
                    fileName, duration.TotalMilliseconds, result.TotalCount);
                
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "IFC 속성정보 추출 처리 중 예외 발생: {FileName}", fileName);
                return StatusCode(500, new IfcPropertyResult
                {
                    Success = false,
                    ErrorMessage = "서버 내부 오류가 발생했습니다."
                });
            }
        }


        /// <summary>
        /// 업로드된 IFC 파일 목록 조회
        /// </summary>
        /// <returns>파일 목록</returns>
        [HttpGet("files")]
        public ActionResult<IEnumerable<string>> GetUploadedFiles()
        {
            try
            {
                var uploadsPath = "uploads";
                
                if (!Directory.Exists(uploadsPath))
                {
                    return Ok(new List<string>());
                }

                var files = Directory.GetFiles(uploadsPath, "*.ifc")
                    .Select(Path.GetFileName)
                    .Where(name => !string.IsNullOrEmpty(name))
                    .Cast<string>()
                    .OrderBy(name => name)
                    .ToList();

                _logger.LogInformation($"업로드된 IFC 파일 목록 조회: {files.Count}개");

                return Ok(files);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "파일 목록 조회 중 오류 발생");
                
                return StatusCode(500, new List<string>());
            }
        }

        /// <summary>
        /// GUID별 속성정보 추출
        /// </summary>
        /// <param name="guid">객체 GUID</param>
        /// <returns>속성정보 결과</returns>
        [HttpPost("extractByGlobalId/{guid}")]
        public async Task<IActionResult> ExtractPropertiesByGlobalId(string guid)
        {
            try
            {
                // 현재 로드된 IFC 파일 경로 가져오기 (실제 구현에서는 세션 또는 캐시에서 가져와야 함)
                var uploadsPath = Path.Combine(Directory.GetCurrentDirectory(), "uploads");
                var ifcFiles = Directory.GetFiles(uploadsPath, "*.ifc");
                
                if (ifcFiles.Length == 0)
                {
                    return Ok(new IfcPropertyResult
                    {
                        Success = false,
                        ErrorMessage = "로드된 IFC 파일이 없습니다."
                    });
                }

                // 가장 최근 파일 사용 (실제로는 현재 로드된 파일을 추적해야 함)
                var latestFile = ifcFiles.OrderByDescending(f => File.GetLastWriteTime(f)).First();
                
                using var ifcStore = IfcStore.Open(latestFile);
                var result = await _propertyExtractor.ExtractPropertiesByGlobalIdAsync(ifcStore, guid);
                
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "GUID별 속성정보 추출 중 오류 발생: {Guid}", guid);
                return Ok(new IfcPropertyResult
                {
                    Success = false,
                    ErrorMessage = $"속성정보 추출 중 오류가 발생했습니다: {ex.Message}"
                });
            }
        }
    }
}
