namespace WebIFCViewer.API.Models
{
    /// <summary>
    /// IFC Geometry 추출 결과
    /// </summary>
    public class IfcGeometryResult
    {
        public List<IfcGeometryData> Geometries { get; set; } = new();
        public IfcGeometryMetadata Metadata { get; set; } = new();
    }

    /// <summary>
    /// IFC Geometry 데이터
    /// </summary>
    public class IfcGeometryData
    {
        public string GlobalId { get; set; } = string.Empty;
        public string IfcType { get; set; } = string.Empty;
        public float[] Vertices { get; set; } = Array.Empty<float>();
        public uint[] Faces { get; set; } = Array.Empty<uint>();
        public string HostId { get; set; } = string.Empty;
        public string ColorHEX { get; set; } = string.Empty;
        public double Transparency { get; set; } = 0;
    }


    /// <summary>
    /// IFC Geometry 메타데이터
    /// </summary>
    public class IfcGeometryMetadata
    {
        public string FileName { get; set; } = string.Empty;
        public int ObjectCount { get; set; }
        public DateTime ExtractTime { get; set; }
        public string IfcVersion { get; set; } = string.Empty;
    }
}
