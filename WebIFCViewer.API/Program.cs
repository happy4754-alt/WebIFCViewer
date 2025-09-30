using WebIFCViewer.API.Services;

var builder = WebApplication.CreateBuilder(args);

// 서비스 등록
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// CORS 설정 (프론트엔드와의 통신을 위해)
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// 파일 업로드 서비스 등록
builder.Services.AddScoped<IFileUploadService, FileUploadService>();

// IFC 계층 구조 추출 서비스 등록
builder.Services.AddScoped<IfcHierarchyExtractor>();

// IFC 파싱 서비스 등록
builder.Services.AddScoped<IfcParsingService>();

// IFC Geometry 추출 서비스 등록
builder.Services.AddScoped<IfcGeometryExtractor>();

// IFC Property 추출 서비스 등록
builder.Services.AddScoped<IfcPropertyExtractor>();

var app = builder.Build();

// 개발 환경에서 Swagger 사용
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// CORS 미들웨어 사용
app.UseCors("AllowFrontend");

// 정적 파일 서빙 (업로드된 파일 접근을 위해)
app.UseStaticFiles();

// 라우팅 및 컨트롤러 사용
app.UseRouting();
app.MapControllers();

app.Run();
