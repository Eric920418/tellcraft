# Action: configureWebhook
# Summary: 配置Webhook
Feature: 配置Webhook

  Background:
    Given 準備一個用戶, with table:
      | id                                   | email            | plan | subscription_status |
      | 550e8400-e29b-41d4-a716-446655440000 | test@example.com | pro  | active              |

  #------------------------------------------------------------
  Rule: 後置 - 成功配置 Webhook（決議 #28）
  #------------------------------------------------------------

    Example: 配置任務完成通知的 Webhook
      When 配置Webhook, call table:
        | userId                               | url                              | events                              |
        | 550e8400-e29b-41d4-a716-446655440000 | https://example.com/webhook      | task_completed,task_failed          |
      Then 配置Webhook成功, with table:
        | webhookId                            | isActive |
        | 550e8400-e29b-41d4-a716-446655440400 | true     |
      And 存在一個Webhook配置, with table:
        | id                                   | user_id                              | url                           | is_active |
        | 550e8400-e29b-41d4-a716-446655440400 | 550e8400-e29b-41d4-a716-446655440000 | https://example.com/webhook   | true      |

  #------------------------------------------------------------
  Rule: 前置 - URL 必須是有效的 HTTPS
  #------------------------------------------------------------

    Example: HTTP URL 被拒絕
      When 配置Webhook, call table:
        | userId                               | url                         | events         |
        | 550e8400-e29b-41d4-a716-446655440000 | http://example.com/webhook  | task_completed |
      Then 操作失敗

  #------------------------------------------------------------
  Rule: 後置 - 更新已存在的 Webhook
  #------------------------------------------------------------

    Example: 更新 Webhook 的事件訂閱
      Given 準備一個Webhook配置, with table:
        | id                                   | user_id                              | url                           | is_active |
        | 550e8400-e29b-41d4-a716-446655440401 | 550e8400-e29b-41d4-a716-446655440000 | https://example.com/old       | true      |
      When 配置Webhook, call table:
        | webhookId                            | url                           | events                     |
        | 550e8400-e29b-41d4-a716-446655440401 | https://example.com/new       | task_completed,task_failed |
      Then 配置Webhook成功, with table:
        | webhookId                            | url                     |
        | 550e8400-e29b-41d4-a716-446655440401 | https://example.com/new |

  #------------------------------------------------------------
  Rule: 後置 - 停用 Webhook
  #------------------------------------------------------------

    Example: 停用現有的 Webhook
      Given 準備一個Webhook配置, with table:
        | id                                   | user_id                              | is_active |
        | 550e8400-e29b-41d4-a716-446655440402 | 550e8400-e29b-41d4-a716-446655440000 | true      |
      When 配置Webhook, call table:
        | webhookId                            | isActive |
        | 550e8400-e29b-41d4-a716-446655440402 | false    |
      Then 配置Webhook成功, with table:
        | webhookId                            | isActive |
        | 550e8400-e29b-41d4-a716-446655440402 | false    |
