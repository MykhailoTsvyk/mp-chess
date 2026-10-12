import {createContext, useContext, useState} from "react";


const ChessContext = createContext()

export default function ChessProvider({children}) {
    const [gameData, setGameData] = useState(null)
    console.log("gamedata", gameData)



    return (
        <ChessContext value={{gameData, setGameData}}>
            {children}
        </ChessContext>
    )
}

export const useChess = () => useContext(ChessContext)