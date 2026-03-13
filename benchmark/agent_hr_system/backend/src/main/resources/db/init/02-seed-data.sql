-- ============================================
-- 特務人資系統 - 測試資料 (Seeder)
-- ============================================

SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;
SET time_zone = '+08:00';

-- ============================================
-- 特務測試資料
-- ============================================
-- 密碼說明：所有測試帳號的密碼都是 "password123"
-- BCrypt hash 使用 Spring Security BCryptPasswordEncoder 生成

-- 插入組織架構：
-- 1. 超級主管（沒有上級）
-- 2. 部門主管（向超級主管報告）
-- 3. 一般特務（向部門主管報告）

-- 超級主管
INSERT INTO agents (agent_id, name, email, password_hash, position, hire_date, gender, marital_status, manager_id, status, created_at, updated_at) VALUES
(1, '王大明', 'johnny@waterballsa.tw', '$2a$10$LMHb2sr..AuSJ9EwYVKuweGRk68HT/XwS.PuQ9.Y18s1oqoMypJ8a', '主管', '2020-01-01', 'MALE', 'MARRIED', NULL, 'ACTIVE', NOW(), NOW());

-- 部門主管
INSERT INTO agents (agent_id, name, email, password_hash, position, hire_date, gender, marital_status, manager_id, status, created_at, updated_at) VALUES
(2, '李小華', 'li.xiaohua@agent.com', '$2a$10$4yfYVG3kgVLA/DBqGJDFcuhvUtYmFE3NOBslZVWzpMt.99R8lrhCa', '技術部主管', '2020-03-15', 'FEMALE', 'SINGLE', 1, 'ACTIVE', NOW(), NOW()),
(3, '張三豐', 'zhang.sanfeng@agent.com', '$2a$10$llUAqpyAHDS5b4PiwV9iI.outtFA2zh6161NUtF.GjgwnTDlrNefy', '業務部主管', '2020-06-01', 'MALE', 'MARRIED', 1, 'ACTIVE', NOW(), NOW());

-- 一般特務
INSERT INTO agents (agent_id, name, email, password_hash, position, hire_date, gender, marital_status, manager_id, status, created_at, updated_at) VALUES
(4, '陳美玲', 'chen.meiling@agent.com', '$2a$10$zVHtf7qzXXUFi.kELc5Z7uH9VeGGkPwDHhny/b2k0.8GNZuPngf36', '資深工程師', '2021-01-10', 'FEMALE', 'MARRIED', 2, 'ACTIVE', NOW(), NOW()),
(5, '林志明', 'lin.zhiming@agent.com', '$2a$10$zH1i1ZeQunKcJfmkuoXZ6etjRNHDowJsAgCsoDEZOX8LFEUCt5KmG', '工程師', '2021-07-15', 'MALE', 'SINGLE', 2, 'ACTIVE', NOW(), NOW()),
(6, '黃小芬', 'huang.xiaofen@agent.com', '$2a$10$LMHb2sr..AuSJ9EwYVKuweGRk68HT/XwS.PuQ9.Y18s1oqoMypJ8a', '初級工程師', '2022-03-01', 'FEMALE', 'SINGLE', 2, 'ACTIVE', NOW(), NOW()),
(7, '劉建國', 'liu.jianguo@agent.com', '$2a$10$4yfYVG3kgVLA/DBqGJDFcuhvUtYmFE3NOBslZVWzpMt.99R8lrhCa', '資深業務', '2021-04-20', 'MALE', 'MARRIED', 3, 'ACTIVE', NOW(), NOW()),
(8, '吳雅婷', 'wu.yating@agent.com', '$2a$10$llUAqpyAHDS5b4PiwV9iI.outtFA2zh6161NUtF.GjgwnTDlrNefy', '業務專員', '2022-01-15', 'FEMALE', 'SINGLE', 3, 'ACTIVE', NOW(), NOW());

-- 已離職特務（軟刪除）
INSERT INTO agents (agent_id, name, email, password_hash, position, hire_date, termination_date, gender, marital_status, manager_id, status, created_at, updated_at) VALUES
(9, '周文傑', 'zhou.wenjie@agent.com', '$2a$10$zVHtf7qzXXUFi.kELc5Z7uH9VeGGkPwDHhny/b2k0.8GNZuPngf36', '前工程師', '2021-02-01', '2023-08-31', 'MALE', 'SINGLE', 2, 'INACTIVE', NOW(), NOW());

-- ============================================
-- 打卡記錄測試資料
-- ============================================
-- 最近一週的打卡記錄（假設今天是 2025-11-07）

-- 2025-11-04 (週一) - 陳美玲
INSERT INTO punch_records (agent_id, punch_type, punch_time, punch_date, created_at) VALUES
(4, 'IN', '2025-11-04 09:00:00', '2025-11-04', '2025-11-04 09:00:00'),
(4, 'OUT', '2025-11-04 12:00:00', '2025-11-04', '2025-11-04 12:00:00'),
(4, 'IN', '2025-11-04 13:30:00', '2025-11-04', '2025-11-04 13:30:00'),
(4, 'OUT', '2025-11-04 18:00:00', '2025-11-04', '2025-11-04 18:00:00');

