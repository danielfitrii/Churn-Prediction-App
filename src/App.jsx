import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import ChurnPredictionApp from './pages/ChurnPredictionApp';
import ChurnDashboard from './pages/ChurnDashboard';
import ModelExplanation from './pages/ModelExplanation';
import Login from './components/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import Settings from './components/Settings';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SettingsProvider, useSettings } from './context/SettingsContext';
import EditProfile from './components/EditProfile';
import { useEffect, useState } from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { toast } from 'react-toastify';
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';

const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" />;
  }
  return children;
};

const Layout = () => {
  const location = useLocation();
  // Normalize trailing slashes so `/register/` still counts as `/register`.
  const normalizedPath =
    location.pathname === '/' ? '/' : location.pathname.replace(/\/+$/, '');
  const isAuthPage = ['/login', '/register', '/forgot-password', '/reset-password'].includes(normalizedPath);
  const [isExpanded, setIsExpanded] = useState(false);

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
      <Sidebar isExpanded={isExpanded} setIsExpanded={setIsExpanded} />
      <Header isExpanded={isExpanded} />

      <main
        className="pt-16 px-4 transition-all duration-300 ease-in-out"
        style={{ marginLeft: isExpanded ? '16rem' : '5rem' }}
      >
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
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
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
    let timeoutMinutes = 60;
    if (settings.sessionTimeout && settings.sessionTimeout !== 'never') {
      timeoutMinutes = parseInt(settings.sessionTimeout, 10);
    }
    const timeoutMs = settings.sessionTimeout === 'never' ? null : timeoutMinutes * 60 * 1000;
    const resetTimer = () => {
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
