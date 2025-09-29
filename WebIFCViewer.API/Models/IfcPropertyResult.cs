namespace WebIFCViewer.API.Models
{
    /// <summary>
    /// IFC 속성정보 추출 결과
    /// </summary>
    public class IfcPropertyResult
    {
        /// <summary>
        /// 성공 여부
        /// </summary>
        public bool Success { get; set; }

        /// <summary>
        /// 오류 메시지
        /// </summary>
        public string? ErrorMessage { get; set; }

        /// <summary>
        /// 속성정보 목록
        /// </summary>
        public List<IfcPropertyInfo> Properties { get; set; } = new List<IfcPropertyInfo>();

        /// <summary>
        /// 총 속성 개수
        /// </summary>
        public int TotalCount { get; set; }
    }

    /// <summary>
    /// IFC 속성정보 (IfcParseProperty 통합)
    /// </summary>
    public class IfcPropertyInfo
    {
        /// <summary>
        /// IFC의 고유ID (Guid)
        /// </summary>
        public string? Guid { get; set; }

        /// <summary>
        /// 대제목 (Title)
        /// </summary>
        public string? Title { get; set; }

        /// <summary>
        /// 소제목 (SubTitle)
        /// </summary>
        public string? SubTitle { get; set; }

        /// <summary>
        /// 속성값 (Value)
        /// </summary>
        public string? Value { get; set; }
    }
}
