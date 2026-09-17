export default function GameCard({ game }) {
    return (
        <div
            className="flex justify-between items-center bg-ui-main p-4 rounded-md border border-ui-border transition-all duration-200 hover:bg-ui-interactive hover:border-ui-accent hover:shadow-sm cursor-pointer"
        >
            <div>
                <span className="font-semibold block text-ui-primary">vs {game.opponent}</span>
                <span className="text-xs text-ui-secondary">{game.date}</span>
            </div>
            <div className="text-right">
                <span className={`font-bold ${game.result === 'Victory' ? 'text-green-500' : 'text-red-500'}`}>
                    {game.result}
                </span>
                <span className="text-xs block text-ui-secondary">{game.ratingChange} ELO</span>
            </div>
        </div>
    )
}