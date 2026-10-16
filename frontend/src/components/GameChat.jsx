import {useEffect, useRef, useState} from "react";
import {useSocket} from "../context/SocketContext.jsx";
import ChatMessage from "./ChatMessage.jsx";
import {useAuth} from "../context/AuthContext.jsx";
import {useChess} from "../context/ChessContext.jsx";

export default function GameChat() {
    const {socket} = useSocket()
    const {user} = useAuth()
    const {gameData} = useChess()
    const [messageText, setMessageText] = useState("")
    // const scrollRef = useRef(null)

    useEffect(() => {
        // IGNORE FOR NOW: scroll should be changed to scrolltop
        // scrollRef.current?.scrollIntoView({ behavior: "smooth" })

    }, [socket])

    function handleChange(e) {
        setMessageText(e.target.value)
    }

    function handleSubmit(e) {
        e.preventDefault()
        const role = user.id === gameData.blackPlayer.id ? "Black Side Player" : "" || user.id === gameData.whitePlayer.id ? "White Side Player" : "Spectator"

        const newMessage = {
            gameID: gameData.game.id,
            author: user,
            text: messageText.trim(),
            timestamp: new Date(),
            role: role
        }

        socket.emit("game:sent-message", newMessage)
        setMessageText("")
    }

    return (
        <div className="w-full lg:w-[320px] flex flex-col h-100 border border-ui-border bg-ui-surface rounded-md">
            <div className="p-3 border-b border-ui-border font-bold text-ui-primary shrink-0">Game Chat</div>

            <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-2">
                {gameData?.messages?.map(m => (
                    <ChatMessage message={m} key={`${m.author.id}_${m.timestamp}`} />
                ))}

                {/*<div ref={scrollRef}></div>*/}
            </div>

            <form className="flex justify-between border-t border-ui-border"
                  onSubmit={handleSubmit}
            >
                <input type="text"
                       className="w-full outline-none px-2"
                       onChange={(e) => handleChange(e)}
                       value={messageText}
                       placeholder="Enter message..."
                       maxLength="150"
                />
                <button type="submit"
                        className="border-l border-ui-border py-3 px-2 cursor-pointer"
                >
                    Send
                </button>
            </form>
        </div>
    )
}