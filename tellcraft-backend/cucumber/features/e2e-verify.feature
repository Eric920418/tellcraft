# Action: createNote
# [POST] /api/notes
# Summary: 建立筆記
Feature: SpecFormula 端對端驗證

  Rule: 基礎流程 - entity_setup → api_call → response_validate → entity_validate

    Example: 建立筆記並驗證回應與資料庫狀態
      Given 準備一個筆記, with table:
        | >Note1.id | title      | content        | author |
        | <id       | 測試筆記    | 這是測試內容    | Alice  |
      When (No Actor) 取得筆記, call table:
        | P:id      |
        | $Note1.id |
      Then 取得筆記(200)回應, with table:
        | id        | title   | author |
        | $Note1.id | 測試筆記 | Alice  |
      And 應該存在一個筆記, with table:
        | id        | title   | content     | status |
        | $Note1.id | 測試筆記 | 這是測試內容 | draft  |

    Example: 建立多筆資料並用 API 建立
      Given 準備一個筆記, with table:
        | >Existing.id | title      | content  | author |
        | <id          | 已有筆記    | 既有內容  | Bob    |
      When (No Actor) 建立筆記, call table:
        | title      | content       | author |
        | 新建筆記    | API 建立的內容 | Carol  |
      Then 建立筆記(201)回應, with table:
        | >Created.id | title   | status |
        | <id         | 新建筆記 | draft  |
      And 應該存在一個筆記, with table:
        | id           | title   | author |
        | $Created.id  | 新建筆記 | Carol  |
      And 應該存在一個筆記, with table:
        | id           | title   | author |
        | $Existing.id | 已有筆記 | Bob    |
