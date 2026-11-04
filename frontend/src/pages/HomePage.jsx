import MainLayout from "../layout/MainLayout.jsx"
import { Link, useLocation, useNavigate } from "react-router"
import { useAuth } from "../context/AuthContext.jsx"
import GameHistory from "../components/GameHistory.jsx";
import MatchmakingWindow from "../components/MatchmakingWindow.jsx";
import {useEffect, useState} from "react";
import {TIME_CONTROLS, DEFAULT_TIME_CONTROL, RATING_CATEGORIES, formatTimeControl} from "../features/chess/timeControls.js";
import {getUserProfile} from "../api/userService.js";
import {pieceImages} from "../features/chess/pieceImages.js";
import {getActiveGame} from "../api/gameService.js";

export default function HomePage() {
    const {user, isAuthenticated} = useAuth()
    const navigate = useNavigate()
    const location = useLocation()
    const [isMatchmaking, setIsMatchmaking] = useState(false)
    const [timeControl, setTimeControl] = useState(DEFAULT_TIME_CONTROL)
    // game in progress for this user: {id, timeControl, color, opponent}, or null
    const [activeGame, setActiveGame] = useState(null)

    // ratings change after every game, so they're fetched fresh instead of using the stored user
    const [freshRatings, setFreshRatings] = useState(null)
    const ratings = freshRatings ?? user?.ratings
    const selectedCategory = TIME_CONTROLS.find(tc => tc.id === timeControl)?.category.toLowerCase()

    useEffect(() => {
        if (!isAuthenticated) return

        getActiveGame()
            .then(setActiveGame)
            .catch((e) => console.error("Failed to check for an active game:", e))

        getUserProfile(user.id)
            .then((profile) => setFreshRatings({
                bullet: profile.ratings.bullet.rating,
                blitz: profile.ratings.blitz.rating,
                rapid: profile.ratings.rapid.rating
            }))
            .catch((e) => console.error("Failed to load ratings:", e))
    }, [isAuthenticated, user?.id])

    // React Router doesn't scroll to #hash links; location.key changes on every click,
    // so the header's Play link scrolls again even when the page is already at /#play
    useEffect(() => {
        if (location.hash === "#play") {
            document.getElementById("play")?.scrollIntoView({behavior: "smooth", block: "start"})
        }
    }, [location.key, location.hash])

    // a player in a game is sent back to it instead of searching for a new one
    function handlePlay() {
        if (activeGame) {
            navigate(`/game/${activeGame.id}`)
        } else {
            setIsMatchmaking(true)
        }
    }

    if (isAuthenticated) {
        return (
            <MainLayout>
                <div className="w-full max-w-4xl mx-auto space-y-6 py-6">
                    {/* User Stats Banner */}
                    <div className="bg-ui-surface border-2 border-ui-border rounded-lg p-6 shadow-md flex justify-between items-center">
                        <div>
                            <h1 className="text-2xl font-bold text-ui-primary">
                                Welcome back, <span className="text-ui-accent">{user?.username}</span>!
                            </h1>
                            <p className="text-sm text-ui-secondary">Ready for your next challenge?</p>
                        </div>
                        {/* the category of the selected time control is highlighted: that rating is at stake */}
                        <div className="flex gap-2">
                            {RATING_CATEGORIES.map(({id, label}) => (
                                <div key={id}
                                     className={`min-w-[4.5rem] text-center px-3 py-2 rounded-md border transition-colors ${
                                         id === selectedCategory ? "border-ui-accent bg-ui-interactive" : "border-ui-border bg-ui-main"
                                     }`}
                                >
                                    <span className="text-xs text-ui-secondary font-bold block">{label}</span>
                                    <span className="text-xl font-extrabold text-ui-accent tabular-nums">{ratings?.[id] ?? "–"}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Game in progress */}
                    {activeGame && (
                        <div className="flex flex-col sm:flex-row sm:items-center gap-4 rounded-lg border-2 border-ui-accent bg-ui-surface p-5 shadow-md">
                            <div className="flex h-14 w-14 shrink-0 items-center justify-center self-center rounded-md border-2 border-slate-400 bg-slate-200 p-1">
                                <img src={pieceImages[`${activeGame.color}p`]} alt={activeGame.color === "w" ? "White" : "Black"} className="h-full w-full object-contain"/>
                            </div>

                            <div className="flex-1 text-center sm:text-left">
                                <p className="text-xs font-semibold uppercase tracking-widest text-ui-accent">Game in progress</p>
                                <p className="mt-1 text-lg font-bold text-ui-primary">
                                    You vs {activeGame.opponent?.username || "Opponent"}
                                </p>
                                <p className="text-sm text-ui-secondary">
                                    You play {activeGame.color === "w" ? "White" : "Black"} · {formatTimeControl(activeGame.timeControl)}
                                </p>
                            </div>

                            <button type="button"
                                    onClick={() => navigate(`/game/${activeGame.id}`)}
                                    className="rounded-lg bg-ui-accent px-5 py-2.5 text-sm font-semibold text-ui-contrast shadow-sm transition-opacity hover:opacity-90 active:scale-[0.98] cursor-pointer"
                            >
                                Return to game
                            </button>
                        </div>
                    )}

                    {/* Play Panel */}
                    <div id="play" className="scroll-mt-6 bg-ui-surface border-2 border-ui-border rounded-lg p-8 shadow-md text-center">
                        <h2 className="text-xl font-bold text-ui-primary mb-4">Start Matchmaking</h2>

                        {/* Time control: players are only matched with the same choice */}
                        <div className="mx-auto mb-6 grid max-w-md grid-cols-3 gap-2">
                            {TIME_CONTROLS.map(({id, category}) => (
                                <button key={id}
                                        type="button"
                                        onClick={() => setTimeControl(id)}
                                        aria-pressed={timeControl === id}
                                        className={`rounded-lg border-2 px-3 py-2 transition-colors cursor-pointer ${
                                            timeControl === id
                                                ? "border-ui-accent bg-ui-interactive text-ui-primary"
                                                : "border-ui-border text-ui-secondary hover:border-ui-accent/60 hover:text-ui-primary"
                                        }`}
                                >
                                    <span className="block text-lg font-bold">{formatTimeControl(id)}</span>
                                    <span className="block text-xs">{category}</span>
                                </button>
                            ))}
                        </div>

                        <button
                            type="button"
                            className="bg-ui-accent hover:opacity-90 text-ui-contrast font-bold text-lg px-8 py-4 rounded-lg shadow-lg cursor-pointer transition transform active:scale-95"
                            onClick={handlePlay}
                        >
                            Play Game
                        </button>
                    </div>
                    {isMatchmaking && (<MatchmakingWindow cancelMatchmaking={setIsMatchmaking} timeControl={timeControl}/>)}

                    <GameHistory userID={user.id}/>
                </div>
            </MainLayout>
        )
    }

    return (
        <MainLayout>
            <div className="w-full max-w-2xl mx-auto text-center space-y-8 py-12">
                <div className="space-y-4">
                    <h1 className="text-4xl font-extrabold text-ui-primary tracking-tight">
                        Multi<span className="text-ui-accent">Player</span> Chess Platform
                    </h1>
                    <p className="text-lg text-ui-secondary max-w-xl mx-auto leading-relaxed">
                        Compete against players worldwide, track your ratings, climb the leaderboards, and view your match history in real-time.
                    </p>
                </div>

                {/* About Section */}
                <div className="pt-10">
                    <h1 className="text-4xl font-extrabold text-ui-primary tracking-tight">About the Platform</h1>
                    <p className="text-lg text-ui-secondary max-w-xl mx-auto leading-relaxed">
                        Built for fast-paced multiplayer competition, featuring instant matchmaking, socket-based updates, and ELO ranking calculations.
                    </p>
                </div>

                {/* Call to Action */}
                <div className="flex justify-center gap-4">
                    <Link to="/authentication">
                        <button className="inline-block bg-ui-accent text-ui-contrast hover:opacity-90 px-8 py-3 rounded-lg font-bold cursor-pointer transition shadow">
                            Sign Up
                        </button>
                    </Link>
                </div>
            </div>
        </MainLayout>
    )
}