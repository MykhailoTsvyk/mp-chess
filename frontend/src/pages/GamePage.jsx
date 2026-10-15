import ChessBoard from "../features/chess/ChessBoard.jsx"
import MainLayout from "../layout/MainLayout.jsx";
import GameChat from "../components/GameChat.jsx";
import {useParams} from "react-router";
import {useChess} from "../context/ChessContext.jsx";
import {useEffect, useState} from "react";
import SummaryWindow from "../features/chess/SummaryWindow.jsx";
import MovesHistory from "../features/chess/MovesHistory.jsx";

export default function GamePage() {

    const {gameID} = useParams()
    const {gameData, setGameID, isGameOver, isReadOnly} = useChess()
    const [isClosed, setIsClosed] = useState(false)

    useEffect(() => {
        setGameID(gameID)
    }, [gameID]);

    return (
        <MainLayout>
            <div className="flex flex-col lg:flex-row gap-4 justify-center w-full max-w-[1100px] mx-auto lg:items-start">
                <ChessBoard/>
                <div className="flex flex-col gap-4">
                    <MovesHistory/>

                    {!isReadOnly && <GameChat/>}
                </div>

                {(!isClosed && isGameOver) && <SummaryWindow setIsClosed={setIsClosed}/>}
            </div>
        </MainLayout>
    )

}