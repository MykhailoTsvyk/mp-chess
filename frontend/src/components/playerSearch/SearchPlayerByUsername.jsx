import { useRef, useState } from "react"
import { getUsersByUsername } from "../../api/userService"
import PlayerSearchResult from "./PlayerSearchResult.jsx"

export default function SearchPlayerByUsername() {
    const [username, setUsername] = useState("")
    const [warning, setWarning] = useState(null)
    const [error, setError] = useState(null)
    const timerRef = useRef(null)
    const [users, setUsers] = useState([])
    const isOpen = username.length > 2
    const [isLoading, setIsLoading] = useState(true)

    console.log(users)


    const handleChange = async (e) => {
        clearTimeout(timerRef.current)
        error && setError(null)
        setWarning(null)
        const query = e.target.value.trim().replace(/[^a-zA-Z0-9_]/g, "")

        if (e.target.value !== query) {
            e.target.value = query
            setWarning("Only English letters, numbers and _ are allowed.")
        }

        if (query.length > 2) {
            setIsLoading(true)
            let timerID = setTimeout(async () => {
                try {
                    const fetchedUsers = await getUsersByUsername(query, 10)
                    setUsers([...fetchedUsers.users])
                } catch (e) {
                    setError("Could not find users")
                    console.error(e)
                } finally {
                    setIsLoading(false)
                }
            }, 400)

            timerRef.current = timerID
        } else {
            setUsers([])
        }

        setUsername(query)
    }

    return (
    <div>
        <p className="min-h-5 mb-1 text-ui-danger text-center text-sm" aria-live="polite">{warning}</p>

        <div className="relative">
            <div className={`flex w-full bg-ui-surface border-2 border-ui-border focus-within:border-ui-accent overflow-hidden shadow transition-colors ${
                isOpen ? "rounded-t-md" : "rounded-md"
            }`}>
                <input
                    onChange={(e) => handleChange(e)}
                    type="text"
                    aria-label="Search players by username"
                    placeholder="Type username..."
                    className="flex-1 min-w-0 bg-transparent text-ui-primary placeholder:text-ui-secondary p-2 outline-none"
                />
                <div className="flex items-center px-3 bg-ui-accent text-ui-contrast" aria-hidden="true">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="7"/>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                    </svg>
                </div>
            </div>

            {isOpen && (
                <ul className="absolute top-full inset-x-0 z-10 max-h-72 overflow-y-auto bg-ui-surface border-2 border-t-0 border-ui-border rounded-b-md shadow-lg">
                    {isLoading ? (
                        <li className="text-center py-2">Searching...</li>
                    ) : error ? (
                        <li className="text-center py-2">{error}</li>
                    ) : users.length === 0 ? (
                        <li className="text-center py-2">No players found</li>
                    ) : (
                        users.map((user) => <PlayerSearchResult key={user.id} player={user}/>)
                    )}
                </ul>
            )}
        </div>
    </div>
    )
}
