import MainLayout from "../layout/MainLayout.jsx"
import { Link } from "react-router"
import { useAuth } from "../context/AuthContext.jsx"
import GameHistory from "../components/GameHistory.jsx";
import MatchmakingWindow from "../components/MatchmakingWindow.jsx";
import {useState} from "react";

export default function HomePage() {
    const {user, isAuthenticated} = useAuth()
    const [isMatchmaking, setIsMatchmaking] = useState(false)

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
                        <div className="text-center bg-ui-main px-4 py-2 rounded-md border border-ui-border">
                            <span className="text-xs text-ui-secondary font-bold block">Rating ELO</span>
                            <span className="text-2xl font-extrabold text-ui-accent">{user?.elo || 1200}</span>
                        </div>
                    </div>

                    {/* Play Panel */}
                    <div className="bg-ui-surface border-2 border-ui-border rounded-lg p-8 shadow-md text-center">
                        <h2 className="text-xl font-bold text-ui-primary mb-4">Start Matchmaking</h2>
                        <button
                            type="button"
                            className="bg-ui-accent hover:opacity-90 text-ui-contrast font-bold text-lg px-8 py-4 rounded-lg shadow-lg cursor-pointer transition transform active:scale-95"
                            onClick={() => setIsMatchmaking(true)}
                        >
                            Play Game
                        </button>
                    </div>
                    {isMatchmaking && (<MatchmakingWindow cancelMatchmaking={setIsMatchmaking}/>)}

                    <GameHistory/>
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