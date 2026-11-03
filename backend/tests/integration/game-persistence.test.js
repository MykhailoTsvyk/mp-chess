import {afterAll, afterEach, beforeEach, describe, expect, test, vi} from "vitest"
import db from "../../db/db.js"
import gameService from "../../services/game.service.js"
import userService from "../../services/user.service.js"
import {gameStore} from "../../store/game.store.js"
import {createUser, getGameRow, getUser, resetDatabase} from "../helpers/db.js"
import {clearLiveGames} from "../helpers/games.js"

// games are saved to the real test database here; only the sockets are fakes
const fakeSocket = (user) => ({user: {id: user.id, username: user.username}, join: () => {}})

let gameCount = 0

// the first user plays white
async function startGame(white, black, timeControl = "10+0") {
    const id = `game_db_${++gameCount}`
    vi.spyOn(Math, "random").mockReturnValue(0)
    await gameService.start([fakeSocket(white), fakeSocket(black)], id, timeControl, () => {})
    vi.mocked(Math.random).mockRestore()
    return id
}

async function play(gameID, ...moves) {
    for (const move of moves) {
        const entry = gameStore.get(gameID)
        const player = entry.chess.turn() === "w" ? entry.whitePlayer.id : entry.blackPlayer.id
        const result = await gameService.makeMove(player, gameID, move.slice(0, 2), move.slice(2, 4), move[4])
        if (!result.success) throw new Error(`move ${move} was rejected`)
    }
}

beforeEach(async () => {
    await resetDatabase()
    vi.spyOn(console, "log").mockImplementation(() => {})
    vi.spyOn(console, "error").mockImplementation(() => {})
})

afterEach(() => {
    clearLiveGames()
    vi.restoreAllMocks()
})

afterAll(() => db.$pool.end())

describe("starting a game", () => {
    test("creates an active game row with the time control and both ratings before the game", async () => {
        const white = await createUser({blitz: 1210})
        const black = await createUser({blitz: 990})

        const id = await startGame(white, black, "3+2")

        expect(await getGameRow(id)).toMatchObject({
            status: "active",
            white_player: white.id,
            black_player: black.id,
            initial_time_control: 180,
            increment_time_control: 2,
            white_time_remaining: 180,
            black_time_remaining: 180,
            rating_category: "blitz",
            white_elo_before: 1210,
            black_elo_before: 990,
            white_elo_after: null,
            black_elo_after: null,
            winner_id: null,
        })
    })

    test("fails for a user that doesn't exist, without leaving a live game behind", async () => {
        const white = await createUser()

        await expect(startGame(white, {id: 99999, username: "ghost"})).rejects.toThrow()
        expect(gameStore.getAll().size).toBe(0)
    })
})