-- 2025-11-04 (週一) - 林志明
INSERT INTO punch_records (agent_id, punch_type, punch_time, punch_date, created_at) VALUES
(5, 'IN', '2025-11-04 08:45:00', '2025-11-04', '2025-11-04 08:45:00'),
(5, 'OUT', '2025-11-04 12:15:00', '2025-11-04', '2025-11-04 12:15:00'),
(5, 'IN', '2025-11-04 13:15:00', '2025-11-04', '2025-11-04 13:15:00'),
(5, 'OUT', '2025-11-04 18:30:00', '2025-11-04', '2025-11-04 18:30:00');

-- 2025-11-05 (週二) - 陳美玲
INSERT INTO punch_records (agent_id, punch_type, punch_time, punch_date, created_at) VALUES
(4, 'IN', '2025-11-05 09:05:00', '2025-11-05', '2025-11-05 09:05:00'),
(4, 'OUT', '2025-11-05 12:00:00', '2025-11-05', '2025-11-05 12:00:00'),
(4, 'IN', '2025-11-05 13:30:00', '2025-11-05', '2025-11-05 13:30:00'),
(4, 'OUT', '2025-11-05 18:15:00', '2025-11-05', '2025-11-05 18:15:00');

-- 2025-11-05 (週二) - 林志明
INSERT INTO punch_records (agent_id, punch_type, punch_time, punch_date, created_at) VALUES
(5, 'IN', '2025-11-05 08:50:00', '2025-11-05', '2025-11-05 08:50:00'),
(5, 'OUT', '2025-11-05 12:00:00', '2025-11-05', '2025-11-05 12:00:00'),
(5, 'IN', '2025-11-05 13:20:00', '2025-11-05', '2025-11-05 13:20:00'),
(5, 'OUT', '2025-11-05 18:00:00', '2025-11-05', '2025-11-05 18:00:00');

-- 2025-11-06 (週三) - 黃小芬
INSERT INTO punch_records (agent_id, punch_type, punch_time, punch_date, created_at) VALUES
(6, 'IN', '2025-11-06 09:10:00', '2025-11-06', '2025-11-06 09:10:00'),
(6, 'OUT', '2025-11-06 12:30:00', '2025-11-06', '2025-11-06 12:30:00'),
(6, 'IN', '2025-11-06 13:45:00', '2025-11-06', '2025-11-06 13:45:00'),
(6, 'OUT', '2025-11-06 18:20:00', '2025-11-06', '2025-11-06 18:20:00');

-- 2025-11-07 (週四) - 當天只有上班打卡
INSERT INTO punch_records (agent_id, punch_type, punch_time, punch_date, created_at) VALUES
(4, 'IN', '2025-11-07 09:00:00', '2025-11-07', '2025-11-07 09:00:00'),
(5, 'IN', '2025-11-07 08:55:00', '2025-11-07', '2025-11-07 08:55:00'),
(6, 'IN', '2025-11-07 09:05:00', '2025-11-07', '2025-11-07 09:05:00');

-- ============================================
-- 請假申請測試資料
-- ============================================

-- 待審核的請假申請
INSERT INTO leave_requests (agent_id, leave_type, start_date, end_date, duration_type, reason, status, created_at, updated_at) VALUES
(5, '特休假', '2025-11-15', '2025-11-15', 'FULL_DAY', '家庭聚會', 'PENDING', NOW(), NOW()),
(6, '病假', '2025-11-08', '2025-11-08', 'TIME_RANGE', '身體不適', 'PENDING', NOW(), NOW());

-- 時段假需要填寫時間
UPDATE leave_requests SET start_time = '14:00:00', end_time = '18:00:00' WHERE request_id = 2;

-- 已核准的請假申請
INSERT INTO leave_requests (agent_id, leave_type, start_date, end_date, duration_type, reason, status, approved_by, notes, created_at, updated_at) VALUES
(4, '特休假', '2025-11-01', '2025-11-03', 'FULL_DAY', '出國旅遊', 'APPROVED', 2, '已核准', '2025-10-20 10:00:00', '2025-10-21 14:30:00'),
(7, '事假', '2025-10-25', '2025-10-25', 'FULL_DAY', '處理私人事務', 'APPROVED', 3, '已核准', '2025-10-18 09:00:00', '2025-10-19 11:00:00');

-- 已拒絕的請假申請
INSERT INTO leave_requests (agent_id, leave_type, start_date, end_date, duration_type, reason, status, approved_by, notes, created_at, updated_at) VALUES
(8, '特休假', '2025-12-20', '2025-12-25', 'FULL_DAY', '聖誕假期', 'REJECTED', 3, '該時段人力不足，請選擇其他日期', '2025-11-01 10:00:00', '2025-11-02 15:00:00');

-- 已取消的請假申請
INSERT INTO leave_requests (agent_id, leave_type, start_date, end_date, duration_type, reason, status, notes, created_at, updated_at) VALUES
(5, '事假', '2025-11-10', '2025-11-10', 'FULL_DAY', '臨時取消', 'CANCELLED', '計畫改變，不需要請假了', '2025-11-05 10:00:00', '2025-11-06 09:00:00');

