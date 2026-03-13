-- 特務人資系統資料庫 Schema
-- 時區說明：所有 TIMESTAMP 欄位使用台灣時區 (UTC+8)
-- 工時精度：DECIMAL(5, 2) 代表小數點後兩位，以分鐘為單位計算（符合台灣勞基法）

-- 特務資料表
-- 採用軟刪除策略：特務資料不實際刪除，改變狀態為 'INACTIVE'（已離職）以符合勞基法 5 年記錄保存要求
-- 包含請假系統所需的擴展欄位（入職日期、性別、婚姻狀態等）
-- 主管關聯設計：
--   - manager_id 為 0..1 關聯（每個特務最多一個直屬主管）
--   - 使用外鍵約束確保資料完整性
--   - 允許指向已離職主管（保留歷史組織關係）
--   - 循環參照檢查在應用程式層級處理
--   - 請假審核規則：approved_by 必須是申請人的 manager_id
CREATE TABLE agents (
    agent_id SERIAL PRIMARY KEY COMMENT '特務編號（系統自動產生的流水號）',
    name VARCHAR(100) NOT NULL COMMENT '特務名稱',
    email VARCHAR(255) UNIQUE NOT NULL COMMENT '電子郵件（用於登入帳號）',
    password_hash VARCHAR(255) NOT NULL COMMENT '密碼雜湊值（bcrypt）',
    position VARCHAR(100) COMMENT '職位',
    hire_date DATE COMMENT '入職日期',
    termination_date DATE COMMENT '離職日期（軟刪除使用）',
    gender VARCHAR(10) COMMENT '性別（用於生理假、陪產假）',
    marital_status VARCHAR(20) COMMENT '婚姻狀態',
    manager_id INT COMMENT '直屬主管編號（外鍵指向 agents.agent_id，0..1 關聯）',
    last_login_at TIMESTAMP COMMENT '最後登入時間',
    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')) COMMENT '特務狀態：ACTIVE=在職, INACTIVE=已離職（軟刪除，保留歷史記錄以符合勞基法）',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '建立時間',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '更新時間',
    FOREIGN KEY (manager_id) REFERENCES agents(agent_id) ON DELETE RESTRICT
);

-- 打卡記錄表
-- 外鍵使用 RESTRICT：禁止刪除有打卡記錄的特務，配合軟刪除保留完整審計記錄
CREATE TABLE punch_records (
    record_id SERIAL PRIMARY KEY,
    agent_id INT NOT NULL COMMENT '特務編號（外鍵）',
    punch_type VARCHAR(10) NOT NULL CHECK (punch_type IN ('IN', 'OUT')) COMMENT '打卡類型：IN 或 OUT',
    punch_time TIMESTAMP NOT NULL COMMENT '打卡時間戳記（台灣時區 UTC+8）',
    punch_date DATE NOT NULL COMMENT '打卡日期',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '建立時間',
    FOREIGN KEY (agent_id) REFERENCES agents(agent_id) ON DELETE RESTRICT
);

-- 請假申請表
CREATE TABLE leave_requests (
    request_id SERIAL PRIMARY KEY COMMENT '申請編號',
    agent_id INT NOT NULL COMMENT '特務編號（外鍵）',
    leave_type VARCHAR(20) NOT NULL COMMENT '假別類型',
    start_date DATE NOT NULL COMMENT '起假日期',
    end_date DATE NOT NULL COMMENT '迄假日期',
    duration_type VARCHAR(20) DEFAULT 'FULL_DAY' CHECK (duration_type IN ('FULL_DAY', 'TIME_RANGE')) COMMENT '請假類型：FULL_DAY=全日假，TIME_RANGE=時段假',
    start_time TIME COMMENT '起假時間（TIME_RANGE 時須填）',
    end_time TIME COMMENT '迄假時間（TIME_RANGE 時須填）',
    reason TEXT COMMENT '請假事由',
    documentation_path VARCHAR(255) COMMENT '附件路徑（醫療證明、死亡證明等）',
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED')) COMMENT '狀態（PENDING、APPROVED、REJECTED、CANCELLED）',
    approved_by INT COMMENT '核准人（主管編號）',
    notes TEXT COMMENT '備註',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '建立時間',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '更新時間',
    FOREIGN KEY (agent_id) REFERENCES agents(agent_id) ON DELETE RESTRICT,
    FOREIGN KEY (approved_by) REFERENCES agents(agent_id) ON DELETE RESTRICT,
    -- NOTE: 以下 CHECK 約束被註解是因為 simple-ddl-parser 無法解析複雜的表級 CHECK 約束
    -- 詳見: SDD.tw/SDD.os/src/features/executors/java/backend/validator/codegen/candidates/springjpa_pojo/SIMPLE_DDL_PARSER_LIMITATIONS.md
    -- CHECK (end_date >= start_date),
    -- CHECK (duration_type = 'FULL_DAY' OR (start_time IS NOT NULL AND end_time IS NOT NULL)),
    -- CHECK (duration_type = 'FULL_DAY' OR end_time > start_time),
    INDEX idx_agent_date (agent_id, start_date, end_date)
) COMMENT '請假申請';

