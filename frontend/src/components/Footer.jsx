export default function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="w-full bg-ui-surface text-ui-secondary border-t border-ui-subtle text-xs sm:text-sm mt-auto shadow-inner">
            <div className="max-w-7xl mx-auto px-4 py-4 md:py-6 flex flex-col md:flex-row items-center justify-between gap-4">

                {/* Copyright and Branding */}
                <div className="flex items-center space-x-2 text-center md:text-left">
                    <span className="font-semibold text-ui-primary">
                        Chess<span className="text-ui-accent">MP</span>
                    </span>
                    <span className="text-ui-subtle">|</span>
                    <span>&copy; {currentYear} All rights reserved.</span>
                </div>

                {/* Secondary Navigation Links */}
                <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 font-medium">
                    <a
                        href="#terms"
                        className="hover:text-ui-primary transition-colors"
                    >
                        Terms of Service
                    </a>
                    <a
                        href="#privacy"
                        className="hover:text-ui-primary transition-colors"
                    >
                        Privacy Policy
                    </a>
                    <a
                        href="#rules"
                        className="hover:text-ui-primary transition-colors hidden sm:inline"
                    >
                        Chess Rules
                    </a>
                    <a
                        href="https://github.com/MykhailoTsvyk/mp-chess"
                        target="_blank"
                        rel="noreferrer"
                        className="hover:text-accent-ui-color text-ui-secondary transition-colors flex items-center space-x-1 group"
                    >
                        {/* SVG GitHub Icon inherits the parent text color state via group utilities */}
                        <svg className="w-4 h-4 fill-current text-ui-secondary group-hover:text-accent-ui-color transition-colors" viewBox="0 0 24 24">
                            <path d="M12,2A10,10 0 0,0 2,12C2,16.42 4.87,20.17 8.84,21.5C9.34,21.58 9.5,21.27 9.5,21C9.5,20.77 9.5,20.14 9.5,19.31C6.73,19.91 6.14,17.97 6.14,17.97C5.68,16.81 5.03,16.5 5.03,16.5C4.12,15.88 5.1,15.9 5.1,15.9C6.1,15.97 6.63,16.93 6.63,16.93C7.5,18.45 8.97,18 9.54,17.76C9.63,17.11 9.89,16.67 10.17,16.42C7.95,16.17 5.62,15.31 5.62,11.5C5.62,10.41 6,9.54 6.63,8.85C6.53,8.6 6.18,7.58 6.73,6.21C6.73,6.21 7.56,5.95 9.45,7.23C10.24,7.02 11.08,6.91 11.91,6.91C12.75,6.91 13.59,7.02 14.38,7.23C16.26,5.95 17.1,6.21 17.1,6.21C17.65,7.58 17.3,8.6 17.2,8.85C17.83,9.54 18.21,10.41 18.21,11.5C18.21,15.32 15.88,16.16 13.66,16.41C14,16.7 14.31,17.29 14.31,18.19C14.31,19.47 14.3,20.5 14.3,20.81C14.3,21.09 14.46,21.4 14.96,21.3C18.92,20.16 21.79,16.42 21.79,12A10,10 0 0,0 12,2Z" />
                        </svg>
                        <span>Source Code</span>
                    </a>
                </div>

            </div>
        </footer>
    );
}