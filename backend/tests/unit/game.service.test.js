import {afterEach, beforeEach, describe, expect, test, vi} from "vitest"

// a stand-in for the database: it remembers users and records every statement, so the
// tests can check what would have been saved; the real SQL is covered by the integration tests
const fakeDb = vi.hoisted(() => ({
    users: new Map(),
    statements: [],
    failTransaction: false,
}))

vi.mock("../../db/db.js", () => ({
    default: {
        one: async (sql, [id]) => {
            const user = fakeDb.users.get(id)
            if (!user) throw new Error("No data returned from the query.")
            return {...user}
        },
        query: async (sql, params) => {
            fakeDb.statements.push({sql, params})
            if (!sql.includes("INSERT INTO games")) return []

            const [id, white, black, initial, increment, category, whiteBefore, blackBefore] = params
            return [{
                id, white_player: white, black_player: black, status: "active", winner_id: null, draw_reason: null,
                moves: [], fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
                initial_time_control: initial, increment_time_control: increment,
                white_time_remaining: initial, black_time_remaining: initial,
                rating_category: category, white_elo_before: whiteBefore, black_elo_before: blackBefore,
                white_elo_after: null, black_elo_after: null,
            }]
        },
        tx: async (callback) => {
            const t = {none: async (sql, params) => fakeDb.statements.push({sql, params, inTransaction: true})}
            await callback(t)
            if (fakeDb.failTransaction) throw new Error("connection lost")
        },
    },
}))

const {default: gameService} = await import("../../services/game.service.js")
const {gameStore} = await import("../../store/game.store.js")
const {clearLiveGames} = await import("../helpers/games.js")

const WHITE = 1
const BLACK = 2
const SPECTATOR = 3
const GAME = "game_test"

function addUser(id, {bullet = 800, blitz = 800, rapid = 800} = {}) {
    fakeDb.users.set(id, {id, username: `user${id}`, email: `user${id}@test.com`,
        elo_bullet: bullet, elo_blitz: blitz, elo_rapid: rapid})
}

// matchmaking passes sockets; only user.id and join() are used
const fakeSocket = (id) => ({user: {id, username: `user${id}`}, join: vi.fn()})

// WHITE always gets white: start() picks the side with Math.random
async function startGame(timeControl = "10+0", onTimerEnd = vi.fn()) {
    vi.spyOn(Math, "random").mockReturnValue(0)
    await gameService.start([fakeSocket(WHITE), fakeSocket(BLACK)], GAME, timeControl, onTimerEnd)
    vi.mocked(Math.random).mockRestore()
    return gameStore.get(GAME)
}

// plays moves like "e2e4" or "e7e8n", each by the side to move
async function play(...moves) {
    for (const move of moves) {
        const entry = gameStore.get(GAME)
        const player = entry.chess.turn() === "w" ? WHITE : BLACK
        const result = await gameService.makeMove(player, GAME, move.slice(0, 2), move.slice(2, 4), move[4])
        if (!result.success) throw new Error(`move ${move} was rejected`)
    }
}

// what the transaction wrote to the users table: {userID: {column, rating}}
function savedRatings() {
    const ratings = {}
    for (const {sql, params} of fakeDb.statements) {
        if (sql.includes("UPDATE users")) {
            const [column, rating, userID] = params
            ratings[userID] = {column, rating}
        }
    }
    return ratings
}

const savedGames = () => fakeDb.statements.filter(s => s.sql.includes("UPDATE games"))

beforeEach(() => {
    vi.useFakeTimers()
    fakeDb.users.clear()
    fakeDb.statements = []
    fakeDb.failTransaction = false
    addUser(WHITE)
    addUser(BLACK)
    vi.spyOn(console, "log").mockImplementation(() => {})
    vi.spyOn(console, "error").mockImplementation(() => {})
})

afterEach(() => {
    clearLiveGames()
    vi.useRealTimers()
    vi.restoreAllMocks()
})

