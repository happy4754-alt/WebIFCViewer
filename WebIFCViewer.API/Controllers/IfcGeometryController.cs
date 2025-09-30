using Microsoft.AspNetCore.Mvc;
using WebIFCViewer.API.Services;
using Microsoft.Extensions.Logging;
using WebIFCViewer.API.Models;
using Xbim.Ifc;

namespace WebIFCViewer.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class IfcGeometryController : ControllerBase
    {
        private readonly ILogger<IfcGeometryController> _logger;
        private readonly IfcGeometryExtractor _geometryExtractor;

        public IfcGeometryController(ILogger<IfcGeometryController> logger, IfcGeometryExtractor geometryExtractor)
        {
            _logger = logger;
            _geometryExtractor = geometryExtractor;
        }

        /// <summary>
        /// IFC 파일에서 Geometry 데이터를 추출합니다.
        /// </summary>
        /// <param name="fileName">IFC 파일명</param>
        /// <returns>Three.js 호환 Geometry 데이터</returns>
        [HttpPost("extract/{fileName}")]
        public async Task<IActionResult> ExtractGeometry(string fileName)
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

                _logger.LogInformation("IFC Geometry 추출 요청 시작: {FileName}", fileName);
                var startTime = DateTime.UtcNow;
                
                using var ifcStore = IfcStore.Open(filePath);
                var result = await _geometryExtractor.ExtractGeometryAsync(ifcStore);
                
                var duration = DateTime.UtcNow - startTime;
                _logger.LogInformation("IFC Geometry 추출 완료: {FileName}, 소요시간: {Duration}ms, 객체수: {ObjectCount}", 
                    fileName, duration.TotalMilliseconds, result.Metadata.ObjectCount);
                
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "IFC Geometry 추출 처리 중 예외 발생: {FileName}, 오류: {ErrorMessage}, 스택트레이스: {StackTrace}", 
                    fileName, ex.Message, ex.StackTrace);
                return StatusCode(500, new { 
                    message = "서버 내부 오류가 발생했습니다.",
                    error = ex.Message,
                    details = ex.ToString()
                });
            }
        }

        /// <summary>
        /// IFC 파일의 Geometry 정보를 조회합니다.
        /// </summary>
        /// <param name="fileName">IFC 파일명</param>
        /// <returns>Geometry 메타데이터</returns>
        [HttpGet("info/{fileName}")]
        public async Task<IActionResult> GetGeometryInfo(string fileName)
        {
            if (string.IsNullOrWhiteSpace(fileName))
            {
                return BadRequest(new { message = "파일명이 필요합니다." });
            }

            try
            {
                var filePath = Path.Combine(Directory.GetCurrentDirectory(), "uploads", fileName);
                
                if (!System.IO.File.Exists(filePath))
                {
                    return NotFound(new { message = $"파일을 찾을 수 없습니다: {fileName}" });
                }

                using var ifcStore = IfcStore.Open(filePath);
                var result = await _geometryExtractor.ExtractGeometryAsync(ifcStore);
                
                return Ok(new { 
                    fileName = result.Metadata.FileName,
                    objectCount = result.Metadata.ObjectCount,
                    extractTime = result.Metadata.ExtractTime,
                    ifcVersion = result.Metadata.IfcVersion
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "IFC Geometry 정보 조회 중 오류 발생: {FileName}", fileName);
                return StatusCode(500, new { message = "서버 내부 오류가 발생했습니다." });
            }
        }
    }
}
