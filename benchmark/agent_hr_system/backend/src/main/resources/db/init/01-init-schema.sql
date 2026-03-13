-- ============================================
-- 特務人資系統資料庫 Schema
-- 時區說明：所有 TIMESTAMP 欄位使用台灣時區 (UTC+8)
-- 工時精度：DECIMAL(5, 2) 代表小數點後兩位，以分鐘為單位計算（符合台灣勞基法）
-- ============================================

-- 設定字符集和時區
SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;
SET time_zone = '+08:00';

-- ============================================
-- 特務資料表
-- ============================================
-- 採用軟刪除策略：特務資料不實際刪除，改變狀態為 'INACTIVE'（已離職）以符合勞基法 5 年記錄保存要求
-- 包含請假系統所需的擴展欄位（入職日期、性別、婚姻狀態等）
-- 主管關聯設計：
--   - manager_id 為 0..1 關聯（每個特務最多一個直屬主管）
--   - 使用外鍵約束確保資料完整性
--   - 允許指向已離職主管（保留歷史組織關係）
--   - 循環參照檢查在應用程式層級處理
--   - 請假審核規則：approved_by 必須是申請人的 manager_id
CREATE TABLE IF NOT EXISTS agents (
    agent_id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '特務編號（系統自動產生的流水號）',
    name VARCHAR(100) NOT NULL COMMENT '特務名稱',
    email VARCHAR(255) UNIQUE NOT NULL COMMENT '電子郵件（用於登入帳號）',
    password_hash VARCHAR(255) NOT NULL COMMENT '密碼雜湊值（bcrypt）',
    position VARCHAR(100) COMMENT '職位',
    hire_date DATE COMMENT '入職日期',
    termination_date DATE COMMENT '離職日期（軟刪除使用）',
    gender VARCHAR(10) COMMENT '性別（用於生理假、陪產假）',
    marital_status VARCHAR(20) COMMENT '婚姻狀態',
    manager_id BIGINT COMMENT '直屬主管編號（外鍵指向 agents.agent_id，0..1 關聯）',
    last_login_at TIMESTAMP NULL COMMENT '最後登入時間',
    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')) COMMENT '特務狀態：ACTIVE=在職, INACTIVE=已離職（軟刪除，保留歷史記錄以符合勞基法）',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '建立時間',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新時間',
    INDEX idx_email (email),
    INDEX idx_status (status),
    INDEX idx_manager (manager_id),
    CONSTRAINT fk_agents_manager FOREIGN KEY (manager_id) REFERENCES agents(agent_id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='特務資料表';

-- ============================================
-- 打卡記錄表
-- ============================================
-- 外鍵使用 RESTRICT：禁止刪除有打卡記錄的特務，配合軟刪除保留完整審計記錄
CREATE TABLE IF NOT EXISTS punch_records (
    record_id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '打卡記錄編號',
    agent_id BIGINT NOT NULL COMMENT '特務編號（外鍵）',
    punch_type VARCHAR(10) NOT NULL CHECK (punch_type IN ('IN', 'OUT')) COMMENT '打卡類型：IN 或 OUT',
    punch_time TIMESTAMP NOT NULL COMMENT '打卡時間戳記（台灣時區 UTC+8）',
    punch_date DATE NOT NULL COMMENT '打卡日期',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '建立時間',
    INDEX idx_agent_date (agent_id, punch_date),
    INDEX idx_punch_date (punch_date),
    CONSTRAINT fk_punch_agent FOREIGN KEY (agent_id) REFERENCES agents(agent_id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='打卡記錄表';

-- ============================================
-- 請假申請表
-- ============================================
CREATE TABLE IF NOT EXISTS leave_requests (
    request_id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '申請編號',
    agent_id BIGINT NOT NULL COMMENT '特務編號（外鍵）',
    leave_type VARCHAR(20) NOT NULL COMMENT '假別類型',
    start_date DATE NOT NULL COMMENT '起假日期',
    end_date DATE NOT NULL COMMENT '迄假日期',
    duration_type VARCHAR(20) DEFAULT 'FULL_DAY' CHECK (duration_type IN ('FULL_DAY', 'TIME_RANGE')) COMMENT '請假類型：FULL_DAY=全日假，TIME_RANGE=時段假',
    start_time TIME COMMENT '起假時間（TIME_RANGE 時須填）',
    end_time TIME COMMENT '迄假時間（TIME_RANGE 時須填）',
    reason TEXT COMMENT '請假事由',
    documentation_path VARCHAR(255) COMMENT '附件路徑（醫療證明、死亡證明等）',
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED')) COMMENT '狀態（PENDING、APPROVED、REJECTED、CANCELLED）',
    approved_by BIGINT COMMENT '核准人（主管編號）',
    notes TEXT COMMENT '備註',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '建立時間',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新時間',
    INDEX idx_agent_date (agent_id, start_date, end_date),
    INDEX idx_status (status),
    INDEX idx_approved_by (approved_by),
    CONSTRAINT fk_leave_agent FOREIGN KEY (agent_id) REFERENCES agents(agent_id) ON DELETE RESTRICT,
    CONSTRAINT fk_leave_approver FOREIGN KEY (approved_by) REFERENCES agents(agent_id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='請假申請';

-- ============================================
-- 假期額度表
-- ============================================
CREATE TABLE IF NOT EXISTS leave_entitlements (
    entitlement_id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '額度紀錄編號',
    agent_id BIGINT NOT NULL COMMENT '特務編號（外鍵）',
    leave_type VARCHAR(20) NOT NULL COMMENT '假別類型',
    fiscal_year INT NOT NULL COMMENT '會計年度',
    entitled_days DECIMAL(5, 2) DEFAULT 0 COMMENT '法定假期天數',
    used_days DECIMAL(5, 2) DEFAULT 0 COMMENT '已用天數',
    remaining_days DECIMAL(5, 2) DEFAULT 0 COMMENT '剩餘天數',
    rollover_days DECIMAL(5, 2) DEFAULT 0 COMMENT '延期天數',
    paid_out_days DECIMAL(5, 2) DEFAULT 0 COMMENT '折算工資天數',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '建立時間',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新時間',
    UNIQUE KEY uk_agent_leave_year (agent_id, leave_type, fiscal_year),
    INDEX idx_agent_year (agent_id, fiscal_year),
    CONSTRAINT fk_entitlement_agent FOREIGN KEY (agent_id) REFERENCES agents(agent_id) ON DELETE RESTRICT,
    CONSTRAINT chk_used_days CHECK (used_days <= entitled_days + rollover_days)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='假期額度';

-- ============================================
-- 假期餘額變化歷史表
-- ============================================
CREATE TABLE IF NOT EXISTS leave_balance_history (
    history_id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '歷史紀錄編號',
    agent_id BIGINT NOT NULL COMMENT '特務編號（外鍵）',
    leave_type VARCHAR(20) NOT NULL COMMENT '假別類型',
    change_date DATE NOT NULL COMMENT '異動日期',
    change_type VARCHAR(20) NOT NULL CHECK (change_type IN ('ALLOCATION', 'USAGE', 'ROLLOVER', 'PAYOUT')) COMMENT '異動類型（ALLOCATION、USAGE、ROLLOVER、PAYOUT）',
    change_days DECIMAL(5, 2) COMMENT '異動天數',
    reference_id BIGINT COMMENT '關連紀錄編號（如請假申請編號）',
    notes TEXT COMMENT '備註',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '建立時間',
    INDEX idx_agent_date (agent_id, change_date),
    INDEX idx_change_type (change_type),
    INDEX idx_reference (reference_id),
    CONSTRAINT fk_balance_history_agent FOREIGN KEY (agent_id) REFERENCES agents(agent_id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='假期餘額變化歷史';
