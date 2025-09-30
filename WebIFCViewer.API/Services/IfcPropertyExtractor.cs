using System.Reflection;
using System.Xml.Linq;
using WebIFCViewer.API.Models;
using Xbim.Ifc;
using Xbim.Ifc4.Interfaces;

namespace WebIFCViewer.API.Services
{
    /// <summary>
    /// IFC 속성정보를 추출하는 부분
    /// IFC 파일에서 속성정보를 추출하여 Three.js 호환 형식으로 변환
    /// </summary>
    public class IfcPropertyExtractor
    {
        private readonly ILogger<IfcPropertyExtractor> _logger;

        public IfcPropertyExtractor(ILogger<IfcPropertyExtractor> logger)
        {
            _logger = logger;
        }

        /// <summary>
        /// IFC 파일에서 속성정보를 추출
        /// </summary>
        /// <param name="ifcStore">IFC 모델</param>
        /// <returns>속성정보 추출 결과</returns>
        public async Task<IfcPropertyResult> ExtractPropertiesAsync(IfcStore ifcStore)
        {
            try
            {
                _logger.LogInformation("IFC 속성정보 추출 시작");

                var result = new IfcPropertyResult
                {
                    Success = true,
                    Properties = new List<IfcPropertyInfo>()
                };

                // IFC 버전에 따른 처리
                var ifcVersion = ifcStore.SchemaVersion;
                _logger.LogInformation("IFC 버전: {IfcVersion}", ifcVersion);

                // 속성정보 추출
                await ExtractBasicProperties(ifcStore, result);

                result.TotalCount = result.Properties.Count;
                result.Success = true;

                _logger.LogInformation("IFC 속성정보 추출 완료: {TotalCount}개", result.TotalCount);

                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "IFC 속성정보 추출 중 오류 발생");
                
                return new IfcPropertyResult
                {
                    Success = false,
                    ErrorMessage = ex.Message,
                    Properties = new List<IfcPropertyInfo>()
                };
            }
        }
       
        /// <summary>
        /// 기본 속성정보 추출
        /// </summary>
        private Task ExtractBasicProperties(IfcStore ifcStore, IfcPropertyResult result)
        {
            try
            {
                _logger.LogInformation("IFC 속성정보 추출 시작");

                // IFC 프로젝트 정보 추출
                var ifcProjects = ifcStore.Instances.OfType<IIfcProject>().ToList();
                if (ifcProjects.Any())
                {
                    foreach (var ifcProject in ifcProjects)
                    {
                        // 프로젝트 정보
                        ExtractProjectProperties(ifcStore, ifcProject, result);
                        
                        // 사이트 정보
                        foreach (var ifcSite in ifcProject.Sites)
                        {
                            ExtractSiteProperties(ifcSite, result);
                            
                            // 건물 정보
                            foreach (var ifcBuilding in ifcSite.Buildings)
                            {
                                ExtractBuildingProperties(ifcBuilding, result);
                                
                                // 층 정보
                                foreach (var ifcBuildingStorey in ifcBuilding.BuildingStoreys)
                                {
                                    ExtractBuildingStoreyProperties(ifcBuildingStorey, result);
                                    
                                    // 요소 정보
                                    ExtractElementProperties(ifcBuildingStorey, result);
                                }
                            }
                        }
                    }
                }

                _logger.LogInformation("IFC 속성정보 추출 완료: {Count}개", result.Properties.Count);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "IFC 속성정보 추출 중 오류 발생");
            }

