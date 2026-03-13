package ai.specformula.core.helper;

/**
 * Feature Argument Resolver Interface
 *
 * 整合了三個系統：
 * 1. VAR-System (Variable System) - 變數符號系統
 * 2. CAS (Constraint Assertion System) - 約束斷言系統
 * 3. TIME-System (Time Expression System) - 時間轉換系統
 */
public interface FeatureArgumentResolver {

    // ========== VAR-System: 處理變數引用 ==========

    /**
     * 解析值中的變數引用與表達式，回傳解析後的物件。
     *
     * <p>支援以下語法：</p>
     * <ul>
     *   <li>{@code $variableName} — 從 ScenarioContext 取得變數值</li>
     *   <li>{@code ${variableName}} — 字串插值，可嵌入在任意字串中（如 {@code "Hello ${name}"}）</li>
     *   <li>{@code @time("now-1d")} — 時間表達式，回傳 {@link java.time.ZonedDateTime}</li>
     *   <li>{@code @date("2025-12-16")} — 日期表達式，回傳 {@link java.time.LocalDate}</li>
     *   <li>{@code @localtime("09:00:00")} — 本地時間表達式，回傳 {@link java.time.LocalTime}</li>
     * </ul>
     *
     * @param value 待解析的字串值
     * @return 解析後的物件（可能是原始字串、Context 中的任意物件、或時間型別）
     */
    Object resolveVariable(String value);

    /**
     * 解析期望值並與實際值進行比對驗證。此方法整合了 VAR-System 變數解析與 CAS 約束斷言，
     * 是驗證流程的核心入口。
     *
     * <p>處理邏輯依序為：</p>
     * <ol>
     *   <li>{@code &constraint(...)} — 委派 CAS 約束斷言系統驗證（如 {@code &gt(5)&lt(10)}），
     *       通過則回傳 {@code null}</li>
     *   <li>時間戳比對 — 當解析結果為數值而實際值為時間型別時，自動轉換並以秒為精度比對</li>
     *   <li>數值比對 — 雙方皆為數值時以 {@code double} 精度比對</li>
     *   <li>以上皆不符合時，回傳解析後的期望值，由呼叫端自行比對</li>
     * </ol>
     *
     * @param expectedValue 期望值字串（支援 {@code $variable}、{@code &constraint} 等語法）
     * @param actualValue   實際值物件
     * @param fieldName     欄位名稱（用於錯誤訊息定位）
     * @param entityName    實體名稱（用於錯誤訊息定位）
     * @return 解析後的期望值物件；若已由內部驗證完畢（{@code &constraint}、時間/數值比對）則回傳 {@code null}
     * @throws AssertionError 若驗證失敗（約束條件不滿足、時間/數值不匹配）
     */
    Object resolveAndValidate(String expectedValue, Object actualValue, String fieldName, String entityName);

    // ========== 值比對 ==========

    /**
     * 比對期望值與實際值是否相等（型別感知）。
     *
     * <p>此方法會自動處理以下情況：</p>
     * <ul>
     *   <li>變數解析 — 若期望值為字串，先透過 VAR-System 解析 {@code $variable} 與時間表達式</li>
     *   <li>JDBC 型別正規化 — 將 {@code java.sql.Timestamp}、{@code java.sql.Date}、{@code java.sql.Time}
     *       轉換為對應的 {@code java.time} 型別</li>
     *   <li>{@code BigDecimal} — 使用 {@code compareTo} 而非 {@code equals} 比對（忽略 scale 差異）</li>
     *   <li>時間型別 — {@code LocalDateTime}、{@code Instant} 以秒為精度比對</li>
     *   <li>布林值 — 支援 {@code "0"}/{@code "1"} 與 {@code Boolean} 的互轉（MSSQL BIT 欄位）</li>
     *   <li>跨型別 — 當雙方型別不同時，嘗試以字串形式比對</li>
     * </ul>
     *
     * @param expected 期望值（支援字串形式的變數引用與時間表達式）
     * @param actual   實際值（通常來自資料庫查詢結果）
     * @return 若兩值相等回傳 {@code true}，否則回傳 {@code false}
     */
    boolean valuesEqual(Object expected, Object actual);
}
