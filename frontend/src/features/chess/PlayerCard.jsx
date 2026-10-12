export default function PlayerCard({user}) {
    return (
        <>
            <span className="font-semibold">{user?.username || "Player"}</span>
            <span className="text-sm text-ui-secondary">({user?.elo ?? 1200})</span>
        </>
    )
}