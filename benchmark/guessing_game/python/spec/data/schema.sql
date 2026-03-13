-- 1A2B 猜數字遊戲資料庫 Schema
-- 此 schema 定義遊戲、玩家和猜測結果的資料結構

-- 遊戲資料表
-- 儲存遊戲的狀態和資訊
CREATE TABLE games (
    id VARCHAR(5) PRIMARY KEY COMMENT '遊戲的唯一識別碼（3-5 個英數字元）',
    status VARCHAR(50) NOT NULL COMMENT '遊戲當前狀態（Waiting for player, Setting secret, Guessing, Ended）',
    winner_id VARCHAR(2) COMMENT '獲勝玩家的 ID（P1 或 P2）'
    -- NOTE: 以下 CHECK 約束被註解是因為 simple-ddl-parser 無法解析包含 OR 的複雜 CHECK 約束
    -- 詳見: src/sdd_os/features/executors/java/backend/validator/codegen/candidates/springjpa_pojo/SIMPLE_DDL_PARSER_LIMITATIONS.md
    -- CHECK (winner_id IN ('P1', 'P2') OR winner_id IS NULL)
) COMMENT '遊戲實體，代表一個 1A2B 遊戲的狀態和資訊';

-- 玩家資料表
-- 儲存參與遊戲的玩家資訊
CREATE TABLE players (
    id BIGINT PRIMARY KEY COMMENT '玩家的角色 ID',
    role VARCHAR(2) NOT NULL CHECK (role IN ('P1', 'P2')) COMMENT '玩家在遊戲中的角色（P1 或 P2）',
    name VARCHAR(20) NOT NULL COMMENT '玩家的顯示名稱',
    secret VARCHAR(4) COMMENT '玩家設定的 4 位秘密數字'
    -- NOTE: 以下 CHECK 約束被註解是因為 simple-ddl-parser 無法解析包含函數的複雜 CHECK 約束
    -- 詳見: src/sdd_os/features/executors/java/backend/validator/codegen/candidates/springjpa_pojo/SIMPLE_DDL_PARSER_LIMITATIONS.md
    -- CHECK (LENGTH(name) >= 1 AND LENGTH(name) <= 20)
    -- CHECK (id > 0)
) COMMENT '玩家實體，代表參與 1A2B 遊戲的玩家';

-- 猜測結果資料表
-- 儲存玩家猜測的結果
CREATE TABLE guess_results (
    id BIGINT PRIMARY KEY COMMENT '猜測結果的唯一識別碼',
    result VARCHAR(5) NOT NULL COMMENT '猜測結果，格式為 XAyB（例如：2A1B）'
) COMMENT '猜測結果實體，表示玩家猜測的結果';