describe("starting a game", () => {
    test("sets up both clocks from the chosen time control", async () => {
        const entry = await startGame("3+2")

        expect(entry.timeControl).toBe("3+2")
        expect(gameService.serialize(entry).clock).toMatchObject({
            timeControl: "3+2", white: 180_000, black: 180_000, turn: "w", running: true,
        })
        expect(entry.game.initial_time_control).toBe(180)
        expect(entry.game.increment_time_control).toBe(2)
    })

    test("puts both players in the game room", async () => {
        const white = fakeSocket(WHITE)
        const black = fakeSocket(BLACK)
        await gameService.start([white, black], GAME, "10+0", vi.fn())

        expect(white.join).toHaveBeenCalledWith(GAME)
        expect(black.join).toHaveBeenCalledWith(GAME)
    })

    test("either player can get white", async () => {
        const whiteIDs = new Set()
        for (const random of [0.1, 0.9]) {
            vi.spyOn(Math, "random").mockReturnValue(random)
            await gameService.start([fakeSocket(WHITE), fakeSocket(BLACK)], GAME, "10+0", vi.fn())
            whiteIDs.add(gameStore.get(GAME).whitePlayer.id)
            clearLiveGames()
        }
        expect(whiteIDs).toEqual(new Set([WHITE, BLACK]))
    })

    test("records each player's rating in the game's category, not another category", async () => {
        addUser(WHITE, {bullet: 950, blitz: 1234, rapid: 1500})
        addUser(BLACK, {bullet: 1100, blitz: 1010, rapid: 700})

        const entry = await startGame("3+0")

        expect(entry.game.rating_category).toBe("blitz")
        expect(entry.game.white_elo_before).toBe(1234)
        expect(entry.game.black_elo_before).toBe(1010)
        expect(entry.whitePlayer.elo).toBe(1234)
        expect(entry.blackPlayer.elo).toBe(1010)
    })

    test.each([
        ["1+0", "bullet"], ["3+0", "blitz"], ["3+2", "blitz"], ["5+0", "blitz"], ["10+0", "rapid"], ["15+10", "rapid"],
    ])("%s is a %s game", async (timeControl, category) => {
        const entry = await startGame(timeControl)
        expect(entry.game.rating_category).toBe(category)
    })

    test("reads ratings from the database, not the possibly outdated socket user", async () => {
        addUser(WHITE, {rapid: 1350})
        const staleSocket = {user: {id: WHITE, ratings: {rapid: 800}}, join: vi.fn()}

        vi.spyOn(Math, "random").mockReturnValue(0)
        await gameService.start([staleSocket, fakeSocket(BLACK)], GAME, "10+0", vi.fn())

        expect(gameStore.get(GAME).game.white_elo_before).toBe(1350)
    })

    test("doesn't send emails to opponents and spectators", async () => {
        const entry = await startGame()
        const state = JSON.stringify(gameService.serialize(entry))
        expect(state).not.toContain("@test.com")
    })
})

describe("moves", () => {
    test("the side to move can make a legal move", async () => {
        const entry = await startGame()

        const result = await gameService.makeMove(WHITE, GAME, "e2", "e4")

        expect(result.success).toBe(true)
        expect(entry.chess.get("e4")).toMatchObject({type: "p", color: "w"})
        expect(entry.game.moves).toEqual(["e4"])
        expect(entry.game.fen).toBe(entry.chess.fen())
        expect(entry.chess.turn()).toBe("b")
    })

    test("a player can't move when it's not their turn", async () => {
        const entry = await startGame()

        expect((await gameService.makeMove(BLACK, GAME, "e7", "e5")).success).toBe(false)
        await play("e2e4")
        expect((await gameService.makeMove(WHITE, GAME, "d2", "d4")).success).toBe(false)

        expect(entry.game.moves).toEqual(["e4"])
    })

    test("a player can't move the opponent's pieces", async () => {
        const entry = await startGame()

        expect((await gameService.makeMove(WHITE, GAME, "e7", "e5")).success).toBe(false)
        expect(entry.chess.history()).toEqual([])
    })

    test("a spectator can't move", async () => {
        const entry = await startGame()

        expect((await gameService.makeMove(SPECTATOR, GAME, "e2", "e4")).success).toBe(false)
        expect(entry.chess.history()).toEqual([])
    })

    test("illegal moves are rejected", async () => {
        const entry = await startGame()

        for (const [from, to] of [["e2", "e5"], ["b1", "b3"], ["e1", "e2"], ["a1", "a5"]]) {
            expect((await gameService.makeMove(WHITE, GAME, from, to)).success, `${from}-${to}`).toBe(false)
        }
        expect(entry.chess.history()).toEqual([])
    })

    test("malformed moves are rejected without throwing", async () => {
        await startGame()

        for (const [from, to] of [[undefined, undefined], ["z9", "e4"], ["e2", null], ["", ""], ["e2", "e9"]]) {
            await expect(gameService.makeMove(WHITE, GAME, from, to)).resolves.toEqual({success: false})
        }
    })

    test("moves in a game that doesn't exist are rejected", async () => {
        expect(await gameService.makeMove(WHITE, "no_such_game", "e2", "e4")).toEqual({success: false})
    })

    describe("promotion", () => {
        async function pawnOnSeventh() {
            const entry = await startGame()
            entry.chess.load("8/4P3/8/8/8/8/8/k6K w - - 0 1")
            return entry
        }

        test("the pawn becomes the chosen piece", async () => {
            for (const piece of ["q", "r", "b", "n"]) {
                const entry = await pawnOnSeventh()
                expect((await gameService.makeMove(WHITE, GAME, "e7", "e8", piece)).success).toBe(true)
                expect(entry.chess.get("e8")).toMatchObject({type: piece, color: "w"})
                clearLiveGames()
            }
        })

        test("a queen is used when no piece is given", async () => {
            const entry = await pawnOnSeventh()
            await gameService.makeMove(WHITE, GAME, "e7", "e8")
            expect(entry.chess.get("e8")).toMatchObject({type: "q", color: "w"})
        })

        test("promoting to a king or a pawn is rejected", async () => {
            const entry = await pawnOnSeventh()
            for (const piece of ["k", "p", "x"]) {
                expect((await gameService.makeMove(WHITE, GAME, "e7", "e8", piece)).success, piece).toBe(false)
            }
            expect(entry.chess.get("e7")).toMatchObject({type: "p", color: "w"})
        })

        test("a promotion piece sent with an ordinary move is ignored", async () => {
            const entry = await startGame()
            expect((await gameService.makeMove(WHITE, GAME, "e2", "e4", "n")).success).toBe(true)
            expect(entry.chess.get("e4")).toMatchObject({type: "p"})
        })
    })
})

