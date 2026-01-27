# Action: createOrder
# Summary: 建立訂單
Feature: 建立訂單

  Background:
    Given 準備一個商品, with table:
      | id   | name     | price | stock |
      | P001 | 宮保雞丁  | 120   | 50    |
      | P002 | 紅燒肉   | 150   | 30    |
    And 準備一個顧客, with table:
      | id   | name | memberLevel |
      | C001 | 小明 | gold        |

  #------------------------------------------------------------
  Rule: 後置 - 訂單總額為所有品項小計加總
  #------------------------------------------------------------

    Example: 成功建立單品項訂單
      When 建立訂單, call table:
        | customerId | items                              |
        | C001       | [{"productId":"P001","quantity":2}] |
      Then 建立訂單成功, with table:
        | orderId | totalAmount | status  |
        | O001    | 240         | pending |
      And 存在一個訂單, with table:
        | id   | customerId | totalAmount | status  |
        | O001 | C001       | 240         | pending |

    Example: 成功建立多品項訂單
      When 建立訂單, call table:
        | customerId | items                                                              |
        | C001       | [{"productId":"P001","quantity":2},{"productId":"P002","quantity":1}] |
      Then 建立訂單成功, with table:
        | orderId | totalAmount | status  |
        | O002    | 390         | pending |
      And 存在一個訂單品項, with table:
        | orderId | productId | quantity | subtotal |
        | O002    | P001      | 2        | 240      |
        | O002    | P002      | 1        | 150      |

  #------------------------------------------------------------
  Rule: 前置 - 建立訂單前必須檢查庫存
  #------------------------------------------------------------

    Example: 庫存不足時拒絕建立訂單
      Given 準備一個商品, with table:
        | id   | name   | price | stock |
        | P003 | 糖醋排骨 | 180   | 3     |
      When 建立訂單, call table:
        | customerId | items                               |
        | C001       | [{"productId":"P003","quantity":10}] |
      Then 操作失敗

  #------------------------------------------------------------
  Rule: 前置 - 訂單必須包含至少一個品項
  #------------------------------------------------------------

    Example: 空訂單被拒絕
      When 建立訂單, call table:
        | customerId | items |
        | C001       | []    |
      Then 操作失敗

  #------------------------------------------------------------
  Rule: 前置 - 品項數量必須大於 0
  #------------------------------------------------------------

    Example: 數量為 0 的品項被拒絕
      When 建立訂單, call table:
        | customerId | items                              |
        | C001       | [{"productId":"P001","quantity":0}] |
      Then 操作失敗

    Example: 數量為負數的品項被拒絕
      When 建立訂單, call table:
        | customerId | items                               |
        | C001       | [{"productId":"P001","quantity":-1}] |
      Then 操作失敗
