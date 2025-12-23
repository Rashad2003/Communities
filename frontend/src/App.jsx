import './App.css'
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Community from "./pages/Community";
import Group from "./pages/Group";
import Navbar from "./components/Navbar";
import ProtectedRoute from './components/ProtectedRoute';
import CreateGroup from "./pages/CreateGroup";
import RoleRoute from "./components/RoleRoute";


export const App = () => {
  return (
    <BrowserRouter>
      {/* <Navbar /> */}
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/community" element={<ProtectedRoute><Community /></ProtectedRoute>} />
        <Route path="/group/:id" element={<ProtectedRoute><Group /></ProtectedRoute>} />
        <Route
  path="/create-group"
  element={
    <ProtectedRoute>
      <RoleRoute>
          <CreateGroup />
      </RoleRoute>
    </ProtectedRoute>
  }
/>
      </Routes>
    </BrowserRouter>
  )
}

