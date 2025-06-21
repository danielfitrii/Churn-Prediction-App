import React from 'react';

const Logo = ({ isDarkMode }) => {
  return (
    <div className="flex items-center space-x-3">
      <svg className="w-10 h-10 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
      <span className={`text-2xl font-bold text-gray-800 dark:text-gray-50`}>
        Churn Predict
      </span>
    </div>
  );
};

export default Logo; 