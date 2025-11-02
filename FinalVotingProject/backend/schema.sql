/* This file defines the database table for our off-chain data. */
CREATE TABLE proposals (
    id BIGINT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);