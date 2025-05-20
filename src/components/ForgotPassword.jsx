import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSettings } from '../context/SettingsContext';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(false);
  const { settings } = useSettings();

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ type: '', message: '' });

    if (!email) {
      setStatus({ type: 'error', message: 'Email is required.' });
      return;
    }

    if (!validateEmail(email)) {
      setStatus({ type: 'error', message: 'Please enter a valid email address.' });
      return;
    }

    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check if email exists in our system
      const validEmails = ["admin@example.com", "user@example.com"];
      if (validEmails.includes(email)) {
        setStatus({
          type: 'success',
          message: 'Password reset instructions have been sent to your email.'
        });
        setEmail('');
      } else {
        setStatus({
          type: 'error',
          message: 'No account found with this email address.'
        });
      }
    } catch (error) {
      setStatus({
        type: 'error',
        message: 'An error occurred. Please try again later.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 ${settings.darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className={`mt-6 text-center text-3xl font-extrabold ${settings.darkMode ? 'text-white' : 'text-gray-900'}`}>
            Reset your password
          </h2>
          <p className={`mt-2 text-center text-sm ${settings.darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Enter your email address and we'll send you instructions to reset your password.
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {status.message && (
            <div className={`rounded-md p-4 ${
              status.type === 'error' 
                ? 'bg-red-100 border border-red-400 text-red-700' 
                : 'bg-green-100 border border-green-400 text-green-700'
            }`} role="alert">
              <span className="block sm:inline">{status.message}</span>
            </div>
          )}

          <div>
            <label htmlFor="email" className="sr-only">Email address</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className={`appearance-none rounded-md relative block w-full px-3 py-2 border ${
                settings.darkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-gray-900'
              } placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm`}
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white ${
                loading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Sending...
                </span>
              ) : (
                'Send Reset Instructions'
              )}
            </button>
          </div>

          <div className="text-center">
            <Link 
              to="/login" 
              className={`font-medium text-blue-600 hover:text-blue-500 ${settings.darkMode ? 'text-blue-400 hover:text-blue-300' : ''}`}
            >
              Back to login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword; 