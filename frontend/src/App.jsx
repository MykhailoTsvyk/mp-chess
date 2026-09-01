import MainLayout from "./layout/MainLayout.jsx";
import GamePage from "./pages/GamePage.jsx";
import RegisterForm from "./features/authentication/RegisterForm.jsx";
import {BrowserRouter, Route, Routes} from "react-router";
import AuthenticationPage from "./pages/AuthenticationPage.jsx";
import HomePage from "./pages/HomePage.jsx";
import {createContext} from "react";


function App() {

  return (
      <BrowserRouter>
        <Routes>
            <Route path="/" element={<HomePage/>}/>
            <Route path={"/authentication"} element={<AuthenticationPage/>}/>
        </Routes>
      </BrowserRouter>
      // <MainLayout>
      //   <GamePage></GamePage>
      //     <RegisterForm/>
      // </MainLayout>
  )

}

export default App
