using WebIFCViewer.API.Models;
using Xbim.Ifc;
using Xbim.Ifc4.Interfaces;
using Xbim.Ifc2x3.Interfaces;
using Microsoft.Extensions.Logging;

namespace WebIFCViewer.API.Services;

/// <summary>
/// IFC 계층 구조 추출을 담당하는 서비스 클래스
/// </summary>
public class IfcHierarchyExtractor
{
    private readonly ILogger<IfcHierarchyExtractor> _logger;

    public IfcHierarchyExtractor(ILogger<IfcHierarchyExtractor> logger)
    {
        _logger = logger;
    }

    /// <summary>
    /// IFC 파일에서 계층 구조를 추출합니다.
    /// </summary>
    /// <param name="ifcStore">IFC 모델</param>
    /// <returns>계층 구조 트리</returns>
    public List<IfcParseTree> ExtractHierarchy(IfcStore ifcStore)
    {
        try
        {
            var ifcProject = GetIfcProject(ifcStore);
            if (ifcProject == null)
            {
                _logger.LogWarning("IFC 프로젝트를 찾을 수 없습니다.");
                return new List<IfcParseTree>();
            }

            var projectNode = CreateProjectNode(ifcProject);
            ProcessSites(ifcProject, projectNode);
            
            return new List<IfcParseTree> { projectNode };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "IFC 계층 구조 추출 중 오류 발생");
            return new List<IfcParseTree>();
        }
    }

    /// <summary>
    /// IFC 프로젝트를 가져옵니다.
    /// </summary>
    private IIfcProject? GetIfcProject(IfcStore ifcStore)
    {
        return ifcStore.Instances
            .Where<IIfcProject>(x => x.ExpressType.ExpressNameUpper.Equals("IFCPROJECT"))
            .FirstOrDefault();
    }

    /// <summary>
    /// 프로젝트 노드를 생성합니다.
    /// </summary>
    private IfcParseTree CreateProjectNode(IIfcProject ifcProject)
    {
        return new IfcParseTree(
            ifcProject.GlobalId,
            ifcProject.ExpressType.Name,
            ifcProject.Name.HasValue ? ifcProject.Name.Value.ToString() : "");
    }

    /// <summary>
    /// 사이트들을 처리합니다.
    /// </summary>
    private void ProcessSites(IIfcProject ifcProject, IfcParseTree projectNode)
    {
        foreach (var ifcSite in ifcProject.Sites)
        {
            var siteNode = CreateSiteNode(ifcSite);
            projectNode.Children.Add(siteNode);
            ProcessBuildings(ifcSite, siteNode);
        }
    }

    /// <summary>
    /// 사이트 노드를 생성합니다.
    /// </summary>
    private IfcParseTree CreateSiteNode(IIfcSite ifcSite)
    {
        return new IfcParseTree(
            ifcSite.GlobalId,
            ifcSite.ExpressType.Name,
            ifcSite.Name.HasValue ? ifcSite.Name.Value.ToString() : "");
    }

    /// <summary>
    /// 건물들을 처리합니다.
    /// </summary>
    private void ProcessBuildings(IIfcSite ifcSite, IfcParseTree siteNode)
    {
        foreach (var ifcBuilding in ifcSite.Buildings)
        {
            var buildingNode = CreateBuildingNode(ifcBuilding);
            siteNode.Children.Add(buildingNode);
            ProcessBuildingStoreys(ifcBuilding, buildingNode);
        }
    }

    /// <summary>
    /// 건물 노드를 생성합니다.
    /// </summary>
    private IfcParseTree CreateBuildingNode(IIfcBuilding ifcBuilding)
    {
        return new IfcParseTree(
            ifcBuilding.GlobalId,
            ifcBuilding.ExpressType.Name,
            ifcBuilding.Name.HasValue ? ifcBuilding.Name.Value.ToString() : "");
    }

    /// <summary>
    /// 건물 층들을 처리합니다.
    /// </summary>
    private void ProcessBuildingStoreys(IIfcBuilding ifcBuilding, IfcParseTree buildingNode)
    {
        foreach (var ifcBuildingStorey in ifcBuilding.BuildingStoreys)
        {
            var storeyNode = CreateBuildingStoreyNode(ifcBuildingStorey);
            buildingNode.Children.Add(storeyNode);
            ProcessElements(ifcBuildingStorey, storeyNode);
        }
    }

    /// <summary>
    /// 건물 층 노드를 생성합니다.
    /// </summary>
    private IfcParseTree CreateBuildingStoreyNode(IIfcBuildingStorey ifcBuildingStorey)
    {
        return new IfcParseTree(
            ifcBuildingStorey.GlobalId,
            ifcBuildingStorey.ExpressType.Name,
            ifcBuildingStorey.Name.HasValue ? ifcBuildingStorey.Name.Value.ToString() : "");
    }

    /// <summary>
    /// 요소들을 처리합니다.
    /// </summary>
    private void ProcessElements(IIfcBuildingStorey ifcBuildingStorey, IfcParseTree storeyNode)
    {
        foreach (var containsElement in ifcBuildingStorey.ContainsElements)
        {
            var relatedElements = containsElement.RelatedElements;
            var groupedElements = relatedElements.GroupBy(e => e.ExpressType.Name).ToList();
            
            foreach (var group in groupedElements)
            {
                var typeGroupNode = CreateTypeGroupNode(group.Key);
                storeyNode.Children.Add(typeGroupNode);
                ProcessElementGroup(group, typeGroupNode);
            }
        }
    }

    /// <summary>
    /// 타입 그룹 노드를 생성합니다.
    /// </summary>
    private IfcParseTree CreateTypeGroupNode(string elementType)
    {
        return new IfcParseTree("-1", "All_" + elementType, "");
    }

    /// <summary>
    /// 요소 그룹을 처리합니다.
    /// </summary>
    private void ProcessElementGroup(IGrouping<string, IIfcProduct> group, IfcParseTree typeGroupNode)
    {
        foreach (var relatedElement in group)
        {
            var elementNode = CreateElementNode(relatedElement);
            typeGroupNode.Children.Add(elementNode);
            ProcessDecomposedElements(relatedElement, elementNode);
        }
    }

    /// <summary>
    /// 요소 노드를 생성합니다.
    /// </summary>
    private IfcParseTree CreateElementNode(IIfcProduct relatedElement)
    {
        return new IfcParseTree(
            relatedElement.GlobalId,
            relatedElement.ExpressType.Name,
            relatedElement.Name.HasValue ? relatedElement.Name.Value.ToString() : "");
    }

    /// <summary>
    /// 분해된 요소들을 처리합니다.
    /// </summary>
    private void ProcessDecomposedElements(IIfcProduct relatedElement, IfcParseTree elementNode)
    {
        if (relatedElement.IsDecomposedBy.Any())
        {
            var decomposedElements = relatedElement.IsDecomposedBy
                .SelectMany(x => x.RelatedObjects)
                .Cast<IIfcProduct>().ToList();

            foreach (var decomposedElement in decomposedElements)
            {
                var decomposedNode = CreateElementNode(decomposedElement);
                elementNode.Children.Add(decomposedNode);
            }
        }
    }
}
