import {Link} from "react-router";


export default function PageNotFound() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-ui-main px-4 text-center">
            {/* Container Card */}
            <div className="flex max-w-md flex-col items-center rounded-2xl border border-ui-border bg-ui-surface p-8 shadow-sm">
                {/* Large 404 Accent Badge */}
                <span className="rounded-full bg-ui-interactive px-4 py-1.5 text-sm font-semibold text-ui-accent">
          Error 404
        </span>

                <h1 className="mt-4 text-6xl font-extrabold tracking-tight text-ui-primary">
                    404
                </h1>

                <p className="mt-2 text-xl font-medium text-ui-primary">
                    Page not found
                </p>

                <p className="mt-2 text-sm text-ui-secondary">
                    Sorry, the page you are looking for doesn't exist or has been moved.
                </p>

                <Link to="/" className="mt-6 rounded-lg bg-ui-accent px-5 py-2.5 text-sm font-medium text-ui-contrast transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-ui-accent focus:ring-offset-2">Go back Home</Link>

            </div>
        </div>
    )
}