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
import AdopterAdoptionsPage from "./pages/AdopterAdoptionsPage";
import OwnerAdoptionsPage from "./pages/OwnerAdoptionsPage";
import ChangePasswordPage from "./pages/ChangePasswordPage";
import ProtectedRoute from "./components/ProtectedRoute";
import { PopupProvider } from "./components/PopupProvider";

function App() {
  return (
    <PopupProvider>
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/verify-email" element={<Verify2FAPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password/new" element={<ResetPasswordPage />} />
          <Route path="/about" element={<AboutUsPage />} />
          <Route path="/adopt" element={<GuestAdoptPage />} />
          <Route path="/matches" element={<MatchResultsPage />} />

          <Route
            path="/account"
            element={
              <ProtectedRoute>
                <AccountProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/account/change-password"
            element={
              <ProtectedRoute>
                <ChangePasswordPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/adopterhomepage"
            element={
              <ProtectedRoute roles={["ADOPTER"]}>
                <AdopterHomePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/complete-adopter-profile"
            element={
              <ProtectedRoute roles={["ADOPTER"]}>
                <CompleteAdopterProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/adoption-request"
            element={
              <ProtectedRoute roles={["ADOPTER"]}>
                <AdoptionRequestPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/saved-animals"
            element={
              <ProtectedRoute roles={["ADOPTER"]}>
                <SavedAnimalsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/adopter-messages"
            element={
              <ProtectedRoute roles={["ADOPTER"]}>
                <AdopterMessagesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/compatible-animals"
            element={
              <ProtectedRoute roles={["ADOPTER"]}>
                <CompatibleAnimalsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-adoption-requests"
            element={
              <ProtectedRoute roles={["ADOPTER"]}>
                <AdopterMyRequestsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-adoptions"
            element={
              <ProtectedRoute roles={["ADOPTER"]}>
                <AdopterAdoptionsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/ownerhomepage"
            element={
              <ProtectedRoute roles={["OWNER"]}>
                <OwnerHomePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/complete-owner-profile"
            element={
              <ProtectedRoute roles={["OWNER"]}>
                <CompleteOwnerProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/owner-messages"
            element={
              <ProtectedRoute roles={["OWNER"]}>
                <OwnerMessagesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/owner-requests"
            element={
              <ProtectedRoute roles={["OWNER"]}>
                <OwnerManageRequestsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/animal/:animalId/requests"
            element={
              <ProtectedRoute roles={["OWNER"]}>
                <AnimalOwnerRequestsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/register-animal"
            element={
              <ProtectedRoute roles={["OWNER"]}>
                <RegisterAnimalPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/owner-listings"
            element={
              <ProtectedRoute roles={["OWNER"]}>
                <OwnerListingsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/owner-adoptions"
            element={
              <ProtectedRoute roles={["OWNER"]}>
                <OwnerAdoptionsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/adminhomepage"
            element={
              <ProtectedRoute roles={["ADMIN"]} requireAdminEmail>
                <AdminHomePage />
              </ProtectedRoute>
            }
          />

          <Route path="/animal/:id" element={<AnimalDetailPage />} />
        </Routes>
      </Router>
    </PopupProvider>
  );
}

export default App;
