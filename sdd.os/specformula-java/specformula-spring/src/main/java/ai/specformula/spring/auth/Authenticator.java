package ai.specformula.spring.auth;

/**
 * 認證介面，負責將 actor 識別碼轉換為 API 認證 token。
 * <p>
 * 受測專案需實作此介面，並透過 Spring Bean 自動注入 {@code SpecFormulaBridge}。
 * 若未註冊，框架會使用 {@link DefaultAuthenticator}，在呼叫時拋出錯誤。
 * </p>
 */
public interface Authenticator {

    /**
     * 根據 actor 識別碼取得認證 token。
     *
     * @param actorId 已解析的 actor 識別碼（如 userId 的實際值）
     * @return 認證 token（將作為 Authorization: Bearer {token} 傳送）
     */
    String getToken(Object actorId);
}