describe("the board ends the game", () => {
    test("checkmate: the mating side wins and both ratings change", async () => {
        const entry = await startGame()

        await play("f2f3", "e7e5", "g2g4", "d8h4")

        expect(entry.game.status).toBe("finished")
        expect(entry.game.winner_id).toBe(BLACK)
        expect(entry.game.white_elo_after).toBe(784)
        expect(entry.game.black_elo_after).toBe(816)
        expect(gameStore.has(GAME)).toBe(false)
    })

    test("stalemate is a draw", async () => {
        const entry = await startGame()
        entry.chess.load("7k/8/6K1/8/8/8/8/5Q2 w - - 0 1")

        await play("f1f7")

        expect(entry.game).toMatchObject({status: "draw", draw_reason: "stalemate", winner_id: null})
    })

    test("insufficient material is a draw", async () => {
        const entry = await startGame()
        entry.chess.load("8/8/8/8/8/8/4q3/4K2k w - - 0 1")

        await play("e1e2")

        expect(entry.game).toMatchObject({status: "draw", draw_reason: "insufficient_material"})
    })

    test("threefold repetition is a draw", async () => {
        const entry = await startGame()

        await play("g1f3", "g8f6", "f3g1", "f6g8", "g1f3", "g8f6", "f3g1")
        expect(gameStore.has(GAME)).toBe(true)
        await play("f6g8")

        expect(entry.game).toMatchObject({status: "draw", draw_reason: "threefold_repetition"})
    })

    test("the 50-move rule is a draw", async () => {
        const entry = await startGame()
        entry.chess.load("8/8/8/8/8/8/R7/K6k w - - 99 80")

        await play("a2a3")

        expect(entry.game).toMatchObject({status: "draw", draw_reason: "fifty_move_rule"})
    })

    test("no moves are accepted after the game ended", async () => {
        await startGame()
        await play("f2f3", "e7e5", "g2g4", "d8h4")

        expect((await gameService.makeMove(WHITE, GAME, "a2", "a3")).success).toBe(false)
    })
})

