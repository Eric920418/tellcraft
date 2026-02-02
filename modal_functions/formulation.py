"""
Modal Formulation Function - BDD Spec 規格生成

完整的 Formulation 階段：
1. 生成 Schema SQL + Entity Mapping
2. 生成所有 Feature Files（一次完成，確保跨 Feature 一致性）
3. 驗證格式（ISA Gherkin 規範）
4. 自癒修復（如有錯誤）

部署指令：
    modal deploy modal_functions/formulation.py

測試指令：
    curl -X POST https://xxx--tellcraft-formulation-generate-spec.modal.run \
      -H "Content-Type: application/json" \
      -d '{"requirements": "訂單管理系統", "resolved_items": []}'
"""

import json
import re
import os
from typing import TypedDict, Optional

import modal

# ============================================================
# Modal App 配置
# ============================================================

app = modal.App("tellcraft-formulation")

image = modal.Image.debian_slim(python_version="3.11").pip_install(
    "anthropic>=0.40.0",
    "fastapi",
    "requests",  # 用於 callback，自動處理重定向
)

# ============================================================
# 類型定義
# ============================================================

# ClarifyItem 使用 dict 類型避免 Python 3.9 兼容性問題
ClarifyItem = dict  # Keys: id, question, whiteTextQuestion, category, status, answer (optional)


class FeatureInfo(TypedDict):
    name: str
    actionName: str
    description: str


class FeatureFile(TypedDict):
    name: str
    actionName: str
    content: str


class FeatureSummary(TypedDict):
    name: str
    actionName: str
    inputs: str
    outputs: str


# ValidationError 使用 dict 類型避免 Python 3.9 兼容性問題
ValidationError = dict  # Keys: code, message, line (optional), suggestion (optional)


# ============================================================
# ISA Gherkin 驗證規則
# ============================================================

ISA_PATTERNS = {
    "entity_setup": {
        "name": "Entity setup",
        "step_type": "Given",
        "regex": re.compile(r"^準備一個[\u4e00-\u9fffa-zA-Z]+, with table:$"),
        "template": "準備一個{entity}, with table:",
    },
    "action_call": {
        "name": "Action call",
        "step_type": "When",
        "regex": re.compile(r"^.+, call table:$"),
        "template": "{summary}, call table:",
    },
    "action_success": {
        "name": "Action success validation",
        "step_type": "Then",
        "regex": re.compile(r"^.+成功,?\s*with table:$"),
        "template": "{summary}成功, with table:",
    },
    "operation_failure": {
        "name": "Operation failure",
        "step_type": "Then",
        "regex": re.compile(r"^操作失敗$"),
        "template": "操作失敗",
    },
    "entity_validate": {
        "name": "Entity validate",
        "step_type": "Then",
        "regex": re.compile(r"^存在一個[\u4e00-\u9fffa-zA-Z]+, with table:$"),
        "template": "存在一個{entity}, with table:",
    },
}


def validate_feature(name: str, content: str) -> list[ValidationError]:
    """驗證單個 Feature File"""
    errors: list[ValidationError] = []
    lines = content.split("\n")

    # 檢查 Action 註解
    if not any(line.strip().startswith("# Action:") for line in lines):
        errors.append({
            "code": "E001",
            "message": f"[{name}] 缺少 Action 註解",
            "suggestion": "在檔案開頭添加 # Action: actionName",
        })

    # 檢查 Summary 註解
    if not any(line.strip().startswith("# Summary:") for line in lines):
        errors.append({
            "code": "E002",
            "message": f"[{name}] 缺少 Summary 註解",
            "suggestion": "在檔案開頭添加 # Summary: 功能名稱",
        })

    # 檢查 Feature 宣告
    feature_match = None
    for line in lines:
        if line.strip().startswith("Feature:"):
            feature_match = line.strip().replace("Feature:", "").strip()
            break

    if not feature_match:
        errors.append({
            "code": "E003",
            "message": f"[{name}] 缺少 Feature 宣告",
        })

    # 檢查 Summary 與 Feature 一致性
    summary_match = None
    for line in lines:
        if line.strip().startswith("# Summary:"):
            summary_match = line.strip().replace("# Summary:", "").strip()
            break

    if summary_match and feature_match and summary_match != feature_match:
        errors.append({
            "code": "E004",
            "message": f"[{name}] Summary ({summary_match}) 與 Feature ({feature_match}) 名稱不一致",
        })

    # 檢查 Rule 標註
    for i, line in enumerate(lines):
        if line.strip().startswith("Rule:"):
            rule_text = line.strip()
            if "前置" not in rule_text and "後置" not in rule_text:
                errors.append({
                    "code": "E005",
                    "line": i + 1,
                    "message": f"[{name}] Rule 缺少前置/後置標註: {rule_text}",
                    "suggestion": "Rule 必須標註「前置」或「後置」",
                })

    # 檢查 When 步驟格式
    for i, line in enumerate(lines):
        stripped = line.strip()
        if stripped.startswith("When "):
            step_text = stripped[5:]  # 移除 "When "
            pattern = ISA_PATTERNS["action_call"]
            if not pattern["regex"].match(step_text):
                errors.append({
                    "code": "E006",
                    "line": i + 1,
                    "message": f"[{name}] When 步驟格式錯誤: {step_text}",
                    "suggestion": "格式應為：{summary}, call table:",
                })

    # 檢查是否有 Example
    has_example = any(line.strip().startswith("Example:") for line in lines)
    if not has_example:
        errors.append({
            "code": "E008",
            "message": f"[{name}] 沒有 Example",
        })

    return errors


