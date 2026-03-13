import { Then } from '@cucumber/cucumber';
import { Response } from 'supertest';
import { getNestedField } from './utils';
import assert from 'assert';

/**
 * 驗證 HTTP 回應的 JSON 欄位（含 API summary 和 status code）
 *
 * 範例：
 *   Then 加入遊戲(200)回應, with table:
 *     | gameId | playerRole |
 *     | ABC    | P1         |
 */
Then(/^(.+)\((\d+)\)回應, with table:$/, function (apiSummary: string, expectedStatusCode: string, dataTable) {
  const statusCode = parseInt(expectedStatusCode, 10);
  const response: Response | null = this.scenarioContext.getLastResponse();

  // 驗證 response 存在
  assert(response !== null, 'No HTTP response found in scenario context');

  // 驗證 status code 符合預期
  assert.strictEqual(
    response.status,
    statusCode,
    `API '${apiSummary}' 預期 HTTP status code 為 ${statusCode}，但實際為 ${response.status}`
  );

  // 驗證回應內容
  validateResponseWithTable(response, dataTable);
});

/**
 * 驗證 HTTP 回應的 JSON 欄位
 *
 * 範例：
 *   Then 回應, with table:
 *     | gameId | playerRole |
 *     | ABC    | P1         |
 */
Then('回應, with table:', function (dataTable) {
  const response: Response | null = this.scenarioContext.getLastResponse();

  // 驗證 response 存在
  assert(response !== null, 'No HTTP response found in scenario context');

  // 驗證 status code 為 2xx
  assert(
    response.status >= 200 && response.status <= 299,
    `Expected successful response (2xx), but got ${response.status}`
  );

  // 驗證回應內容
  validateResponseWithTable(response, dataTable);
});

/**
 * 驗證回應內容與 DataTable 的共用邏輯
 */
function validateResponseWithTable(response: Response, dataTable: any) {
  const expectedRow = dataTable.hashes()[0];

  // 逐一驗證每個欄位
  for (const [fieldPath, expectedValue] of Object.entries(expectedRow)) {
    // 跳過 VAR-System 的 context key (以 > 開頭)
    if (fieldPath.startsWith('>')) {
      continue;
    }

    // 跳過 execution key (以 < 開頭)
    if (fieldPath.startsWith('<')) {
      continue;
    }

    const actualValue = getNestedField(response.body, fieldPath);

    // Type-tolerant comparison: convert both values to strings
    const actualValueStr = String(actualValue);
    const expectedValueStr = String(expectedValue);

    assert.strictEqual(
      actualValueStr,
      expectedValueStr,
      `Expected field '${fieldPath}' to be '${expectedValue}', but got '${actualValue}'`
    );
  }
}

/**
 * 驗證 HTTP 回應為失敗（4xx）
 *
 * 範例：
 *   Then 操作失敗
 */
Then('操作失敗', function () {
  const response: Response | null = this.scenarioContext.getLastResponse();

  // 驗證 response 存在
  assert(response !== null, 'No HTTP response found in scenario context');

  // 驗證 status code 為 4xx
  assert(
    response.status >= 400 && response.status <= 499,
    `Expected client error (4xx), but got ${response.status}`
  );
});
