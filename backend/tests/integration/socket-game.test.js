import {afterAll, afterEach, beforeAll, beforeEach, describe, expect, test, vi} from "vitest"
import request from "supertest"
import db from "../../db/db.js"
import {createUser, getGameRow, getUser, resetDatabase} from "../helpers/db.js"
import {clearLiveGames} from "../helpers/games.js"
import {connectAs, connectWithCookie, issueTokens, nextEvent, recordEvents, startServer, wait} from "../helpers/server.js"

// how long to wait before deciding that an event did not happen
const QUIET_MS = 300

let server
let sockets = []

async function connect(user) {
    const socket = await connectAs(server.url, user)
    sockets.push(socket)
    return socket
}

// two new players search for the same time control; resolves once both are in the game
async function matchTwoPlayers(timeControl = "10+0", ratings = {}) {
    const a = await connect(await createUser(ratings))
    const b = await connect(await createUser(ratings))

    const foundA = nextEvent(a, "matchmaking:matchFound")
    const foundB = nextEvent(b, "matchmaking:matchFound")
    a.emit("matchmaking:start", timeControl)
    await nextEvent(a, "matchmaking:queued")
    b.emit("matchmaking:start", timeControl)
    const [state] = await Promise.all([foundA, foundB])

    const white = state.whitePlayer.id === a.user.id ? a : b
    const black = white === a ? b : a
    return {white, black, gameID: state.game.id, state}
}

// sends a move and waits until the given socket sees it applied
async function move(mover, observer, gameID, uci) {
    const movesBefore = (await currentState(observer, gameID)).game.moves.length
    const applied = nextEvent(observer, "game:updated", s => s.game.moves.length === movesBefore + 1)
    mover.emit("game:move", gameID, uci.slice(0, 2), uci.slice(2, 4), uci[4])
    return applied
}

// the state the server sends to this socket when it (re)joins the game
async function currentState(socket, gameID) {
    const state = nextEvent(socket, "game:updated")
    socket.emit("game:sync-state", gameID)
    return state
}

beforeAll(async () => {
    server = await startServer()
})

beforeEach(async () => {
    await resetDatabase()
    vi.spyOn(console, "log").mockImplementation(() => {})
    vi.spyOn(console, "error").mockImplementation(() => {})
})

afterEach(async () => {
    for (const socket of sockets) socket.close()
    sockets = []
    // let the server handle the disconnects before the live games are dropped
    await wait(50)
    clearLiveGames()
    vi.restoreAllMocks()
})

afterAll(async () => {
    await server.close()
    await db.$pool.end()
})

describe("socket authentication", () => {
    test("a connection without a refresh token is rejected as an expired session", async () => {
        const error = await connectWithCookie(server.url, null).catch(e => e)
        expect(error.data).toEqual({code: "SESSION_EXPIRED"})
    })

    test("a user who hasn't verified their email is rejected as not verified", async () => {
        const user = await createUser({activated: false})
        const {refresh} = await issueTokens(user)

        const error = await connectWithCookie(server.url, `refreshToken=${refresh}`).catch(e => e)

        expect(error.data).toEqual({code: "NOT_VERIFIED"})
    })

    test("a refresh token that was replaced by a newer one is rejected", async () => {
        const user = await createUser()
        const {refresh} = await issueTokens(user)
        await db.none(`UPDATE tokens SET refresh_token = 'newer-token' WHERE user_id = $1`, [user.id])

        const error = await connectWithCookie(server.url, `refreshToken=${refresh}`).catch(e => e)

        expect(error.data).toEqual({code: "SESSION_EXPIRED"})
    })

    test("a forged token is rejected", async () => {
        const forged = "eyJhbGciOiJIUzI1NiJ9.eyJpZCI6MX0.c2lnbmVkLXdpdGgtdGhlLXdyb25nLXNlY3JldA"
        const error = await connectWithCookie(server.url, `refreshToken=${forged}`).catch(e => e)
        expect(error.data).toEqual({code: "SESSION_EXPIRED"})
    })
})