describe("clocks", () => {
    test("only the side to move loses time", async () => {
        const entry = await startGame()

        await vi.advanceTimersByTimeAsync(5_000)

        const {clock} = gameService.serialize(entry)
        expect(clock.white).toBe(595_000)
        expect(clock.black).toBe(600_000)
    })

    test("a move stops the mover's clock and starts the opponent's", async () => {
        const entry = await startGame()

        await vi.advanceTimersByTimeAsync(5_000)
        await play("e2e4")
        await vi.advanceTimersByTimeAsync(3_000)

        const {clock} = gameService.serialize(entry)
        expect(clock.white).toBe(595_000)
        expect(clock.black).toBe(597_000)
        expect(clock.turn).toBe("b")
    })

    test("the increment is added after each move", async () => {
        const entry = await startGame("3+2")

        await vi.advanceTimersByTimeAsync(10_000)
        await play("e2e4")
        await vi.advanceTimersByTimeAsync(4_000)
        await play("e7e5")

        const {clock} = gameService.serialize(entry)
        expect(clock.white).toBe(172_000)
        expect(clock.black).toBe(178_000)
    })

    test("running out of time loses the game", async () => {
        const onTimerEnd = vi.fn()
        const entry = await startGame("1+0", onTimerEnd)
        await play("e2e4", "e7e5")

        await vi.advanceTimersByTimeAsync(59_999)
        expect(gameStore.has(GAME)).toBe(true)

        await vi.advanceTimersByTimeAsync(1)
        expect(entry.game.status).toBe("finished")
        expect(entry.game.winner_id).toBe(BLACK)
        expect(gameService.serialize(entry).clock.white).toBe(0)
        expect(onTimerEnd).toHaveBeenCalledWith(entry)
    })

    test("a loss on time is rated", async () => {
        const entry = await startGame("1+0")
        await play("e2e4", "e7e5", "g1f3")

        await vi.advanceTimersByTimeAsync(60_000)

        expect(entry.game.winner_id).toBe(WHITE)
        expect(savedRatings()).toEqual({
            [WHITE]: {column: "elo_bullet", rating: 816},
            [BLACK]: {column: "elo_bullet", rating: 784},
        })
    })

    test("a move that arrives after the mover's time ran out loses instead of being played", async () => {
        const entry = await startGame("1+0")
        await play("e2e4", "e7e5")

        // the clock time passes without the flag timer firing yet
        vi.setSystemTime(Date.now() + 61_000)
        const result = await gameService.makeMove(WHITE, GAME, "d2", "d4")

        expect(result.success).toBe(false)
        expect(entry.chess.history()).toEqual(["e4", "e5"])
        expect(entry.game.status).toBe("finished")
        expect(entry.game.winner_id).toBe(BLACK)
    })

    test("clocks stop when the game ends", async () => {
        const entry = await startGame()
        await vi.advanceTimersByTimeAsync(2_000)
        await play("f2f3")
        await vi.advanceTimersByTimeAsync(3_000)
        await play("e7e5", "g2g4", "d8h4")

        const atEnd = gameService.serialize(entry).clock
        await vi.advanceTimersByTimeAsync(30_000)
        const later = gameService.serialize(entry).clock

        expect(later.white).toBe(atEnd.white)
        expect(later.black).toBe(atEnd.black)
        expect(later.running).toBe(false)
        expect(entry.game.white_time_remaining).toBe(598)
        expect(entry.game.black_time_remaining).toBe(597)
    })
})

describe("first move deadline", () => {
    test("white has a minute for the first move, then the game is aborted and not rated", async () => {
        const onTimerEnd = vi.fn()
        const entry = await startGame("10+0", onTimerEnd)

        await vi.advanceTimersByTimeAsync(59_000)
        expect(gameStore.has(GAME)).toBe(true)
        expect(gameService.serialize(entry).clock.firstMoveMs).toBe(1_000)

        await vi.advanceTimersByTimeAsync(1_000)
        expect(entry.game.status).toBe("aborted")
        expect(entry.game.winner_id).toBe(null)
        expect(entry.game.white_elo_after).toBe(null)
        expect(savedRatings()).toEqual({})
        expect(onTimerEnd).toHaveBeenCalledWith(entry)
    })

    test("black's minute starts from white's first move", async () => {
        const entry = await startGame()

        await vi.advanceTimersByTimeAsync(50_000)
        await play("e2e4")

        await vi.advanceTimersByTimeAsync(59_000)
        expect(gameStore.has(GAME)).toBe(true)

        await vi.advanceTimersByTimeAsync(1_000)
        expect(entry.game.status).toBe("aborted")
    })

    test("black can make the first move within the minute", async () => {
        const entry = await startGame()

        await play("e2e4")
        await vi.advanceTimersByTimeAsync(59_000)
        await play("e7e5")

        expect(entry.chess.history()).toEqual(["e4", "e5"])
        expect(gameService.serialize(entry).clock.firstMoveMs).toBe(null)
    })

    test("there's no deadline once both sides have moved", async () => {
        await startGame()
        await play("e2e4", "e7e5")

        await vi.advanceTimersByTimeAsync(5 * 60_000)

        expect(gameStore.has(GAME)).toBe(true)
    })

    test("running out of time before both sides moved aborts instead of losing", async () => {
        const entry = await startGame("1+0")

        await play("e2e4")
        await vi.advanceTimersByTimeAsync(60_000)

        expect(entry.game.status).toBe("aborted")
        expect(entry.game.winner_id).toBe(null)
        expect(savedRatings()).toEqual({})
    })
})

