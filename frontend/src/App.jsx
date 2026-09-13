import {BrowserRouter, Navigate, Route, Routes} from "react-router";
import AuthenticationPage from "./pages/AuthenticationPage.jsx";
import HomePage from "./pages/HomePage.jsx";
import {useAuth} from "./context/AuthContext.jsx";
import {useSocket} from "./context/SocketContext.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";

function App() {
    const {isAuthenticated} = useAuth()

    const {socket, isConnected} = useSocket()
    console.log(isConnected)

  return (
      <BrowserRouter>
        <Routes>
            <Route path="/" element={<HomePage/>}/>
            <Route path="/authentication"
                element={!isAuthenticated ? <AuthenticationPage/> : <Navigate to="/" replace/>}
            />
            <Route path="/profile"
                   element={<ProfilePage/>}
            />
        </Routes>
      </BrowserRouter>
      // <MainLayout>
      //   <GamePage></GamePage>
      //     <RegisterForm/>
      // </MainLayout>
  )

}

export default App