def validate_all_features(features: list[FeatureFile]) -> dict:
    """驗證所有 Feature Files"""
    all_errors: list[ValidationError] = []

    for feature in features:
        feature_errors = validate_feature(feature["name"], feature["content"])
        all_errors.extend(feature_errors)

    return {
        "passed": len(all_errors) == 0,
        "errors": all_errors,
        "total_errors": len(all_errors),
    }


# ============================================================
# LLM 調用
# ============================================================

def call_claude(
    system_prompt: str,
    user_message: str,
    max_tokens: int = 8192,
    temperature: float = 0.3,
) -> dict:
    """調用 Claude API"""
    import anthropic

    client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])

    try:
        response = client.messages.create(
            model="claude-sonnet-4-5-20250929",
            max_tokens=max_tokens,
            temperature=temperature,
            system=system_prompt,
            messages=[{"role": "user", "content": user_message}],
        )

        content = response.content[0].text if response.content else ""

        return {
            "success": True,
            "content": content,
            "usage": {
                "input_tokens": response.usage.input_tokens,
                "output_tokens": response.usage.output_tokens,
            },
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
        }


# ============================================================
# Formulation 階段函數
# ============================================================

def format_decisions(resolved_items: list[ClarifyItem]) -> str:
    """格式化釐清決策"""
    decisions = []
    for item in resolved_items:
        if item.get("status") == "resolved" and item.get("answer"):
            decisions.append(f"Q: {item.get('whiteTextQuestion', '')}\nA: {item.get('answer', '')}")
    return "\n\n".join(decisions) if decisions else "（無額外決策）"


def generate_schema_sql(
    requirements: str,
    resolved_items: list[ClarifyItem],
    project_context: Optional[str] = None,
) -> dict:
    """生成 Schema SQL 和 Entity Mapping"""
    decisions = format_decisions(resolved_items)

    system_prompt = """你是一位資深的資料庫架構師。根據需求和釐清決策，產出 SQL Schema 和 Entity 映射。

## 輸出格式

### 1. SQL Schema (schema.sql)
```sql
-- 實體名稱
CREATE TABLE table_name (
    id VARCHAR(10) PRIMARY KEY COMMENT '唯一識別碼',
    column_name TYPE NOT NULL COMMENT '欄位說明',
    -- 約束條件
    CONSTRAINT chk_name CHECK (condition)
) COMMENT '實體說明';
```

### 2. Entity Mapping (YAML)
```yaml
entity_to_table_mapping:
  - 中文實體名: table_name
```

## 規則
- 每個欄位必須有 COMMENT 說明
- 限制條件用 CHECK constraint 表達
- 使用 snake_case 命名
- 不要假設需求中沒有的欄位

輸出 JSON 格式：
```json
{
  "schemaSql": "完整的 SQL DDL",
  "entityMapping": "完整的 YAML"
}
```"""

    project_prefix = f"專案背景：{project_context}\n\n" if project_context else ""
    user_message = f"""{project_prefix}需求描述：
{requirements}

---

釐清決策：
{decisions}"""

    response = call_claude(system_prompt, user_message, max_tokens=8192, temperature=0.2)

    if not response["success"]:
        return {"success": False, "error": response.get("error", "LLM 調用失敗")}

    try:
        content = response["content"]
        json_match = re.search(r"```json\s*([\s\S]*?)\s*```", content) or re.search(r"\{[\s\S]*\}", content)

        if not json_match:
            return {"success": False, "error": "無法解析 LLM 回應"}

        json_str = json_match.group(1) if "```" in (json_match.group(0) or "") else json_match.group(0)
        parsed = json.loads(json_str)

        return {
            "success": True,
            "schema_sql": parsed.get("schemaSql", ""),
            "entity_mapping": parsed.get("entityMapping", ""),
        }
    except Exception as e:
        return {"success": False, "error": f"解析回應時發生錯誤: {e}"}


