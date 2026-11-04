import { useEffect, useState } from "react";
import GameCard, {GAME_ROW_GRID} from "./GameCard.jsx";
import {getUserMatches} from "../api/userService.js";

const PAGE_SIZE = 5

async function fetchPage(userID, offset) {
    const games = await getUserMatches(userID, {limit: PAGE_SIZE + 1, offset})
    return {games: games.slice(0, PAGE_SIZE), hasMore: games.length > PAGE_SIZE}
}

export default function GameHistory({userID}){
    const [matches, setMatches] = useState([])
    const [hasMore, setHasMore] = useState(false)
    const [loading, setLoading] = useState(true)
    const [loadingMore, setLoadingMore] = useState(false)
    const [error, setError] = useState(null)

    useEffect(() => {
        let ignore = false

        async function loadFirstPage() {
            setLoading(true)
            setError(null)
            try {
                const page = await fetchPage(userID, 0)
                if (!ignore) {
                    setMatches(page.games)
                    setHasMore(page.hasMore)
                }
            } catch (e) {
                console.log(e)
                if (!ignore) {
                    setMatches([])
                    setHasMore(false)
                    setError("Failed to load matches")
                }
            } finally {
                if (!ignore) setLoading(false)
            }
        }

        loadFirstPage()

        return () => {
            ignore = true
        }
    }, [userID])

    async function loadMore() {
        setLoadingMore(true)
        setError(null)
        try {
            const page = await fetchPage(userID, matches.length)
            setMatches((prev) => [...prev, ...page.games])
            setHasMore(page.hasMore)
        } catch (e) {
            console.log(e)
            setError("Failed to load more matches")
        } finally {
            setLoadingMore(false)
        }
    }

    let content
    if (loading) {
        content = <p className="text-ui-secondary text-sm text-center py-6">Loading matches...</p>
    } else if (error && matches.length === 0) {
        content = <p className="text-rose-500 text-sm text-center py-6">{error}</p>
    } else if (matches.length === 0) {
        content = <p className="text-ui-secondary text-sm text-center py-6">No recent matches found.</p>
    } else {
        content = (
            <>
                <div className={`${GAME_ROW_GRID} px-4 py-2 text-sm font-semibold text-center text-ui-secondary border-b border-ui-border`}>
                    <span className="hidden sm:block"></span>
                    <span className="text-left">Players</span>
                    <span>Result</span>
                    <span>Turns</span>
                    <span>Date</span>
                </div>

                <div>
                    {matches.map((match) => <GameCard key={match.id} game={match}/>)}
                </div>

                {error && <p className="text-rose-500 text-sm text-center pt-3">{error}</p>}
            </>
        )
    }

    return(
        <div className="bg-ui-surface border-2 border-ui-border rounded-lg shadow-md overflow-hidden">
            <h2 className="text-xl font-bold text-ui-primary px-6 py-4 border-b border-ui-border">
                Recent Matches
            </h2>

            {content}

            {!loading && hasMore && (
                <button
                    type="button"
                    onClick={loadMore}
                    disabled={loadingMore}
                    className="w-full py-3 text-sm font-semibold text-ui-secondary border-t border-ui-border transition-colors hover:bg-ui-interactive hover:text-ui-primary disabled:opacity-60 disabled:cursor-wait cursor-pointer"
                >
                    {loadingMore ? "Loading..." : "Show more"}
                </button>
            )}
        </div>
    )
}
