// components/Register.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Register = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setMessage("Passwords do not match");
      return;
    }

    // Simulated account creation
    console.log("Creating user:", formData.email);
    setMessage("Account created! Redirecting to login...");
    setTimeout(() => navigate("/login"), 2000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white p-8 rounded shadow">
        <h2 className="text-2xl font-bold mb-6 text-center">Create Account</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            name="email"
            placeholder="Email address"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border rounded"
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border rounded"
          />
          <input
            type="password"
            name="confirmPassword"
            placeholder="Confirm password"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border rounded"
          />
          <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
            Create Account
          </button>
        </form>
        {message && <p className="mt-4 text-center text-sm text-green-600">{message}</p>}
        <div className="mt-4 text-center">
          <a href="/login" className="text-sm text-blue-600 hover:underline">
            Back to Login
          </a>
        </div>
      </div>
    </div>
  );
};

export default Register;