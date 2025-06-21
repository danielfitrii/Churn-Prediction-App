import { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../firebaseConfig';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useAuth } from './AuthContext';

const SettingsContext = createContext(null);

export const SettingsProvider = ({ children }) => {
  const { user } = useAuth();
  const [settings, setSettings] = useState({
    notificationType: 'toast',
    darkMode: false,
    sessionTimeout: '60',
  });
  const [loading, setLoading] = useState(true);

  // Load settings from Firestore when user changes
  useEffect(() => {
    const fetchSettings = async () => {
      if (!user?.uid) {
        setSettings({ notificationType: 'toast', darkMode: false, sessionTimeout: '60' });
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const settingsRef = doc(db, 'users', user.uid, 'settings', 'preferences');
        const settingsSnap = await getDoc(settingsRef);
        if (settingsSnap.exists()) {
          setSettings(settingsSnap.data());
        } else {
          setSettings({ notificationType: 'toast', darkMode: false, sessionTimeout: '60' });
        }
      } catch (err) {
        setSettings({ notificationType: 'toast', darkMode: false, sessionTimeout: '60' });
      }
      setLoading(false);
    };
    fetchSettings();
  }, [user]);

  // Save settings to Firestore
  const updateSettings = async (newSettings) => {
    setSettings(prevSettings => ({ ...prevSettings, ...newSettings }));
    if (user?.uid) {
      const settingsRef = doc(db, 'users', user.uid, 'settings', 'preferences');
      await setDoc(settingsRef, { ...settings, ...newSettings }, { merge: true });
    }
  };

  useEffect(() => {
    // Apply dark mode class to document
    if (settings.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.darkMode]);

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, loading }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}; 