import {useEffect, useState} from "react";

export function useTheme(){

    const [theme, setTheme] = useState(localStorage.getItem("theme") || "light")

    useEffect(() => {
        document.documentElement.setAttribute("data-theme", theme)

        localStorage.setItem("theme", theme)
    }, [theme])

    const toggleTheme = () => {
        setTheme(prevState => {
            return prevState === "dark" ? "light" : "dark"
        })
    }

    return [theme, toggleTheme]
}