import {beforeEach, describe, expect, test, vi} from "vitest"
import {fireEvent, render, screen} from "@testing-library/react"
import ChessBoard from "./ChessBoard.jsx"
import {BLACK, liveGame, SPECTATOR, WHITE} from "../../test/gameData.js"

const mocks = vi.hoisted(() => ({chess: {}, auth: {}, socket: {}}))
vi.mock("../../context/ChessContext.jsx", () => ({useChess: () => mocks.chess}))
vi.mock("../../context/AuthContext.jsx", () => ({useAuth: () => mocks.auth}))
vi.mock("../../context/SocketContext.jsx", () => ({useSocket: () => mocks.socket}))

const PROMOTION_FEN = "8/4P3/8/8/8/8/8/k6K w - - 0 1"

function renderBoard({user = WHITE, gameData = liveGame(), isGameOver = false} = {}) {
    mocks.auth = {user}
    mocks.chess = {gameData, isGameOver}
    return render(<ChessBoard/>)
}

const square = (coordinate) => document.querySelector(`[data-square="${coordinate}"]`)
const click = (coordinate) => fireEvent.click(square(coordinate))
const highlighted = () => [...document.querySelectorAll("[data-square].ring-4")].map(s => s.dataset.square).sort()
const pieceOn = (coordinate) => square(coordinate).querySelector("img")?.alt ?? null

// the files along the bottom edge, left to right
const bottomFiles = () => [...document.querySelectorAll("[data-square] span")]
    .map(label => label.textContent)
    .filter(text => /^[a-h]$/.test(text))
    .join("")

beforeEach(() => {
    mocks.socket = {socket: {emit: vi.fn()}}
})

describe("board", () => {
    test("shows the position from the FEN", () => {
        renderBoard()

        expect(document.querySelectorAll("[data-square]")).toHaveLength(64)
        expect(pieceOn("e1")).toBe("w k")
        expect(pieceOn("d8")).toBe("b q")
        expect(pieceOn("a2")).toBe("w p")
        expect(pieceOn("e4")).toBe(null)
    })

    test("light and dark squares are where they are on a real board", () => {
        renderBoard()

        // a1 is dark, h1 is light
        expect(square("a1").className).toContain("bg-indigo-600")
        expect(square("h1").className).toContain("bg-slate-200")
        expect(square("d1").className).toContain("bg-slate-200")
        expect(square("e1").className).toContain("bg-indigo-600")
    })

    test("white sees files a to h from the left", () => {
        renderBoard({user: WHITE})
        expect(bottomFiles()).toBe("abcdefgh")
        expect(square("a1").textContent).toContain("a")
    })

    test("black sees the board rotated: files h to a from the left", () => {
        renderBoard({user: BLACK})
        expect(bottomFiles()).toBe("hgfedcba")
        expect(square("h8").textContent).toContain("h")
    })

    test("each row lists its squares in the order they appear on screen", () => {
        renderBoard({user: BLACK})
        const firstRow = [...square("a1").parentElement.children].map(s => s.dataset.square)
        expect(firstRow).toEqual(["h1", "g1", "f1", "e1", "d1", "c1", "b1", "a1"])
    })

    test("the flip button turns the board around", () => {
        renderBoard({user: WHITE})

        fireEvent.click(screen.getByLabelText("Flip board"))
        expect(bottomFiles()).toBe("hgfedcba")

        fireEvent.click(screen.getByLabelText("Flip board"))
        expect(bottomFiles()).toBe("abcdefgh")
    })
})

describe("making moves", () => {
    test("selecting one of your pieces highlights exactly its legal moves", () => {
        renderBoard()

        click("e2")
        expect(highlighted()).toEqual(["e3", "e4"])

        click("g1")
        expect(highlighted()).toEqual(["f3", "h3"])
    })

    test("clicking a highlighted square sends the move", () => {
        renderBoard()

        click("e2")
        click("e4")

        expect(mocks.socket.socket.emit).toHaveBeenCalledWith("game:move", "game_1", "e2", "e4", undefined)
        expect(highlighted()).toEqual([])
    })

    test("clicking a square that isn't a legal move doesn't send anything", () => {
        renderBoard()

        click("e2")
        click("e5")

        expect(mocks.socket.socket.emit).not.toHaveBeenCalled()
    })

    test("the opponent's pieces can't be moved", () => {
        renderBoard()

        click("e7")

        expect(highlighted()).toEqual([])
    })

    test("nothing can be moved while it's the opponent's turn", () => {
        renderBoard({user: BLACK})

        click("e7")
        click("e5")

        expect(highlighted()).toEqual([])
        expect(mocks.socket.socket.emit).not.toHaveBeenCalled()
    })

    test("spectators can't move pieces", () => {
        renderBoard({user: SPECTATOR})

        click("e2")
        click("e4")

        expect(highlighted()).toEqual([])
        expect(mocks.socket.socket.emit).not.toHaveBeenCalled()
    })

    test("nothing can be moved once the game is over", () => {
        // white resigned while it was their turn: the final position still has white to move
        renderBoard({gameData: liveGame({game: {status: "finished", winner_id: BLACK.id}}), isGameOver: true})

        click("e2")
        click("e4")

        expect(highlighted()).toEqual([])
        expect(mocks.socket.socket.emit).not.toHaveBeenCalled()
    })
})

describe("promotion", () => {
    test("a pawn reaching the last rank asks which piece to take, and sends that piece", () => {
        renderBoard({gameData: liveGame({game: {fen: PROMOTION_FEN}})})

        click("e7")
        click("e8")
        expect(mocks.socket.socket.emit).not.toHaveBeenCalled()

        fireEvent.click(screen.getByRole("button", {name: "Knight"}))

        expect(mocks.socket.socket.emit).toHaveBeenCalledWith("game:move", "game_1", "e7", "e8", "n")
        expect(screen.queryByRole("button", {name: "Knight"})).not.toBeInTheDocument()
    })

    test("pressing Escape cancels the promotion without moving", () => {
        renderBoard({gameData: liveGame({game: {fen: PROMOTION_FEN}})})

        click("e7")
        click("e8")
        fireEvent.keyDown(window, {key: "Escape"})

        expect(screen.queryByText("Promote pawn to")).not.toBeInTheDocument()
        expect(mocks.socket.socket.emit).not.toHaveBeenCalled()
    })

    test("an ordinary pawn move doesn't ask for a piece", () => {
        renderBoard()

        click("e2")
        click("e4")

        expect(screen.queryByText("Promote pawn to")).not.toBeInTheDocument()
    })
})
