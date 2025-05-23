import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { useLocation, Link } from 'react-router-dom';

const Header = ({ isExpanded }) => {
  const { user } = useAuth();
  const { settings } = useSettings();
  const location = useLocation();

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/':
        return 'Dashboard';
      case '/predict':
        return 'Churn Prediction';
      case '/explanation':
        return 'Model Explanation';
      case '/settings':
        return 'Settings';
      case '/profile/edit':
        return 'Profile Settings';
      default:
        return user?.role === 'admin' ? 'Admin Dashboard' : 'User Dashboard';
    }
  };

  return (
    <header className={`fixed top-0 right-0 transition-all duration-300 ease-in-out h-16 ${
      settings.darkMode ? 'bg-gray-800' : 'bg-white'
    } shadow-sm z-40`} style={{ left: isExpanded ? '16rem' : '5rem' }}>
      <div className="h-full px-4 flex items-center justify-between">
        <div className="flex items-center">
          <h1 className={`text-xl font-semibold ${settings.darkMode ? 'text-white' : 'text-gray-800'}`}>
            {getPageTitle()}
          </h1>
        </div>

        <div className="flex items-center space-x-4">
          <Link
            to="/profile/edit"
            className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
              settings.darkMode 
                ? 'bg-gray-700 hover:bg-gray-600' 
                : 'bg-gray-50 hover:bg-gray-100'
            }`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              settings.darkMode ? 'bg-gray-600' : 'bg-gray-200'
            }`}>
              {user?.profilePicture ? (
                <img 
                  src={user.profilePicture} 
                  alt="Profile" 
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <span className={`text-sm font-medium ${settings.darkMode ? 'text-white' : 'text-gray-600'}`}>
                  {user?.email?.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div className="hidden md:block">
              <p className={`text-sm font-medium ${settings.darkMode ? 'text-white' : 'text-gray-800'}`}>
                {user?.firstName} {user?.lastName}
              </p>
              <p className={`text-xs ${settings.darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {user?.email}
              </p>
            </div>
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Header; 