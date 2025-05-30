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
import { SettingsProvider } from './context/SettingsContext';
import EditProfile from './components/EditProfile';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import { registerUser } from './firebaseHelpers';
import { useState, useEffect } from 'react';

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

function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <Router>
          <Layout />
        </Router>
      </SettingsProvider>
    </AuthProvider>
  );
}

export default App;
