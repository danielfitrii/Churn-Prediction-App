import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { insertMockData } from '../scripts/insertMockData';
import { deleteMockData } from '../scripts/deleteMockData';

export default function MockDataButton() {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const handleInsertMockData = async () => {
    if (!user) {
      alert('Please log in first');
      return;
    }

    // Set the year range for mock data insertion
    const startYear = new Date().getFullYear() - 2; // e.g., current year - 2
    const endYear = new Date().getFullYear();       // e.g., current year

    if (window.confirm(`This will insert 50 mock records spread across years ${startYear} to ${endYear}. Continue?`)) {
      setLoading(true);
      try {
        // Pass the year range to the insertMockData function
        await insertMockData(user.uid, 50, startYear, endYear);
        alert('Mock data inserted successfully!');
      } catch (error) {
        console.error('Error inserting mock data:', error);
        alert('Error inserting mock data. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleDeleteMockData = async () => {
    if (!user) {
      alert('Please log in first');
      return;
    }

    if (window.confirm('This will delete all mock data. This action cannot be undone. Continue?')) {
      setLoading(true);
      try {
        const success = await deleteMockData(user.uid);
        if (success) {
          alert('Mock data deleted successfully!');
        } else {
          alert('Error deleting mock data. Please try again.');
        }
      } catch (error) {
        console.error('Error deleting mock data:', error);
        alert('Error deleting mock data. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="flex space-x-2">
      <button
        onClick={handleInsertMockData}
        disabled={loading}
        className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-md transition duration-300 disabled:opacity-50"
      >
        {loading ? 'Processing...' : 'Insert Mock Data'}
      </button>
      <button
        onClick={handleDeleteMockData}
        disabled={loading}
        className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-md transition duration-300 disabled:opacity-50"
      >
        {loading ? 'Processing...' : 'Delete Mock Data'}
      </button>
    </div>
  );
} 