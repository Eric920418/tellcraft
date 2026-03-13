namespace Tw.Sdd.Isa.TestLib.Testables.Auth;

/// <summary>
/// 認證介面
/// 對應 Java 的 tw.sdd.isa.testlib.testables.auth.Authenticator
/// </summary>
public interface IAuthenticator
{
    /// <summary>
    /// 根據 actor ID 取得認證 token
    /// </summary>
    /// <param name="actorId">actor 的識別 ID</param>
    /// <returns>認證 token</returns>
    string GetToken(object actorId);
}
