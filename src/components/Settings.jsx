import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { FiEdit2, FiSave, FiHelpCircle } from 'react-icons/fi';
import { Tooltip } from 'react-tooltip';
import { toast } from 'react-toastify';

const Settings = () => {
  const { user, updateUserProfile } = useAuth();
  const { settings, updateSettings } = useSettings();
  const [localSettings, setLocalSettings] = useState(settings);
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleSave = async () => {
    updateSettings(localSettings);
    // Persist emailUpdates to Firestore
    if (user) {
      await updateUserProfile({ emailUpdates: localSettings.emailUpdates });
    }
    if (localSettings.notificationType === 'builtin') {
      setSaveMessage('Settings saved successfully!');
    } else {
      setSaveMessage('');
    }
    if (localSettings.notificationType === 'toast') {
      toast.success('Settings saved successfully!');
    }
    setTimeout(() => setSaveMessage(''), 3000);
  };

  const handleKeyPress = (e, settingKey) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setLocalSettings(prev => ({ ...prev, [settingKey]: !prev[settingKey] }));
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      <div className="bg-white shadow rounded-lg p-8">
        <div className="space-y-6">
          {/* Notification Settings */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div>
                <h3 className="text-lg font-medium">Notification Style</h3>
                <p className="text-sm text-gray-500">Choose how you want to receive notifications for updates.</p>
              </div>
              <FiHelpCircle 
                className="text-gray-400 cursor-help"
                data-tooltip-id="notifications-tooltip"
                data-tooltip-content="Choose between pop-out (toast) or built-in notifications. Only one style will be active."
              />
            </div>
            <select
              className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={localSettings.notificationType}
              onChange={e => setLocalSettings(prev => ({ ...prev, notificationType: e.target.value }))}
              aria-label="Select notification style"
            >
              <option value="none">None</option>
              <option value="builtin">Built-in</option>
              <option value="toast">Pop-out (Toast)</option>
            </select>
          </div>

          {/* Dark Mode */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div>
                <h3 className="text-lg font-medium">Enable Dark Mode</h3>
                <p className="text-sm text-gray-500">Switch between light and dark theme.</p>
              </div>
              <FiHelpCircle 
                className="text-gray-400 cursor-help"
                data-tooltip-id="darkmode-tooltip"
                data-tooltip-content="Apply a darker color scheme to the interface."
              />
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={localSettings.darkMode}
                onChange={(e) => setLocalSettings(prev => ({ ...prev, darkMode: e.target.checked }))}
                onKeyPress={(e) => handleKeyPress(e, 'darkMode')}
                aria-label="Toggle dark mode"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Email Updates */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div>
                <h3 className="text-lg font-medium">Enable Email Updates</h3>
                <p className="text-sm text-gray-500">Receive email notifications for important updates.</p>
              </div>
              <FiHelpCircle 
                className="text-gray-400 cursor-help"
                data-tooltip-id="email-tooltip"
                data-tooltip-content="Receive news and important information via email."
              />
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={localSettings.emailUpdates}
                onChange={(e) => setLocalSettings(prev => ({ ...prev, emailUpdates: e.target.checked }))}
                onKeyPress={(e) => handleKeyPress(e, 'emailUpdates')}
                aria-label="Toggle email updates"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Save Message */}
          {saveMessage && (
            <div className="text-green-600 text-sm font-medium">{saveMessage}</div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4">
            {user && (
              <a
                href="/profile/edit"
                className="px-4 py-2 text-sm font-medium text-white bg-yellow-500 hover:bg-yellow-600 rounded-md flex items-center space-x-2 transition-colors"
              >
                <FiEdit2 className="w-4 h-4" />
                <span>Edit Profile</span>
              </a>
            )}
            <button
              onClick={handleSave}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md flex items-center space-x-2 transition-colors"
            >
              <FiSave className="w-4 h-4" />
              <span>Save Changes</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tooltips */}
      <Tooltip id="notifications-tooltip" />
      <Tooltip id="darkmode-tooltip" />
      <Tooltip id="email-tooltip" />
    </div>
  );
};

export default Settings;