describe("matchmaking", () => {
    test("two players looking for the same time control get one game, on opposite sides", async () => {
        const {white, black, gameID, state} = await matchTwoPlayers("3+2", {blitz: 1050})

        expect(white.user.id).not.toBe(black.user.id)
        expect(state.clock).toMatchObject({timeControl: "3+2", white: expect.any(Number), turn: "w", running: true})
        expect(state.clock.white).toBeLessThanOrEqual(180_000)
        expect(state.clock.white).toBeGreaterThan(178_000)
        expect(state.whitePlayer).toEqual({id: white.user.id, username: white.user.username, elo: 1050})
        expect(await getGameRow(gameID)).toMatchObject({status: "active", rating_category: "blitz"})
    })

    test("players looking for different time controls aren't matched", async () => {
        const a = await connect(await createUser())
        const b = await connect(await createUser())
        const foundA = recordEvents(a, "matchmaking:matchFound")
        const foundB = recordEvents(b, "matchmaking:matchFound")

        a.emit("matchmaking:start", "3+0")
        await nextEvent(a, "matchmaking:queued")
        b.emit("matchmaking:start", "5+0")
        await nextEvent(b, "matchmaking:queued")
        await wait(QUIET_MS)

        expect([...foundA, ...foundB]).toEqual([])
    })

    test("an unknown time control is ignored", async () => {
        const a = await connect(await createUser())
        const queued = recordEvents(a, "matchmaking:queued")

        a.emit("matchmaking:start", "2+1")
        a.emit("matchmaking:start", undefined)
        await wait(QUIET_MS)

        expect(queued).toEqual([])
    })

    test("a player searching from two tabs isn't matched with themselves; the older search is cancelled", async () => {
        const user = await createUser()
        const tab1 = await connect(user)
        const tab2 = await connect(user)
        const found = recordEvents(tab1, "matchmaking:matchFound")

        tab1.emit("matchmaking:start", "3+0")
        await nextEvent(tab1, "matchmaking:queued")
        const cancelled = nextEvent(tab1, "matchmaking:cancelled")
        tab2.emit("matchmaking:start", "3+0")

        await cancelled
        await wait(QUIET_MS)
        expect(found).toEqual([])
    })

    test("a cancelled search isn't matched", async () => {
        const a = await connect(await createUser())
        const b = await connect(await createUser())
        const found = recordEvents(b, "matchmaking:matchFound")

        a.emit("matchmaking:start", "3+0")
        await nextEvent(a, "matchmaking:queued")
        a.emit("matchmaking:cancel")
        await wait(50)
        b.emit("matchmaking:start", "3+0")
        await wait(QUIET_MS)

        expect(found).toEqual([])
    })

    test("a player who disconnects leaves the queue", async () => {
        const a = await connect(await createUser())
        const b = await connect(await createUser())
        const found = recordEvents(b, "matchmaking:matchFound")

        a.emit("matchmaking:start", "3+0")
        await nextEvent(a, "matchmaking:queued")
        a.close()
        await wait(50)
        b.emit("matchmaking:start", "3+0")
        await wait(QUIET_MS)

        expect(found).toEqual([])
    })

    test("a player in a live game is sent back to it instead of being queued", async () => {
        const {white, gameID} = await matchTwoPlayers()
        const queued = recordEvents(white, "matchmaking:queued")

        const reply = nextEvent(white, "matchmaking:activeGame")
        white.emit("matchmaking:start", "1+0")

        expect(await reply).toEqual({gameID})
        expect(queued).toEqual([])
    })

    test("a player in a live game who searches from another tab isn't put in a second game", async () => {
        const {white} = await matchTwoPlayers()
        const otherTab = await connect(white.user)
        const stranger = await connect(await createUser())
        const found = recordEvents(stranger, "matchmaking:matchFound")

        otherTab.emit("matchmaking:start", "10+0")
        await nextEvent(otherTab, "matchmaking:activeGame")
        stranger.emit("matchmaking:start", "10+0")
        await wait(QUIET_MS)

        expect(found).toEqual([])
    })
})

