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
const highlighted = () => [...document.querySelectorAll("[data-move-hint]")].map(s => s.dataset.square).sort()
// the marker drawn on a target square: "dot", "ring" or null
const marker = (coordinate) => {
    const span = [...square(coordinate).querySelectorAll("span")].find(s => s.className.includes("rounded-full"))
    if (!span) return null
    return span.className.includes("border-") ? "ring" : "dot"
}
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

// fires the HTML5 drag events a browser sends when a piece is dragged from one square to another
function dataTransfer() {
    const data = {}
    return {
        dropEffect: "move", effectAllowed: "all", files: [], items: [], types: [],
        setData: (key, value) => { data[key] = value },
        getData: (key) => data[key],
        clearData: () => {},
        setDragImage: () => {},
    }
}

function startDrag(from) {
    const transfer = dataTransfer()
    fireEvent.dragStart(square(from), {dataTransfer: transfer, clientX: 10, clientY: 10})
    return transfer
}

function hover(transfer, over) {
    fireEvent.dragEnter(square(over), {dataTransfer: transfer, clientX: 40, clientY: 40})
    fireEvent.dragOver(square(over), {dataTransfer: transfer, clientX: 40, clientY: 40})
}

function drop(transfer, from, to) {
    hover(transfer, to)
    fireEvent.drop(square(to), {dataTransfer: transfer})
    fireEvent.dragEnd(square(from), {dataTransfer: transfer})
}

function dragAndDrop(from, to) {
    drop(startDrag(from), from, to)
}

describe("drag and drop", () => {
    test("dragging one of your pieces highlights its legal moves, like clicking it", () => {
        renderBoard()

        const transfer = startDrag("g1")
        hover(transfer, "g1")

        expect(highlighted()).toEqual(["f3", "h3"])
    })

    test("the dragged piece leaves its square and follows the pointer", () => {
        renderBoard()

        const transfer = startDrag("e2")
        hover(transfer, "e3")

        expect(pieceOn("e2")).toBe(null)
        const preview = document.querySelector(".fixed img")
        expect(preview).not.toBe(null)
        expect(preview.style.transform).toContain("translate(")
    })

    test("dropping on a legal square sends the move", () => {
        renderBoard()

        dragAndDrop("e2", "e4")

        expect(mocks.socket.socket.emit).toHaveBeenCalledWith("game:move", "game_1", "e2", "e4", undefined)
        expect(highlighted()).toEqual([])
        expect(document.querySelector(".fixed img")).toBe(null)
    })

    test("dropping on an illegal square sends nothing and puts the piece back", () => {
        renderBoard()

        dragAndDrop("e2", "e5")

        expect(mocks.socket.socket.emit).not.toHaveBeenCalled()
        expect(pieceOn("e2")).toBe("w p")
        expect(highlighted()).toEqual([])
    })

    test("dropping back on the start square keeps the piece selected", () => {
        renderBoard()

        dragAndDrop("e2", "e2")

        expect(mocks.socket.socket.emit).not.toHaveBeenCalled()
        expect(highlighted()).toEqual(["e3", "e4"])
    })

    test("after a drop on the start square, a click on a target makes the move", () => {
        renderBoard()

        dragAndDrop("e2", "e2")
        click("e4")

        expect(mocks.socket.socket.emit).toHaveBeenCalledWith("game:move", "game_1", "e2", "e4", undefined)
    })

    test("a pawn dropped on the last rank asks for the promotion piece", () => {
        renderBoard({gameData: liveGame({game: {fen: PROMOTION_FEN}})})

        dragAndDrop("e7", "e8")
        expect(mocks.socket.socket.emit).not.toHaveBeenCalled()

        fireEvent.click(screen.getByRole("button", {name: "Rook"}))
        expect(mocks.socket.socket.emit).toHaveBeenCalledWith("game:move", "game_1", "e7", "e8", "r")
    })

    test.each([
        ["the opponent's piece", {}, "e7", "e5"],
        ["a piece while it's the opponent's turn", {user: BLACK}, "e7", "e5"],
        ["a piece as a spectator", {user: SPECTATOR}, "e2", "e4"],
        ["a piece after the game ended", {gameData: liveGame({game: {status: "finished"}}), isGameOver: true}, "e2", "e4"],
    ])("you can't drag %s", (_, options, from, to) => {
        renderBoard(options)

        const transfer = startDrag(from)
        hover(transfer, to)
        // the drag never starts, so nothing is highlighted, nothing moves and nothing can be dropped
        expect(highlighted()).toEqual([])
        expect(pieceOn(from)).not.toBe(null)
        expect(document.querySelector(".fixed img")).toBe(null)
        expect(mocks.socket.socket.emit).not.toHaveBeenCalled()
    })
})

describe("move markers", () => {
    test("an ordinary move is marked with a dot in the middle of the square", () => {
        renderBoard()

        click("e2")

        expect(marker("e3")).toBe("dot")
        expect(marker("e4")).toBe("dot")
        expect(square("e4").querySelector("span.rounded-full").className).toContain("emerald")
    })

    test("a capture is marked with a ring around the piece, and the piece stays visible", () => {
        // 1. e4 d5: the e4 pawn can push to e5 or take on d5
        renderBoard({gameData: liveGame({game: {fen: "rnbqkbnr/ppp1pppp/8/3p4/4P3/8/PPPP1PPP/RNBQKBNR w KQkq d6 0 2"}})})

        click("e4")

        expect(marker("d5")).toBe("ring")
        expect(pieceOn("d5")).toBe("b p")
        expect(marker("e5")).toBe("dot")
    })

    test("en passant is marked as a capture although the square is empty", () => {
        // 1. e4 d5 2. e5 f5: exf6 en passant is possible
        renderBoard({gameData: liveGame({game: {fen: "rnbqkbnr/ppp1p1pp/8/3pPp2/8/8/PPPP1PPP/RNBQKBNR w KQkq f6 0 3"}})})

        click("e5")

        expect(marker("f6")).toBe("ring")
        expect(marker("e6")).toBe("dot")
    })

    test("squares that aren't legal moves have no marker", () => {
        renderBoard()

        click("e2")

        expect(marker("e5")).toBe(null)
        expect(marker("d3")).toBe(null)
    })
})
