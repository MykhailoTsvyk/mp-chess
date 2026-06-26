import {useState} from "react";
import RegisterForm from "../features/authentication/RegisterForm.jsx";
import LoginForm from "../features/authentication/LoginForm.jsx";


export default function AuthenticationPage() {

    const [currPage, setPage] = useState("register")

    return (
        <div className="bg-ui-main min-h-screen w-full flex items-center justify-center">
            <div className="w-11/12 max-w-md m-auto flex flex-col items-center justify-center">
                {currPage === "register" ? <RegisterForm changePage={setPage}/> : <LoginForm changePage={setPage}/>}
            </div>
        </div>

    )
}