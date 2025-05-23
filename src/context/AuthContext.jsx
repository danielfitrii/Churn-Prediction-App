import { createContext, useContext, useState, useEffect } from 'react';
import { loginUser } from '../firebaseHelpers';
import firebaseApp from '../firebaseConfig';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const AuthContext = createContext(null);

const db = getFirestore(firebaseApp);
const auth = getAuth(firebaseApp);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("user");
    const storedTimestamp = localStorage.getItem("userTimestamp");

    // Check if the stored user data is still valid (24 hours)
    if (stored && storedTimestamp) {
      const timestamp = parseInt(storedTimestamp);
      const now = new Date().getTime();
      if (now - timestamp < 24 * 60 * 60 * 1000) {
        // Return stored user for quick initial load
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

  // Effect to fetch latest user data from Firestore after initial load or user change
  useEffect(() => {
    if (user?.uid) {
      const fetchLatestUserData = async () => {
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
            const latestUserData = { uid: user.uid, email: user.email, ...userDocSnap.data() };
            // Only update state and local storage if data is different to avoid unnecessary re-renders
            if (JSON.stringify(user) !== JSON.stringify(latestUserData)) {
                 setUser(latestUserData);
                 localStorage.setItem("user", JSON.stringify(latestUserData));
                 localStorage.setItem("userTimestamp", new Date().getTime().toString()); // Update timestamp as well
            }
          } else {
             // If Firestore doc doesn't exist, clear local storage (shouldn't happen with current logic)
             console.warn("User document not found in Firestore for UID:", user.uid);
             logout(); // Log out user if their Firestore document is missing
          }
        } catch (error) {
          console.error("Error fetching latest user data from Firestore:", error);
          // Optionally, handle error display to user
        }
      };

      fetchLatestUserData();

      // No need to set up a real-time listener for this request, just fetch on mount/user change.
      // If real-time updates across tabs are needed, a snapshot listener would be better.

    }
  }, [user?.uid]); // Re-run effect if user UID changes (e.g., after login/logout)

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

  const updateUserProfile = async (updates) => {
    if (user) {
      try {
        console.log("Updates submitted:", updates);

        await setDoc(doc(db, 'users', user.uid), updates, { merge: true });

        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (!userDoc.exists()) throw new Error("User document not found");

        const freshUser = {
          uid: user.uid,
          email: user.email,
          ...userDoc.data()
        };

        console.log("Fresh user after Firestore update:", freshUser);

        setUser(freshUser);
        localStorage.setItem("user", JSON.stringify(freshUser));
        localStorage.setItem("userTimestamp", new Date().getTime().toString());

        console.log("Local storage now:", localStorage.getItem("user"));

        return true;
      } catch (error) {
        console.error("Error updating user profile in Firestore:", error);
        return false;
      }
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
