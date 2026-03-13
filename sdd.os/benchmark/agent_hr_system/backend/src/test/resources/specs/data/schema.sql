CREATE TABLE agents (
    agent_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    position VARCHAR(100),
    hire_date DATE,
    termination_date DATE,
    gender VARCHAR(10),
    marital_status VARCHAR(20),
    manager_id BIGINT,
    last_login_at TIMESTAMP,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE punch_records (
    record_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    agent_id BIGINT NOT NULL,
    punch_type VARCHAR(10) NOT NULL,
    punch_time TIMESTAMP NOT NULL,
    punch_date DATE NOT NULL,
    created_at TIMESTAMP
);

CREATE TABLE leave_requests (
    request_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    agent_id BIGINT NOT NULL,
    leave_type VARCHAR(20) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    duration_type VARCHAR(20) DEFAULT 'FULL_DAY',
    start_time TIME,
    end_time TIME,
    reason TEXT,
    documentation_path VARCHAR(255),
    status VARCHAR(20) DEFAULT 'PENDING',
    approved_by BIGINT,
    notes TEXT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE leave_entitlements (
    entitlement_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    agent_id BIGINT NOT NULL,
    leave_type VARCHAR(20) NOT NULL,
    fiscal_year INT NOT NULL,
    entitled_days DECIMAL(5, 2) DEFAULT 0,
    used_days DECIMAL(5, 2) DEFAULT 0,
    remaining_days DECIMAL(5, 2) DEFAULT 0,
    rollover_days DECIMAL(5, 2) DEFAULT 0,
    paid_out_days DECIMAL(5, 2) DEFAULT 0,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE leave_balance_history (
    history_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    agent_id BIGINT NOT NULL,
    leave_type VARCHAR(20) NOT NULL,
    change_date DATE NOT NULL,
    change_type VARCHAR(20) NOT NULL,
    change_days DECIMAL(5, 2),
    reference_id BIGINT,
    notes TEXT,
    created_at TIMESTAMP
);

CREATE TABLE overtime_requests (
    request_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    agent_id BIGINT NOT NULL,
    overtime_type VARCHAR(30) NOT NULL,
    overtime_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    reason TEXT,
    status VARCHAR(20) DEFAULT 'PENDING',
    approved_by BIGINT,
    notes TEXT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
