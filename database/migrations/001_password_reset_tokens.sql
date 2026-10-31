CREATE TABLE IF NOT EXISTS password_reset_tokens (
    reset_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token_hash CHAR(64) NOT NULL UNIQUE,
    expires_at DATETIME NOT NULL,
    used_at DATETIME DEFAULT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_reset_user (user_id),

    CONSTRAINT fk_password_reset_user
        FOREIGN KEY (user_id)
        REFERENCES user(user_id)
        ON DELETE CASCADE
);
