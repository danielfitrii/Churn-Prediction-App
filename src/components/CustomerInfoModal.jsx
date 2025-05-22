import React, { useState } from 'react';

export default function CustomerInfoModal({ isOpen, onClose, onSave, initialInfo }) {
  const [customerInfo, setCustomerInfo] = useState(initialInfo || {
    customerID: '',
    name: '',
    gender: '',
    age: '',
    email: '',
    phone: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCustomerInfo({ ...customerInfo, [name]: value });
  };

  const handleSave = () => {
    onSave(customerInfo);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md relative">
        <button
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
          onClick={onClose}
        >
          &times;
        </button>
        <h2 className="text-2xl font-bold mb-4">Customer Information</h2>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Customer ID</label>
            <input
              type="text"
              name="customerID"
              value={customerInfo.customerID}
              onChange={handleChange}
              className="w-full border-gray-300 rounded-md shadow-sm px-3 py-2 border"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              name="name"
              value={customerInfo.name}
              onChange={handleChange}
              className="w-full border-gray-300 rounded-md shadow-sm px-3 py-2 border"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
            <select
              name="gender"
              value={customerInfo.gender}
              onChange={handleChange}
              className="w-full border-gray-300 rounded-md shadow-sm px-3 py-2 border"
            >
              <option value="">Select</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
            <input
              type="number"
              name="age"
              value={customerInfo.age}
              onChange={handleChange}
              className="w-full border-gray-300 rounded-md shadow-sm px-3 py-2 border"
              min="0"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              name="email"
              value={customerInfo.email}
              onChange={handleChange}
              className="w-full border-gray-300 rounded-md shadow-sm px-3 py-2 border"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input
              type="text"
              name="phone"
              value={customerInfo.phone}
              onChange={handleChange}
              className="w-full border-gray-300 rounded-md shadow-sm px-3 py-2 border"
            />
          </div>
        </div>
        <div className="mt-6 flex justify-end space-x-2">
          <button
            className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2 px-4 rounded-md"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md"
            onClick={handleSave}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
} 