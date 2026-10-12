import bp from "../../assets/images/chess-pieces/bp.svg"
import wp from "../../assets/images/chess-pieces/wp.svg"
import br from "../../assets/images/chess-pieces/br.svg"
import wr from "../../assets/images/chess-pieces/wr.svg"
import bb from "../../assets/images/chess-pieces/bb.svg"
import wb from "../../assets/images/chess-pieces/wb.svg"
import bn from "../../assets/images/chess-pieces/bn.svg"
import wn from "../../assets/images/chess-pieces/wn.svg"
import bq from "../../assets/images/chess-pieces/bq.svg"
import wq from "../../assets/images/chess-pieces/wq.svg"
import bk from "../../assets/images/chess-pieces/bk.svg"
import wk from "../../assets/images/chess-pieces/wk.svg"
import {useSocket} from "../../context/SocketContext.jsx";

const pieceImages = {
    wp, bp,
    wr, br,
    wb, bb,
    wn, bn,
    wq, bq,
    wk, bk,
}

export default function Square({isLight, piece= null, coordinate, selectedSquare, setSelectedSquare, roomID, validMoves}) {
    const bgClass = isLight ? "bg-slate-200" : "bg-indigo-600";
    const {socket} = useSocket()

    function handleSelectedSquare() {
        if (validMoves.includes(coordinate)) {
            socket.emit("game:move", roomID, selectedSquare.coordinate, coordinate)
        } else {
            setSelectedSquare(piece ? { piece, coordinate } : { coordinate })
        }

    }

    return (
        <div
            className={`${bgClass} flex aspect-square w-full items-center justify-center p-1 select-none ${validMoves.includes(coordinate) ? "ring-4 ring-inset ring-emerald-500/70" : "" }`}
            onClick={handleSelectedSquare}
        >
            {piece && (
                <img
                    src={pieceImages[`${piece.color}${piece.type}`]}
                    alt={`${piece.color} ${piece.type}`}
                    className="h-full w-full object-contain pointer-events-none"
                />
            )}
        </div>
    )
}