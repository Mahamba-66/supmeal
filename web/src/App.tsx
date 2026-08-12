import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import Cookbooks from "./pages/Cookbooks";
import CookbookDetailPage from "./pages/CookbookDetail";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
        <Route path="/cookbooks" element={<ProtectedRoute><Cookbooks /></ProtectedRoute>} />
        <Route path="/cookbooks/:cookbookId" element={<ProtectedRoute><CookbookDetailPage /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
