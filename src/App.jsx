import './App.css';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import ChurnPredictionApp from './ChurnPredictionApp';
import ChurnDashboard from './ChurnDashboard';
import ModelExplanation from './ModelExplanation';
import Login from './components/Login';
import Register from './components/Register';
import Settings from './components/Settings';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SettingsProvider, useSettings } from './context/SettingsContext';
import EditProfile from './components/EditProfile';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import { registerUser } from './firebaseHelpers';
import { useState, useEffect } from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { toast } from 'react-toastify';

const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" />;
  }
  return children;
};

const Layout = () => {
  const location = useLocation();
  const { user } = useAuth();
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);

  const isAuthPage = location.pathname === "/login" || location.pathname === "/register" || location.pathname === "/forgot-password" || location.pathname === "/reset-password";

  if (isAuthPage) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4 bg-gray-50">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
        </Routes>
      </main>
    );
  }

  return (
    <div className="min-h-screen">
      <Sidebar isExpanded={isSidebarExpanded} setIsExpanded={setIsSidebarExpanded} />
      <Header isExpanded={isSidebarExpanded} />
      <main className="pt-16 transition-all duration-300 ease-in-out" style={{ marginLeft: isSidebarExpanded ? '16rem' : '5rem' }}>
        <div className="p-6">
          <Routes>
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <ChurnDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/predict"
              element={
                <ProtectedRoute>
                  <ChurnPredictionApp />
                </ProtectedRoute>
              }
            />
            <Route
              path="/explanation"
              element={
                <ProtectedRoute>
                  <ModelExplanation />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile/edit"
              element={
                <ProtectedRoute>
                  <EditProfile />
                </ProtectedRoute>
              }
            />
          </Routes>
        </div>
      </main>
    </div>
  );
};

// Add SessionManager component for session timeout logic
function SessionManager() {
  const { user, logout } = useAuth();
  const { settings } = useSettings();
  useEffect(() => {
    if (!user) return;
    let timeoutId;
    let lastActivity = Date.now();
    let timeoutMinutes = 60;
    if (settings.sessionTimeout && settings.sessionTimeout !== 'never') {
      timeoutMinutes = parseInt(settings.sessionTimeout, 10);
    }
    const timeoutMs = settings.sessionTimeout === 'never' ? null : timeoutMinutes * 60 * 1000;
    const resetTimer = () => {
      lastActivity = Date.now();
      if (timeoutId) clearTimeout(timeoutId);
      if (timeoutMs) {
        timeoutId = setTimeout(() => {
          logout();
          toast.info('You have been logged out due to inactivity.');
        }, timeoutMs);
      }
    };
    const activityEvents = ['mousemove', 'keydown', 'mousedown', 'touchstart'];
    activityEvents.forEach(event => window.addEventListener(event, resetTimer));
    resetTimer();
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      activityEvents.forEach(event => window.removeEventListener(event, resetTimer));
    };
  }, [user, settings.sessionTimeout, logout]);
  return null;
}

function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <SessionManager />
        <Router>
          <Layout />
          <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop closeOnClick pauseOnFocusLoss draggable pauseOnHover />
        </Router>
      </SettingsProvider>
    </AuthProvider>
  );
}

export default App;
