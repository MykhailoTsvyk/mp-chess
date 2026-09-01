import {createContext, useContext, useState} from "react";

const AuthContext = createContext();

export default function AuthProvider({children}) {

    const [user, setUser] = useState(() => {
        const savedUser = localStorage.getItem('user')
        return savedUser ? JSON.parse(savedUser) : null
    })
    // lazy init to execute  that only once when component is loaded
    const [token, setToken] = useState(() => localStorage.getItem('token'))


    const login = ({access, user}) => {
        localStorage.setItem('token', access);
        localStorage.setItem('user', JSON.stringify(user));
        setUser(user)
        setToken(access);
    }

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user')
        setToken(null);
        setUser(null);
    }

    return (
        <AuthContext value={{user, token, login, logout}}>
            {children}
        </AuthContext>
    )
}

export const useAuth = () => useContext(AuthContext)