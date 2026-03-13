package ai.specformula.spring.auth;

/**
 * 預設的 Authenticator 實作。
 * <p>
 * 呼叫 {@link #getToken(Object)} 時直接拋出 {@link UnsupportedOperationException}，
 * 要求使用者在受測專案的 test 中實作並註冊自己的 {@link Authenticator}。
 * </p>
 */
public class DefaultAuthenticator implements Authenticator {

    @Override
    public String getToken(Object actorId) {
        throw new UnsupportedOperationException("""
                [SpecFormula] Authenticator 尚未設定。
                請在受測專案的 test 目錄中建立一個 @TestConfiguration 類別，
                實作 ai.specformula.spring.auth.Authenticator 介面並註冊為 Spring Bean。

                Authenticator 介面定義：
                  String getToken(Object actorId)
                  - 傳入：actorId（Object）— 已解析的使用者識別碼（例如 userId，型別可能為 Long 或 String）
                  - 回傳：String — JWT token（將作為 Authorization: Bearer {token} 傳送）

                範例（src/test/java/.../config/TestConfig.java）：

                  import ai.specformula.spring.auth.Authenticator;
                  import org.springframework.boot.test.context.TestConfiguration;
                  import org.springframework.context.annotation.Bean;
                  import org.springframework.beans.factory.annotation.Autowired;

                  @TestConfiguration
                  public class TestConfig {

                      @Autowired
                      private JwtUtil jwtUtil;

                      @Bean
                      public Authenticator authenticator() {
                          return actorId -> {
                              if (actorId == null) return null;
                              Long userId = actorId instanceof Long
                                  ? (Long) actorId
                                  : Long.parseLong(actorId.toString());
                              return jwtUtil.generateToken(userId);
                          };
                      }
                  }

                接著在 CucumberSpringConfiguration 中引入此設定：

                  @CucumberContextConfiguration
                  @SpringBootTest(classes = {Application.class, TestConfig.class})
                  @AutoConfigureMockMvc
                  public class CucumberSpringConfiguration {}
                """);
    }
}
