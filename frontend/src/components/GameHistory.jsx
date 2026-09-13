import GameCard from "./GameCard.jsx";

export default function GameHistory(){
    const matches = [
        { id: 1, opponent: "ChessMaster99", result: "Victory", ratingChange: "+15", date: "10 mins ago" },
        { id: 2, opponent: "TacticalPro", result: "Defeat", ratingChange: "-12", date: "2 hours ago" },
    ]

    return(
        <div className="bg-ui-surface border-2 border-ui-border rounded-lg p-6 shadow-md">
            <h2 className="text-xl font-bold text-ui-primary mb-4 border-b border-ui-border pb-2">
                Recent Matches
            </h2>
            <div className="space-y-3">
                {matches.length > 0 ? (
                    matches.map((match) => (
                        <GameCard game={match}/>
                    ))
                ) : (
                    <p className="text-ui-secondary text-sm text-center py-4">No recent matches found.</p>
                )}
            </div>
        </div>
    )
}