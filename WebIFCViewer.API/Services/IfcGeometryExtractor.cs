using Xbim.Ifc;
using Xbim.Ifc4.Interfaces;
using Xbim.ModelGeometry.Scene;
using Xbim.Common.Geometry;
using Microsoft.Extensions.Logging;
using WebIFCViewer.API.Models;
using Microsoft.Extensions.Hosting;
using System.Diagnostics;
using System;

namespace WebIFCViewer.API.Services
{
    /// <summary>
    /// IFC Geometry 추출 서비스
    /// IFC 파일에서 3D Geometry 데이터를 추출하여 Three.js 호환 형식으로 변환
    /// </summary>
    public class IfcGeometryExtractor
    {
        private readonly ILogger<IfcGeometryExtractor> _logger;

        public IfcGeometryExtractor(ILogger<IfcGeometryExtractor> logger)
        {
            _logger = logger;
        }

        /// <summary>
        /// IFC 파일에서 Geometry 데이터를 추출합니다.
        /// </summary>
        /// <param name="ifcStore">IFC 모델</param>
        /// <returns>Three.js 호환 Geometry 데이터</returns>
        public async Task<IfcGeometryResult> ExtractGeometryAsync(IfcStore ifcStore)
        {
            try
            {
                _logger.LogInformation("IFC Geometry 추출 시작");

                var result = new IfcGeometryResult
                {
                    Geometries = new List<IfcGeometryData>(),
                    Metadata = new IfcGeometryMetadata
                    {
                        FileName = ifcStore.FileName,
                        ObjectCount = 0,
                        ExtractTime = DateTime.UtcNow,
                        IfcVersion = ifcStore.SchemaVersion.ToString()
                    }
                };

                // 실제 IFC 파일 처리
                await ExtractBasicGeometry(ifcStore, result);

                result.Metadata.ObjectCount = result.Geometries.Count;
                _logger.LogInformation("IFC Geometry 추출 완료: {ObjectCount}개 객체", result.Metadata.ObjectCount);

                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "IFC Geometry 추출 중 오류 발생: {ErrorMessage}, 스택트레이스: {StackTrace}", 
                    ex.Message, ex.StackTrace);
                throw;
            }
        }

        /// <summary>
        /// 테스트용 간단한 Geometry 데이터 생성
        /// </summary>
        private async Task CreateTestGeometry(IfcGeometryResult result)
        {
            // 간단한 박스 Geometry 생성 (테스트용)
            var testGeometry = new IfcGeometryData
            {
                GlobalId = "test-box-001",
                IfcType = "IfcBox",
                Vertices = new float[]
                {
                    // 박스의 8개 꼭짓점
                    -1.0f, -1.0f, -1.0f,  // 0
                     1.0f, -1.0f, -1.0f,  // 1
                     1.0f,  1.0f, -1.0f,  // 2
                    -1.0f,  1.0f, -1.0f,  // 3
                    -1.0f, -1.0f,  1.0f,  // 4
                     1.0f, -1.0f,  1.0f,  // 5
                     1.0f,  1.0f,  1.0f,  // 6
                    -1.0f,  1.0f,  1.0f   // 7
                },
                Faces = new uint[]
                {
                    // 12개 삼각형 면
                    0, 1, 2,  0, 2, 3,  // 앞면
                    4, 7, 6,  4, 6, 5,  // 뒷면
                    0, 4, 5,  0, 5, 1,  // 아래면
                    2, 6, 7,  2, 7, 3,  // 위면
                    0, 3, 7,  0, 7, 4,  // 왼쪽면
                    1, 5, 6,  1, 6, 2   // 오른쪽면
                },
                HostId = "",
                ColorHEX = "4CAF50",
                Transparency = 0.0
            };

            result.Geometries.Add(testGeometry);
            await Task.CompletedTask;
        }


