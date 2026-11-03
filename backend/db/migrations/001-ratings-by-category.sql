-- Moves an existing database from one Elo rating per user to one per category
-- (bullet / blitz / rapid) and adds rating history to games.
-- New databases don't need this: db-schema.sql already has these columns.
-- Run once, e.g. in pgAdmin's Query Tool. It runs in a transaction, so on any
-- error nothing is changed.

BEGIN;

-- users: three ratings, starting from each user's current rating
ALTER TABLE users
    ADD COLUMN elo_bullet INT NOT NULL DEFAULT 800,
    ADD COLUMN elo_blitz INT NOT NULL DEFAULT 800,
    ADD COLUMN elo_rapid INT NOT NULL DEFAULT 800;

UPDATE users SET elo_bullet = elo, elo_blitz = elo, elo_rapid = elo;

ALTER TABLE users DROP COLUMN elo;

-- games: category and both players' ratings before and after the game
CREATE TYPE rating_category AS ENUM ('bullet', 'blitz', 'rapid');

ALTER TABLE games
    ADD COLUMN rating_category rating_category,
    ADD COLUMN white_elo_before INT,
    ADD COLUMN white_elo_after INT,
    ADD COLUMN black_elo_before INT,
    ADD COLUMN black_elo_after INT;

COMMIT;
