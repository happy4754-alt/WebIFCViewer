# Use the official .NET 8 runtime as base image
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 8080

# Use the official .NET 8 SDK for building
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["WebIFCViewer.API/WebIFCViewer.API.csproj", "WebIFCViewer.API/"]
RUN dotnet restore "WebIFCViewer.API/WebIFCViewer.API.csproj"
COPY . .
WORKDIR "/src/WebIFCViewer.API"
RUN dotnet build "WebIFCViewer.API.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "WebIFCViewer.API.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENV ASPNETCORE_URLS=http://+:8080
ENTRYPOINT ["dotnet", "WebIFCViewer.API.dll"]
