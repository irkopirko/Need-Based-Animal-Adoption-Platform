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
import AnimalOwnerRequestsPage from "./pages/AnimalOwnerRequestsPage";
import RegisterAnimalPage from "./pages/RegisterAnimalPage";
import OwnerListingsPage from "./pages/OwnerListingsPage";
import CompatibleAnimalsPage from "./pages/CompatibleAnimalsPage";
import AdopterMyRequestsPage from "./pages/AdopterMyRequestsPage";
import MatchResultsPage from "./pages/MatchResultsPage";
import Verify2FAPage from "./pages/Verify2FAPage";
import AccountProfilePage from "./pages/AccountProfilePage";
import CompleteAdopterProfilePage from "./pages/CompleteAdopterProfilePage";
import CompleteOwnerProfilePage from "./pages/CompleteOwnerProfilePage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import AdminHomePage from "./pages/AdminHomePage";
import ChangePasswordPage from "./pages/ChangePasswordPage";
import { PopupProvider } from "./components/PopupProvider";


function App() {
  return (
    <PopupProvider>
      <Router>
        <Routes>
          <Route path="/matches" element={<MatchResultsPage />} />
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/verify-email" element={<Verify2FAPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password/new" element={<ResetPasswordPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/account" element={<AccountProfilePage />} />
          <Route path="/account/change-password" element={<ChangePasswordPage />} />
          <Route path="/adopterhomepage" element={<AdopterHomePage />} />
          <Route path="/ownerhomepage" element={<OwnerHomePage />} />
          <Route path="/adminhomepage" element={<AdminHomePage />} />
          <Route path="/complete-adopter-profile" element={<CompleteAdopterProfilePage />} />
          <Route path="/complete-owner-profile" element={<CompleteOwnerProfilePage />} />
          <Route path="/adoption-request" element={<AdoptionRequestPage />} />
          <Route path="/about" element={<AboutUsPage />} />
          <Route path="/adopt" element={<GuestAdoptPage />} />
          <Route path="/saved-animals" element={<SavedAnimalsPage />} />
          <Route path="/adopter-messages" element={<AdopterMessagesPage />} />
          <Route path="/owner-messages" element={<OwnerMessagesPage />} />
          <Route path="/owner-requests" element={<OwnerManageRequestsPage />} />
          <Route path="/animal/:animalId/requests" element={<AnimalOwnerRequestsPage />} />
          <Route path="/animal/:id" element={<AnimalDetailPage />} />
          <Route path="/register-animal" element={<RegisterAnimalPage />} />
          <Route path="/owner-listings" element={<OwnerListingsPage />} />
          <Route path="/compatible-animals" element={<CompatibleAnimalsPage />} />
          <Route path="/my-adoption-requests" element={<AdopterMyRequestsPage />} />
        </Routes>
      </Router>
    </PopupProvider>
  );
}
export default App;