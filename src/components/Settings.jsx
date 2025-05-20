import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';

const Settings = () => {
  const { user } = useAuth(); // Removed logout since it's unused now
  const { settings, updateSettings } = useSettings();
  const [localSettings, setLocalSettings] = useState(settings);
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleSave = () => {
    updateSettings(localSettings);
    setSaveMessage('Settings saved successfully!');
    setTimeout(() => setSaveMessage(''), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      <div className="bg-white shadow rounded-lg p-6">
        <div className="space-y-6">
          {/* Notification Settings */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium">Notifications</h3>
              <p className="text-sm text-gray-500">Receive in-app notifications</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={localSettings.notifications}
                onChange={(e) => setLocalSettings(prev => ({ ...prev, notifications: e.target.checked }))}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Dark Mode */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium">Dark Mode</h3>
              <p className="text-sm text-gray-500">Toggle dark mode theme</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={localSettings.darkMode}
                onChange={(e) => setLocalSettings(prev => ({ ...prev, darkMode: e.target.checked }))}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Email Updates */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium">Email Updates</h3>
              <p className="text-sm text-gray-500">Receive email notifications</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={localSettings.emailUpdates}
                onChange={(e) => setLocalSettings(prev => ({ ...prev, emailUpdates: e.target.checked }))}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Save Message */}
          {saveMessage && (
            <div className="text-green-600 text-sm">{saveMessage}</div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4">
            {user && (
              <a
                href="/profile/edit"
                className="px-4 py-2 text-sm font-medium text-white bg-yellow-500 hover:bg-yellow-600 rounded-md"
              >
                Edit Profile
              </a>
            )}
            <button
              onClick={handleSave}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