describe("resigning", () => {
    test("the opponent of the player who resigns wins", async () => {
        const entry = await startGame()
        await play("e2e4")

        expect((await gameService.resign(WHITE, GAME)).success).toBe(true)

        expect(entry.game).toMatchObject({status: "finished", winner_id: BLACK})
        expect(gameStore.has(GAME)).toBe(false)
    })

    test("a spectator can't resign for a player", async () => {
        await startGame()

        expect((await gameService.resign(SPECTATOR, GAME)).success).toBe(false)
        expect(gameStore.has(GAME)).toBe(true)
    })

    test("a finished game can't be ended again", async () => {
        const entry = await startGame()
        await play("e2e4")
        await gameService.resign(WHITE, GAME)

        expect((await gameService.resign(BLACK, GAME)).success).toBe(false)
        expect(entry.game.winner_id).toBe(BLACK)
        expect(savedGames()).toHaveLength(1)
    })

    test("two endings at the same moment save the game once", async () => {
        const entry = await startGame()
        await play("e2e4")

        await Promise.all([gameService.resign(WHITE, GAME), gameService.resign(BLACK, GAME)])

        expect(savedGames()).toHaveLength(1)
        expect(entry.game.winner_id).toBe(BLACK)
    })
})

describe("draw offers", () => {
    test("the opponent can accept a draw offer", async () => {
        const entry = await startGame()
        await play("e2e4")

        await gameService.offerDraw(WHITE, GAME)
        expect(entry.drawOffer).toEqual({from: WHITE})
        await gameService.respondDraw(BLACK, GAME, true)

        expect(entry.game).toMatchObject({status: "draw", draw_reason: "agreement", winner_id: null})
    })

    test("the player who offered can't accept their own offer", async () => {
        const entry = await startGame()

        await gameService.offerDraw(WHITE, GAME)

        expect((await gameService.respondDraw(WHITE, GAME, true)).success).toBe(false)
        expect(gameStore.has(GAME)).toBe(true)
        expect(entry.drawOffer).toEqual({from: WHITE})
    })

    test("offering while the opponent's offer is pending accepts it", async () => {
        const entry = await startGame()

        await gameService.offerDraw(WHITE, GAME)
        await gameService.offerDraw(BLACK, GAME)

        expect(entry.game).toMatchObject({status: "draw", draw_reason: "agreement"})
    })

    test("a player can't make a second offer while theirs is pending", async () => {
        await startGame()

        await gameService.offerDraw(WHITE, GAME)
        expect((await gameService.offerDraw(WHITE, GAME)).success).toBe(false)
    })

    test("after a decline, the player who offered must move before offering again", async () => {
        const entry = await startGame()

        await gameService.offerDraw(WHITE, GAME)
        await gameService.respondDraw(BLACK, GAME, false)
        expect(entry.drawOffer).toBe(null)
        expect((await gameService.offerDraw(WHITE, GAME)).success).toBe(false)

        await play("e2e4")
        expect((await gameService.offerDraw(WHITE, GAME)).success).toBe(true)
    })

    test("a decline doesn't stop the player who declined from offering", async () => {
        await startGame()

        await gameService.offerDraw(WHITE, GAME)
        await gameService.respondDraw(BLACK, GAME, false)

        expect((await gameService.offerDraw(BLACK, GAME)).success).toBe(true)
    })

    test("an offer is cancelled when the player who made it moves", async () => {
        const entry = await startGame()

        await gameService.offerDraw(WHITE, GAME)
        await play("e2e4")

        expect(entry.drawOffer).toBe(null)
        expect((await gameService.respondDraw(BLACK, GAME, true)).success).toBe(false)
        expect(gameStore.has(GAME)).toBe(true)
    })

    test("an offer stays open when the opponent moves", async () => {
        const entry = await startGame()
        await play("e2e4")

        await gameService.offerDraw(WHITE, GAME)
        await play("e7e5")

        expect(entry.drawOffer).toEqual({from: WHITE})
    })

    test("spectators can't offer or answer draws", async () => {
        const entry = await startGame()

        expect((await gameService.offerDraw(SPECTATOR, GAME)).success).toBe(false)
        await gameService.offerDraw(WHITE, GAME)
        expect((await gameService.respondDraw(SPECTATOR, GAME, true)).success).toBe(false)
        expect(gameStore.has(GAME)).toBe(true)
        expect(entry.drawOffer).toEqual({from: WHITE})
    })

    test("a draw by agreement is rated", async () => {
        addUser(WHITE, {rapid: 1400})
        addUser(BLACK, {rapid: 1800})
        const entry = await startGame("10+0")

        await gameService.offerDraw(WHITE, GAME)
        await gameService.respondDraw(BLACK, GAME, true)

        expect(entry.game.white_elo_after).toBe(1413)
        expect(entry.game.black_elo_after).toBe(1787)
    })
})