describe("playing a game", () => {
    test("moves reach both players, and checkmate ends the game and updates both ratings", async () => {
        const {white, black, gameID} = await matchTwoPlayers("10+0")

        await move(white, black, gameID, "f2f3")
        await move(black, white, gameID, "e7e5")
        await move(white, black, gameID, "g2g4")
        const finishedForWhite = nextEvent(white, "game:updated", s => s.game.status === "finished")
        const finishedForBlack = nextEvent(black, "game:updated", s => s.game.status === "finished")
        black.emit("game:move", gameID, "d8", "h4")

        const [state] = await Promise.all([finishedForWhite, finishedForBlack])
        expect(state.game).toMatchObject({winner_id: black.user.id, moves: ["f3", "e5", "g4", "Qh4#"]})
        expect(state.clock.running).toBe(false)

        expect(await getGameRow(gameID)).toMatchObject({status: "finished", winner_id: black.user.id})
        expect((await getUser(white.user.id)).elo_rapid).toBe(784)
        expect((await getUser(black.user.id)).elo_rapid).toBe(816)
    })

    test("a move out of turn is ignored and nobody is sent an update", async () => {
        const {white, black, gameID} = await matchTwoPlayers()
        const whiteUpdates = recordEvents(white, "game:updated")

        black.emit("game:move", gameID, "e7", "e5")
        await wait(QUIET_MS)

        expect(whiteUpdates).toEqual([])
        expect((await currentState(black, gameID)).game.moves).toEqual([])
    })

    test("malformed move payloads don't break the game", async () => {
        const {white, black, gameID} = await matchTwoPlayers()

        white.emit("game:move", gameID, {}, [])
        white.emit("game:move", gameID)
        white.emit("game:move", null, "e2", "e4")
        white.emit("game:move", {gameID}, "e2", "e4")
        await wait(50)

        const state = await move(white, black, gameID, "e2e4")
        expect(state.game.moves).toEqual(["e4"])
    })

    test("a player can resign and the opponent wins", async () => {
        const {white, black, gameID} = await matchTwoPlayers()
        await move(white, black, gameID, "e2e4")

        const finished = nextEvent(black, "game:updated", s => s.game.status === "finished")
        white.emit("game:resign", gameID)

        expect((await finished).game.winner_id).toBe(black.user.id)
        expect(await getGameRow(gameID)).toMatchObject({status: "finished", winner_id: black.user.id})
    })

    test("a draw offer can be accepted", async () => {
        const {white, black, gameID} = await matchTwoPlayers()

        const offered = nextEvent(black, "game:updated", s => s.drawOffer?.from === white.user.id)
        white.emit("game:offer-draw", gameID)
        await offered

        const drawn = nextEvent(white, "game:updated", s => s.game.status === "draw")
        black.emit("game:respond-draw", gameID, true)

        expect((await drawn).game.draw_reason).toBe("agreement")
        expect(await getGameRow(gameID)).toMatchObject({status: "draw", draw_reason: "agreement"})
    })

    test("only `true` accepts a draw offer", async () => {
        const {white, black, gameID} = await matchTwoPlayers()
        const offered = nextEvent(black, "game:updated", s => s.drawOffer)
        white.emit("game:offer-draw", gameID)
        await offered

        const declined = nextEvent(white, "game:updated", s => s.drawOffer === null)
        black.emit("game:respond-draw", gameID, "yes")

        const state = await declined
        expect(state.game.status).toBe("active")
        expect(state.drawBlocked).toEqual([white.user.id])
    })
})

describe("spectators and chat", () => {
    test("a spectator gets the game state but can't move, resign or offer a draw", async () => {
        const {white, black, gameID} = await matchTwoPlayers()
        await move(white, black, gameID, "e2e4")
        const spectator = await connect(await createUser())

        const state = await currentState(spectator, gameID)
        expect(state.game.moves).toEqual(["e4"])

        const playerUpdates = recordEvents(white, "game:updated")
        spectator.emit("game:move", gameID, "e7", "e5")
        spectator.emit("game:resign", gameID)
        spectator.emit("game:offer-draw", gameID)
        await wait(QUIET_MS)

        expect(playerUpdates).toEqual([])
        expect((await currentState(white, gameID)).game).toMatchObject({status: "active", moves: ["e4"]})
    })

    test("chat messages are labelled by the server, whatever the client claims", async () => {
        const {white, gameID} = await matchTwoPlayers()
        const spectator = await connect(await createUser())
        await currentState(spectator, gameID)

        const received = nextEvent(white, "game:updated", s => s.messages.length === 1)
        spectator.emit("game:sent-message", {
            gameID, text: "  good luck  ", role: "White Side Player", author: {id: white.user.id, username: "admin"},
        })

        const [message] = (await received).messages
        expect(message).toMatchObject({
            text: "good luck",
            role: "Spectator",
            author: {id: spectator.user.id, username: spectator.user.username},
        })
    })

    test("players' messages are labelled with their side", async () => {
        const {white, black, gameID} = await matchTwoPlayers()

        const first = nextEvent(white, "game:updated", s => s.messages.length === 1)
        white.emit("game:sent-message", {gameID, text: "hi"})
        await first
        const second = nextEvent(white, "game:updated", s => s.messages.length === 2)
        black.emit("game:sent-message", {gameID, text: "hello"})

        expect((await second).messages.map(m => m.role)).toEqual(["White Side Player", "Black Side Player"])
    })

    test("messages are cut to 150 characters and empty ones are dropped", async () => {
        const {white, black, gameID} = await matchTwoPlayers()

        white.emit("game:sent-message", {gameID, text: "    "})
        white.emit("game:sent-message", {gameID, text: 42})
        white.emit("game:sent-message", {gameID})
        const received = nextEvent(black, "game:updated", s => s.messages.length > 0)
        white.emit("game:sent-message", {gameID, text: "x".repeat(400)})

        const {messages} = await received
        expect(messages).toHaveLength(1)
        expect(messages[0].text).toBe("x".repeat(150))
    })

    test("someone who hasn't joined the game can't post in its chat", async () => {
        const {white, gameID} = await matchTwoPlayers()
        const outsider = await connect(await createUser())
        const updates = recordEvents(white, "game:updated")

        outsider.emit("game:sent-message", {gameID, text: "spam"})
        await wait(QUIET_MS)

        expect(updates).toEqual([])
    })
})

