-- a declined request is deleted, so there is no 'rejected' status
CREATE TYPE friendship_status AS ENUM ('pending', 'accepted');

CREATE TABLE friendships (
    id SERIAL PRIMARY KEY,
    status friendship_status NOT NULL DEFAULT 'pending',
    sender_id INT NOT NULL,
    recipient_id INT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_friendship_sender FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_friendship_recipient FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT check_not_self CHECK (sender_id <> recipient_id)
);

-- one row per pair of users, whichever of them sent the request
CREATE UNIQUE INDEX unique_friendship_pair ON friendships (LEAST(sender_id, recipient_id), GREATEST(sender_id, recipient_id));
