import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import AdopterHomePage from "./pages/AdopterHomePage";
import OwnerHomePage from "./pages/OwnerHomePage";
import AdoptionRequestPage from "./pages/AdoptionRequestPage";
import AboutUsPage from "./pages/AboutUsPage";
import GuestAdoptPage from "./pages/GuestAdoptPage";
import SavedAnimalsPage from "./pages/SavedAnimalsPage";
import AdopterMessagesPage from "./pages/AdopterMessagesPage";
import OwnerMessagesPage from "./pages/OwnerMessagesPage";
import OwnerManageRequestsPage from "./pages/OwnerManageRequestsPage";
import AnimalDetailPage from "./pages/AnimalDetailPage";
import RegisterAnimalPage from "./pages/RegisterAnimalPage";
import CompatibleAnimalsPage from "./pages/CompatibleAnimalsPage";
import MatchResultsPage from "./pages/MatchResultsPage";
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/matches" element={<MatchResultsPage />} />
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/adopter-home" element={<AdopterHomePage />} />
        <Route path="/owner-home" element={<OwnerHomePage />} />
        <Route path="/adoption-request" element={<AdoptionRequestPage />} />
        <Route path="/about" element={<AboutUsPage />} />
        <Route path="/adopt" element={<GuestAdoptPage />} />
        <Route path="/saved-animals" element={<SavedAnimalsPage />} />
        <Route path="/adopter-messages" element={<AdopterMessagesPage />} />
        <Route path="/owner-messages" element={<OwnerMessagesPage />} />
        <Route path="/owner-requests" element={<OwnerManageRequestsPage />} />
        <Route path="/animal/:id" element={<AnimalDetailPage />} />
        <Route path="/register-animal" element={<RegisterAnimalPage />} />
        <Route path="/compatible-animals" element={<CompatibleAnimalsPage />} />
      </Routes>
    </Router>
  );
}
export default App;