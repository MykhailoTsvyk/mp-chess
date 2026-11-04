import { useAuth } from "../context/AuthContext"
import { useSocket } from "../context/SocketContext"
import MainLayout from "../layout/MainLayout.jsx";
import GameHistory from "../components/GameHistory.jsx";
import EmailVerification from "../components/EmailVerification.jsx";
import {useEffect, useState} from "react";
import {useParams} from "react-router";
import api from "../api/axios.js";
import {RATING_CATEGORIES} from "../features/chess/timeControls.js";

export default function ProfilePage() {
    const { user, logout } = useAuth()
    const { isConnected } = useSocket()
    const { userID } = useParams()

    // "/profile" and "/profile/<own id>" both show the logged-in user's own profile
    const isOwnProfile = !userID || Number(userID) === user.id
    const profileID = isOwnProfile ? user.id : Number(userID)

    const [profile, setProfile] = useState(null)
    const [error, setError] = useState(null)

    useEffect(() => {
        async function fetchProfile() {
            try {
                const res = await api.get(`/user/${profileID}`)
                setProfile(res.data)
                setError(null)
            } catch (e) {
                setProfile(null)
                setError({id: profileID, message: e.response?.status === 404 ? "User not found" : "Failed to load profile"})
            }
        }

        fetchProfile()
    }, [profileID])

    function handleLogout(){
        logout()
    }

    // don't show the previous profile while navigating to another one
    const isLoaded = profile?.id === profileID
    const hasError = error?.id === profileID

    if (!isLoaded) {
        return (
            <MainLayout>
                <div className="min-h-screen bg-ui-main text-ui-secondary p-4 md:p-8 text-center">
                    {hasError ? error.message : "Loading profile..."}
                </div>
            </MainLayout>
        )
    }

    return (
        <MainLayout>
            <div className="min-h-screen bg-ui-main text-ui-primary p-4 md:p-8 transition-colors duration-200">
                <div className="max-w-3xl mx-auto space-y-6">

                    {/* Profile Card Header */}
                    <div className="bg-ui-surface border border-ui-border rounded-xl p-6 shadow-md flex flex-col md:flex-row items-center gap-6">
                        <div className="relative">
                            <div className="w-24 h-24 rounded-full bg-ui-accent text-ui-contrast flex items-center justify-center text-3xl font-bold border-2 border-ui-border cursor-default">
                                {profile.username.substring(0, 2).toUpperCase()}
                            </div>
                            {/* only the own connection status is known on the client */}
                            {isOwnProfile && (
                                <span
                                    className={`absolute bottom-0 right-0 w-4 h-4 border-2 border-ui-surface rounded-full ${
                                        isConnected ? "bg-emerald-500" : "bg-rose-500"
                                    }`}
                                    title={isConnected ? "Online" : "Offline"}
                                />
                            )}
                        </div>

                        <div className="flex-1 text-center md:text-left">
                            <div className="flex flex-col md:flex-row md:items-center gap-2">
                                <h1 className="text-2xl font-bold">{profile.username}</h1>
                            </div>

                            <p className="text-sm text-ui-secondary cursor-default">
                                Joined {profile.created_at ? new Date(profile.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : ""}
                            </p>
                        </div>

                        {isOwnProfile && (
                            <button className="bg-ui-accent text-ui-contrast hover:opacity-90 active:scale-95 px-4 py-2 rounded-lg font-medium transition-all shadow-sm cursor-pointer">
                                Edit Profile
                            </button>
                        )}
                    </div>

                    {isOwnProfile && !profile.is_activated && <EmailVerification/>}

                    {/* Ratings: one per category of time control */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {RATING_CATEGORIES.map(({id, label}) => (
                            <div key={id} className="bg-ui-surface border border-ui-border rounded-lg p-4 text-center">
                                <p className="text-ui-secondary text-sm">{label}</p>
                                <p className="text-2xl font-extrabold text-ui-accent mt-1 tabular-nums">{profile.ratings?.[id]?.rating ?? "–"}</p>
                                <p className="text-base text-ui-secondary mt-1">
                                    {profile.ratings?.[id]?.games ?? 0} {profile.ratings?.[id]?.games === 1 ? "game" : "games"}
                                </p>
                            </div>
                        ))}
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="bg-ui-surface border border-ui-border rounded-lg p-4 text-center">
                            <p className="text-ui-secondary text-sm">Matches Played</p>
                            <p className="text-2xl font-bold text-ui-primary mt-1">{profile.stats.games_played}</p>
                        </div>
                        <div className="bg-ui-surface border border-ui-border rounded-lg p-4 text-center">
                            <p className="text-ui-secondary text-sm">Wins</p>
                            <p className="text-2xl font-bold text-emerald-500 mt-1">{profile.stats.wins}</p>
                        </div>
                        <div className="bg-ui-surface border border-ui-border rounded-lg p-4 text-center">
                            <p className="text-ui-secondary text-sm">Losses</p>
                            <p className="text-2xl font-bold text-rose-500 mt-1">{profile.stats.losses}</p>
                        </div>
                    </div>

                    <GameHistory key={profileID} userID={profileID}/>

                    {/* Friends Tab */}

                    {/* Settings / System Info */}
                    {isOwnProfile && (
                        <div className="bg-ui-surface border border-ui-border rounded-xl p-6 shadow-md">
                            <h2 className="text-lg font-semibold border-b border-ui-subtle pb-3 mb-4">
                                Account & Session Status
                            </h2>

                            <div className="space-y-4">
                                <div className="flex justify-between items-center py-2 border-ui-border border-b">
                                    <span className="text-ui-secondary">Account ID</span>
                                    <span className="text-ui-primary text-sm font-mono">{profile.id}</span>
                                </div>

                                <div className="flex justify-between items-center py-2 border-ui-border border-b">
                                    <p className="text-ui-secondary">
                                        Email
                                    </p>

                                    <p className={profile.is_activated ? "text-emerald-500" : "text-rose-500"}>
                                        {profile.is_activated ? "Verified" : "Not verified"}
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
                    )}
                </div>
            </div>
        </MainLayout>
    )
}
