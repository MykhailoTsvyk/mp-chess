import Header from "../components/Header.jsx";
import Footer from "../components/Footer.jsx";


export default function MainLayout({children}){

    return (
        <div className="w-full min-h-screen bg-ui-main text-ui-primary flex flex-col">
            <Header/>
            <div className="bg-ui-main">
                <main className="container mx-auto h-auto px-2 py-4 text-ui-primary sm:p-4 md:p-6">
                    {children}
                </main>
            </div>
            <Footer/>
        </div>
    )
}