            return Task.CompletedTask;
        }

        /// <summary>
        /// 프로젝트 속성 추출
        /// </summary>
        private void ExtractProjectProperties(IfcStore ifcStore, IIfcProject ifcProject, IfcPropertyResult result)
        {
            var projectGuid = ifcProject.GlobalId;
            var title = "Project Details";

            AddProperty(result.Properties, projectGuid, title, "FileName", Path.GetFileName(ifcStore.FileName));
            AddProperty(result.Properties, projectGuid, title, "Guid", ifcProject.GlobalId);
            AddProperty(result.Properties, projectGuid, title, "Entity", ifcProject.ExpressType.ToString());
            AddProperty(result.Properties, projectGuid, title, "LongName", ifcProject.LongName?.Value?.ToString());
            AddProperty(result.Properties, projectGuid, title, "Name", ifcProject.Name?.Value?.ToString());
            AddProperty(result.Properties, projectGuid, title, "Phase", ifcProject.Phase?.Value?.ToString());

            // 파일 헤더 정보
            var header = ifcStore.Header;
            AddProperty(result.Properties, projectGuid, title, "Description", header.ModelViewDefinition?.ToString());
            AddProperty(result.Properties, projectGuid, title, "ImplementationLevel", header.FileDescription.ImplementationLevel?.ToString());
            AddProperty(result.Properties, projectGuid, title, "OriginatingSystem", header.FileName.OriginatingSystem?.ToString());
            AddProperty(result.Properties, projectGuid, title, "PreprocessorVersion", header.FileName.PreprocessorVersion?.ToString());
            AddProperty(result.Properties, projectGuid, title, "TimeStamp", header.FileName.TimeStamp?.ToString());
        }

        /// <summary>
        /// 사이트 속성 추출
        /// </summary>
        private void ExtractSiteProperties(IIfcSite ifcSite, IfcPropertyResult result)
        {
            var siteGuid = ifcSite.GlobalId;
            var title = "Site";

            AddProperty(result.Properties, siteGuid, title, "Guid", ifcSite.GlobalId);
            AddProperty(result.Properties, siteGuid, title, "Entity", ifcSite.ExpressType.ToString());
            AddProperty(result.Properties, siteGuid, title, "Name", ifcSite.Name?.Value?.ToString());
            AddProperty(result.Properties, siteGuid, title, "CompositionType", ifcSite.CompositionType?.ToString());
            AddProperty(result.Properties, siteGuid, title, "RefElevation", ifcSite.RefElevation?.ToString());

            // 위도 정보
            if (ifcSite.RefLatitude.HasValue)
            {
                var str_RefLatitudes = ifcSite.RefLatitude.Value;
                string str_Latitude = "";
                int index = 0;
                foreach (var str_RefLatitude in str_RefLatitudes)
                {
                    if (index == 0) { str_Latitude = str_Latitude + str_RefLatitude + "°"; }
                    else if (index == 1) { str_Latitude = str_Latitude + str_RefLatitude + "'"; }
                    else if (index == 2) { str_Latitude = str_Latitude + str_RefLatitude + "\""; }
                    else if (index == 3) { str_Latitude = str_Latitude + str_RefLatitude; }
                    index++;
                }
                AddProperty(result.Properties, siteGuid, title, "RefLatitude", str_Latitude);
            }

            // 경도 정보
            if (ifcSite.RefLongitude.HasValue)
            {
                var str_RefLongitudes = ifcSite.RefLongitude.Value;
                string str_Longitude = "";
                int index = 0;
                foreach (var str_RefLongitude in str_RefLongitudes)
                {
                    if (index == 0) { str_Longitude = str_Longitude + str_RefLongitude + "°"; }
                    else if (index == 1) { str_Longitude = str_Longitude + str_RefLongitude + "'"; }
                    else if (index == 2) { str_Longitude = str_Longitude + str_RefLongitude + "\""; }
                    else if (index == 3) { str_Longitude = str_Longitude + str_RefLongitude; }
                    index++;
                }

                AddProperty(result.Properties, siteGuid, title, "RefLongitude", str_Longitude);
            }
        }

        /// <summary>
        /// 건물 속성 추출
        /// </summary>
        private void ExtractBuildingProperties(IIfcBuilding ifcBuilding, IfcPropertyResult result)
        {
            var buildingGuid = ifcBuilding.GlobalId;
            var title = "Building";

            AddProperty(result.Properties, buildingGuid, title, "Guid", ifcBuilding.GlobalId);
            AddProperty(result.Properties, buildingGuid, title, "Entity", ifcBuilding.ExpressType.ToString());
            AddProperty(result.Properties, buildingGuid, title, "Name", ifcBuilding.Name?.Value?.ToString());
            AddProperty(result.Properties, buildingGuid, title, "LongName", ifcBuilding.LongName?.Value?.ToString());
            AddProperty(result.Properties, buildingGuid, title, "CompositionType", ifcBuilding.CompositionType?.ToString());
        }

        /// <summary>
        /// 층 속성 추출
        /// </summary>
        private void ExtractBuildingStoreyProperties(IIfcBuildingStorey ifcBuildingStorey, IfcPropertyResult result)
        {
            var storeyGuid = ifcBuildingStorey.GlobalId;
            var title = "Building Storey";

            AddProperty(result.Properties, storeyGuid, title, "Guid", ifcBuildingStorey.GlobalId);
            AddProperty(result.Properties, storeyGuid, title, "Entity", ifcBuildingStorey.ExpressType.ToString());
            AddProperty(result.Properties, storeyGuid, title, "Name", ifcBuildingStorey.Name?.Value?.ToString());
            AddProperty(result.Properties, storeyGuid, title, "LongName", ifcBuildingStorey.LongName?.Value?.ToString());
            AddProperty(result.Properties, storeyGuid, title, "ObjectType", ifcBuildingStorey.ObjectType?.Value?.ToString());
            AddProperty(result.Properties, storeyGuid, title, "CompositionType", ifcBuildingStorey.CompositionType?.ToString());
        }

        /// <summary>
        /// 요소 속성 추출
        /// </summary>
        private void ExtractElementProperties(IIfcBuildingStorey ifcBuildingStorey, IfcPropertyResult result)
        {
            foreach (var containsElement in ifcBuildingStorey.ContainsElements)
            {
                var relatedElements = containsElement.RelatedElements;
                var groupedElements = relatedElements.GroupBy(e => e.ExpressType.Name);

                foreach (var group in groupedElements)
                {
                    foreach (var element in group)
                    {
                        ExtractElementBasicProperties(element, result);
                        
                        // 분해된 요소들도 추출
                        if (element.IsDecomposedBy.Any())
                        {
                            var decomposedElements = element.IsDecomposedBy
                                .SelectMany(x => x.RelatedObjects)
                                .OfType<IIfcProduct>();

                            foreach (var decomposedElement in decomposedElements)
                            {
                                ExtractElementBasicProperties(decomposedElement, result);
                            }
                        }
                    }
                }
            }
        }

        /// <summary>
        /// 요소 기본 속성 추출
        /// </summary>
        private void ExtractElementBasicProperties(IIfcProduct element, IfcPropertyResult result)
        {
            if (element is not IIfcElement ifcElement) return;

            var elementGuid = element.GlobalId;
            var title = "Element";

            AddProperty(result.Properties, elementGuid, title, "Guid", element.GlobalId);
            AddProperty(result.Properties, elementGuid, title, "Entity", ifcElement.ExpressType.ToString());
            AddProperty(result.Properties, elementGuid, title, "Name", ifcElement.Name?.Value?.ToString());
            AddProperty(result.Properties, elementGuid, title, "ObjectType", ifcElement.ObjectType?.Value?.ToString());
            AddProperty(result.Properties, elementGuid, title, "Tag", ifcElement.Tag?.Value?.ToString());
            AddProperty(result.Properties, elementGuid, title, "PredefinedType", element.GetPredefinedTypeValue());
        }
        /// <summary>
        /// 속성 정보를 결과에 추가하는 헬퍼 메서드
        /// </summary>
        private void AddProperty(List<IfcPropertyInfo> properties, string guid, string title, string subTitle, string? value)
        {
            if (string.IsNullOrEmpty(value)) return;

            var propertyInfo = new IfcPropertyInfo
            {
                Guid = guid,
                Title = title,
                SubTitle = subTitle,
                Value = value
            };
            
            properties.Add(propertyInfo);
        }

    }
}
