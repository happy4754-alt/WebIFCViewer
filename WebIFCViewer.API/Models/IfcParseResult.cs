namespace WebIFCViewer.API.Models;

/// <summary>
/// IFC 파싱 결과를 담는 모델 클래스
/// </summary>
public class IfcParseResult
{
    // 기본 정보
    public string FilePath { get; set; } = string.Empty;
    public string FileName { get; set; } = string.Empty;
    public DateTime ParseTime { get; set; }
    public bool Success { get; set; }
    public string? ErrorMessage { get; set; }
    
    // IFC 파싱 트리 데이터
    public List<IfcParseTree>? ParseDatas { get; set; }
    
    // 파싱 통계 정보
    public int ObjectCount => ParseDatas?.Count ?? 0;
}

