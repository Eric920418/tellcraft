-- secondary DataSource (MSSQL) — todos table only

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='todos' AND xtype='U')
CREATE TABLE todos (
    -- ========== Id ==========
    todo_id INT IDENTITY(1,1),
    -- ========== user_id ==========
    user_id INT NOT NULL,
    -- ========== title ==========
    title NVARCHAR(255) NOT NULL,
    -- ========== description ==========
    description NVARCHAR(MAX),
    completed BIT DEFAULT 0,
    -- ========== 建立時間 ==========
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE(),
    PRIMARY KEY (todo_id, user_id)
);
