
export default function RegisterForm({changePage}) {
    const currentYear = new Date().getFullYear();

    return (
        <>
            <form className="shadow-md bg-ui-surface flex-col rounded-md pb-4 w-full">
                <h1 className="text-center text-ui-primary text-3xl font-bold p-4">Registration Form</h1>
                <div className="mb-4 w-3/4 m-auto text-ui-primary">
                    <label htmlFor="username-input"
                           className="block text-sm font-bold">
                        Username
                    </label>
                    <input className="w-1/1 block bg-ui-main border-2 outline-0 border-ui-border rounded-md p-2 shadow"
                           id="username-input"
                           type="text"
                           placeholder="Username"

                    />
                </div>

                <div className="mb-4 w-3/4 m-auto text-ui-primary">
                    <label htmlFor="email-input"
                           className="block text-sm font-bold">
                        Email
                    </label>
                    <input className="w-1/1 block bg-ui-main border-2 outline-0 border-ui-border rounded-md p-2 shadow"
                           id="email-input"
                           type="email"
                           placeholder="Enter your email"

                    />
                </div>

                <div className="mb-4 w-3/4 m-auto text-ui-primary">
                    <label htmlFor="passworn-input"
                           className="block text-sm font-bold">
                        Password
                    </label>
                    <input className="w-1/1 block bg-ui-main border-2 outline-0 border-ui-border rounded-md p-2 shadow"
                           id="password-input"
                           type="password"
                           placeholder="Enter password"

                    />
                </div>

                <div className="mb-4 w-3/4 m-auto text-ui-primary">
                    <label htmlFor="confirm-password-input"
                           className="block text-sm font-bold">
                        Confirm Password
                    </label>
                    <input className="w-1/1 block bg-ui-main border-2 outline-0 border-ui-border rounded-md p-2 shadow"
                           id="confirm-password-input"
                           type="password"
                           placeholder="Confirm Password"

                    />
                </div>

                <div className="flex flex-col w-3/4 m-auto text-ui-primary">
                    <button onClick={() => {changePage("login")}}
                            className="block text-sm mb-4 underline cursor-pointer">
                        Already have an account? Log in
                    </button>

                    <button className="block bg-ui-accent text-ui-contrast hover:opacity-90 px-6 py-3 rounded-lg cursor-pointer"
                            type="submit">
                        Register
                    </button>
                </div>



            </form>
            <p className="text-center text-ui-secondary text-xs">
                &copy;{currentYear} All rights reserved.
            </p>
        </>

    )
}