-- ============================================
-- 假期額度測試資料
-- ============================================
-- 2025 年度假期額度

INSERT INTO leave_entitlements (agent_id, leave_type, fiscal_year, entitled_days, used_days, remaining_days, rollover_days, created_at, updated_at) VALUES
-- 王大明（主管）- 年資 5 年以上
(1, '特休假', 2025, 15.00, 3.00, 12.00, 0.00, NOW(), NOW()),
(1, '病假', 2025, 30.00, 0.00, 30.00, 0.00, NOW(), NOW()),
(1, '事假', 2025, 14.00, 0.00, 14.00, 0.00, NOW(), NOW()),

-- 李小華（技術部主管）- 年資 5 年以上
(2, '特休假', 2025, 15.00, 5.00, 10.00, 0.00, NOW(), NOW()),
(2, '病假', 2025, 30.00, 2.00, 28.00, 0.00, NOW(), NOW()),
(2, '事假', 2025, 14.00, 1.00, 13.00, 0.00, NOW(), NOW()),

-- 張三豐（業務部主管）- 年資 5 年以上
(3, '特休假', 2025, 15.00, 8.00, 7.00, 0.00, NOW(), NOW()),
(3, '病假', 2025, 30.00, 1.00, 29.00, 0.00, NOW(), NOW()),
(3, '事假', 2025, 14.00, 0.00, 14.00, 0.00, NOW(), NOW()),

-- 陳美玲（資深工程師）- 年資 4 年
(4, '特休假', 2025, 14.00, 3.00, 11.00, 0.00, NOW(), NOW()),
(4, '病假', 2025, 30.00, 0.00, 30.00, 0.00, NOW(), NOW()),
(4, '事假', 2025, 14.00, 0.00, 14.00, 0.00, NOW(), NOW()),

-- 林志明（工程師）- 年資 3 年
(5, '特休假', 2025, 10.00, 0.00, 10.00, 0.00, NOW(), NOW()),
(5, '病假', 2025, 30.00, 0.00, 30.00, 0.00, NOW(), NOW()),
(5, '事假', 2025, 14.00, 1.00, 13.00, 0.00, NOW(), NOW()),

-- 黃小芬（初級工程師）- 年資 2 年
(6, '特休假', 2025, 10.00, 0.00, 10.00, 0.00, NOW(), NOW()),
(6, '病假', 2025, 30.00, 0.00, 30.00, 0.00, NOW(), NOW()),
(6, '事假', 2025, 14.00, 0.00, 14.00, 0.00, NOW(), NOW()),

-- 劉建國（資深業務）- 年資 3 年
(7, '特休假', 2025, 10.00, 1.00, 9.00, 0.00, NOW(), NOW()),
(7, '病假', 2025, 30.00, 0.00, 30.00, 0.00, NOW(), NOW()),
(7, '事假', 2025, 14.00, 1.00, 13.00, 0.00, NOW(), NOW()),

-- 吳雅婷（業務專員）- 年資 2 年
(8, '特休假', 2025, 10.00, 0.00, 10.00, 0.00, NOW(), NOW()),
(8, '病假', 2025, 30.00, 0.00, 30.00, 0.00, NOW(), NOW()),
(8, '事假', 2025, 14.00, 0.00, 14.00, 0.00, NOW(), NOW());

-- ============================================
-- 假期餘額變化歷史測試資料
-- ============================================

-- 年初分配假期
INSERT INTO leave_balance_history (agent_id, leave_type, change_date, change_type, change_days, notes, created_at) VALUES
(4, '特休假', '2025-01-01', 'ALLOCATION', 14.00, '2025年度特休假分配', NOW()),
(4, '病假', '2025-01-01', 'ALLOCATION', 30.00, '2025年度病假分配', NOW()),
(4, '事假', '2025-01-01', 'ALLOCATION', 14.00, '2025年度事假分配', NOW());

-- 使用假期（關聯到請假申請）
INSERT INTO leave_balance_history (agent_id, leave_type, change_date, change_type, change_days, reference_id, notes, created_at) VALUES
(4, '特休假', '2025-11-01', 'USAGE', -3.00, 3, '請假申請 #3 核准，使用3天特休假', NOW()),
(7, '事假', '2025-10-25', 'USAGE', -1.00, 4, '請假申請 #4 核准，使用1天事假', NOW());

-- ============================================
-- 測試資料摘要
-- ============================================
-- 特務總數：9 人（8 在職 + 1 離職）
-- 組織架構：
--   - 主管：王大明
--   - 技術部：李小華(主管)、陳美玲、林志明、黃小芬
--   - 業務部：張三豐(主管)、劉建國、吳雅婷
--   - 離職：周文傑
--
-- 測試帳號密碼：所有帳號密碼都是 "password123"
--
-- 打卡記錄：涵蓋最近一週的打卡資料
-- 請假申請：涵蓋各種狀態（待審核、已核准、已拒絕、已取消）
-- 假期額度：所有在職特務都有完整的假期額度資料
-- ============================================
