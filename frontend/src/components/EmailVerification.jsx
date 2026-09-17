import { useState } from "react";
import api from "../api/axios.js";

export default function EmailVerification() {
    const [isLoading, setIsLoading] = useState(false)
    const [message, setMessage] = useState("")
    const [isError, setIsError] = useState(false)

    async function handleRequest() {
        setIsLoading(true)
        setMessage("")
        setIsError(false)

        try {
            const res = await api.post("/resend-activation")

            // Handle successful response
            if (res.status === 200 || res.status === 201) {
                setMessage(res.data?.message || "Activation link sent! Check your inbox.")
            }
        } catch (error) {
            console.error("Resend activation error:", error.response?.data || error.message)
            setIsError(true)
            setMessage(
                error.response?.data?.message || "Failed to resend activation link. Please try again."
            )
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 rounded-xl border border-ui-danger-border bg-ui-danger-subtle p-6 shadow-md transition-all">
            <div className="flex items-center gap-3 text-center md:text-left">
                {/* Pulsing Attention Indicator */}
                <span className="relative flex h-3 w-3 shrink-0">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-ui-danger opacity-75" />
                    <span className="relative inline-flex h-3 w-3 rounded-full bg-ui-danger" />
                </span>

                <div>
                    <h1 className="text-lg font-bold text-ui-danger-text">
                        Your email is not verified!
                    </h1>
                    <p className="text-sm text-ui-danger-text/80">
                        Please check your inbox or request a new link to activate your account.
                    </p>
                    <p className="text-sm text-ui-danger-text/80">
                        You must verify your email to be allowed to play online.
                    </p>

                    {/* Feedback Message */}
                    {message && (
                        <p className={`mt-2 text-sm font-medium ${isError ? 'text-ui-danger-text' : 'text-ui-primary'}`}>
                            {message}
                        </p>
                    )}
                </div>
            </div>

            <button
                className="shrink-0 rounded-lg bg-ui-danger px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-ui-danger-hover active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleRequest}
                disabled={isLoading}
            >
                {isLoading ? "Sending..." : "Verify Email"}
            </button>
        </div>
    );
}