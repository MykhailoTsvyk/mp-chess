import { useAuth } from "../context/AuthContext"
import { useSocket } from "../context/SocketContext"
import MainLayout from "../layout/MainLayout.jsx";
import GameHistory from "../components/GameHistory.jsx";
import EmailVerification from "../components/EmailVerification.jsx";

export default function ProfilePage() {
    const { user, logout } = useAuth()
    const { isConnected } = useSocket()

    function handleLogout(){
        logout()
    }

    return (
        <MainLayout>
            <div className="min-h-screen bg-ui-main text-ui-primary p-4 md:p-8 transition-colors duration-200">
                <div className="max-w-3xl mx-auto space-y-6">

                    {/* Profile Card Header */}
                    <div className="bg-ui-surface border border-ui-border rounded-xl p-6 shadow-md flex flex-col md:flex-row items-center gap-6">
                        <div className="relative">
                            <div className="w-24 h-24 rounded-full bg-ui-accent text-ui-contrast flex items-center justify-center text-3xl font-bold border-2 border-ui-border cursor-default">
                                {user.username.substring(0, 2).toUpperCase()}
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
                                <h1 className="text-2xl font-bold">{user?.username}</h1>
                                <span className="inline-block bg-ui-interactive text-ui-accent text-xs font-semibold px-2.5 py-1 rounded-full border border-ui-border w-fit mx-auto md:mx-0">
                                    ELO {user?.elo || 800}
                                </span>
                            </div>

                            <p className="text-sm text-ui-secondary cursor-default">
                                Joined {user?.created_at ? new Date(user.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : ""}
                            </p>
                        </div>

                        <button className="bg-ui-accent text-ui-contrast hover:opacity-90 active:scale-95 px-4 py-2 rounded-lg font-medium transition-all shadow-sm cursor-pointer">
                            Edit Profile
                        </button>
                    </div>

                    {!user.is_activated && <EmailVerification/>}

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
                            <p className="text-ui-secondary text-sm">Losses</p>
                            <p className="text-2xl font-bold text-rose-500 mt-1">{user?.stats?.losses || 0}</p>
                        </div>
                    </div>

                    <GameHistory/>

                    {/* Friends Tab */}

                    {/* Settings / System Info */}
                    <div className="bg-ui-surface border border-ui-border rounded-xl p-6 shadow-md">
                        <h2 className="text-lg font-semibold border-b border-ui-subtle pb-3 mb-4">
                            Account & Session Status
                        </h2>

                        <div className="space-y-4">
                            <div className="flex justify-between items-center py-2 border-ui-border border-b">
                                <span className="text-ui-secondary">Account ID</span>
                                <span className="text-ui-primary text-sm font-mono">{user?.id || "N/A"}</span>
                            </div>

                            <div className="flex justify-between items-center py-2 border-ui-border border-b">
                                <p className="text-ui-secondary">
                                    Email
                                </p>

                                <p className={user.is_activated ? "text-emerald-500" : "text-rose-500"}>
                                    {user.is_activated ? "Verified" : "Not verified"}
                                </p>
                            </div>

                            <div className="flex justify-between items-center py-2 border-ui-border border-b">
                                <span className="text-ui-secondary">Online Status</span>
                                <span className="flex items-center gap-2 text-sm font-medium">
                                <span className={`w-2.5 h-2.5 rounded-full ${isConnected ? "bg-emerald-500 animate-pulse" : "bg-rose-500"}`} />
                                <span className={isConnected ? "text-emerald-500" : "text-rose-500"}>
                                    {isConnected ? "Connected" : "Disconnected"}
                                </span>
                            </span>
                            </div>

                            <div className="flex py-2 border-b border-ui-subtle">
                                <button className="bg-rose-500 text-ui-contrast hover:opacity-90 active:scale-95 px-4 py-2 rounded-lg font-medium transition-all shadow-sm cursor-pointer"
                                    onClick={() => handleLogout()}
                                >
                                    Logout
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </MainLayout>
    )
}