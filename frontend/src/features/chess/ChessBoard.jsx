

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
import captureSound from "../../assets/sounds/capture.mp3"
import castleSound from "../../assets/sounds/castle.mp3"
import notifySound from "../../assets/sounds/notify.mp3"
import moveSound from "../../assets/sounds/move-self.mp3"

const sounds = {
    capture: new Audio(captureSound),
    move: new Audio(moveSound),
    notify: new Audio(notifySound),
    castle: new Audio(castleSound)
}

export default function ChessBoard(){


    return (
        <div>

        </div>
    )
}