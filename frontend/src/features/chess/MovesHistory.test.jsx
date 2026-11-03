import {describe, expect, test, vi} from "vitest"
import {render, screen} from "@testing-library/react"
import MovesHistory from "./MovesHistory.jsx"
import {liveGame} from "../../test/gameData.js"

const mocks = vi.hoisted(() => ({chess: {}}))
vi.mock("../../context/ChessContext.jsx", () => ({useChess: () => mocks.chess}))

function renderMoves(moves) {
    mocks.chess = {gameData: liveGame({game: {moves}})}
    return render(<MovesHistory/>)
}

describe("moves history", () => {
    test("pairs white's and black's moves under one move number", () => {
        renderMoves(["e4", "e5", "Nf3", "Nc6", "Bb5"])

        expect(screen.getByText("1.")).toBeInTheDocument()
        expect(screen.getByText("2.")).toBeInTheDocument()
        expect(screen.getByText("3.")).toBeInTheDocument()
        expect(screen.queryByText("4.")).not.toBeInTheDocument()
        expect(screen.getByText("Bb5")).toBeInTheDocument()
    })

    test("a move number appears with white's move, before black replies", () => {
        renderMoves(["d4"])

        expect(screen.getByText("1.")).toBeInTheDocument()
        expect(screen.getByText("d4")).toBeInTheDocument()
    })

    test("an empty game shows no moves", () => {
        renderMoves([])
        expect(screen.queryByText("1.")).not.toBeInTheDocument()
    })
})
