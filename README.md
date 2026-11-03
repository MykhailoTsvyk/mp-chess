# Real-Time Multiplayer Chess Platform

A full-stack, real-time chess platform built with React, Node.js/Express, PostgreSQL and Socket.io. Players register, verify their email, queue for a match and play live against other players, with ELO ratings and game history.

> **Status:** work in progress. Authentication, email verification, matchmaking with time controls, live gameplay (with chat and spectating) and Elo ratings work. Game history is still being built.

## Features

- **Authentication**: registration and login, bcrypt password hashing, short-lived JWT access tokens (30 min) and refresh tokens (14 days) stored in an HTTP-only cookie, with rotation on refresh.
- **Email verification**: an activation link is sent via Gmail (Nodemailer). Tokens expire after 1 hour, and an hourly cron job removes expired tokens.
- **Authenticated WebSockets**: the Socket.io middleware checks the refresh-token cookie against the database and only accepts users who have verified their email.
- **Matchmaking**: a queue-based system that pairs two waiting players into a private game room. Players pick a time control (1+0, 3+0, 3+2, 5+0, 10+0, 15+10) and are only matched with players who chose the same one. If the same user queues from several tabs, only the newest connection stays in the queue.
- **Chess clocks**: each player's clock runs on their turn and gets the increment after each move. The server stores each side's remaining time and when the current turn started, and schedules a single timeout instead of ticking every second. Running out of time loses. Each side must make its first move within 1 minute, otherwise the game is aborted.
- **One game at a time**: while you're playing, the home page shows a "Game in progress" banner with a button to return, and Play Game takes you back to that game. The server also refuses to queue a player who is already in a live game.
- **Live gameplay**: moves are validated on the server with `chess.js` and sent to everyone in the game room. Checkmate and draws (stalemate, insufficient material, threefold repetition, 50-move rule) end the game and save it to the database.
- **Resign and draw offers**: a player can resign (after confirming) or offer a draw. The opponent accepts or declines. An offer is cancelled when the player who made it moves, and after a decline that player can offer again only after their next move.
- **Leaving a game**: if a player disconnects or leaves the game page, they have 60 seconds to return, and their opponent sees a countdown. When time runs out, the player who left loses. If both players are gone, the game is a draw. If no moves were made, the game is aborted.
- **Reconnect and spectating**: after a page reload, the client asks the server for the current game state. Other logged-in users with a verified email can open `/game/:gameID` to watch a game live and chat as Spectator. Logged-out users are sent to login and brought back to the game afterwards. If the server rejects an expired session, the client refreshes it once and logs out if that fails.
- **In-game chat**: chat in the game room, with each message labelled White, Black or Spectator.
- **Game page UI**: move history, a board flip button, a result summary and read-only replay of finished games.
- **Pawn promotion**: when a pawn reaches the last rank, the player picks a queen, rook, bishop or knight. Clicking outside the picker or pressing Esc cancels the move.
- **Elo ratings per category**: each player has a Bullet, Blitz and Rapid rating (starting at 800). A time control's category is based on its estimated length (`initial + 40 × increment`): under 3 min is Bullet, under 8 min is Blitz, the rest is Rapid. After a win, loss or draw, both ratings change by the standard Elo formula with K = 32; aborted games aren't rated. The game and both new ratings are saved in one database transaction, and each game stores both players' ratings before and after. The summary window shows each player's rating change.
- **Planned**: game history and friends.

## Tech Stack

| Layer    | Technologies                                                                 |
| -------- | ---------------------------------------------------------------------------- |
| Frontend | React 19, Vite, React Router, Tailwind CSS v4, Axios, socket.io-client, chess.js |
| Backend  | Node.js (ES modules), Express 5, Socket.io, pg-promise, chess.js, node-cron |
| Auth     | jsonwebtoken, bcrypt, cookie-parser                                          |
| Database | PostgreSQL                                                                   |
| Email    | Nodemailer (Gmail SMTP)                                                      |

## Project Structure

