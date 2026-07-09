FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY ["SimplyFly.API/SimplyFly.API.csproj", "SimplyFly.API/"]
RUN dotnet restore "SimplyFly.API/SimplyFly.API.csproj"

COPY . .
WORKDIR /src/SimplyFly.API
RUN dotnet publish "SimplyFly.API.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080

COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "SimplyFly.API.dll"]
