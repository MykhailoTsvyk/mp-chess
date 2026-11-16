import { Link } from "react-router";

// elo is the player's rating in the game's category; older games may not have one
export default function PlayerCard({user}) {
    return (
        <Link to={`/profile/${user?.id}`}>
            <span className="font-semibold">{user?.username || "Player"}</span>
            {user?.elo != null && <span className="text-sm text-ui-secondary">({user.elo})</span>}
        </Link>
    )
}
