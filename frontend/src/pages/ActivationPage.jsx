import {useNavigate, useParams} from "react-router";
import MainLayout from "../layout/MainLayout.jsx";
import {useEffect, useRef, useState} from "react";
import api from "../api/axios.js";
import {useAuth} from "../context/AuthContext.jsx";

export default function ActivationPage() {
    const navigate = useNavigate()
    const {login} = useAuth()
    const {token} = useParams()
    const [status, setStatus] = useState('verifying') // verifying || success || error
    const [apiError, setApiError] = useState('')
    console.log(token)

    const hasCalledApi = useRef(false)

    useEffect(() => {
        if (!token) return

        if (hasCalledApi.current) return
        hasCalledApi.current = true

        const activateEmail = async () => {
            try {
                const res = await api.post(`/activate/${token}`)
                console.log(res)

                const accessToken = res.data?.accessToken
                const user = res.data?.user
                console.log(accessToken)
                console.log(user)
                if (accessToken && user) {
                    setStatus('success')
                    login({accessToken, user})
                }
            } catch (e) {
                console.log(e)
                setStatus("error")
                setApiError("Activation error: token is not valid!")
            }
        }

        activateEmail()
    }, [token, login]);

    return (
        <MainLayout>
            <div className="min-h-[70vh] flex items-center justify-center px-4 bg-ui-main">
                <div className="w-full max-w-md p-8 rounded-xl border border-ui-border bg-ui-surface shadow-lg text-center">

                    {/* State: Verifying */}
                    {status === "verifying" && (
                        <div className="space-y-4">
                            <div className="w-12 h-12 border-4 border-t-transparent border-ui-accent rounded-full animate-spin mx-auto" />
                            <h2 className="text-xl font-semibold text-ui-primary">
                                Verifying your email...
                            </h2>
                            <p className="text-sm text-ui-secondary">
                                Please wait while we activate your account.
                            </p>
                        </div>
                    )}

                    {/* State: Success */}
                    {status === "success" && (
                        <div className="space-y-4">
                            <div className="w-12 h-12 rounded-full bg-ui-interactive text-ui-accent flex items-center justify-center mx-auto text-2xl font-bold">
                                ✓
                            </div>
                            <h2 className="text-2xl font-bold text-ui-primary">
                                Account Activated!
                            </h2>
                            <p className="text-sm text-ui-secondary">
                                Your email has been successfully verified. You now have full access to your account.
                            </p>
                            <div className="pt-4">
                                <button
                                    onClick={() => navigate("/")}
                                    className="w-full py-2.5 px-4 rounded-lg bg-ui-accent text-ui-contrast font-medium hover:opacity-90 transition-opacity cursor-pointer"
                                >
                                    Go to Home Page
                                </button>
                            </div>
                        </div>
                    )}

                    {/* State already verified */}
                    {status === "alreadyVerified" && (
                        <div className="space-y-4">
                            <div className="w-12 h-12 rounded-full bg-ui-interactive text-ui-accent flex items-center justify-center mx-auto text-2xl font-bold">
                                ✓
                            </div>
                            <h2 className="text-2xl font-bold text-ui-primary">
                                Account is already activated!
                            </h2>
                            <p className="text-sm text-ui-secondary">
                                Your email has been successfully verified. You now have full access to your account.
                            </p>
                            <div className="pt-4">
                                <button
                                    onClick={() => navigate("/")}
                                    className="w-full py-2.5 px-4 rounded-lg bg-ui-accent text-ui-contrast font-medium hover:opacity-90 transition-opacity cursor-pointer"
                                >
                                    Go to Home Page
                                </button>
                            </div>
                        </div>
                    )}

                    {/* State: Error */}
                    {status === "error" && (
                        <div className="space-y-4">
                            <div className="w-12 h-12 rounded-full bg-ui-danger-subtle text-ui-danger-text border border-ui-danger-border flex items-center justify-center mx-auto text-xl font-bold">
                                !
                            </div>
                            <h2 className="text-2xl font-bold text-ui-primary">
                                Activation Failed
                            </h2>
                            <p className="text-sm text-ui-danger-text bg-ui-danger-subtle p-3 rounded-lg border border-ui-danger-border">
                                {apiError}
                            </p>
                        </div>
                    )}

                </div>
            </div>
        </MainLayout>
    )
}