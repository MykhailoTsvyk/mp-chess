import {loginUser} from "../../api/authService.js";
import {useState} from "react";
import {useNavigate} from "react-router";
import {useAuth} from "../../context/AuthContext.jsx";

export default function LoginForm({changePage}) {
    const currentYear = new Date().getFullYear();
    const [formData, setFormData] = useState({email: '', password: ''})
    const navigate = useNavigate()
    const {login} = useAuth()

    function handleChange(e){
        setFormData({...formData, [e.target.name]: e.target.value})
        console.log(formData)
    }

    async function handleSubmit(e) {
        e.preventDefault()

        try {
            const data = await loginUser(formData)
            console.log(data)
            login(data)
            navigate('/')
        } catch (e) {
            console.log(e)
        }
    }

    return (
        <>
            <form onSubmit={handleSubmit}
                className="shadow-md bg-ui-surface flex-col rounded-md pb-4 w-full">
                <h1 className="text-center text-3xl text-ui-primary font-bold p-4">Log In</h1>

                <div className="mb-4 w-3/4 m-auto text-ui-primary">
                    <label htmlFor="email-input"
                           className="block text-sm font-bold">
                        Email
                    </label>
                    <input className="w-1/1 block bg-ui-main border-2 outline-0 border-ui-border rounded-md p-2 shadow"
                           id="email-input"
                           type="email"
                           name="email"
                           placeholder="Enter your email"
                           required
                           onChange={handleChange}
                    />
                </div>

                <div className="mb-4 w-3/4 m-auto text-ui-primary">
                    <label htmlFor="password-input"
                           className="block text-sm font-bold">
                        Password
                    </label>
                    <input className="w-1/1 block bg-ui-main border-2 outline-0 border-ui-border rounded-md p-2 shadow"
                           id="password-input"
                           type="password"
                           name="password"
                           placeholder="Enter password"
                           onChange={handleChange}
                           required
                    />
                </div>

                <div className="flex flex-col w-3/4 m-auto text-ui-primary">
                    <button onClick={() => {changePage("register")}}
                            className="block text-sm mb-4 underline cursor-pointer">
                        Do not have an account? Register
                    </button>

                    <button className="block bg-ui-accent text-ui-contrast hover:opacity-90 px-6 py-3 rounded-lg cursor-pointer"
                            type="submit">
                        Log In
                    </button>
                </div>



            </form>
            <p className="text-center text-ui-secondary text-xs">
                &copy;{currentYear} All rights reserved.
            </p>
        </>

    )
}