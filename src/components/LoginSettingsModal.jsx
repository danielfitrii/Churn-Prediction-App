import React, { useState, useEffect } from 'react';
import { useSettings } from '../context/SettingsContext';

const LoginSettingsModal = ({ showModal, onClose }) => {
  const { settings, updateSettings } = useSettings();
  const [localSettings, setLocalSettings] = useState(settings);
  const [saveMessage, setSaveMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleSave = () => {
    setIsSaving(true);
    updateSettings(localSettings);
    setSaveMessage('Settings saved successfully!');
    setTimeout(() => {
      setSaveMessage('');
      setIsSaving(false);
      onClose();
    }, 3000);
  };

  if (!showModal) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-600 bg-opacity-50 flex justify-center items-center">
      <div className={`relative p-8 rounded-lg shadow-lg ${settings.darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} w-full max-w-md max-h-full overflow-y-auto`}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">Settings</h3>
          <button
            type="button"
            className={`text-gray-400 hover:text-gray-500 ${settings.darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} rounded-md p-1`}
            onClick={onClose}
          >
            <span className="sr-only">Close settings</span>
            <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
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
            <button
              onClick={handleSave}
              disabled={isSaving}
              className={`px-4 py-2 text-sm font-medium rounded-md text-white ${isSaving ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
            >
              {isSaving ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </span>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginSettingsModal; 