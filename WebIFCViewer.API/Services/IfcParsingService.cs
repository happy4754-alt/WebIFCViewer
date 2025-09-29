using Xbim.Ifc;
using Microsoft.Extensions.Logging;
using WebIFCViewer.API.Models;

namespace WebIFCViewer.API.Services;

public class IfcParsingService
{
    private readonly ILogger<IfcParsingService> _logger;
    private readonly IfcHierarchyExtractor _hierarchyExtractor;

    public IfcParsingService(ILogger<IfcParsingService> logger, IfcHierarchyExtractor hierarchyExtractor)
    {
        _logger = logger;
        _hierarchyExtractor = hierarchyExtractor;
    }

    /// <summary>
    /// IFC 파일을 파싱하여 기본 정보를 추출합니다.
    /// </summary>
    /// <param name="filePath">IFC 파일 경로</param>
    /// <returns>파싱된 IFC 정보</returns>
    public async Task<IfcParseResult> ParseIfcFileAsync(string filePath)
    {
        try
        {
            _logger.LogInformation("IFC 파일 파싱 시작: {FilePath}", filePath);

            using var model = IfcStore.Open(filePath);
            var parseDatas = await Task.Run(() => _hierarchyExtractor.ExtractHierarchy(model));

            var result = new IfcParseResult
            {
                FilePath = filePath,
                FileName = Path.GetFileName(filePath),
                ParseTime = DateTime.UtcNow,
                Success = true,
                ParseDatas = parseDatas
            };

            _logger.LogInformation("IFC 파일 파싱 완료: {ParseDatasCount}개 트리 노드", parseDatas?.Count ?? 0);
            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "IFC 파일 파싱 중 오류 발생: {FilePath}", filePath);
            return new IfcParseResult
            {
                FilePath = filePath,
                FileName = Path.GetFileName(filePath),
                ParseTime = DateTime.UtcNow,
                Success = false,
                ErrorMessage = ex.Message
            };
        }
    }
}