def identify_features_with_interfaces(
    requirements: str,
    resolved_items: list[ClarifyItem],
    schema_sql: str,
    entity_mapping: str,
    project_context: Optional[str] = None,
) -> dict:
    """
    第一階段：一次調用識別所有 Features 並定義統一接口

    這確保了跨 Feature 的命名一致性（如 orderId 在所有 Features 中使用相同名稱）
    """
    decisions = format_decisions(resolved_items)

    system_prompt = """你是一位資深的 BDD 分析師。根據需求和 Schema，一次識別所有功能並定義它們的接口。

## 任務
1. 分析需求，列出所有需要實現的功能
2. 為每個功能定義輸入參數（inputs）和輸出結果（outputs）
3. **確保跨功能的命名一致性**：如果多個功能都用到同一個欄位（如訂單ID），必須使用相同的命名

## 輸出格式
```json
{
  "features": [
    {
      "name": "建立訂單",
      "actionName": "createOrder",
      "description": "用戶可以建立新訂單，包含商品和數量",
      "inputs": ["userId", "items"],
      "outputs": ["orderId", "totalAmount", "createdAt"],
      "relatedEntities": ["訂單", "訂單項目"]
    },
    {
      "name": "取消訂單",
      "actionName": "cancelOrder",
      "description": "用戶可以取消未出貨的訂單",
      "inputs": ["orderId"],
      "outputs": ["success", "cancelledAt"],
      "relatedEntities": ["訂單"]
    },
    {
      "name": "查詢訂單",
      "actionName": "getOrder",
      "description": "查詢單一訂單的詳細資訊",
      "inputs": ["orderId"],
      "outputs": ["orderId", "userId", "items", "status", "totalAmount"],
      "relatedEntities": ["訂單", "訂單項目"]
    }
  ]
}
```

## 命名一致性規則（非常重要）
1. **ID 欄位**：如果「建立訂單」輸出 `orderId`，則「取消訂單」和「查詢訂單」的輸入也必須叫 `orderId`
2. **狀態欄位**：所有功能使用相同的狀態命名（如 `status`、`isCompleted`）
3. **時間欄位**：統一使用 `createdAt`、`updatedAt`、`deletedAt` 等命名
4. **參考 Schema**：欄位命名應與 SQL Schema 的欄位名對應（snake_case 轉 camelCase）

## 其他規則
1. 每個功能名稱要簡潔明確（如「建立訂單」而非「訂單建立功能」）
2. actionName 用 camelCase（如 createOrder）
3. inputs/outputs 用 camelCase
4. relatedEntities 使用中文實體名稱（對應 Entity Mapping）"""

    project_prefix = f"專案背景：{project_context}\n\n" if project_context else ""
    user_message = f"""{project_prefix}需求描述：
{requirements}

---

SQL Schema：
{schema_sql}

---

Entity Mapping：
{entity_mapping}

---

釐清決策：
{decisions}

---

請一次列出所有功能及其接口定義，確保跨功能的命名一致性。"""

    response = call_claude(system_prompt, user_message, max_tokens=8192, temperature=0.3)

    if not response["success"]:
        return {"success": False, "error": response.get("error", "LLM 調用失敗")}

    try:
        content = response["content"]
        json_match = re.search(r"```json\s*([\s\S]*?)\s*```", content) or re.search(r"\{[\s\S]*\}", content)

        if not json_match:
            return {"success": False, "error": "無法解析 LLM 回應"}

        json_str = json_match.group(1) if "```" in (json_match.group(0) or "") else json_match.group(0)
        parsed = json.loads(json_str)

        return {
            "success": True,
            "features": parsed.get("features", []),
        }
    except Exception as e:
        return {"success": False, "error": f"解析回應時發生錯誤: {e}"}


