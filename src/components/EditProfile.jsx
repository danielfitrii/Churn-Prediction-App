import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { getAuth, reauthenticateWithCredential, EmailAuthProvider, updatePassword as firebaseUpdatePassword } from 'firebase/auth';
import { Tooltip } from 'react-tooltip';
import { FiHelpCircle } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { db } from '../firebaseConfig';
import { collection, query, where, getDocs } from 'firebase/firestore';

const EditProfile = () => {
  const { user, updateUserProfile } = useAuth();
  const { settings } = useSettings();
  const fileInputRef = useRef(null);
  const [isPasswordSectionOpen, setIsPasswordSectionOpen] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [showToast, setShowToast] = useState(false);

  const [formData, setFormData] = useState({
    email: user?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phone: user?.phone || ''
  });

  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState(user?.profilePicture || null);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    // Check if form data has changed from initial values
    const hasFormChanges = 
      formData.firstName !== user?.firstName ||
      formData.lastName !== user?.lastName ||
      formData.phone !== user?.phone ||
      formData.newPassword !== '' ||
      formData.currentPassword !== '' ||
      formData.confirmPassword !== '' ||
      previewImage !== user?.profilePicture;

    setHasChanges(hasFormChanges);
  }, [formData, previewImage, user]);

  useEffect(() => {
    // Calculate password strength
    if (formData.newPassword) {
      let strength = 0;
      if (formData.newPassword.length >= 8) strength += 1;
      if (/[A-Z]/.test(formData.newPassword)) strength += 1;
      if (/[0-9]/.test(formData.newPassword)) strength += 1;
      if (/[^A-Za-z0-9]/.test(formData.newPassword)) strength += 1;
      setPasswordStrength(strength);
    } else {
      setPasswordStrength(0);
    }
  }, [formData.newPassword]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (formData.newPassword) {
      if (formData.newPassword.length < 8) {
        newErrors.newPassword = 'Password must be at least 8 characters long';
      }
      if (formData.newPassword !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    if (formData.phone && !/^\+?[\d\s-]{10,}$/.test(formData.phone)) {
      newErrors.phone = 'Invalid phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setSuccess('');

    if (!validateForm()) return;

    setLoading(true);
    const auth = getAuth();
    const currentUser = auth.currentUser;

    if (!currentUser) {
      setErrors({ submit: 'No authenticated user found.' });
      setLoading(false);
      return;
    }

    try {
      // Update general profile information if changed (excluding passwords)
      const profileUpdates = { ...formData };
      delete profileUpdates.currentPassword;
      delete profileUpdates.newPassword;
      delete profileUpdates.confirmPassword;
      profileUpdates.profilePicture = previewImage; // Include profile picture

      await updateUserProfile(profileUpdates);

      // Handle password change separately if new password is provided
      if (formData.newPassword && formData.currentPassword) {
        const credential = EmailAuthProvider.credential(currentUser.email, formData.currentPassword);
        await reauthenticateWithCredential(currentUser, credential);

        await firebaseUpdatePassword(currentUser, formData.newPassword);
        if (settings.notificationType === 'toast') {
          toast.success('Profile and password updated successfully!');
        } else if (settings.notificationType === 'builtin') {
          setSuccess('Profile and password updated successfully!');
        }
      } else if (formData.newPassword || formData.currentPassword) {
         setErrors({ passwordChange: 'Both current and new password are required to change password.' });
         setLoading(false);
         return;
      } else {
        if (settings.notificationType === 'toast') {
          toast.success('Profile updated successfully!');
        } else if (settings.notificationType === 'builtin') {
          setSuccess('Profile updated successfully!');
        }
      }

      // Clear password fields after successful update (or if no new password was attempted)
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));

      setHasChanges(false);

    } catch (error) {
      console.error('Error updating profile or password:', error);
      let errorMessage = 'Failed to update profile. Please try again.';

      if (error.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect current password. Please try again.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'New password is too weak. Please choose a stronger password.';
      } else if (error.code === 'auth/requires-recent-login') {
        errorMessage = 'Please log in again to update your password.';
      } else if (error.message) {
         errorMessage = error.message;
      }

      setErrors({ submit: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrengthColor = () => {
    switch (passwordStrength) {
      case 0: return 'bg-gray-200';
      case 1: return 'bg-red-500';
      case 2: return 'bg-yellow-500';
      case 3: return 'bg-blue-500';
      case 4: return 'bg-green-500';
      default: return 'bg-gray-200';
    }
  };

  return (
    <div className={`max-w-4xl mx-auto ${settings.darkMode ? 'text-gray-50' : 'text-gray-800'}`}>
      <div className={`${settings.darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg p-6`}>
        <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Profile Settings</h2>

        {showToast && (
          <div className="fixed bottom-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg">
            Changes saved successfully!
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-100 rounded-lg">
            {success}
          </div>
        )}

        {errors.submit && (
          <div className="mb-4 p-4 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-100 rounded-lg">
            {errors.submit}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Profile Picture Section */}
          <div className={`flex items-center space-x-6 p-4 ${settings.darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg`}>
            <div className="relative group">
              <div className={`w-24 h-24 rounded-full overflow-hidden ${settings.darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                {previewImage ? (
                  <img
                    src={previewImage}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-2xl font-medium">
                      {user?.email?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className={`absolute bottom-0 right-0 p-2 rounded-full bg-blue-600 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-blue-500 ${settings.darkMode ? 'bg-gray-600 hover:bg-gray-500' : 'bg-gray-200 hover:bg-gray-300'}`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageChange}
                accept="image/*"
                className="hidden"
              />
            </div>
            <div>
              <h3 className="text-lg font-medium">Profile Picture</h3>
              <p className={`text-sm ${settings.darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Upload a new profile picture. JPG, GIF or PNG. Max size of 2MB.
              </p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className={`mt-2 px-4 py-2 ${settings.darkMode ? 'bg-gray-600 hover:bg-gray-500' : 'bg-gray-200 hover:bg-gray-300'} rounded-lg transition-colors`}
              >
                Change Picture
              </button>
            </div>
          </div>

          {/* Personal Information */}
          <div className={`p-4 ${settings.darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg`}>
            <h3 className="text-lg font-medium mb-4">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">First Name</label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 rounded-lg border ${settings.darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Last Name</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 rounded-lg border ${settings.darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 flex items-center">
                  Email
                  <span className="ml-2 text-xs text-gray-500">(Contact support to change)</span>
                </label>
                <div className="relative">
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    disabled
                    className={`w-full px-3 py-2 rounded-lg border ${settings.darkMode ? 'bg-gray-700 border-gray-600 text-gray-400' : 'bg-gray-100 border-gray-300 text-gray-500'}`}
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Phone</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 rounded-lg border ${settings.darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                />
                {errors.phone && (
                  <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
                )}
              </div>
            </div>
          </div>

          {/* Password Change */}
          <div className={`p-4 ${settings.darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg`}>
            <button
              type="button"
              onClick={() => setIsPasswordSectionOpen(!isPasswordSectionOpen)}
              className="flex items-center justify-between w-full text-lg font-medium mb-4"
            >
              {/* Left side: Text and Tooltip Icon */}
              <span className="flex items-center space-x-2">
                <span>Change Password</span>
                <FiHelpCircle 
                  className="text-gray-400 dark:text-gray-500 cursor-help w-4 h-4"
                  data-tooltip-id="password-tooltip"
                  data-tooltip-content="Click to expand password change options"
                />
              </span>
              {/* Right side: Collapse Arrow */}
              <svg
                className={`w-5 h-5 transform transition-transform ${isPasswordSectionOpen ? 'rotate-180' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {isPasswordSectionOpen && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Current Password</label>
                    <div className="relative">
                      <input
                        type={showCurrentPassword ? "text" : "password"}
                        name="currentPassword"
                        value={formData.currentPassword}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 rounded-lg border ${settings.darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      >
                        {showCurrentPassword ? (
                          <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                          </svg>
                        ) : (
                          <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">New Password</label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? "text" : "password"}
                        name="newPassword"
                        value={formData.newPassword}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 rounded-lg border ${settings.darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
                        {showNewPassword ? (
                          <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                          </svg>
                        ) : (
                          <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                    </div>
                    {formData.newPassword && (
                      <div className="mt-2">
                        <div className="h-2 bg-gray-200 rounded-full">
                          <div
                            className={`h-2 rounded-full ${getPasswordStrengthColor()}`}
                            style={{ width: `${(passwordStrength / 4) * 100}%` }}
                          />
                        </div>
                        <p className="text-xs mt-1 text-gray-500">
                          {passwordStrength === 0 && 'Enter a password'}
                          {passwordStrength === 1 && 'Weak'}
                          {passwordStrength === 2 && 'Fair'}
                          {passwordStrength === 3 && 'Good'}
                          {passwordStrength === 4 && 'Strong'}
                        </p>
                      </div>
                    )}
                    {errors.newPassword && (
                      <p className="mt-1 text-sm text-red-600">{errors.newPassword}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Confirm New Password</label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 rounded-lg border ${settings.darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? (
                          <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                          </svg>
                        ) : (
                          <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                    </div>
                    {formData.confirmPassword && (
                      <p className={`mt-1 text-sm ${
                        formData.newPassword === formData.confirmPassword
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}>
                        {formData.newPassword === formData.confirmPassword
                          ? 'Passwords match'
                          : 'Passwords do not match'}
                      </p>
                    )}
                    {errors.confirmPassword && (
                      <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Are you sure you want to reset this form?')) {
                  setFormData({
                    email: user?.email || '',
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: '',
                    firstName: user?.firstName || '',
                    lastName: user?.lastName || '',
                    phone: user?.phone || ''
                  });
                  setPreviewImage(user?.profilePicture || null);
                  setErrors({});
                  setSuccess('');
                  setHasChanges(false);
                }
              }}
              className={`px-4 py-2 rounded-lg transition-colors ${
                settings.darkMode
                  ? 'bg-red-900 hover:bg-red-800 text-white'
                  : 'bg-red-100 hover:bg-red-200 text-red-800'
              }`}
            >
              Reset
            </button>
            <button
              type="submit"
              disabled={loading || !hasChanges}
              className={`px-4 py-2 rounded-lg transition-colors ${
                settings.darkMode
                  ? 'bg-blue-600 hover:bg-blue-500 text-white'
                  : 'bg-blue-600 hover:bg-blue-500 text-white'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {loading ? (
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
        </form>
      </div>

      <Tooltip id="password-tooltip" />

    </div>
  );
};

export default EditProfile;
