-- 1A2B 猜數字遊戲資料庫 Schema（H2 相容版本，匹配 JPA entities）

CREATE TABLE games (
    id VARCHAR(5) PRIMARY KEY,
    status VARCHAR(50) NOT NULL,
    winner_id VARCHAR(2),
    current_round INTEGER
);

CREATE TABLE players (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    role VARCHAR(2) NOT NULL,
    name VARCHAR(20) NOT NULL,
    secret VARCHAR(4),
    game_id VARCHAR(5)
);

CREATE TABLE guesses (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    game_id VARCHAR(5) NOT NULL,
    player_role VARCHAR(2) NOT NULL,
    round INTEGER NOT NULL,
    guess VARCHAR(4) NOT NULL
);
