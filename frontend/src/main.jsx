import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import "./index.css"
import App from './App.jsx'
import AuthProvider from "./context/AuthContext.jsx";
import SocketProvider from "./context/SocketContext.jsx";
import ChessProvider from "./context/ChessContext.jsx";
import NotificationProvider from "./context/NotificationContext.jsx";


createRoot(document.getElementById('root')).render(
  <StrictMode>
      <AuthProvider>
          <SocketProvider>
              <NotificationProvider>
                  <ChessProvider>
                      <App />
                  </ChessProvider>
              </NotificationProvider>
          </SocketProvider>
      </AuthProvider>
  </StrictMode>,
)
