export const WHITE = {id: 1, username: "alice", elo: 1500}
export const BLACK = {id: 2, username: "bob", elo: 1480}
export const SPECTATOR = {id: 3, username: "carol"}
export const START_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"

// game state shaped like the server's "game:updated" payload; clock: null leaves it out
export function liveGame({game = {}, clock, ...overrides} = {}) {
    return {
        game: {id: "game_1", status: "active", fen: START_FEN, moves: [], winner_id: null, draw_reason: null, ...game},
        whitePlayer: WHITE,
        blackPlayer: BLACK,
        messages: [],
        drawOffer: null,
        drawBlocked: [],
        leftPlayers: {},
        clock: clock === undefined
            ? {timeControl: "10+0", white: 600_000, black: 600_000, turn: "w", running: true, firstMoveMs: null}
            : clock,
        receivedAt: 0,
        ...overrides,
    }
}
