import {BrowserRouter, Navigate, Route, Routes} from "react-router";
import AuthenticationPage from "./pages/AuthenticationPage.jsx";
import HomePage from "./pages/HomePage.jsx";
import {useAuth} from "./context/AuthContext.jsx";
import {useSocket} from "./context/SocketContext.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";
import ActivationPage from "./pages/ActivationPage.jsx";
import PageNotFound from "./pages/PageNotFound.jsx";
import GamePage from "./pages/GamePage.jsx";

function App() {
    const {isAuthenticated} = useAuth()

    const {socket} = useSocket()
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
            <Route path="/game/:gameRoomID"
                   element={isAuthenticated ? <GamePage/> : <Navigate to="/" replace />}
            />
            <Route path="*"
                    element={<PageNotFound/>}
            />
        </Routes>
      </BrowserRouter>
  )
}

export default App