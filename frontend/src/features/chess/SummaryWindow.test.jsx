import {beforeEach, describe, expect, test, vi} from "vitest"
import {fireEvent, render, screen} from "@testing-library/react"
import SummaryWindow from "./SummaryWindow.jsx"
import {BLACK, liveGame, WHITE} from "../../test/gameData.js"

const mocks = vi.hoisted(() => ({chess: {}, navigate: null}))
vi.mock("../../context/ChessContext.jsx", () => ({useChess: () => mocks.chess}))
vi.mock("react-router", () => ({useNavigate: () => mocks.navigate}))

let setIsClosed

function renderSummary(game) {
    mocks.chess = {gameData: liveGame({clock: null, game}), isGameOver: true}
    return render(<SummaryWindow setIsClosed={setIsClosed}/>)
}

const ratings = {white_elo_before: 1500, black_elo_before: 1500}

beforeEach(() => {
    setIsClosed = vi.fn()
    mocks.navigate = vi.fn()
})

describe("result", () => {
    test("a white win names the winner and scores 1 - 0", () => {
        renderSummary({status: "finished", winner_id: WHITE.id})

        expect(screen.getByRole("heading")).toHaveTextContent("alice won")
        expect(screen.getByText("White wins")).toBeInTheDocument()
        expect(screen.getByText("1")).toBeInTheDocument()
        expect(screen.getByText("0")).toBeInTheDocument()
    })

    test("a black win names the winner and scores 0 - 1", () => {
        renderSummary({status: "finished", winner_id: BLACK.id})

        expect(screen.getByRole("heading")).toHaveTextContent("bob won")
        expect(screen.getByText("Black wins")).toBeInTheDocument()
    })

    test.each([
        ["stalemate", "Draw by stalemate"],
        ["insufficient_material", "Draw by insufficient material"],
        ["threefold_repetition", "Draw by threefold repetition"],
        ["fifty_move_rule", "Draw by the 50-move rule"],
        ["agreement", "Draw by agreement"],
    ])("a draw by %s explains why", (reason, text) => {
        renderSummary({status: "draw", draw_reason: reason})

        expect(screen.getByRole("heading")).toHaveTextContent("Draw")
        expect(screen.getByText(text)).toBeInTheDocument()
        expect(screen.getAllByText("½")).toHaveLength(2)
    })

    test("a draw without a reason (both players left) still reads sensibly", () => {
        renderSummary({status: "draw", draw_reason: null})
        expect(screen.getByText("The game ended in a draw")).toBeInTheDocument()
    })

    test("an aborted game says so and has no score", () => {
        renderSummary({status: "aborted"})

        expect(screen.getByRole("heading")).toHaveTextContent("Game aborted")
        expect(screen.getAllByText("–").length).toBeGreaterThanOrEqual(2)
        expect(screen.queryByText("1")).not.toBeInTheDocument()
    })
})

describe("rating change", () => {
    test("shows each player's rating before and after, with the difference", () => {
        renderSummary({status: "finished", winner_id: WHITE.id, ...ratings, white_elo_after: 1516, black_elo_after: 1484})

        expect(screen.getByText("1500 → 1516")).toBeInTheDocument()
        expect(screen.getByText("+16")).toBeInTheDocument()
        expect(screen.getByText("1500 → 1484")).toBeInTheDocument()
        expect(screen.getByText("-16")).toBeInTheDocument()
    })

    test("gains are green and losses are red", () => {
        renderSummary({status: "finished", winner_id: WHITE.id, ...ratings, white_elo_after: 1516, black_elo_after: 1484})

        expect(screen.getByText("+16").className).toContain("emerald")
        expect(screen.getByText("-16").className).toContain("rose")
    })

    test("no change is shown as ±0", () => {
        renderSummary({status: "draw", ...ratings, white_elo_after: 1500, black_elo_after: 1500})
        expect(screen.getAllByText("±0")).toHaveLength(2)
    })

    test("an aborted game shows no rating change", () => {
        renderSummary({status: "aborted", ...ratings, white_elo_after: null, black_elo_after: null})
        expect(screen.queryByText(/→/)).not.toBeInTheDocument()
    })

    test("an older game without ratings shows no rating change", () => {
        renderSummary({status: "finished", winner_id: WHITE.id})
        expect(screen.queryByText(/→/)).not.toBeInTheDocument()
    })
})

describe("closing", () => {
    test("the close button, View board, Escape and the backdrop close the window", () => {
        const {container} = renderSummary({status: "finished", winner_id: WHITE.id})

        fireEvent.click(screen.getByLabelText("Close"))
        fireEvent.click(screen.getByText("View board"))
        fireEvent.keyDown(window, {key: "Escape"})
        fireEvent.click(container.firstChild)

        expect(setIsClosed).toHaveBeenCalledTimes(4)
        expect(setIsClosed).toHaveBeenCalledWith(true)
    })

    test("clicking inside the window doesn't close it", () => {
        renderSummary({status: "finished", winner_id: WHITE.id})

        fireEvent.click(screen.getByRole("dialog"))
        fireEvent.click(screen.getByRole("heading"))

        expect(setIsClosed).not.toHaveBeenCalled()
    })

    test("Back to home goes to the home page", () => {
        renderSummary({status: "finished", winner_id: WHITE.id})

        fireEvent.click(screen.getByText("Back to home"))

        expect(mocks.navigate).toHaveBeenCalledWith("/")
    })
})
