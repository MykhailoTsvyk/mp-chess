import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import "./index.css"
import App from './App.jsx'
import AuthProvider from "./context/AuthContext.jsx";
import SocketProvider from "./context/SocketContext.jsx";
import ChessProvider from "./context/ChessContext.jsx";


createRoot(document.getElementById('root')).render(
  <StrictMode>
      <AuthProvider>
          <SocketProvider>
              <ChessProvider>
                  <App />
              </ChessProvider>
          </SocketProvider>
      </AuthProvider>
  </StrictMode>,
)
