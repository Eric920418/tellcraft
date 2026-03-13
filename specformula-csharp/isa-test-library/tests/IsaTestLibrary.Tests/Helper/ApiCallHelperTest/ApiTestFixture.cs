using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

namespace Tw.Sdd.Isa.TestLib.Tests.Helper.ApiCallHelperTest;

/// <summary>
/// API 測試 Fixture
/// 使用 TestServer 模擬 ASP.NET Core 測試伺服器
/// 對應 Java 的 MockMvcBuilders.standaloneSetup()
/// </summary>
public class ApiTestFixture : IDisposable
{
    public IHost Host { get; }
    public HttpClient Client { get; }
    public RequestCaptureHolder CaptureHolder { get; }

    public ApiTestFixture()
    {
        CaptureHolder = new RequestCaptureHolder();

        Host = Microsoft.Extensions.Hosting.Host.CreateDefaultBuilder()
            .ConfigureWebHostDefaults(webBuilder =>
            {
                webBuilder.UseTestServer();
                webBuilder.ConfigureServices(services =>
                {
                    services.AddSingleton(CaptureHolder);
                    services.AddControllers()
                        .AddApplicationPart(typeof(EchoController).Assembly);
                });
                webBuilder.Configure(app =>
                {
                    app.UseRouting();
                    app.UseEndpoints(endpoints =>
                    {
                        endpoints.MapControllers();
                    });
                });
            })
            .Build();

        Host.Start();
        Client = Host.GetTestClient();
    }

    public void Dispose()
    {
        Client.Dispose();
        Host.Dispose();
        GC.SuppressFinalize(this);
    }
}
