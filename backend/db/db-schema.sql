CREATE TABLE users(
    ID SERIAL PRIMARY KEY,
    username VARCHAR(20) UNIQUE NOT NULL,
    email VARCHAR(50) UNIQUE NOT NULL,
    is_activated BOOLEAN NOT NULL DEFAULT FALSE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)

CREATE TABLE activation_tokens(
    ID SERIAL PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    CONSTRAINT fk_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(64) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL DEFAULT (CURRENT_TIMESTAMP + INTERVAL '1 hour'),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)

CREATE TABLE tokens(
    ID SERIAL PRIMARY KEY,
    refresh_token TEXT NOT NULL,
    user_id INT NOT NULL UNIQUE,
    CONSTRAINT fk_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

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

CREATE TYPE match_status AS ENUM ('pending', 'active', 'draw', 'finished', 'aborted')
-- pending for created match without both players joining it
-- aborted for cancelled game

CREATE TABLE games (
    id SERIAL PRIMARY KEY,
    moves VARCHAR(7)[],
    status match_status DEFAULT 'pending',
    final_position TEXT DEFAULT 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    player_1 INT NOT NULL,
    player_2 INT NOT NULL,
    CONSTRAINT fk_player_1 FOREIGN KEY (player_1) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_player_2 FOREIGN KEY (player_2) REFERENCES users(id) ON DELETE CASCADE
);