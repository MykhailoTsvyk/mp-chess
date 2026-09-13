import { useState } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import { registerUser } from "../../api/authService.js";
import {useNavigate} from "react-router";

export default function RegisterForm({ changePage }) {
    const currentYear = new Date().getFullYear()
    const { login } = useAuth()
    const navigate = useNavigate()
    const [username, setUsername] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')

    const [error, setError] = useState('')

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')

        if (password !== confirmPassword) {
            setError("Passwords do not match")
            return;
        }

        const payload = {
            username: username.trim(),
            email: email.trim(),
            password: password,
        }

        try {
            const data = await registerUser(payload)
            login(data)
            navigate("/")
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed')
        }
    }

    return (
        <>
            <form onSubmit={handleSubmit} className="shadow-md bg-ui-surface flex-col rounded-md pb-4 w-full">
                <h1 className="text-center text-ui-primary text-3xl font-bold p-4">Registration Form</h1>

                {error && (
                    <p className="text-center text-red-500 font-semibold mb-2 text-sm">{error}</p>
                )}

                <div className="mb-4 w-3/4 m-auto text-ui-primary">
                    <label htmlFor="username-input" className="block text-sm font-bold">Username</label>
                    <input
                        className="w-full block bg-ui-main border-2 outline-0 border-ui-border rounded-md p-2 shadow"
                        id="username-input"
                        type="text"
                        placeholder="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                    />
                </div>

                <div className="mb-4 w-3/4 m-auto text-ui-primary">
                    <label htmlFor="email-input" className="block text-sm font-bold">Email</label>
                    <input
                        className="w-full block bg-ui-main border-2 outline-0 border-ui-border rounded-md p-2 shadow"
                        id="email-input"
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>

                <div className="mb-4 w-3/4 m-auto text-ui-primary">
                    <label htmlFor="password-input" className="block text-sm font-bold">Password</label>
                    <input
                        className="w-full block bg-ui-main border-2 outline-0 border-ui-border rounded-md p-2 shadow"
                        id="password-input"
                        type="password"
                        placeholder="Enter password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>

                <div className="mb-4 w-3/4 m-auto text-ui-primary">
                    <label htmlFor="confirm-password-input" className="block text-sm font-bold">Confirm Password</label>
                    <input
                        className="w-full block bg-ui-main border-2 outline-0 border-ui-border rounded-md p-2 shadow"
                        id="confirm-password-input"
                        type="password"
                        placeholder="Confirm Password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                    />
                </div>

                <div className="flex flex-col w-3/4 m-auto text-ui-primary">
                    <button
                        type="button"
                        onClick={() => changePage("login")}
                        className="block text-sm mb-4 underline cursor-pointer"
                    >
                        Already have an account? Log in
                    </button>

                    <button
                        className="block bg-ui-accent text-ui-contrast hover:opacity-90 px-6 py-3 rounded-lg cursor-pointer"
                        type="submit"
                    >
                        Register
                    </button>
                </div>
            </form>
            <p className="text-center text-ui-secondary text-xs mt-2">
                &copy;{currentYear} All rights reserved.
            </p>
        </>
    );
}