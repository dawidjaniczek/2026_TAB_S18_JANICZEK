CREATE TABLE IF NOT EXISTS init_check (
    id SERIAL PRIMARY KEY,
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO init_check (message) VALUES ('Docker + PostgreSQL dziala poprawnie');