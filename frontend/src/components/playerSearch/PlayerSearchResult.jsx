import {Link} from "react-router"

export default function PlayerSearchResult({player}) {

    return (
        <li className="border-b border-ui-border last:border-b-0 even:bg-ui-main">
            <Link
                to={`/profile/${player.id}`}
                className="flex items-center gap-3 px-3 sm:px-4 py-3 transition-colors hover:bg-ui-interactive focus:outline-none focus-visible:bg-ui-interactive"
            >
                <span className="w-8 h-8 shrink-0 rounded-full bg-ui-accent text-ui-contrast flex items-center justify-center font-bold uppercase text-sm">
                    {player.username[0]}
                </span>

                <span className="flex-1 min-w-0 truncate text-ui-primary font-semibold">{player.username}</span>

                <svg className="w-4 h-4 shrink-0 text-ui-secondary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polyline points="9 6 15 12 9 18"/>
                </svg>
            </Link>
        </li>
    )
}
