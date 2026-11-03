import ChessBoard from "../features/chess/ChessBoard.jsx"
import MainLayout from "../layout/MainLayout.jsx";
import GameChat from "../components/GameChat.jsx";
import {useParams} from "react-router";
import {useChess} from "../context/ChessContext.jsx";
import {useEffect, useState} from "react";
import SummaryWindow from "../features/chess/SummaryWindow.jsx";
import MovesHistory from "../features/chess/MovesHistory.jsx";
import EmailVerification from "../components/EmailVerification.jsx";
import {useAuth} from "../context/AuthContext.jsx";
import {useSocket} from "../context/SocketContext.jsx";

export default function GamePage() {

    const {gameID} = useParams()
    const {user} = useAuth()
    const {isConnected, socketErrorCode} = useSocket()
    const {gameData, setGameID, isGameOver, isReadOnly} = useChess()
    const [isClosed, setIsClosed] = useState(false)

    useEffect(() => {
        setGameID(gameID)

        // clearing the game on unmount tells the server the player left the game page
        return () => setGameID(null)
    }, [gameID, setGameID]);

    // live games need the socket, which the server only accepts for verified emails;
    // the stored user can be outdated, so a connected socket counts as verified
    const mustVerify = !isReadOnly && (socketErrorCode === "NOT_VERIFIED" || (!user.is_activated && !isConnected))

    if (mustVerify) {
        return (
            <MainLayout>
                <div className="w-full max-w-xl mx-auto space-y-4 py-6">
                    <div className="bg-ui-surface border border-ui-border rounded-xl p-6 shadow-md text-center space-y-2">
                        <h1 className="text-xl font-bold text-ui-primary">Verify your email to watch live games</h1>
                        <p className="text-sm text-ui-secondary">
                            Open the link we sent to your email. This page unlocks once your email is verified.
                        </p>
                    </div>

                    <EmailVerification/>
                </div>
            </MainLayout>
        )
    }

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