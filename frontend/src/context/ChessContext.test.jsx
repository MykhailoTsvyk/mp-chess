import {useEffect} from "react"
import {beforeEach, describe, expect, test, vi} from "vitest"
import {act, render, screen, waitFor} from "@testing-library/react"
import ChessProvider, {useChess} from "./ChessContext.jsx"
import {liveGame} from "../test/gameData.js"

const mocks = vi.hoisted(() => ({socket: null, get: null}))
vi.mock("./SocketContext.jsx", () => ({useSocket: () => ({socket: mocks.socket})}))
vi.mock("../api/axios.js", () => ({default: {get: (...args) => mocks.get(...args)}}))

// a socket whose server side the test controls
function fakeSocket() {
    const handlers = {}
    return {
        emit: vi.fn(),
        on: (event, handler) => { (handlers[event] ??= new Set()).add(handler) },
        off: (event, handler) => handlers[event]?.delete(handler),
        receive: (event, data) => act(() => handlers[event]?.forEach(h => h(data))),
        listenerCount: (event) => handlers[event]?.size ?? 0,
    }
}

// the HTTP reply is resolved by the test, so it can arrive before or after the socket data
function deferredGet() {
    const replies = {}
    mocks.get = vi.fn((url) => new Promise(resolve => { replies[url] = resolve }))
    return (url, data) => act(async () => replies[url]({data}))
}

// filled in by Probe, so the test can open and close games like GamePage does
const controls = {}
const setGameID = (id) => controls.setGameID(id)

function Probe() {
    const chess = useChess()
    useEffect(() => {
        controls.setGameID = chess.setGameID
    })
    return (
        <div>
            <p data-testid="status">{chess.gameData?.game?.status ?? "none"}</p>
            <p data-testid="id">{chess.gameData?.game?.id ?? "none"}</p>
            <p data-testid="clock">{chess.gameData?.clock?.white ?? "none"}</p>
            <p data-testid="readonly">{String(chess.isReadOnly)}</p>
            <p data-testid="over">{String(chess.isGameOver)}</p>
        </div>
    )
}

function renderProvider() {
    render(<ChessProvider><Probe/></ChessProvider>)
}

const text = (id) => screen.getByTestId(id).textContent

// what the DB has for a live game: the starting times, and no clock object
const dbRow = (overrides = {}) => ({...liveGame({clock: null, game: overrides}), clock: undefined})

beforeEach(() => {
    mocks.socket = fakeSocket()
})

describe("loading a live game", () => {
    test("asks the server for the live state", () => {
        deferredGet()
        renderProvider()

        act(() => setGameID("game_1"))

        expect(mocks.socket.emit).toHaveBeenCalledWith("game:sync-state", "game_1")
    })

    test("live socket data isn't overwritten by the slower database reply", async () => {
        const replyHttp = deferredGet()
        renderProvider()
        act(() => setGameID("game_1"))

        mocks.socket.receive("game:updated", liveGame({clock: {white: 412_000, black: 500_000, turn: "w", running: true}}))
        await replyHttp("/game/game_1", dbRow())

        expect(text("clock")).toBe("412000")
    })

    test("every socket update replaces the state", async () => {
        deferredGet()
        renderProvider()
        act(() => setGameID("game_1"))

        mocks.socket.receive("game:updated", liveGame())
        mocks.socket.receive("game:updated", liveGame({game: {status: "draw"}}))

        expect(text("status")).toBe("draw")
        expect(text("over")).toBe("true")
    })

    test("the game is shown from the database until socket data arrives", async () => {
        const replyHttp = deferredGet()
        renderProvider()
        act(() => setGameID("game_1"))

        await replyHttp("/game/game_1", dbRow())

        expect(text("status")).toBe("active")
        expect(text("readonly")).toBe("false")
    })

    test("leaving the game page tells the server and stops listening", () => {
        deferredGet()
        renderProvider()
        act(() => setGameID("game_1"))

        act(() => setGameID(null))

        expect(mocks.socket.emit).toHaveBeenCalledWith("game:leave", "game_1")
        expect(mocks.socket.listenerCount("game:updated")).toBe(0)
    })

    test("rejoins the game after the socket reconnects", () => {
        deferredGet()
        renderProvider()
        act(() => setGameID("game_1"))
        mocks.socket.emit.mockClear()

        mocks.socket.receive("connect")

        expect(mocks.socket.emit).toHaveBeenCalledWith("game:sync-state", "game_1")
    })
})

describe("finished games", () => {
    test("a finished game is read-only and stops using the socket", async () => {
        const replyHttp = deferredGet()
        renderProvider()
        act(() => setGameID("game_9"))

        await replyHttp("/game/game_9", dbRow({id: "game_9", status: "finished"}))

        expect(text("readonly")).toBe("true")
        expect(text("over")).toBe("true")
        expect(mocks.socket.listenerCount("game:updated")).toBe(0)
    })
})

describe("switching games", () => {
    test("the previous game isn't shown while the next one loads", async () => {
        const replyHttp = deferredGet()
        renderProvider()
        act(() => setGameID("game_1"))
        await replyHttp("/game/game_1", dbRow())
        expect(text("id")).toBe("game_1")

        act(() => setGameID("game_2"))

        expect(text("id")).toBe("none")
        await replyHttp("/game/game_2", dbRow({id: "game_2"}))
        await waitFor(() => expect(text("id")).toBe("game_2"))
    })

    test("a late reply for the previous game doesn't replace the current one", async () => {
        const replyHttp = deferredGet()
        renderProvider()
        act(() => setGameID("game_1"))
        act(() => setGameID("game_2"))

        await replyHttp("/game/game_2", dbRow({id: "game_2"}))
        await replyHttp("/game/game_1", dbRow({id: "game_1"}))

        expect(text("id")).toBe("game_2")
    })
})
