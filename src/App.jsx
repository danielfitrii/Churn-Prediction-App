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

const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" />;
  }
  return children;
};

function FirestoreTestButton() {
  const handleTest = async () => {
    try {
      const userId = await registerUser('testuser@example.com', 'testpassword123');
      alert('User created with ID: ' + userId);
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };
  return (
    <button onClick={handleTest} style={{marginBottom: 16, padding: '8px 16px', background: '#2563eb', color: 'white', borderRadius: 6}}>
      Test Firestore Register
    </button>
  );
}

const Layout = () => {
  const location = useLocation();
  const { user } = useAuth();
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
      <Sidebar />
      <Header />
      <main className="pt-16 transition-all duration-300 ease-in-out">
        <div className="p-6">
          {/* Firestore test button for development only */}
          <FirestoreTestButton />
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
            <Route path="/settings" element={<Settings />} />
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