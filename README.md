# Real-Time Multiplayer Chess Platform

A full-stack, real-time chess platform built with React, Node.js/Express, PostgreSQL and Socket.io. Players register, verify their email, queue for a match and play live against other players, with ELO ratings and game history.

> **Status:** work in progress. Authentication, email verification, matchmaking and live gameplay (with chat and spectating) work. Time controls, ELO updates and game history are still being built.

## Features

- **Authentication**: registration and login, bcrypt password hashing, short-lived JWT access tokens (30 min) and refresh tokens (14 days) stored in an HTTP-only cookie, with rotation on refresh.
- **Email verification**: an activation link is sent via Gmail (Nodemailer). Tokens expire after 1 hour, and an hourly cron job removes expired tokens.
- **Authenticated WebSockets**: the Socket.io middleware checks the refresh-token cookie against the database and only accepts users who have verified their email.
- **Matchmaking**: a queue-based system that pairs two waiting players into a private game room. If the same user queues from several tabs, only the newest connection stays in the queue.
- **Live gameplay**: moves are validated on the server with `chess.js` and sent to everyone in the game room. Checkmate and draws (stalemate, insufficient material, threefold repetition, 50-move rule) end the game and save it to the database.
- **Reconnect and spectating**: after a page reload, the client asks the server for the current game state. Other users can open `/game/:gameID` to watch a game live.
- **In-game chat**: chat in the game room, with each message labelled White, Black or Spectator.
- **Game page UI**: move history, a board flip button, a result summary and read-only replay of finished games.
- **Planned**: time controls, ELO calculation, game history, friends, draw offers and choosing a promotion piece (pawns currently always promote to a queen).

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
| GET    | `/user/:id`           | Bearer token   | Get a user (not implemented yet, returns 501)   |
| PUT    | `/user/:id`           | Bearer token   | Update a user (not implemented yet, returns 501) |
| DELETE | `/user/:id`           | Bearer token   | Delete a user (not implemented yet, returns 501) |

Protected routes expect an `Authorization: Bearer <accessToken>` header. The frontend Axios instance adds it automatically and calls `/refresh` again when it gets a 401.

## Socket Events

Socket connections are authenticated with the `refreshToken` cookie, so the client must connect with `withCredentials: true`. Only users who have verified their email can connect.

| Direction       | Event                    | Payload                            |
| --------------- | ------------------------ | ---------------------------------- |
| client → server | `matchmaking:start`      | none                               |
| client → server | `matchmaking:cancel`     | none                               |
| server → client | `matchmaking:queued`     | `{ status, totalPlayers }`         |
| server → client | `matchmaking:matchFound` | `{ game, whitePlayer, blackPlayer }` |
| server → client | `matchmaking:cancelled`  | none (you queued from another tab) |
| client → server | `game:sync-state`        | `gameID`: joins the room as a player or spectator |
| client → server | `game:move`              | `gameID, from, to, promotion?` (e.g. `"e2", "e4"`; promotion defaults to `"q"`) |
| client → server | `game:sent-message`      | `{ gameID, text }`: the server adds author, role and timestamp |
| server → client | `game:updated`           | `{ game, whitePlayer, blackPlayer, messages? }` |

Active games are kept in memory ([backend/store/game.store.js](backend/store/game.store.js)) and written to the `games` table when they start and finish. Games still in progress are lost if the server restarts.

## Database

The schema is in [backend/db/db-schema.sql](backend/db/db-schema.sql):

- `users`: account details, activation flag and `elo` (default 800)
- `activation_tokens`: email verification tokens (1-hour expiry)
- `tokens`: one refresh token per user
- `friendships`: friend requests (`pending` / `accepted` / `rejected`)
- `games`: players, status, result/draw reason, move list, current FEN and time-control fields

## License

ISC