def extract_feature_summary(content: str, feature_info: FeatureInfo) -> FeatureSummary:
    """從 Feature 內容中提取輸入輸出摘要"""
    # 提取 When 步驟的表格欄位作為輸入
    when_match = re.search(
        r"When\s+[^,]+,\s*call table:\s*\n\s*\|([^|]+(?:\|[^|]+)*)\|",
        content,
        re.IGNORECASE,
    )
    inputs = "(未識別)"
    if when_match:
        inputs = ", ".join(s.strip() for s in when_match.group(1).split("|") if s.strip())

    # 提取 Then 成功步驟的表格欄位作為輸出
    then_match = re.search(
        r"Then\s+[^,]+成功,?\s*with table:\s*\n\s*\|([^|]+(?:\|[^|]+)*)\|",
        content,
        re.IGNORECASE,
    )
    outputs = "(未識別)"
    if then_match:
        outputs = ", ".join(s.strip() for s in then_match.group(1).split("|") if s.strip())

    return {
        "name": feature_info["name"],
        "actionName": feature_info["actionName"],
        "inputs": inputs,
        "outputs": outputs,
    }


def generate_single_feature_with_interface(
    feature_with_interface: dict,
    all_features_interfaces: list[dict],
    requirements: str,
    resolved_items: list[ClarifyItem],
    schema_sql: str,
    entity_mapping: str,
    project_context: Optional[str] = None,
) -> dict:
    """
    第二階段：根據統一接口定義生成單個 Feature 的完整內容

    Args:
        feature_with_interface: 當前要生成的 Feature（包含 inputs/outputs 定義）
        all_features_interfaces: 所有 Features 的接口定義（用於跨 Feature 參考）
    """
    decisions = format_decisions(resolved_items)

    feature_name = feature_with_interface.get('name', '')
    action_name = feature_with_interface.get('actionName', '')
    description = feature_with_interface.get('description', '')
    inputs = feature_with_interface.get('inputs', [])
    outputs = feature_with_interface.get('outputs', [])
    related_entities = feature_with_interface.get('relatedEntities', [])

    # 構建所有 Features 接口的上下文（確保跨 Feature 一致性）
    all_interfaces_desc = "\n".join(
        f"- **{f.get('name')}** ({f.get('actionName')}): 輸入=[{', '.join(f.get('inputs', []))}] → 輸出=[{', '.join(f.get('outputs', []))}]"
        for f in all_features_interfaces
    )

    system_prompt = f"""你是一位資深的 BDD 分析師。為指定的功能產出完整的 sdd.os ISA 格式 Feature File。

## 要產出的功能
- 名稱：{feature_name}
- Action：{action_name}
- 描述：{description}
- **輸入參數**：{', '.join(inputs) if inputs else '（無）'}
- **輸出結果**：{', '.join(outputs) if outputs else '（無）'}
- **相關實體**：{', '.join(related_entities) if related_entities else '（無）'}

## 所有功能的接口定義（必須嚴格遵守命名）
{all_interfaces_desc}

**⚠️ 重要**：
1. When 步驟的表格欄位必須使用上面定義的**輸入參數**命名
2. Then 成功步驟的表格欄位必須使用上面定義的**輸出結果**命名
3. 如果需要引用其他功能的輸出（如 `orderId`），必須使用完全相同的命名

## sdd.os ISA Gherkin 格式

```gherkin
# Action: {action_name}
# Summary: {feature_name}
Feature: {feature_name}

  Background:
    Given 準備一個{{entity}}, with table:
      | column1 | column2 |
      | value1  | value2  |

  #------------------------------------------------------------
  Rule: 前置/後置 - 規則描述
  #------------------------------------------------------------

    Example: 例子名稱
      When {feature_name}, call table:
        | {' | '.join(inputs) if inputs else 'param1'} |
        | value1 {'| value2 ' * (len(inputs) - 1) if len(inputs) > 1 else ''}|
      Then {feature_name}成功, with table:
        | {' | '.join(outputs) if outputs else 'result'} |
        | value1 {'| value2 ' * (len(outputs) - 1) if len(outputs) > 1 else ''}|
      And 存在一個{{entity}}, with table:
        | column1 | column2 |
        | value1  | value2  |

    Example: 錯誤情境
      When {feature_name}, call table:
        | {' | '.join(inputs) if inputs else 'param1'} |
        | invalid_value |
      Then 操作失敗
```

## 格式規則
1. **Action 綁定**：檔案開頭必須有 `# Action:` 和 `# Summary:` 註解
2. **Rule 標註**：每個 Rule 必須標註 `前置` 或 `後置`
3. **When 格式**：`{feature_name}, call table:`
4. **Then 成功格式**：`{feature_name}成功, with table:`
5. **Then 失敗格式**：`操作失敗`
6. **Entity 驗證格式**：`存在一個{{entity}}, with table:`
7. **summary 一致**：Feature 名稱必須與 When/Then 中的 summary 一致
8. **欄位命名**：When 表格必須使用 [{', '.join(inputs)}]，Then 表格必須使用 [{', '.join(outputs)}]

## Entity 映射
{entity_mapping}

## 輸出
直接輸出完整的 .feature 檔案內容，不需要 JSON 包裝。以 `# Action:` 開頭。"""

    project_prefix = f"專案背景：{project_context}\n\n" if project_context else ""
    user_message = f"""{project_prefix}需求描述：
{requirements}

---

SQL Schema：
{schema_sql}

---

釐清決策：
{decisions}

---

請產出「{feature_name}」的完整 Feature File 內容。
- 輸入參數必須使用：{', '.join(inputs) if inputs else '（無）'}
- 輸出結果必須使用：{', '.join(outputs) if outputs else '（無）'}"""

    response = call_claude(system_prompt, user_message, max_tokens=8192, temperature=0.3)

    if not response["success"]:
        return {"success": False, "error": response.get("error", "LLM 調用失敗")}

    content = (response.get("content") or "").strip()

    # 驗證內容是否包含必要元素
    if "# Action:" not in content or "Feature:" not in content:
        return {"success": False, "error": "生成的內容缺少必要元素"}

    return {
        "success": True,
        "feature": {
            "name": feature_name,
            "actionName": action_name,
            "content": content,
        },
    }


