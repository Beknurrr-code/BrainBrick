import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import ErrorBoundary from "./components/ErrorBoundary";
import HomePage from "./pages/HomePage";
import BuilderPage from "./pages/BuilderPage";
import DashPage from "./pages/DashPage";
import AcademyPage from "./pages/AcademyPage";
import SocialPage from "./pages/SocialPage";
import ProfilePage from "./pages/ProfilePage";
import LoginPage from "./pages/LoginPage";
import BillingPage from "./pages/BillingPage";
import AdminPage from "./pages/AdminPage";
import ObservatoryPage from "./pages/ObservatoryPage";
import PhonePage from "./pages/PhonePage";

function AppRoutes() {
  const { isAuth } = useAuth();

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={!isAuth ? <LoginPage /> : <Navigate to="/dashboard" />} />
        <Route path="/phone" element={<PhonePage />} />
        <Route path="/observatory" element={<ObservatoryPage />} />

        {/* Protected Routes with Navbar */}
        <Route path="/builder" element={isAuth ? <><Navbar /><BuilderPage /></> : <Navigate to="/login" />} />
        <Route path="/dashboard" element={isAuth ? <><Navbar /><DashPage /></> : <Navigate to="/login" />} />
        <Route path="/academy" element={isAuth ? <><Navbar /><AcademyPage /></> : <Navigate to="/login" />} />
        <Route path="/social" element={isAuth ? <><Navbar /><SocialPage /></> : <Navigate to="/login" />} />
        <Route path="/profile" element={isAuth ? <><Navbar /><ProfilePage /></> : <Navigate to="/login" />} />
        <Route path="/billing" element={isAuth ? <><Navbar /><BillingPage /></> : <Navigate to="/login" />} />
        <Route path="/admin" element={isAuth ? <><Navbar /><AdminPage /></> : <Navigate to="/login" />} />

        <Route path="/editor" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

function App() {
  useEffect(() => {
    // Hidden Console Command for Z.ai Activation
    (window as any).glm = () => {
      console.log("%c ⚡ Z.ai QUANTUM LINK ACTIVATED ", "background: #8b5cf6; color: white; font-weight: bold; padding: 4px 8px; border-radius: 4px;");
      console.log("%c Flagship Intelligence: Gemini Robotics ER 1.6 (Reasoning) ", "color: #a78bfa; font-weight: bold;");
      console.log("%c Multimodal Power: Gemini 3 Flash Live (Vision) ", "color: #a78bfa; font-style: italic;");
      
      const event = new CustomEvent('zai-activate');
      window.dispatchEvent(event);
      return "Z.ai Pro Stack Initialized.";
    };

    // Hidden Console Command for Gemini Live API
    (window as any).live = () => {
      console.log("%c 🎙️ GEMINI LIVE API CONNECTED ", "background: #ef4444; color: white; font-weight: bold; padding: 4px 8px; border-radius: 4px;");
      console.log("%c Real-time WebSocket established. ", "color: #fca5a5; font-style: italic;");
      
      const event = new CustomEvent('live-activate');
      window.dispatchEvent(event);
      return "Live Voice Streaming Active.";
    };
  }, []);

  return (
    <BrowserRouter>
      <AuthProvider>
        <ErrorBoundary>
          <AppRoutes />
        </ErrorBoundary>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
