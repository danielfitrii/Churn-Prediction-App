import { createContext, useContext, useState, useEffect } from 'react';
import { loginUser } from '../firebaseHelpers';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("user");
    const storedTimestamp = localStorage.getItem("userTimestamp");
    
    // Check if the stored user data is still valid (24 hours)
    if (stored && storedTimestamp) {
      const timestamp = parseInt(storedTimestamp);
      const now = new Date().getTime();
      if (now - timestamp < 24 * 60 * 60 * 1000) {
        return JSON.parse(stored);
      }
    }
    
    // Clear invalid or expired data
    localStorage.removeItem("user");
    localStorage.removeItem("userTimestamp");
    return null;
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Auto-logout after 24 hours of inactivity
  useEffect(() => {
    if (user) {
      const checkSession = () => {
        const storedTimestamp = localStorage.getItem("userTimestamp");
        if (storedTimestamp) {
          const timestamp = parseInt(storedTimestamp);
          const now = new Date().getTime();
          if (now - timestamp > 24 * 60 * 60 * 1000) {
            logout();
          }
        }
      };

      const interval = setInterval(checkSession, 60000); // Check every minute
      return () => clearInterval(interval);
    }
  }, [user]);

  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const userData = await loginUser(email, password);
      if (userData) {
        setUser(userData);
        localStorage.setItem("user", JSON.stringify(userData));
        localStorage.setItem("userTimestamp", new Date().getTime().toString());
        return true;
      } else {
        setError("Invalid email or password");
        return false;
      }
    } catch (error) {
      console.error("Login error:", error);
      setError("An error occurred during login");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
    localStorage.removeItem("userTimestamp");
  };

  const updateUserProfile = (updates) => {
    if (user) {
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));
      return true;
    }
    return false;
  };

  const isAuthenticated = () => {
    return !!user;
  };

  const hasRole = (role) => {
    return user?.role === role;
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        login, 
        logout, 
        loading, 
        error,
        updateUserProfile,
        isAuthenticated,
        hasRole
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
