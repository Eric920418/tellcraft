# Action: createOrder
# [POST] /api/orders
# Summary: 建立訂單
Feature: 建立訂單

  Background:
    Given 準備一個商品, with table:
      | >Product1.id | name     | price | stock |
      | <product1Id  | 宮保雞丁  | 120   | 50    |
    And 準備一個商品, with table:
      | >Product2.id | name   | price | stock |
      | <product2Id  | 紅燒肉  | 150   | 30    |
    And 準備一個顧客, with table:
      | >Customer1.id | name | memberLevel |
      | <customerId   | 小明 | gold        |

  #------------------------------------------------------------
  Rule: 後置（狀態）- 訂單總額為所有品項小計加總
  #------------------------------------------------------------

    Example: 成功建立單品項訂單
      When (UID="$Customer1.id") 建立訂單, call table:
        | customerId    | items                                       |
        | $Customer1.id | [{"productId":"$Product1.id","quantity":2}]  |
      Then 建立訂單(201)回應, with table:
        | >order1.id | totalAmount | status  |
        | <orderId   | 240         | pending |
      And 應該存在一個訂單, with table:
        | orderId    | customerId    | totalAmount | status  |
        | $order1.id | $Customer1.id | 240         | pending |

    Example: 成功建立多品項訂單
      When (UID="$Customer1.id") 建立訂單, call table:
        | customerId    | items                                                                        |
        | $Customer1.id | [{"productId":"$Product1.id","quantity":2},{"productId":"$Product2.id","quantity":1}] |
      Then 建立訂單(201)回應, with table:
        | >order2.id | totalAmount | status  |
        | <orderId   | 390         | pending |
      And 應該存在一個訂單品項, with table:
        | orderId    | productId    | quantity | subtotal |
        | $order2.id | $Product1.id | 2        | 240      |
        | $order2.id | $Product2.id | 1        | 150      |

  #------------------------------------------------------------
  Rule: 前置（狀態）- 建立訂單前必須檢查庫存
  #------------------------------------------------------------

    Example: 庫存不足時拒絕建立訂單
      Given 準備一個商品, with table:
        | >Product3.id | name   | price | stock |
        | <product3Id  | 糖醋排骨 | 180   | 3     |
      When (UID="$Customer1.id") 建立訂單, call table:
        | customerId    | items                                        |
        | $Customer1.id | [{"productId":"$Product3.id","quantity":10}]  |
      Then 操作失敗

  #------------------------------------------------------------
  Rule: 前置（參數）- 訂單必須包含至少一個品項
  #------------------------------------------------------------

    Example: 空訂單被拒絕
      When (UID="$Customer1.id") 建立訂單, call table:
        | customerId    | items |
        | $Customer1.id | []    |
      Then 操作失敗

  #------------------------------------------------------------
  Rule: 前置（參數）- 品項數量必須大於 0
  #------------------------------------------------------------

    Example: 數量為 0 的品項被拒絕
      When (UID="$Customer1.id") 建立訂單, call table:
        | customerId    | items                                       |
        | $Customer1.id | [{"productId":"$Product1.id","quantity":0}]  |
      Then 操作失敗

    Example: 數量為負數的品項被拒絕
      When (UID="$Customer1.id") 建立訂單, call table:
        | customerId    | items                                        |
        | $Customer1.id | [{"productId":"$Product1.id","quantity":-1}]  |
      Then 操作失敗
