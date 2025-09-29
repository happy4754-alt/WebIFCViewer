using Xbim.Ifc4.Interfaces;
using Xbim.Ifc2x3.Interfaces;

namespace WebIFCViewer.API.Models;

/// <summary>
/// IFC 파싱 트리 노드 모델
/// </summary>
public class IfcParseTree
{
    public string? Guid { get; set; }  // IFC의 고유ID
    public string? Type { get; set; }  // IFC의 타입 => IFCWALL, IFCSLAB등등
    public string? Name { get; set; }  // IFC객체이름
    public object? IfcElement { get; set; }  // 모든 타입 저장 가능
    public List<IfcParseTree> Children { get; set; } = new();  // 트리구조처럼 하기위한 방식이다.

    // 타입 안전한 접근을 위한 메서드
    public T? GetIfcElement<T>() where T : class
    {
        return IfcElement as T;
    }

    // IFC Element로 안전하게 접근
    public IIfcElement? GetIfcElement()
    {
        return IfcElement as IIfcElement;
    }

    // IFC Product로 안전하게 접근 (더 일반적)
    public IIfcProduct? GetIfcProduct()
    {
        return IfcElement as IIfcProduct;
    }

    public IfcParseTree(string Guid, string Type, string Name)
    {
        this.Guid = Guid;
        this.Type = Type;
        this.Name = Name;
        this.Children = new List<IfcParseTree>();
    }

    // 기본 생성자
    public IfcParseTree()
    {
        this.Children = new List<IfcParseTree>();
    }
}