def fix_features(
    features_to_fix: list[dict],
    resolved_items: list[ClarifyItem],
) -> dict:
    """批量修復有錯誤的 Features"""
    decisions = format_decisions(resolved_items)

    # 構建要修復的 Features 描述
    features_desc = "\n\n---\n\n".join(
        f"### Feature: {f['name']}\n\n**錯誤**：\n" + "\n".join(f"- {e}" for e in f["errors"]) + f"\n\n**原始內容**：\n```gherkin\n{f['content']}\n```"
        for f in features_to_fix
    )

    system_prompt = """你是一位資深的 BDD 分析師。請修復以下 Feature Files 中的格式錯誤。

## 修復規則
1. **E001**: 添加 `# Action: actionName` 註解
2. **E002**: 添加 `# Summary: 功能名稱` 註解
3. **E004**: 確保 Summary 與 Feature 名稱一致
4. **E005**: 為 Rule 添加「前置」或「後置」標註
5. **E006**: 修正 When 步驟格式為 `{summary}, call table:`
6. **E008**: 確保有至少一個 Example

## 輸出格式
```json
{
  "fixedFeatures": [
    {
      "name": "功能名稱",
      "content": "修復後的完整 .feature 內容"
    }
  ]
}
```

**重要**：只輸出修復後的內容，保持其他部分不變。"""

    user_message = f"""請修復以下 Feature Files：

{features_desc}

---

釐清決策（供參考）：
{decisions}"""

    response = call_claude(system_prompt, user_message, max_tokens=65536, temperature=0.2)

    if not response["success"]:
        return {"success": False, "error": response.get("error", "LLM 調用失敗")}

    try:
        content = response["content"]
        json_match = re.search(r"```json\s*([\s\S]*?)\s*```", content) or re.search(r"\{[\s\S]*\}", content)

        if not json_match:
            return {"success": False, "error": "無法解析 LLM 回應"}

        json_str = json_match.group(1) if "```" in (json_match.group(0) or "") else json_match.group(0)
        parsed = json.loads(json_str)

        return {
            "success": True,
            "fixed_features": parsed.get("fixedFeatures", []),
        }
    except Exception as e:
        return {"success": False, "error": f"解析回應時發生錯誤: {e}"}


# ============================================================
# 主函數 - Modal HTTP Endpoint
# ============================================================

