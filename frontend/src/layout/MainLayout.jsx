import Header from "../components/Header.jsx";
import Footer from "../components/Footer.jsx";


export default function MainLayout({children}){

    return (
        <>
            <Header/>
            <div className="bg-ui-main">
                <main className="h-screen container m-auto text-ui-primary p-6">
                    {children}
                </main>
            </div>
            <Footer/>
        </>
    )
}