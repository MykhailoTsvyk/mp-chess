import { useAuth } from "../context/AuthContext"
import { useSocket } from "../context/SocketContext"
import MainLayout from "../layout/MainLayout.jsx";
import GameHistory from "../components/GameHistory.jsx";

export default function ProfilePage() {
    const { user } = useAuth()
    const { isConnected } = useSocket()

    return (
        <MainLayout>
            <div className="min-h-screen bg-ui-main text-ui-primary p-4 md:p-8 transition-colors duration-200">
                <div className="max-w-3xl mx-auto space-y-6">

                    {/* Profile Card Header */}
                    <div className="bg-ui-surface border border-ui-border rounded-xl p-6 shadow-md flex flex-col md:flex-row items-center gap-6">
                        <div className="relative">
                            <div className="w-24 h-24 rounded-full bg-ui-accent text-ui-contrast flex items-center justify-center text-3xl font-bold border-2 border-ui-border">
                                {user?.username ? user.username.substring(0, 2).toUpperCase() : "JD"}
                            </div>
                            <span
                                className={`absolute bottom-0 right-0 w-4 h-4 border-2 border-ui-surface rounded-full ${
                                    isConnected ? "bg-emerald-500" : "bg-rose-500"
                                }`}
                                title={isConnected ? "Online" : "Offline"}
                            />
                        </div>

                        <div className="flex-1 text-center md:text-left">
                            <div className="flex flex-col md:flex-row md:items-center gap-2">
                                <h1 className="text-2xl font-bold">{user?.username || "John Doe"}</h1>
                                <span className="inline-block bg-ui-interactive text-ui-accent text-xs font-semibold px-2.5 py-1 rounded-full border border-ui-border w-fit mx-auto md:mx-0">
                                ELO {user?.elo || 1200}
                            </span>
                            </div>
                            <p className="text-ui-secondary text-sm mt-1">
                                {user?.email || "user@example.com"}
                            </p>
                        </div>

                        <button className="bg-ui-accent text-ui-contrast hover:opacity-90 active:scale-95 px-4 py-2 rounded-lg font-medium transition-all shadow-sm">
                            Edit Profile
                        </button>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="bg-ui-surface border border-ui-border rounded-lg p-4 text-center">
                            <p className="text-ui-secondary text-sm">Matches Played</p>
                            <p className="text-2xl font-bold text-ui-primary mt-1">{user?.stats?.gamesPlayed || 0}</p>
                        </div>
                        <div className="bg-ui-surface border border-ui-border rounded-lg p-4 text-center">
                            <p className="text-ui-secondary text-sm">Wins</p>
                            <p className="text-2xl font-bold text-emerald-500 mt-1">{user?.stats?.wins || 0}</p>
                        </div>
                        <div className="bg-ui-surface border border-ui-border rounded-lg p-4 text-center">
                            <p className="text-ui-secondary text-sm">Global Rank</p>
                            <p className="text-2xl font-bold text-ui-accent mt-1">#{user?.stats?.rank || "N/A"}</p>
                        </div>
                    </div>

                    {/* Match History */}
                    <GameHistory/>

                    {/* Settings / System Info */}
                    <div className="bg-ui-surface border border-ui-border rounded-xl p-6 shadow-md">
                        <h2 className="text-lg font-semibold border-b border-ui-subtle pb-3 mb-4">
                            Account & Session Status
                        </h2>

                        <div className="space-y-4">
                            <div className="flex justify-between items-center py-2 border-b border-ui-subtle">
                                <span className="text-ui-secondary">Account ID</span>
                                <span className="text-ui-primary text-sm font-mono">{user?.id || "N/A"}</span>
                            </div>
                            <div className="flex justify-between items-center py-2">
                                <span className="text-ui-secondary">Real-Time Socket</span>
                                <span className="flex items-center gap-2 text-sm font-medium">
                                <span className={`w-2.5 h-2.5 rounded-full ${isConnected ? "bg-emerald-500 animate-pulse" : "bg-rose-500"}`} />
                                <span className={isConnected ? "text-emerald-500" : "text-rose-500"}>
                                    {isConnected ? "Connected" : "Disconnected"}
                                </span>
                            </span>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </MainLayout>
    )
}