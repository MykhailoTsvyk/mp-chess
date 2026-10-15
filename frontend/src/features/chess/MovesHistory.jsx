import {useChess} from "../../context/ChessContext.jsx";
import ChatMessage from "../../components/ChatMessage.jsx";


export default function MovesHistory() {
    const {gameData} = useChess()
    const movePairs = []
    if (gameData?.game?.moves) {
        console.log(movePairs)
        for (let i = 0; i < gameData?.game?.moves.length; i+=2) {
            movePairs.push({
                id: i,
                white: gameData?.game?.moves[i],
                black:gameData?.game?.moves[i + 1] || null
            })
        }
    }



    return (

        <div className="w-full lg:w-[320px] flex flex-col h-100 border border-ui-border bg-ui-surface rounded-md">
            <div className="p-3 border-b border-ui-border font-bold text-ui-primary shrink-0">Moves History</div>

            <div className="overflow-y-auto">
                {movePairs.map((move, index) => (
                    <div className="flex text-center items-center">
                        <div className="text-sm text-ui-secondary px-1">{index + 1}.</div>
                        <div className="flex w-full justify-between px-2 py-1">
                            <div className="px-1 bg-ui-surface border border-ui-border cursor-pointer border-b-4">{move.white}</div>
                            <div className="px-1 bg-ui-surface border border-ui-border cursor-pointer border-b-4">{move.black}</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}