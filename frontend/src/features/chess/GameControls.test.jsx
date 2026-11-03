import {afterEach, beforeEach, describe, expect, test, vi} from "vitest"
import {act, fireEvent, render, screen} from "@testing-library/react"
import GameControls from "./GameControls.jsx"
import {BLACK, liveGame, SPECTATOR, WHITE} from "../../test/gameData.js"

const mocks = vi.hoisted(() => ({chess: {}, auth: {}, socket: {}}))
vi.mock("../../context/ChessContext.jsx", () => ({useChess: () => mocks.chess}))
vi.mock("../../context/AuthContext.jsx", () => ({useAuth: () => mocks.auth}))
vi.mock("../../context/SocketContext.jsx", () => ({useSocket: () => mocks.socket}))

let emit

function renderControls({user = WHITE, isGameOver = false, ...gameOverrides} = {}) {
    mocks.auth = {user}
    mocks.chess = {gameData: liveGame(gameOverrides), isGameOver}
    return render(<GameControls onFlip={() => {}}/>)
}

const button = (name) => screen.queryByRole("button", {name})

beforeEach(() => {
    emit = vi.fn()
    mocks.socket = {socket: {emit}}
})

afterEach(() => {
    vi.useRealTimers()
})

describe("who sees the controls", () => {
    test("players can offer a draw and resign", () => {
        renderControls({user: BLACK})
        expect(button("Offer draw")).toBeInTheDocument()
        expect(button("Resign")).toBeInTheDocument()
    })

    test("spectators only get the flip button", () => {
        renderControls({user: SPECTATOR})
        expect(button("Offer draw")).not.toBeInTheDocument()
        expect(button("Resign")).not.toBeInTheDocument()
        expect(button("Flip board")).toBeInTheDocument()
    })

    test("nothing can be offered or resigned after the game ended", () => {
        renderControls({isGameOver: true, game: {status: "finished"}})
        expect(button("Offer draw")).not.toBeInTheDocument()
        expect(button("Resign")).not.toBeInTheDocument()
    })
})

describe("resigning", () => {
    test("needs a confirmation", () => {
        renderControls()

        fireEvent.click(button("Resign"))
        expect(emit).not.toHaveBeenCalled()

        fireEvent.click(button("Yes"))
        expect(emit).toHaveBeenCalledWith("game:resign", "game_1")
    })

    test("can be cancelled", () => {
        renderControls()

        fireEvent.click(button("Resign"))
        fireEvent.click(button("No"))

        expect(emit).not.toHaveBeenCalled()
        expect(button("Resign")).toBeInTheDocument()
    })
})

describe("draw offers", () => {
    test("offering a draw tells the server", () => {
        renderControls()
        fireEvent.click(button("Offer draw"))
        expect(emit).toHaveBeenCalledWith("game:offer-draw", "game_1")
    })

    test("a pending offer of your own can't be sent again", () => {
        renderControls({drawOffer: {from: WHITE.id}})
        expect(button("Draw offered")).toBeDisabled()
    })

    test("after a decline you can't offer again until you move", () => {
        renderControls({drawBlocked: [WHITE.id]})
        expect(button("Offer draw")).toBeDisabled()
    })

    test("being blocked doesn't affect the opponent", () => {
        renderControls({user: BLACK, drawBlocked: [WHITE.id]})
        expect(button("Offer draw")).toBeEnabled()
    })

    test("the opponent's offer can be accepted or declined", () => {
        renderControls({drawOffer: {from: BLACK.id}})

        expect(screen.getByText("Opponent offers a draw")).toBeInTheDocument()
        fireEvent.click(button("Accept"))
        fireEvent.click(button("Decline"))

        expect(emit).toHaveBeenNthCalledWith(1, "game:respond-draw", "game_1", true)
        expect(emit).toHaveBeenNthCalledWith(2, "game:respond-draw", "game_1", false)
    })
})

describe("countdowns", () => {
    test("shows how long a player who left has to come back, counting down", () => {
        vi.useFakeTimers()
        renderControls({leftPlayers: {[BLACK.id]: Date.now() + 30_000}, game: {moves: ["e4", "e5"]}})

        expect(screen.getByText(/bob left the game\. They lose in 30s/)).toBeInTheDocument()
        act(() => vi.advanceTimersByTime(5_000))
        expect(screen.getByText(/They lose in 25s/)).toBeInTheDocument()
    })

    test("a player leaving before any move aborts the game instead", () => {
        renderControls({leftPlayers: {[BLACK.id]: Date.now() + 60_000}, game: {moves: []}})
        expect(screen.getByText(/The game will be aborted in/)).toBeInTheDocument()
    })

    test("shows how long the side to move has for its first move", () => {
        renderControls({
            clock: {timeControl: "10+0", white: 600_000, black: 600_000, turn: "b", running: true, firstMoveMs: 42_000},
            receivedAt: performance.now(),
        })
        expect(screen.getByText("Black", {exact: false})).toHaveTextContent("Black has 42s to make the first move")
    })

    test("no countdowns after the game ended", () => {
        renderControls({
            isGameOver: true,
            game: {status: "aborted"},
            leftPlayers: {[BLACK.id]: Date.now() + 60_000},
            clock: {timeControl: "10+0", white: 1, black: 1, turn: "w", running: false, firstMoveMs: 5_000},
        })
        expect(screen.queryByText(/left the game/)).not.toBeInTheDocument()
        expect(screen.queryByText(/first move/)).not.toBeInTheDocument()
    })
})