describe("finishing a game", () => {
    test("checkmate saves the result, the moves, the final position and the new ratings", async () => {
        const white = await createUser({rapid: 1500})
        const black = await createUser({rapid: 1600})
        const id = await startGame(white, black)

        await play(id, "f2f3", "e7e5", "g2g4", "d8h4")

        const row = await getGameRow(id)
        expect(row).toMatchObject({
            status: "finished",
            winner_id: black.id,
            draw_reason: null,
            moves: ["f3", "e5", "g4", "Qh4#"],
            fen: "rnb1kbnr/pppp1ppp/8/4p3/6Pq/5P2/PPPPP2P/RNBQKBNR w KQkq - 1 3",
            white_elo_before: 1500,
            black_elo_before: 1600,
            white_elo_after: 1488,
            black_elo_after: 1612,
        })
        expect((await getUser(white.id)).elo_rapid).toBe(1488)
        expect((await getUser(black.id)).elo_rapid).toBe(1612)
    })

    test("only the rating of the game's category changes", async () => {
        const white = await createUser({bullet: 900, blitz: 1000, rapid: 1100})
        const black = await createUser({bullet: 900, blitz: 1000, rapid: 1100})
        const id = await startGame(white, black, "1+0")

        await gameService.resign(black.id, id)

        expect(await getUser(white.id)).toMatchObject({elo_bullet: 916, elo_blitz: 1000, elo_rapid: 1100})
        expect(await getUser(black.id)).toMatchObject({elo_bullet: 884, elo_blitz: 1000, elo_rapid: 1100})
    })

    test("a draw is saved with its reason and rated", async () => {
        const white = await createUser({rapid: 1400})
        const black = await createUser({rapid: 1800})
        const id = await startGame(white, black)

        await gameService.offerDraw(white.id, id)
        await gameService.respondDraw(black.id, id, true)

        expect(await getGameRow(id)).toMatchObject({
            status: "draw", draw_reason: "agreement", winner_id: null, white_elo_after: 1413, black_elo_after: 1787,
        })
        expect((await getUser(white.id)).elo_rapid).toBe(1413)
        expect((await getUser(black.id)).elo_rapid).toBe(1787)
    })

    test("an aborted game is saved without changing anyone's rating", async () => {
        const white = await createUser({rapid: 1234})
        const black = await createUser({rapid: 1234})
        const id = await startGame(white, black)

        await gameService.resolveAbandonment(id, white.id, true)

        expect(await getGameRow(id)).toMatchObject({status: "aborted", white_elo_after: null, black_elo_after: null})
        expect((await getUser(white.id)).elo_rapid).toBe(1234)
        expect((await getUser(black.id)).elo_rapid).toBe(1234)
    })

    test("the next game starts from the rating the last game ended with", async () => {
        const a = await createUser()
        const b = await createUser()

        const first = await startGame(a, b, "3+0")
        await gameService.resign(b.id, first)
        const second = await startGame(b, a, "5+0")

        expect(await getGameRow(second)).toMatchObject({white_elo_before: 784, black_elo_before: 816})
    })

    test("if saving the ratings fails, the game result isn't saved either", async () => {
        const white = await createUser({rapid: 1000})
        const black = await createUser({rapid: 1000})
        const id = await startGame(white, black)

        // makes every rating update fail inside the transaction
        await db.none(`
            CREATE FUNCTION reject_rating_update() RETURNS trigger AS $$
            BEGIN RAISE EXCEPTION 'rating update rejected'; END $$ LANGUAGE plpgsql;
            CREATE TRIGGER reject_rating_update BEFORE UPDATE ON users
            FOR EACH ROW EXECUTE FUNCTION reject_rating_update();`)

        try {
            await gameService.resign(black.id, id)

            expect(await getGameRow(id)).toMatchObject({status: "active", winner_id: null, white_elo_after: null})
            expect((await getUser(white.id)).elo_rapid).toBe(1000)
        } finally {
            await db.none(`DROP TRIGGER reject_rating_update ON users; DROP FUNCTION reject_rating_update();`)
        }
    })
})

describe("profile stats", () => {
    test("counts wins, losses and draws, and leaves out aborted and live games", async () => {
        const me = await createUser()
        const other = await createUser()

        const win = await startGame(me, other, "10+0")
        await gameService.resign(other.id, win)
        const loss = await startGame(other, me, "3+0")
        await gameService.resign(me.id, loss)
        const draw = await startGame(me, other, "1+0")
        await gameService.offerDraw(me.id, draw)
        await gameService.respondDraw(other.id, draw, true)
        const aborted = await startGame(me, other, "10+0")
        await gameService.resolveAbandonment(aborted, me.id, true)
        await startGame(other, me, "10+0") // still being played

        const profile = await userService.getProfile(me.id, me.id)

        expect(profile.stats).toEqual({games_played: 3, wins: 1, losses: 1, draws: 1})
        expect(profile.ratings.rapid.games).toBe(1)
        expect(profile.ratings.blitz.games).toBe(1)
        expect(profile.ratings.bullet.games).toBe(1)
        // the opponent's numbers are the mirror image
        expect((await userService.getProfile(other.id, me.id)).stats).toEqual({games_played: 3, wins: 1, losses: 1, draws: 1})
    })

    test("shows the current rating of every category", async () => {
        const me = await createUser({bullet: 1111, blitz: 1222, rapid: 1333})

        const profile = await userService.getProfile(me.id, me.id)

        expect(profile.ratings).toEqual({
            bullet: {rating: 1111, games: 0},
            blitz: {rating: 1222, games: 0},
            rapid: {rating: 1333, games: 0},
        })
        expect(profile.stats).toEqual({games_played: 0, wins: 0, losses: 0, draws: 0})
    })

    test("email and verification status are only shown to the owner", async () => {
        const me = await createUser()
        const other = await createUser()

        const own = await userService.getProfile(me.id, me.id)
        const someoneElse = await userService.getProfile(me.id, other.id)

        expect(own).toMatchObject({email: me.email, is_activated: true})
        expect(someoneElse).not.toHaveProperty("email")
        expect(someoneElse).not.toHaveProperty("is_activated")
    })

    test("a user that doesn't exist has no profile", async () => {
        expect(await userService.getProfile(12345, 1)).toBe(null)
    })
})