def send_callback(callback_url: str, session_id: str, conversation_id: str, result: dict):
    """發送結果到 callback URL（使用 requests 自動處理重定向）"""
    import requests

    payload = {
        "sessionId": session_id,
        "conversationId": conversation_id,
        **result,
    }

    try:
        response = requests.post(
            callback_url,
            json=payload,
            timeout=30,
            allow_redirects=True,  # 自動處理 308 等重定向
        )
        response.raise_for_status()
        print(f"[Callback] 成功發送到 {callback_url}, status={response.status_code}")
    except requests.exceptions.RequestException as e:
        print(f"[Callback] 發送失敗: {e}")
    except Exception as e:
        print(f"[Callback] 發送失敗: {e}")


@app.function(
    image=image,
    timeout=30 * 60,  # 30 分鐘超時
    secrets=[modal.Secret.from_name("tellcraft-secrets")],
)
def formulation_worker(
    requirements: str,
    resolved_items: list,
    project_context: Optional[str],
    session_id: str,
    conversation_id: str,
    callback_url: str,
):
    """
    異步執行 Formulation 並回調結果。
    這個函數會被 generate_spec 使用 .spawn() 觸發，在後台運行。
    """
    print(f"[Worker] 開始執行 Formulation: session_id={session_id}")

    try:
        result = _execute_formulation(requirements, resolved_items, project_context)
        print(f"[Worker] Formulation 完成，發送回調...")
        send_callback(callback_url, session_id, conversation_id, result)
    except Exception as e:
        error_result = {"success": False, "error": str(e)}
        print(f"[Worker] Formulation 失敗: {e}")
        send_callback(callback_url, session_id, conversation_id, error_result)

    print(f"[Worker] 任務完成: session_id={session_id}")


@app.function(
    image=image,
    timeout=60,  # HTTP 端點只需要很短的超時
    secrets=[modal.Secret.from_name("tellcraft-secrets")],
)
@modal.fastapi_endpoint(method="POST")
def generate_spec(request: dict) -> dict:
    """
    完整的 Formulation 階段（異步模式）：
    1. 生成 Schema SQL + Entity Mapping
    2. 生成所有 Feature Files（一次完成，確保跨 Feature 一致性）
    3. 驗證格式
    4. 自癒修復（如有錯誤，最多 3 次）
    5. 完成後調用 callback_url 發送結果

    Request Body:
    {
        "requirements": "需求描述",
        "resolved_items": [...],
        "project_context": "專案背景（可選）",
        "session_id": "BDD Session ID",
        "conversation_id": "對話 ID",
        "callback_url": "完成後回調的 URL"
    }

    Response (立即返回):
    {
        "accepted": true,
        "message": "任務已接受，完成後會調用 callback"
    }
    """
    requirements = request.get("requirements", "")
    resolved_items = request.get("resolved_items", [])
    project_context = request.get("project_context")
    session_id = request.get("session_id", "")
    conversation_id = request.get("conversation_id", "")
    callback_url = request.get("callback_url", "")

    # 驗證必要參數
    if not requirements:
        return {"success": False, "error": "缺少 requirements 參數"}

    if not callback_url or not session_id or not conversation_id:
        # 沒有 callback 配置，使用同步模式（向後兼容）
        print("[Formulation] 同步模式（無 callback）")
        return _execute_formulation(requirements, resolved_items, project_context)

    # 異步模式：使用 spawn() 觸發後台 worker，立即返回
    print(f"[Formulation] 異步模式：觸發 worker，session_id={session_id}")

    # spawn() 會在後台異步執行，不會阻塞
    formulation_worker.spawn(
        requirements=requirements,
        resolved_items=resolved_items,
        project_context=project_context,
        session_id=session_id,
        conversation_id=conversation_id,
        callback_url=callback_url,
    )

    # 立即返回確認
    return {"accepted": True, "message": "任務已接受，完成後會調用 callback"}


