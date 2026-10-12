import ChessBoard from "../features/chess/ChessBoard.jsx"
import MainLayout from "../layout/MainLayout.jsx";
import GameChat from "../components/GameChat.jsx";
import {useParams} from "react-router";
import {useChess} from "../context/ChessContext.jsx";
import {useEffect} from "react";

export default function GamePage() {
// IGNORE FOR NOW: Should replace shared logic between chessBoard and chat there and pass down to them
    const {gameID} = useParams()
    const {gameData, setGameID} = useChess()

    useEffect(() => {
        setGameID(gameID)
    }, [gameID]);

    return (
        <MainLayout>
            <div className="flex flex-col lg:flex-row gap-4 justify-start w-full lg:items-start">
                <ChessBoard/>
                <GameChat/>
            </div>
        </MainLayout>
    )

}