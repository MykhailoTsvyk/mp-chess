import MainLayout from "../layout/MainLayout.jsx";
import {Link} from "react-router";

export default function HomePage(){

    return(
        <MainLayout>
            <Link to="/authentication">
                <button className="block bg-ui-accent text-ui-contrast hover:opacity-90 px-6 py-3 rounded-lg cursor-pointer"
                        >
                    Sign Up
                </button>
            </Link>
        </MainLayout>
    )
}