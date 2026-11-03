import {afterEach, beforeEach, describe, expect, test, vi} from "vitest"
import {act, render, screen} from "@testing-library/react"
import PlayerClock from "./PlayerClock.jsx"
import {liveGame} from "../../test/gameData.js"

const mocks = vi.hoisted(() => ({chess: {}}))
vi.mock("../../context/ChessContext.jsx", () => ({useChess: () => mocks.chess}))

function renderClock(color, {white = 600_000, black = 600_000, turn = "w", running = true, isGameOver = false, game} = {}) {
    mocks.chess = {
        gameData: liveGame({clock: {timeControl: "10+0", white, black, turn, running, firstMoveMs: null}, receivedAt: performance.now(), game}),
        isGameOver,
    }
    return render(<PlayerClock color={color}/>)
}

const clockText = (color) => screen.getByLabelText(new RegExp(`^${color === "w" ? "White" : "Black"} clock`)).textContent

beforeEach(() => {
    vi.useFakeTimers({toFake: ["setInterval", "clearInterval", "setTimeout", "clearTimeout", "Date", "performance"]})
})

afterEach(() => {
    vi.useRealTimers()
})

describe("format", () => {
    test.each([
        [600_000, "10:00"],
        // the first update arrives a few ms after the game started; it should still read 10:00
        [599_990, "10:00"],
        [59_001, "1:00"],
        [10_400, "0:11"],
        [65_000, "1:05"],
        [60_000, "1:00"],
        [10_000, "0:10"],
        [9_500, "0:09.5"],
        [3_210, "0:03.2"],
        [0, "0:00.0"],
    ])("%i ms is shown as %s", (ms, text) => {
        renderClock("b", {black: ms})
        expect(clockText("b")).toBe(text)
    })
})

describe("counting down", () => {
    test("the clock of the side to move counts down", () => {
        renderClock("w", {white: 600_000})

        act(() => vi.advanceTimersByTime(3_000))

        expect(clockText("w")).toBe("9:57")
    })

    test("the clock of the side not to move stands still", () => {
        renderClock("b", {black: 600_000, turn: "w"})

        act(() => vi.advanceTimersByTime(3_000))

        expect(clockText("b")).toBe("10:00")
    })

    test("a clock never shows less than zero", () => {
        renderClock("w", {white: 2_000})

        act(() => vi.advanceTimersByTime(5_000))

        expect(clockText("w")).toBe("0:00.0")
    })

    test("a paused clock (game not running yet) stands still", () => {
        renderClock("w", {white: 600_000, running: false})

        act(() => vi.advanceTimersByTime(3_000))

        expect(clockText("w")).toBe("10:00")
    })

    test("the running clock is marked as running", () => {
        renderClock("w")
        expect(screen.getByLabelText("White clock, running")).toBeInTheDocument()
    })

    test("a running clock turns red with 20 seconds or less, an idle one doesn't", () => {
        renderClock("w", {white: 20_000, black: 15_000})
        expect(screen.getByLabelText(/^White clock/).className).toContain("bg-rose-600")

        renderClock("b", {white: 20_000, black: 15_000})
        expect(screen.getByLabelText(/^Black clock/).className).not.toContain("bg-rose-600")
    })
})

describe("finished games", () => {
    test("the clocks are frozen", () => {
        renderClock("w", {white: 300_000, isGameOver: true})

        act(() => vi.advanceTimersByTime(5_000))

        expect(clockText("w")).toBe("5:00")
        expect(screen.queryByLabelText("White clock, running")).not.toBeInTheDocument()
    })

    test("a game loaded from the database shows the saved time", () => {
        mocks.chess = {
            gameData: liveGame({clock: null, game: {status: "finished", white_time_remaining: 125, black_time_remaining: 7}}),
            isGameOver: true,
        }
        render(<><PlayerClock color="w"/><PlayerClock color="b"/></>)

        expect(clockText("w")).toBe("2:05")
        expect(clockText("b")).toBe("0:07.0")
    })

    test("a live game without clock data yet shows nothing rather than the starting time", () => {
        mocks.chess = {
            gameData: liveGame({clock: null, game: {white_time_remaining: 600}}),
            isGameOver: false,
        }
        const {container} = render(<PlayerClock color="w"/>)

        expect(container).toBeEmptyDOMElement()
    })
})