describe("leaving a game", () => {
    test("a leave timer can only be started once per player and can be cancelled", async () => {
        const entry = await startGame()
        const onTimeout = vi.fn()

        expect(gameService.startLeaveTimer(GAME, WHITE, 60_000, onTimeout)).toBe(true)
        expect(gameService.startLeaveTimer(GAME, WHITE, 60_000, onTimeout)).toBe(false)
        expect(gameService.serialize(entry).leftPlayers[WHITE]).toBe(Date.now() + 60_000)

        expect(gameService.cancelLeaveTimer(GAME, WHITE)).toBe(true)
        await vi.advanceTimersByTimeAsync(60_000)
        expect(onTimeout).not.toHaveBeenCalled()
        expect(gameService.serialize(entry).leftPlayers).toEqual({})
    })

    test("leaving before any move aborts the game", async () => {
        const entry = await startGame()

        await gameService.resolveAbandonment(GAME, WHITE, true)

        expect(entry.game.status).toBe("aborted")
        expect(savedRatings()).toEqual({})
    })

    test("after moves, the player who left loses if the opponent stayed", async () => {
        const entry = await startGame()
        await play("e2e4", "e7e5")

        await gameService.resolveAbandonment(GAME, BLACK, true)

        expect(entry.game).toMatchObject({status: "finished", winner_id: WHITE})
    })

    test("after moves, it's a draw if both players are gone", async () => {
        const entry = await startGame()
        await play("e2e4", "e7e5")

        await gameService.resolveAbandonment(GAME, BLACK, false)

        expect(entry.game).toMatchObject({status: "draw", winner_id: null})
    })

    test("ending the game cancels pending leave timers", async () => {
        await startGame()
        const onTimeout = vi.fn()
        gameService.startLeaveTimer(GAME, BLACK, 60_000, onTimeout)

        await gameService.resign(WHITE, GAME)
        await vi.advanceTimersByTimeAsync(60_000)

        expect(onTimeout).not.toHaveBeenCalled()
    })
})

describe("saving ratings", () => {
    test("only the rating of the game's category changes", async () => {
        addUser(WHITE, {bullet: 900, blitz: 1000, rapid: 1100})
        addUser(BLACK, {bullet: 900, blitz: 1000, rapid: 1100})
        await startGame("5+0")

        await gameService.resign(BLACK, GAME)

        expect(savedRatings()).toEqual({
            [WHITE]: {column: "elo_blitz", rating: 1016},
            [BLACK]: {column: "elo_blitz", rating: 984},
        })
    })

    test("the game and the ratings are written in one transaction", async () => {
        await startGame()
        await gameService.resign(BLACK, GAME)

        const writes = fakeDb.statements.filter(s => /UPDATE (games|users)/.test(s.sql))
        expect(writes).toHaveLength(3)
        expect(writes.every(s => s.inTransaction)).toBe(true)
    })

    test("a failed save doesn't crash the server", async () => {
        await startGame()
        fakeDb.failTransaction = true

        await expect(gameService.resign(BLACK, GAME)).resolves.toEqual({success: true})
    })
})

describe("finding a player's live game", () => {
    test("finds the game for both players but not for others", async () => {
        const entry = await startGame()

        expect(gameService.findActiveGameForUser(WHITE)).toBe(entry)
        expect(gameService.findActiveGameForUser(BLACK)).toBe(entry)
        expect(gameService.findActiveGameForUser(SPECTATOR)).toBeUndefined()
    })

    test("a finished game is no longer found", async () => {
        await startGame()
        await gameService.resign(WHITE, GAME)

        expect(gameService.findActiveGameForUser(WHITE)).toBeUndefined()
    })
})