-- 假期額度表
CREATE TABLE leave_entitlements (
    entitlement_id SERIAL PRIMARY KEY COMMENT '額度紀錄編號',
    agent_id INT NOT NULL COMMENT '特務編號（外鍵）',
    leave_type VARCHAR(20) NOT NULL COMMENT '假別類型',
    fiscal_year INT NOT NULL COMMENT '會計年度',
    entitled_days DECIMAL(5, 2) DEFAULT 0 COMMENT '法定假期天數',
    used_days DECIMAL(5, 2) DEFAULT 0 COMMENT '已用天數',
    remaining_days DECIMAL(5, 2) DEFAULT 0 COMMENT '剩餘天數',
    rollover_days DECIMAL(5, 2) DEFAULT 0 COMMENT '延期天數',
    paid_out_days DECIMAL(5, 2) DEFAULT 0 COMMENT '折算工資天數',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '建立時間',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '更新時間',
    FOREIGN KEY (agent_id) REFERENCES agents(agent_id) ON DELETE RESTRICT,
    UNIQUE (agent_id, leave_type, fiscal_year),
    CHECK (used_days <= entitled_days + rollover_days)
) COMMENT '假期額度';

-- 假期餘額變化歷史表
CREATE TABLE leave_balance_history (
    history_id SERIAL PRIMARY KEY COMMENT '歷史紀錄編號',
    agent_id INT NOT NULL COMMENT '特務編號（外鍵）',
    leave_type VARCHAR(20) NOT NULL COMMENT '假別類型',
    change_date DATE NOT NULL COMMENT '異動日期',
    change_type VARCHAR(20) NOT NULL CHECK (change_type IN ('ALLOCATION', 'USAGE', 'ROLLOVER', 'PAYOUT')) COMMENT '異動類型（ALLOCATION、USAGE、ROLLOVER、PAYOUT）',
    change_days DECIMAL(5, 2) COMMENT '異動天數',
    reference_id INT COMMENT '關連紀錄編號（如請假申請編號）',
    notes TEXT COMMENT '備註',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '建立時間',
    FOREIGN KEY (agent_id) REFERENCES agents(agent_id) ON DELETE RESTRICT,
    INDEX idx_agent_date (agent_id, change_date)
) COMMENT '假期餘額變化歷史';

-- 加班申請表
-- 符合台灣勞基法第 32 條和第 36 條規定
-- 加班類型說明：
--   WEEKDAY_OVERTIME: 平日延長工時（每日最多 4 小時）
--   REST_DAY_OVERTIME: 休息日出勤（需勞工同意）
--   LEGAL_HOLIDAY_OVERTIME: 例假日/國定假日出勤（僅限天災、事變或突發事件）
CREATE TABLE overtime_requests (
    request_id SERIAL PRIMARY KEY COMMENT '申請編號',
    agent_id INT NOT NULL COMMENT '特務編號（外鍵）',
    overtime_type VARCHAR(30) NOT NULL CHECK (overtime_type IN ('WEEKDAY_OVERTIME', 'REST_DAY_OVERTIME', 'LEGAL_HOLIDAY_OVERTIME')) COMMENT '加班類型：平日加班、休息日加班、例假日加班',
    overtime_date DATE NOT NULL COMMENT '加班日期',
    start_time TIME NOT NULL COMMENT '開始時間',
    end_time TIME NOT NULL COMMENT '結束時間',
    reason TEXT COMMENT '加班事由',
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED')) COMMENT '狀態（PENDING、APPROVED、REJECTED、CANCELLED）',
    approved_by INT COMMENT '核准人（主管編號）',
    notes TEXT COMMENT '備註',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '建立時間',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '更新時間',
    FOREIGN KEY (agent_id) REFERENCES agents(agent_id) ON DELETE RESTRICT,
    FOREIGN KEY (approved_by) REFERENCES agents(agent_id) ON DELETE RESTRICT,
    INDEX idx_agent_date (agent_id, overtime_date)
) COMMENT '加班申請';

-- 索引優化
CREATE INDEX idx_punch_records_agent_date ON punch_records(agent_id, punch_date);
