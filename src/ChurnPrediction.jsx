import { useState } from "react";

export default function ChurnPredictionApp() {
  const [formData, setFormData] = useState({
    tenure: 12,
    monthlyCharges: 70,
    totalCharges: 840,
    contract: "Month-to-month",
    paymentMethod: "Electronic check",
    internetService: "Fiber optic",
    onlineSecurity: "No",
    techSupport: "No",
    streamingTV: "Yes",
    paperlessBilling: "Yes",
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Placeholder for prediction logic
    console.log("Submitted form data:", formData);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h1 className="text-3xl font-bold text-blue-700 mb-6">Customer Churn Prediction</h1>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input name="tenure" label="Tenure (months)" value={formData.tenure} onChange={handleChange} />
          <Input name="monthlyCharges" label="Monthly Charges ($)" value={formData.monthlyCharges} onChange={handleChange} />
          <Input name="totalCharges" label="Total Charges ($)" value={formData.totalCharges} onChange={handleChange} />
          <Select name="contract" label="Contract Type" value={formData.contract} onChange={handleChange}
            options={["Month-to-month", "One year", "Two year"]} />
          <Select name="paymentMethod" label="Payment Method" value={formData.paymentMethod} onChange={handleChange}
            options={["Electronic check", "Mailed check", "Bank transfer", "Credit card"]} />
          <Select name="internetService" label="Internet Service" value={formData.internetService} onChange={handleChange}
            options={["DSL", "Fiber optic", "No"]} />
          <Select name="onlineSecurity" label="Online Security" value={formData.onlineSecurity} onChange={handleChange}
            options={["Yes", "No"]} />
          <Select name="techSupport" label="Tech Support" value={formData.techSupport} onChange={handleChange}
            options={["Yes", "No"]} />
          <Select name="streamingTV" label="Streaming TV" value={formData.streamingTV} onChange={handleChange}
            options={["Yes", "No"]} />
          <Select name="paperlessBilling" label="Paperless Billing" value={formData.paperlessBilling} onChange={handleChange}
            options={["Yes", "No"]} />
        </div>
        
        <div className="mt-6">
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition duration-300"
          >
            Predict Churn Risk
          </button>
        </div>
      </form>
    </div>
  );
}

function Input({ name, label, value, onChange }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type="number"
        name={name}
        value={value}
        onChange={onChange}
        className="w-full border-gray-300 rounded-md shadow-sm px-3 py-2 border"
        min="0"
      />
    </div>
  );
}

function Select({ name, label, value, onChange, options }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <select
        name={name}
        value={value}
        onChange={onChange}
        className="w-full border-gray-300 rounded-md shadow-sm px-3 py-2 border"
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </div>
  );
}
