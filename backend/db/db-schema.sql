CREATE TABLE users(
    ID SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)

CREATE TYPE friendship_status AS ENUM ('accepted', 'rejected', 'pending');

CREATE TABLE friendships (
    id SERIAL PRIMARY KEY,
    status friendship_status NOT NULL DEFAULT 'pending',
    user_1 INT NOT NULL,
    user_2 INT NOT NULL,
    CONSTRAINT fk_user_1 FOREIGN KEY (user_1) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_user_2 FOREIGN KEY (user_2) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT unique_friendship UNIQUE (user_1, user_2),
    CONSTRAINT check_not_self CHECK (user_1 <> user_2)
);

CREATE TABLE games(
    ID SERIAL PRIMARY KEY,
    moves VARCHAR(7)[],
    final_position TEXT DEFAULT "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
)