```
chess-app/
├── backend/
│   ├── controllers/   # Express route handlers
│   ├── db/            # pg-promise connection + db-schema.sql
│   ├── dtos/          # Data shapes sent to the client
│   ├── jobs/          # Cron jobs (expired token cleanup)
│   ├── middleware/    # Request validation, HTTP + socket auth
│   ├── routes/        # REST API routes (mounted at /api)
│   ├── services/      # Business logic (users, tokens, email, games, matchmaking)
│   ├── socket/        # Socket.io event handlers (matchmaking, game, chat)
│   ├── store/         # In-memory store of active games
│   ├── utils/         # Nodemailer transporter
│   └── index.js       # App entry point
└── frontend/
    └── src/
        ├── api/       # Axios instance (auto refresh on 401) + auth service
        ├── components/
        ├── context/   # AuthContext, SocketContext, ChessContext (game state)
        ├── features/  # authentication forms, chess board, move history
        ├── hooks/
        ├── layout/
        └── pages/
```

## Getting Started

### Prerequisites

- Node.js v20.19+ or v22.12+ (required by Vite 8)
- PostgreSQL
- A Gmail account with an [App Password](https://support.google.com/accounts/answer/185833), for sending verification emails

### 1. Clone and install

```bash
git clone <repo-url>
cd chess-app

cd backend && npm install
cd ../frontend && npm install
```

### 2. Create the database

```bash
createdb chess_app
psql -d chess_app -f backend/db/db-schema.sql
```

### 3. Configure environment variables

Create `backend/.env`:

```env
PORT=3000
CLIENT_URL=http://localhost:5173

# PostgreSQL
DB_USER=postgres
DB_PASS=your_password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=chess_app

# JWT (use long random strings)
JWT_ACCESS_SECRET=change_me
JWT_REFRESH_SECRET=change_me_too

# bcrypt cost factor (optional, defaults to 12)
SALT_ROUNDS=12

# Gmail App Password for the sender account set in backend/utils/email.js
GOOGLE_APP_PASS=xxxx xxxx xxxx xxxx
```

`CLIENT_URL` is used to build the email activation link (`<CLIENT_URL>/activation/<token>`). The sender address is set in [backend/utils/email.js](backend/utils/email.js). Change it if you use your own Gmail account.

> `.env` files are git-ignored. Never commit real secrets.

### 4. Run in development

In two terminals:

```bash
# Terminal 1: API + WebSocket server on http://localhost:3000
cd backend
npm run dev

# Terminal 2: Vite dev server on http://localhost:5173
cd frontend
npm run dev
```

Open http://localhost:5173.

> The frontend origin (`http://localhost:5173`) and the API URL (`http://localhost:3000`) are currently hard-coded in [backend/index.js](backend/index.js), [frontend/src/api/axios.js](frontend/src/api/axios.js) and [frontend/src/context/SocketContext.jsx](frontend/src/context/SocketContext.jsx). If you change ports, update them there too.

## Scripts

| Location    | Command           | Description                       |
| ----------- | ----------------- | --------------------------------- |
| `backend/`  | `npm run dev`     | Start the server with nodemon     |
| `backend/`  | `npm start`       | Start the server with node        |
| `frontend/` | `npm run dev`     | Start the Vite dev server         |
| `frontend/` | `npm run build`   | Make a production build in `dist/` |
| `frontend/` | `npm run preview` | Serve the production build        |
| `frontend/` | `npm run lint`    | Run ESLint                        |

## Testing

Both apps use [Vitest](https://vitest.dev).

```bash
cd backend && npm test        # unit + integration (needs PostgreSQL running)
cd backend && npm run test:unit   # game logic and Elo only, no database
cd frontend && npm test       # React components (jsdom + Testing Library)
```

- **Backend unit tests** (`backend/tests/unit`): game rules, clocks, first-move and leave timeouts, resign and draw offers, and Elo, with fake timers and a stubbed database.
- **Backend integration tests** (`backend/tests/integration`): a real Socket.io server and clients (auth, matchmaking, full games, spectators, chat, leaving), the HTTP game routes, and saving games and ratings to PostgreSQL, including the transaction.
- **Frontend tests** (`frontend/src/**/*.test.jsx`): board, promotion, clocks, game controls, the summary window and the game context.

The integration tests use a separate database, `chessMP_test` (set `TEST_DB_NAME` to change it). It is created if it's missing and rebuilt from `db-schema.sql` on every run, so your dev database is never touched. The setup refuses to run against a database whose name doesn't end in `_test`.

## API Reference

All routes are prefixed with `/api`.

| Method | Route                 | Auth           | Description                                     |
| ------ | --------------------- | -------------- | ----------------------------------------------- |
| POST   | `/register`           | none           | Create an account and send the activation email |
| POST   | `/login`              | none           | Log in; returns an access token and sets the refresh cookie |
| POST   | `/activate/:link`     | none           | Verify the email with an activation token       |
| POST   | `/refresh`            | refresh cookie | Rotate tokens; returns a new access token        |
| POST   | `/resend-activation`  | Bearer token   | Send a new activation email                     |
| GET    | `/game/:gameID`       | none           | Get a game and both players                     |
| GET    | `/active-game`        | Bearer token   | The game you're playing right now: `{ activeGame: { id, timeControl, color, opponent } }`, or `{ activeGame: null }` |
| GET    | `/user/:id`           | Bearer token   | Get a profile with `ratings` (`{ bullet, blitz, rapid }`, each `{ rating, games }`) and stats `{ games_played, wins, losses, draws }`; `email` and `is_activated` only on your own profile |
| PUT    | `/user/:id`           | Bearer token   | Update a user (not implemented yet, returns 501) |
| DELETE | `/user/:id`           | Bearer token   | Delete a user (not implemented yet, returns 501) |

Protected routes expect an `Authorization: Bearer <accessToken>` header. The frontend Axios instance adds it automatically and calls `/refresh` again when it gets a 401.

## Socket Events

Socket connections are authenticated with the `refreshToken` cookie, so the client must connect with `withCredentials: true`. Only users who have verified their email can connect.

| Direction       | Event                    | Payload                            |
| --------------- | ------------------------ | ---------------------------------- |
| client → server | `matchmaking:start`      | `timeControl`, e.g. `"3+2"`        |
| client → server | `matchmaking:cancel`     | none                               |
| server → client | `matchmaking:queued`     | `{ status, totalPlayers }`         |
| server → client | `matchmaking:matchFound` | `{ game, whitePlayer, blackPlayer }` |
| server → client | `matchmaking:cancelled`  | none (you queued from another tab) |
| server → client | `matchmaking:activeGame` | `{ gameID }`: you're already playing, so you're sent back to that game instead of being queued |
| client → server | `game:sync-state`        | `gameID`: joins the room as a player or spectator |
| client → server | `game:move`              | `gameID, from, to, promotion?` (e.g. `"e2", "e4"`; `promotion` is `"q"`, `"r"`, `"b"` or `"n"` for a pawn reaching the last rank, defaults to `"q"`) |
| client → server | `game:resign`            | `gameID` |
| client → server | `game:offer-draw`        | `gameID` (offering while the opponent's offer is pending accepts it) |
| client → server | `game:respond-draw`      | `gameID, accept` (`true` / `false`) |
| client → server | `game:leave`             | `gameID`: sent when the game page closes; starts the 60s timer for players |
| client → server | `game:sent-message`      | `{ gameID, text }`: the server adds author, role and timestamp |
| server → client | `game:updated`           | `{ game, whitePlayer, blackPlayer, messages, drawOffer, drawBlocked, leftPlayers, clock }` (`leftPlayers` maps a user ID to the time its timeout ends; `clock` is `{ timeControl, white, black, turn, running, firstMoveMs }` with times in milliseconds) |

Active games are kept in memory ([backend/store/game.store.js](backend/store/game.store.js)) and written to the `games` table when they start and finish. Games still in progress are lost if the server restarts.

## Database

The schema is in [backend/db/db-schema.sql](backend/db/db-schema.sql):

- `users`: account details, activation flag and one rating per category: `elo_bullet`, `elo_blitz`, `elo_rapid` (default 800)
- `activation_tokens`: email verification tokens (1-hour expiry)
- `tokens`: one refresh token per user
- `friendships`: friend requests (`pending` / `accepted` / `rejected`)
- `games`: players, status, result/draw reason, move list, current FEN, time-control fields, `rating_category` and each player's rating before and after the game

Changes to an existing database are in [backend/db/migrations/](backend/db/migrations/). Run each file once, in order, for example in pgAdmin's Query Tool. A new database created from `db-schema.sql` doesn't need them.

## License

ISC
