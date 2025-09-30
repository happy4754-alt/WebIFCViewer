# WebIFCViewer Backend API

IFC 파일을 처리하고 속성정보를 추출하는 ASP.NET Core Web API입니다.

## 🚀 기능

- **IFC 파일 업로드**: IFC 파일을 서버에 업로드
- **속성정보 추출**: IFC 파일에서 속성정보를 추출하여 JSON 형태로 반환
- **파일 관리**: 업로드된 IFC 파일 목록 조회

## 🛠️ 기술 스택

- **.NET 8.0**
- **ASP.NET Core Web API**
- **Xbim.Ifc** (IFC 파일 처리)
- **Entity Framework Core** (데이터베이스)

## 📋 API 엔드포인트

### 속성정보 추출
- `POST /api/IfcProperty/extract/{fileName}` - IFC 파일의 모든 속성정보 추출

### 파일 관리
- `GET /api/IfcProperty/files` - 업로드된 IFC 파일 목록 조회

## 🚀 실행 방법

1. **의존성 설치**
   ```bash
   dotnet restore
   ```

2. **데이터베이스 마이그레이션**
   ```bash
   dotnet ef database update
   ```

3. **애플리케이션 실행**
   ```bash
   dotnet run
   ```

4. **API 문서 확인**
   - Swagger UI: `https://localhost:5001/swagger`

## 📁 프로젝트 구조

```
WebIFCViewer.API/
├── Controllers/          # API 컨트롤러
│   └── IfcPropertyController.cs
├── Models/              # 데이터 모델
│   └── IfcPropertyResult.cs
├── Services/            # 비즈니스 로직
│   └── IfcPropertyExtractor.cs
├── Program.cs           # 애플리케이션 진입점
└── appsettings.json     # 설정 파일
```

## 🔧 설정

### appsettings.json
```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "AllowedHosts": "*"
}
```

## 📝 사용 예시

### 속성정보 추출
```bash
curl -X POST "https://localhost:5001/api/IfcProperty/extract/sample.ifc"
```

### 파일 목록 조회
```bash
curl -X GET "https://localhost:5001/api/IfcProperty/files"
```

## 🤝 기여

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 `LICENSE` 파일을 참조하세요.

## 📞 문의

프로젝트에 대한 문의사항이 있으시면 이슈를 생성해 주세요.
