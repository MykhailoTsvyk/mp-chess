import {useChess} from "../../context/ChessContext.jsx";


export default function SummaryWindow({setIsClosed}) {
    const {gameData} = useChess()
    let winner = gameData?.game?.winner_id === gameData?.whitePlayer ? gameData?.whitePlayer?.username : gameData?.blackPlayer?.username

    return (
        <div className="fixed inset-0 z-99 flex items-center justify-center p-4">
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"

            />



            <div className="relative z-10 flex w-full max-w-md flex-col items-center rounded-2xl border border-ui-border bg-ui-surface p-8 text-center shadow-xl transition-all">

                <button onClick={() => setIsClosed(true)}>
                    X
                </button>

                <h1 className="text-2xl font-bold tracking-tight text-ui-primary">
                    Summary
                </h1>

                {gameData?.game?.winner_id !== null ? (
                    <p className="mt-2 text-sm text-ui-secondary">
                        <span>{winner}</span> won!
                    </p>
                ) : (
                    <p className="mt-2 text-sm text-ui-secondary">
                        Draw {gameData?.game?.draw_reason}
                    </p>
                )}

                <button className="mt-8 w-full rounded-xl border border-ui-border bg-ui-interactive px-4 py-3 text-sm font-semibold text-ui-primary transition-all hover:border-ui-accent hover:text-ui-accent active:scale-[0.98]">
                    Go to Home
                </button>
            </div>

        </div>
    )
}