import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import AdopterHomePage from "./pages/AdopterHomePage";
import OwnerHomePage from "./pages/OwnerHomePage";
import AdoptionRequestPage from "./pages/AdoptionRequestPage";
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/adopter-home" element={<AdopterHomePage />} />
        <Route path="/owner-home" element={<OwnerHomePage />} />
        <Route path="/adoption-request" element={<AdoptionRequestPage />} />
      </Routes>
    </Router>
  );
}

export default App;