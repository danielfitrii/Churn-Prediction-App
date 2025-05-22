import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';

const Sidebar = ({ isExpanded, setIsExpanded }) => {
  const { user, logout } = useAuth();
  const { settings } = useSettings();
  const location = useLocation();

  const menuItems = [
    { path: '/', label: 'Dashboard', icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    )},
    { path: '/predict', label: 'Prediction', icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    )},
    { path: '/explanation', label: 'Model Explanation', icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    )},
    { path: '/settings', label: 'Settings', icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    )},
  ];

  return (
    <div
      className={`sidebar fixed left-0 top-0 h-full transition-all duration-300 ease-in-out ${
        isExpanded ? 'w-64' : 'w-20'
      } ${settings.darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg z-50`}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      <div className="flex flex-col h-full">
        {/* Logo/Brand */}
        <div className={`p-4 ${settings.darkMode ? 'border-gray-700' : 'border-gray-200'} border-b`}>
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            {isExpanded && (
              <span className={`text-xl font-bold ${settings.darkMode ? 'text-white' : 'text-gray-800'}`}>
                Churn Predict
              </span>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-2 px-2">
            {menuItems.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    location.pathname === item.path
                      ? settings.darkMode
                        ? 'bg-gray-700 text-white'
                        : 'bg-blue-50 text-blue-600'
                      : settings.darkMode
                        ? 'text-gray-300 hover:bg-gray-700 hover:text-white'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-blue-600'
                  }`}
                >
                  <span className="flex-shrink-0">{item.icon}</span>
                  {isExpanded && <span>{item.label}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* User Section */}
        <div className={`p-4 ${settings.darkMode ? 'border-gray-700' : 'border-gray-200'} border-t`}>
          <Link
            to="/profile/edit"
            className={`flex items-center space-x-3 group transition-colors rounded-lg px-2 py-2 ${
              location.pathname === '/profile/edit'
                ? settings.darkMode
                  ? 'bg-gray-700 text-white'
                  : 'bg-gray-50 text-blue-600'
                : settings.darkMode
                  ? 'text-gray-300 hover:text-white'
                  : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex-shrink-0">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${
                settings.darkMode
                  ? 'bg-gray-700 group-hover:bg-gray-600 border border-gray-600'
                  : 'bg-gray-200 group-hover:bg-gray-300 border border-gray-300'
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
            </div>
            {isExpanded && (
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium truncate ${settings.darkMode ? 'text-white' : 'text-gray-800'}`}>
                  {user?.email}
                </p>
                <p className={`text-xs truncate ${settings.darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {user?.role}
                </p>
              </div>
            )}
          </Link>
          {isExpanded && (
            <button
              onClick={logout}
              className={`mt-4 w-full flex items-center space-x-3 px-4 py-2 rounded-lg transition-colors ${
                settings.darkMode
                  ? 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-red-600'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Logout</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar; 