import {BrowserRouter, Navigate, Route, Routes} from "react-router";
import AuthenticationPage from "./pages/AuthenticationPage.jsx";
import HomePage from "./pages/HomePage.jsx";
import {useAuth} from "./context/AuthContext.jsx";
import {useSocket} from "./context/SocketContext.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";
import ActivationPage from "./pages/ActivationPage.jsx";

function App() {
    const {isAuthenticated} = useAuth()

    const {socket, isConnected} = useSocket()
    console.log(socket)

  return (
      <BrowserRouter>
        <Routes>
            <Route path="/" element={<HomePage/>}/>
            <Route path="/authentication"
                element={!isAuthenticated ? <AuthenticationPage/> : <Navigate to="/" replace/>}
            />
            <Route path="/profile"
                   element={isAuthenticated ? <ProfilePage/> : <Navigate to="/" replace />}
            />
            <Route path="/activation/:token"
                   element={<ActivationPage/>}
            />
        </Routes>
      </BrowserRouter>
  )
}

export default App