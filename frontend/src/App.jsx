import {BrowserRouter, Navigate, Route, Routes, useLocation} from "react-router";
import AuthenticationPage from "./pages/AuthenticationPage.jsx";
import HomePage from "./pages/HomePage.jsx";
import {useAuth} from "./context/AuthContext.jsx";
import {useSocket} from "./context/SocketContext.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";
import ActivationPage from "./pages/ActivationPage.jsx";
import PageNotFound from "./pages/PageNotFound.jsx";
import GamePage from "./pages/GamePage.jsx";

// logged-out users go to login; the page they wanted is kept so login can send them back
function ProtectedRoute({children}) {
    const {isAuthenticated} = useAuth()
    const location = useLocation()

    return isAuthenticated ? children : <Navigate to="/authentication" replace state={{from: location}}/>
}

// logged-in users leave the login page, back to the page they came from if there is one
function GuestRoute({children}) {
    const {isAuthenticated} = useAuth()
    const location = useLocation()

    return !isAuthenticated ? children : <Navigate to={location.state?.from?.pathname || "/"} replace/>
}

function App() {
    const {socket} = useSocket()
    console.log(socket)

  return (
      <BrowserRouter>
        <Routes>
            <Route path="/" element={<HomePage/>}/>
            <Route path="/authentication"
                element={<GuestRoute><AuthenticationPage/></GuestRoute>}
            />
            <Route path="/profile"
                   element={<ProtectedRoute><ProfilePage/></ProtectedRoute>}
            />
            <Route path="/profile/:userID"
                   element={<ProtectedRoute><ProfilePage/></ProtectedRoute>}
            />
            <Route path="/activation/:token"
                   element={<ActivationPage/>}
            />
            <Route path="/game/:gameID"
                   element={<ProtectedRoute><GamePage/></ProtectedRoute>}
            />
            <Route path="*"
                    element={<PageNotFound/>}
            />
        </Routes>
      </BrowserRouter>
  )
}

export default App