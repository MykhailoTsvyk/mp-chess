import { useState } from "react";
import themeIcon from "../assets/images/icons/theme-change.svg"
import notificationIcon from "../assets/images/icons/notification.svg"
import {useTheme} from "../hooks/useTheme.jsx";

export default function Header() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [theme, toggleTheme] = useTheme()

    return (
        <header className="w-full bg-ui-surface text-ui-primary border-b border-ui-subtle relative shadow-sm z-50">
            <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">

                {/* LEFT: Mobile Menu Button, Branding and Main Nav */}
                <div className="flex items-center space-x-4 md:space-x-6">
                    {/* Hamburger Menu Toggle Button (Visible on Mobile only) */}
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="md:hidden p-1.5 rounded text-ui-secondary hover:text-ui-primary focus:outline-none hover:bg-ui-interactive transition-colors"
                        aria-label="Toggle Navigation Menu"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            {isMenuOpen ? (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            ) : (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                            )}
                        </svg>
                    </button>

                    {/* Branding Logo */}
                    <div className="flex items-center space-x-2 cursor-pointer">
                        <svg className="w-8 h-8 text-accent-ui-color fill-current" viewBox="0 0 24 24">
                            <path d="M19,22H5V20H19V22M17,11C17,14.38 14.8,17.25 11.81,18.31C11.11,18.56 10.32,18.2 10.07,17.5C9.82,16.8 10.18,16 10.88,15.76C12.87,15.06 14.33,13.14 14.33,11C14.33,10.23 14,9.5 13.46,8.97L11.5,11H8V5H9.5L12,2.5L14.5,5H13.22C15.44,5.43 17,7.38 17,9.67V11Z" />
                        </svg>
                        <span className="font-bold text-xl tracking-wide hidden sm:block text-ui-primary">
                          Chess<span className="text-ui-accent">MP</span>
                        </span>
                    </div>

                    {/* Desktop Navigation Links */}
                    <nav className="hidden md:flex space-x-5 text-sm font-medium text-ui-secondary">
                        <a href="#play" className="hover:text-ui-primary transition-colors py-1">Play</a>
                        <a href="#friends" className="hover:text-ui-primary transition-colors flex items-center py-1">Friends</a>
                        <a href="#leaderboard" className="hover:text-ui-primary transition-colors py-1">Leaderboard</a>
                    </nav>
                </div>

                {/* RIGHT: Profile, ELO, Notifications */}
                <div className="flex items-center space-x-3 md:space-x-4">

                    {/* Elo Rating Badge */}
                    <div className="bg-ui-main border border-ui-main px-3 py-1 rounded-full flex items-center space-x-1.5 text-xs md:text-sm font-semibold text-accent-ui-color shadow-sm">
                        <span>ELO</span>
                        <span>1200</span>
                    </div>

                    {/* Notifications / Friend Invites Bell */}
                    <button className="shrink-0 relative p-1.5 text-ui-secondary hover:text-ui-primary transition-colors focus:outline-none rounded-full hover:bg-ui-interactive">
                        <img src={notificationIcon} alt="" className={theme === "dark" ? "invert" : ""} />
                    </button>

                    {/* Changing theme button */}
                    <button
                        type="button"
                        onClick={toggleTheme}
                        aria-label="Toggle theme"
                        className="shrink-0 relative p-1.5 text-ui-secondary hover:text-ui-primary transition-colors focus:outline-none rounded-full hover:bg-ui-interactive"
                    >
                        <img src={themeIcon} alt="change theme" className={theme === "dark" ? "invert" : ""} />
                    </button>

                    {/* User Account / Profile Dropdown Trigger */}
                    <div className="flex items-center space-x-2 pl-2 border-l border-ui-subtle cursor-pointer group">
                        <div className="w-8 h-8 rounded-full bg-accent-ui-color text-accent-ui-contrast flex items-center justify-center font-bold uppercase shadow-sm text-sm">
                            U
                        </div>
                        <span className="text-sm font-medium hidden lg:block text-ui-secondary group-hover:text-accent-ui-color transition-colors">
                          Guest
                        </span>
                    </div>

                </div>
            </div>

            {/* MOBILE DROPDOWN MENU (Toggled via state) */}
            {isMenuOpen && (
                <div className="md:hidden absolute top-full left-0 w-full bg-ui-surface border-b border-ui-main shadow-lg py-2 flex flex-col px-4 space-y-2 animate-fadeIn">
                    <a
                        href="#play"
                        onClick={() => setIsMenuOpen(false)}
                        className="text-ui-secondary hover:text-ui-primary hover:bg-ui-interactive p-2 rounded transition-colors text-sm font-medium"
                    >
                        Play
                    </a>
                    <a
                        href="#friends"
                        onClick={() => setIsMenuOpen(false)}
                        className="text-ui-secondary hover:text-ui-primary hover:bg-ui-interactive p-2 rounded transition-colors text-sm font-medium flex items-center justify-between"
                    >
                        Friends
                    </a>
                    <a
                        href="#leaderboard"
                        onClick={() => setIsMenuOpen(false)}
                        className="text-ui-secondary hover:text-ui-primary hover:bg-ui-interactive p-2 rounded transition-colors text-sm font-medium"
                    >
                        Leaderboard
                    </a>
                </div>
            )}
        </header>
    );
}