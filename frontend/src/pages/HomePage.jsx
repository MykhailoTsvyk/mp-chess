import MainLayout from "../layout/MainLayout.jsx";
import {Link} from "react-router";
import {useAuth} from "../context/AuthContext.jsx";

export default function HomePage(){
    const {user} = useAuth()

    if (user) {
        return(
            <MainLayout>
                <div>
                    <h1 className="text-xl">Welcome back, <span className="text-ui-accent font-bold">{user.username}</span>!</h1>
                </div>
            </MainLayout>
    )
    }

    return(
        <MainLayout>
            <Link to="/authentication">
                <button className="inline-block bg-ui-accent text-ui-contrast hover:opacity-90 px-6 py-3 rounded-lg cursor-pointer">
                    Sign Up
                </button>
            </Link>
        </MainLayout>
    )
}