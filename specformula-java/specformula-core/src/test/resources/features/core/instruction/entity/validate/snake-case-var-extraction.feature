@entity_validate
Feature: EntityValidate - VAR-System 整合（snake_case 字段名）
  測試 EntityValidate 從資料庫查詢結果（snake_case 字段名）中提取變數（camelCase）的功能。
  驗證當資料庫欄位使用 snake_case（如 review_id）時，能否正確提取為 camelCase 變數（如 reviewId）。

  # ==================== VAR-System snake_case 字段名提取 ====================

  @h2 @postgresql @mysql @mssql
  Scenario: VAR - snake_case 字段名應能正確提取變數（訂單編號 order_id → orderId）
    Given entity-validate primary 建立資料表 tb_Order:
      | column      | type          | pk | notnull | default | auto | fk |
      | order_id    | BIGINT        | Y  |         |         | Y    |    |
      | order_no    | VARCHAR       |    | Y       |         |      |    |
      | total_amount | DECIMAL(10,2) |    |         |         |      |    |
      | created_at  | TIMESTAMP     |    |         |         |      |    |
    And entity-validate primary entity_to_table_mapping:
      | entity | table    |
      | 訂單   | tb_Order |
    And entity-validate 準備一個 訂單:
      | orderNo | totalAmount | createdAt           |
      | ORD-001 | 1500.00     | @time("2025-01-15T10:00:00") |
    When entity-validate 驗證 訂單 資料:
      | >orderId | >orderNo | totalAmount | createdAt           |
      | <orderId | <orderNo | 1500.00     | &sameTime("2025-01-15T10:00:00") |
    Then entity-validate 通過
    And entity-validate context 應有變數:
      | orderId |
      | &gt(0)  |
    And entity-validate context 應有變數:
      | orderNo |
      | ORD-001 |

  @h2 @postgresql @mysql @mssql
  Scenario: VAR - snake_case 複合主鍵應能正確提取變數（訂單明細）
    Given entity-validate primary 建立資料表 tb_Order:
      | column   | type    | pk | notnull | default | auto | fk |
      | order_id | BIGINT  | Y  |         |         | Y    |    |
      | order_no | VARCHAR |    | Y       |         |      |    |
    And entity-validate primary 建立資料表 tb_OrderItem:
      | column       | type          | pk | notnull | default | auto | fk          |
      | order_id     | BIGINT        | Y  |         |         |      | tb_Order.order_id |
      | product_id   | BIGINT        | Y  |         |         |      |             |
      | quantity     | INT           |    |         |         |      |             |
      | unit_price   | DECIMAL(10,2) |    |         |         |      |             |
    And entity-validate primary entity_to_table_mapping:
      | entity   | table        |
      | 訂單     | tb_Order     |
      | 訂單明細 | tb_OrderItem |
    And entity-validate 準備一個 訂單:
      | >orderId | orderNo |
      | <order_id | ORD-001 |
    And entity-validate 準備一個 訂單明細:
      | orderId  | productId | quantity | unitPrice |
      | $orderId | 101       | 2        | 150.00    |
    When entity-validate 驗證 訂單明細 資料:
      | >orderItemOrderId | >orderItemProductId | orderId  | productId | quantity | unitPrice |
      | <orderId          | <productId          | $orderId | 101       | 2        | 150.00    |
    Then entity-validate 通過
    And entity-validate context 應有變數:
      | orderItemOrderId |
      | &gt(0)           |
    And entity-validate context 應有變數:
      | orderItemProductId |
      | 101                |

  @h2 @postgresql @mysql @mssql
  Scenario: VAR - snake_case 字段名提取後使用 $variable 引用驗證（購物車流程）
    Given entity-validate primary 建立資料表 tb_Cart:
      | column     | type    | pk | notnull | default | auto | fk |
      | cart_id    | BIGINT  | Y  |         |         | Y    |    |
      | cart_no    | VARCHAR |    | Y       |         |      |    |
      | customer_id | BIGINT |    | Y       |         |      |    |
      | total_amount | DECIMAL(10,2) |    |         |         |      |    |
    And entity-validate primary 建立資料表 tb_CartItem:
      | column     | type          | pk | notnull | default | auto | fk          |
      | cart_id    | BIGINT        | Y  |         |         |      | tb_Cart.cart_id |
      | product_id | BIGINT        | Y  |         |         |      |             |
      | quantity   | INT           |    |         |         |      |             |
    And entity-validate primary entity_to_table_mapping:
      | entity   | table      |
      | 購物車   | tb_Cart    |
      | 購物車項目 | tb_CartItem |
    And entity-validate 準備一個 購物車:
      | >cartId | cartNo | customerId | totalAmount |
      | <cart_id | CART-001 | 1001      | 2500.00     |
    And entity-validate 準備一個 購物車項目:
      | cartId  | productId | quantity |
      | $cartId | 201       | 3        |
      | $cartId | 202       | 2        |
    When entity-validate 驗證 購物車 資料:
      | cartNo   | customerId | totalAmount |
      | CART-001 | 1001       | 2500.00     |
    Then entity-validate 通過
    When entity-validate 驗證 購物車項目 資料:
      | cartId  | productId | quantity |
      | $cartId | 201       | 3        |
      | $cartId | 202       | 2        |
    Then entity-validate 通過

  @h2 @postgresql @mysql @mssql
  Scenario: VAR - snake_case 多個字段名同時提取（會員註冊）
    Given entity-validate primary 建立資料表 tb_Member:
      | column      | type      | pk | notnull | default | auto | fk |
      | member_id   | BIGINT    | Y  |         |         | Y    |    |
      | member_name | VARCHAR   |    | Y       |         |      |    |
      | email_address | VARCHAR |    |         |         |      |    |
      | phone_number | VARCHAR  |    |         |         |      |    |
      | created_at   | TIMESTAMP |    |         |         |      |    |
    And entity-validate primary entity_to_table_mapping:
      | entity | table     |
      | 會員   | tb_Member |
    And entity-validate 準備一個 會員:
      | memberName | emailAddress      | phoneNumber | createdAt           |
      | 王小明     | wang@example.com  | 0912345678  | @time("2025-01-15T10:00:00") |
    When entity-validate 驗證 會員 資料:
      | >memberId | >memberName | >emailAddress | >phoneNumber | createdAt           |
      | <memberId | <memberName | <emailAddress | <phoneNumber | &sameTime("2025-01-15T10:00:00") |
    Then entity-validate 通過
    And entity-validate context 應有變數:
      | memberId |
      | &gt(0)   |
    And entity-validate context 應有變數:
      | memberName |
      | 王小明     |
    And entity-validate context 應有變數:
      | emailAddress |
      | wang@example.com |
    And entity-validate context 應有變數:
      | phoneNumber |
      | 0912345678 |

  @h2 @postgresql @mysql @mssql
  Scenario: VAR - snake_case 字段名不存在時應正確處理（查詢商品）
    Given entity-validate primary 建立資料表 tb_Product:
      | column     | type    | pk | notnull | default | auto | fk |
      | product_id | BIGINT  | Y  |         |         | Y    |    |
      | product_name | VARCHAR |    | Y       |         |      |    |
      | price      | DECIMAL(10,2) |    |         |         |      |    |
    And entity-validate primary entity_to_table_mapping:
      | entity | table      |
      | 商品   | tb_Product |
    And entity-validate 準備一個 商品:
      | productName | price |
      | 蘋果        | 50.00 |
    When entity-validate 驗證 商品 資料:
      | >productId | >productName | >nonExistentField |
      | <productId | <productName | <nonExistentField |
    Then entity-validate 應拋出例外:
      | message                      |
      | 找不到 execution key 'nonExistentField' |

  @h2 @postgresql @mysql @mssql
  Scenario: VAR - snake_case 與 camelCase 混合字段名提取（商品庫存）
    Given entity-validate primary 建立資料表 tb_Inventory:
      | column       | type    | pk | notnull | default | auto | fk |
      | warehouse_id | BIGINT  | Y  |         |         |      |    |
      | product_id   | BIGINT  | Y  |         |         |      |    |
      | quantity     | INT     |    |         |         |      |    |
      | lastUpdated  | TIMESTAMP |    |         |         |      |    |
    And entity-validate primary entity_to_table_mapping:
      | entity | table        |
      | 庫存   | tb_Inventory |
    And entity-validate 準備一個 庫存:
      | warehouseId | productId | quantity | lastUpdated           |
      | 1            | 101       | 100      | @time("2025-01-15T10:00:00") |
    When entity-validate 驗證 庫存 資料:
      | >warehouseId | >productId | quantity | lastUpdated           |
      | <warehouseId | <productId | 100      | &sameTime("2025-01-15T10:00:00") |
    Then entity-validate 通過
    And entity-validate context 應有變數:
      | warehouseId |
      | 1            |
    And entity-validate context 應有變數:
      | productId |
      | 101       |
