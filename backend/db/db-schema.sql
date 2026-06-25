CREATE TABLE users(
    ID SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)

CREATE TYPE friendship_status AS ENUM("accepted", "rejected", "pending")

CREATE TABLE friendships(
    ID SERIAL PRIMARY KEY,
    status friendship_status NOT NULL,
    user_1 INT,
    CONSTRAINT fk_user_1 FOREIGN KEY (ID)
        REFERENCES users(ID),
    user_2 INT,
    CONSTRAINT fk_user_2 FOREIGN KEY (ID)
        REFERENCES  users(ID),
)

CREATE TABLE games(
    ID SERIAL PRIMARY KEY,
    moves VARCHAR(7)[],
    final_position TEXT DEFAULT "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
)