def _execute_formulation(
    requirements: str,
    resolved_items: list,
    project_context: Optional[str],
) -> dict:
    """執行 Formulation 的核心邏輯"""
    if not requirements:
        return {"success": False, "error": "缺少 requirements 參數"}

    # Step 1: 生成 Schema SQL
    print("[Formulation] Step 1: 生成 Schema SQL...")
    schema_result = generate_schema_sql(requirements, resolved_items, project_context)

    if not schema_result["success"]:
        return {"success": False, "error": f"生成 Schema 失敗: {schema_result.get('error', '')}", "step": "schema"}

    schema_sql = schema_result["schema_sql"]
    entity_mapping = schema_result["entity_mapping"]

    # Step 2: 第一階段 - 一次識別所有 Features 並定義統一接口
    print("[Formulation] Step 2: 識別 Features 並定義統一接口（確保跨 Feature 一致性）...")
    identify_result = identify_features_with_interfaces(
        requirements, resolved_items, schema_sql, entity_mapping, project_context
    )

    if not identify_result["success"] or not identify_result.get("features"):
        return {"success": False, "error": f"識別 Features 失敗: {identify_result.get('error', '')}", "step": "identify"}

    all_features_interfaces = identify_result["features"]
    print(f"[Formulation] 識別到 {len(all_features_interfaces)} 個 Features，接口定義：")
    for f in all_features_interfaces:
        print(f"  - {f.get('name')} ({f.get('actionName')}): 輸入={f.get('inputs', [])} → 輸出={f.get('outputs', [])}")

    # Step 3: 第二階段 - 根據統一接口定義逐個生成完整 Feature 內容
    print("[Formulation] Step 3: 根據統一接口生成 Feature Files...")
    generated_features: list[FeatureFile] = []

    for i, feature_with_interface in enumerate(all_features_interfaces):
        feature_name = feature_with_interface.get('name', f'Feature_{i}')
        print(f"[Formulation] 生成 Feature {i + 1}/{len(all_features_interfaces)}: {feature_name}")

        result = generate_single_feature_with_interface(
            feature_with_interface,
            all_features_interfaces,  # 傳入所有 Features 的接口定義
            requirements,
            resolved_items,
            schema_sql,
            entity_mapping,
            project_context,
        )

        if result["success"] and result.get("feature"):
            generated_features.append(result["feature"])
        else:
            print(f"[Formulation] 警告：生成 Feature '{feature_name}' 失敗: {result.get('error', '')}")

    if not generated_features:
        return {"success": False, "error": "沒有成功生成任何 Feature", "step": "generate"}

    # Step 4: 驗證格式
    print("[Formulation] Step 4: 驗證格式...")
    validation = validate_all_features(generated_features)

    # Step 5: 自癒修復（如有錯誤，最多 3 次）
    max_fix_attempts = 3
    fix_attempt = 0

    while not validation["passed"] and fix_attempt < max_fix_attempts:
        fix_attempt += 1
        print(f"[Formulation] Step 5: 自癒修復 (嘗試 {fix_attempt}/{max_fix_attempts})...")

        # 收集需要修復的 Features
        features_to_fix = []
        for feature in generated_features:
            feature_errors = [
                e["message"] for e in validation["errors"]
                if feature["name"] in e["message"]
            ]
            if feature_errors:
                features_to_fix.append({
                    "name": feature["name"],
                    "content": feature["content"],
                    "errors": feature_errors,
                })

        if not features_to_fix:
            break

        # 批量修復
        fix_result = fix_features(features_to_fix, resolved_items)

        if fix_result["success"] and fix_result.get("fixed_features"):
            # 用修復後的內容替換原來的
            fixed_map = {f["name"]: f["content"] for f in fix_result["fixed_features"]}
            generated_features = [
                {**f, "content": fixed_map.get(f["name"], f["content"])}
                for f in generated_features
            ]

            # 重新驗證
            validation = validate_all_features(generated_features)
        else:
            print(f"[Formulation] 修復失敗: {fix_result.get('error', '')}")
            break

    print(f"[Formulation] 完成！生成 {len(generated_features)} 個 Features，驗證 {'通過' if validation['passed'] else '未通過'}")

    return {
        "success": True,
        "schema_sql": schema_sql,
        "entity_mapping": entity_mapping,
        "features": generated_features,
        "validation": {
            "passed": validation["passed"],
            "errors": [e["message"] for e in validation["errors"]],
            "total_errors": validation["total_errors"],
        },
    }


# ============================================================
# 本地測試入口
# ============================================================

@app.local_entrypoint()
def main():
    """本地測試入口"""
    test_request = {
        "requirements": "幫我做一個簡單的訂單管理系統，可以建立訂單、查詢訂單、取消訂單",
        "resolved_items": [],
        "project_context": None,
    }

    result = generate_spec.remote(test_request)
    print(json.dumps(result, ensure_ascii=False, indent=2))