describe("leaving and returning", () => {
    test("when a player leaves, the opponent sees a one minute countdown, which stops when they return", async () => {
        const {white, black, gameID} = await matchTwoPlayers()

        const left = nextEvent(black, "game:updated", s => s.leftPlayers[white.user.id])
        const leftAt = Date.now()
        white.emit("game:leave", gameID)
        const deadline = (await left).leftPlayers[white.user.id]
        expect(deadline - leftAt).toBeGreaterThan(59_000)
        expect(deadline - leftAt).toBeLessThanOrEqual(60_500)

        const back = nextEvent(black, "game:updated", s => Object.keys(s.leftPlayers).length === 0)
        white.emit("game:sync-state", gameID)
        await back
    })

    test("disconnecting counts as leaving", async () => {
        const {white, black, gameID} = await matchTwoPlayers()

        const left = nextEvent(black, "game:updated", s => s.leftPlayers[white.user.id])
        white.close()

        expect((await left).leftPlayers[white.user.id]).toBeGreaterThan(Date.now())
        expect((await currentState(black, gameID)).game.status).toBe("active")
    })

    test("closing one of two tabs on the game doesn't count as leaving", async () => {
        const {white, black, gameID} = await matchTwoPlayers()
        const secondTab = await connect(white.user)
        await currentState(secondTab, gameID)
        const updates = recordEvents(black, "game:updated")

        white.close()
        await wait(QUIET_MS)

        expect(updates.filter(s => s.leftPlayers[white.user.id])).toEqual([])
    })

    test("a spectator leaving doesn't start a countdown", async () => {
        const {black, gameID} = await matchTwoPlayers()
        const spectator = await connect(await createUser())
        await currentState(spectator, gameID)
        const updates = recordEvents(black, "game:updated")

        spectator.close()
        await wait(QUIET_MS)

        expect(updates).toEqual([])
    })
})

describe("HTTP game routes", () => {
    test("/active-game returns the player's live game, and nothing for other users", async () => {
        const {white, black, gameID} = await matchTwoPlayers("5+0")
        const {access: whiteToken} = await issueTokens(white.user)
        const {access: strangerToken} = await issueTokens(await createUser())

        const own = await request(server.app).get("/api/active-game").set("Authorization", `Bearer ${whiteToken}`)
        const stranger = await request(server.app).get("/api/active-game").set("Authorization", `Bearer ${strangerToken}`)

        expect(own.body.activeGame).toMatchObject({
            id: gameID, timeControl: "5+0", color: "w", opponent: {id: black.user.id},
        })
        expect(stranger.body).toEqual({activeGame: null})
    })

    test("/active-game needs a valid access token", async () => {
        expect((await request(server.app).get("/api/active-game")).status).toBe(401)
        expect((await request(server.app).get("/api/active-game").set("Authorization", "Bearer nope")).status).toBe(401)
    })

    test("/game/:id returns a game with its players' ratings in the game's category", async () => {
        const {white, black, gameID} = await matchTwoPlayers("1+0", {bullet: 1300, blitz: 900})
        await move(white, black, gameID, "e2e4")
        white.emit("game:resign", gameID)
        await nextEvent(black, "game:updated", s => s.game.status === "finished")

        const res = await request(server.app).get(`/api/game/${gameID}`)

        expect(res.status).toBe(200)
        expect(res.body.game).toMatchObject({id: gameID, status: "finished", white_elo_before: 1300, white_elo_after: 1284})
        expect(res.body.whitePlayer).toEqual({id: white.user.id, username: white.user.username, elo: 1284})
        expect(res.body.blackPlayer.elo).toBe(1316)
        expect(JSON.stringify(res.body)).not.toContain("@test.com")
    })

    test("/game/:id returns 404 for an unknown game", async () => {
        expect((await request(server.app).get("/api/game/does-not-exist")).status).toBe(404)
    })
})