        /// <summary>
        /// 기본 Geometry 추출
        /// </summary>
        private Task ExtractBasicGeometry(IfcStore ifcStore, IfcGeometryResult result)
        {
            // 현재, IFC에서 존재하는 물리적인 요소들
            var elements = ifcStore.Instances.OfType<IIfcElement>().ToList();
            // 현재 IFC에서 IIfcSurfaceStyle의 데이터 가져오기 => StyleLabel를 비교하는 방식을 진행한다.
            var surfaceStyles = ifcStore.Instances.OfType<IIfcSurfaceStyle>().ToList();
            _logger.LogInformation("IFC 파일에서 발견된 요소 개수: {Count}", elements.Count);
            
            // 지오메트리 컨텍스트 생성
            var context = new Xbim3DModelContext(ifcStore);
            context.CreateContext();

            int successCount = 0;
            int failCount = 0;

            foreach (var element in elements)
            {
                foreach (var shapeInstance in context.ShapeInstancesOf(element))
                {
                    // 이걸 사용해야 (IfcOpeningElement 등) 불필요한 요소가 안보인다.
                    if (shapeInstance.RepresentationType == XbimGeometryRepresentationType.OpeningsAndAdditionsIncluded)
                    {
                        try
                        {
                            // 지오메트리 정보 가져오기 => Mesh => Vertex, Face
                            var shape = context.ShapeGeometry(shapeInstance.ShapeGeometryLabel);
                            // Offset값을 추출하기위해 필요하다.
                            var tranform = shapeInstance.Transformation;
                            // vertex 배열 (Vector3) - double → float 변환
                            var vertices = new List<float>();
                            foreach (var vertax in shape.Vertices)
                            {
                                var worldPoint = tranform.Transform(vertax);

                                vertices.Add((float)worldPoint.X);
                                vertices.Add((float)worldPoint.Y);
                                vertices.Add((float)worldPoint.Z);
                            }
                            // face 배열 (삼각형 index) - uint[]로 변환
                            var faces = new List<uint>();
                            foreach (var face in shape.Faces)
                            {
                                foreach (var index in face.Indices)
                                {
                                    faces.Add((uint)index);
                                }
                            }
                            // Host 객체 찾기 (IfcRelFillsElement 통해)
                            string? hostId = "";
                            var fills = ifcStore.Instances
                                .OfType<IIfcRelFillsElement>()
                                .Where(r => r.RelatedBuildingElement == element);
                            foreach (var rel in fills)
                            {
                                var opening = rel.RelatingOpeningElement;
                                hostId = opening.VoidsElements.RelatedOpeningElement.GlobalId;
                            }
                            // Color를 담당하는 부분 => string이며 HEX코드로 변환
                            var styleLabel = shapeInstance.StyleLabel;  // 현재, 객체의 스타일라벨 => 1 or 다중(쉐입이 다중인 경우)
                            // IIfcSurfaceStyle 형식이다. => 스타일 라벨이 같은 것만 가져온 후,
                            var findStyle = surfaceStyles.Where(a => a.EntityLabel.Equals(styleLabel)).FirstOrDefault();
                            string hex = ""; // 색상값을 HEX로 변경
                            double opacity = 0;
                            if (findStyle != null)
                            {
                                foreach (var rendering in findStyle.Styles.OfType<IIfcSurfaceStyleRendering>())
                                {
                                    var col = rendering.SurfaceColour;
                                    if (col != null)
                                    {
                                        int r = (int)(col.Red * 255);
                                        int g = (int)(col.Green * 255);
                                        int b = (int)(col.Blue * 255);
                                        hex = $"{r:X2}{g:X2}{b:X2}";
                                        opacity = rendering.Transparency ?? 0;
                                    }
                                }
                            }                            
                            // IfcGeometryData 객체 생성
                            var geometryData = new IfcGeometryData
                            {
                                GlobalId = element.GlobalId,
                                IfcType = element.GetType().Name,
                                Vertices = vertices.ToArray(),
                                Faces = faces.ToArray(),
                                HostId = hostId,
                                ColorHEX = hex,
                                Transparency = opacity
                            };

                            result.Geometries.Add(geometryData);
                            successCount++;

                            _logger.LogInformation("Geometry 추출 성공: {GlobalId} - {IfcType} (정점: {VertexCount}, 면: {FaceCount})",
                                element.GlobalId, element.GetType().Name, vertices.Count / 3, faces.Count / 3);
                        }
                        catch (Exception ex)
                        {
                            failCount++;
                            _logger.LogError(ex, "Geometry 추출 중 오류 발생: {GlobalId}", element.GlobalId);
                        }
                    }
                }
            }            
            _logger.LogInformation("Geometry 추출 완료 - 성공: {SuccessCount}, 실패: {FailCount}", successCount, failCount);
            return Task.CompletedTask;
        }
    }
}