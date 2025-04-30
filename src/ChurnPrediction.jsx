import { useState } from "react";

export default function ChurnPrediction() {
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

  const [selectedModel, setSelectedModel] = useState("logistic");
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);

  const [modelInfo] = useState({
    logistic: {
      accuracy: "82.4%",
      precision: "79.1%",
      recall: "73.8%",
      description:
        "Simple, fast, and provides probability estimates. Good for understanding feature importance.",
    },
    randomForest: {
      accuracy: "87.2%",
      precision: "84.5%",
      recall: "79.3%",
      description:
        "Ensemble method with higher accuracy. Better handles non-linear relationships and feature interactions.",
    },
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
    setLoading(true);

    setTimeout(() => {
      let churnScore = 0;

      if (formData.contract === "Month-to-month") churnScore += 30;
      else if (formData.contract === "One year") churnScore += 15;

      if (formData.paymentMethod === "Electronic check") churnScore += 20;
      if (formData.internetService === "Fiber optic") churnScore += 15;
      if (formData.onlineSecurity === "No") churnScore += 10;
      if (formData.techSupport === "No") churnScore += 10;
      if (formData.monthlyCharges > 80) churnScore += 15;

      churnScore -= Math.min(formData.tenure / 2, 20);

      if (selectedModel === "logistic") {
        churnScore = churnScore * 0.95 + (Math.random() * 6 - 3);
      } else {
        if (formData.tenure < 6 && formData.contract === "Month-to-month") churnScore += 10;
        if (formData.monthlyCharges > 90 && formData.internetService === "Fiber optic") churnScore += 8;
        if (churnScore > 50) churnScore *= 1.1;
        if (churnScore < 20) churnScore *= 0.9;
        churnScore += Math.random() * 8 - 4;
      }

      const normalized = Math.max(0, Math.min(100, churnScore));
      const riskLevel = normalized < 30 ? "Low" : normalized < 70 ? "Medium" : "High";

      setPrediction({
        churnProbability: normalized.toFixed(1),
        riskLevel,
        model: selectedModel === "logistic" ? "Logistic Regression" : "Random Forest",
      });

      setLoading(false);
    }, 800);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h1 className="text-3xl font-bold text-blue-700 mb-6">Customer Churn Prediction</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Panel: Form + Model Selection */}
        <div className="md:col-span-2 bg-gray-50 p-6 rounded-lg">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Customer Data</h2>
            <div className="flex bg-white rounded-md shadow-sm border border-gray-300 overflow-hidden">
              <button
                type="button"
                className={`px-4 py-2 text-sm font-medium ${selectedModel === "logistic"
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                onClick={() => {
                  setSelectedModel("logistic");
                  setPrediction(null);
                }}
              >
                Logistic Regression
              </button>
              <button
                type="button"
                className={`px-4 py-2 text-sm font-medium border-l border-gray-300 ${selectedModel === "randomForest"
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                onClick={() => {
                  setSelectedModel("randomForest");
                  setPrediction(null);
                }}
              >
                Random Forest
              </button>
            </div>
          </div>

          <div className="bg-blue-50 p-3 rounded mb-4 text-sm text-blue-800">
            <div className="font-medium mb-1">
              {selectedModel === "logistic" ? "Logistic Regression" : "Random Forest"} Model
            </div>
            <p>{modelInfo[selectedModel].description}</p>
            <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
              <div>
                <span className="font-medium">Accuracy:</span> {modelInfo[selectedModel].accuracy}
              </div>
              <div>
                <span className="font-medium">Precision:</span> {modelInfo[selectedModel].precision}
              </div>
              <div>
                <span className="font-medium">Recall:</span> {modelInfo[selectedModel].recall}
              </div>
            </div>
          </div>

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
                disabled={loading}
              >
                {loading ? "Analyzing..." : "Predict Churn Risk"}
              </button>
            </div>
          </form>
        </div>

        {/* Right Panel: Prediction */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Prediction Result</h2>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : prediction ? (
            <div className="h-64 flex flex-col items-center justify-center">
              <div className={`text-6xl font-bold mb-2 ${prediction.riskLevel === "Low"
                  ? "text-green-500"
                  : prediction.riskLevel === "Medium"
                    ? "text-yellow-500"
                    : "text-red-500"
                }`}>
                {prediction.churnProbability}%
              </div>
              <div className="text-xl font-medium text-gray-700">
                {prediction.riskLevel} Risk
              </div>
              <div className="mt-2 text-sm text-blue-600 font-medium">
                {prediction.model}
              </div>
              <div className="mt-4 text-sm text-gray-600 text-center">
                {prediction.riskLevel === "Low" ? (
                  <p>This customer has a low probability of churning. Continue providing good service.</p>
                ) : prediction.riskLevel === "Medium" ? (
                  <p>This customer has a moderate risk of churning. Consider proactive retention strategies.</p>
                ) : (
                  <p>This customer has a high risk of churning. Immediate intervention recommended.</p>
                )}
              </div>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-400 text-center">
              <p>Enter customer data and click "Predict Churn Risk" to see the prediction</p>
            </div>
          )}

          {prediction && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <h3 className="font-medium text-gray-700 mb-2">Key Churn Factors:</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                {formData.contract === "Month-to-month" && <li>• Month-to-month contract increases churn risk</li>}
                {formData.paymentMethod === "Electronic check" && <li>• Electronic check payment method</li>}
                {formData.internetService === "Fiber optic" && <li>• Fiber optic internet service</li>}
                {formData.onlineSecurity === "No" && <li>• No online security</li>}
                {formData.techSupport === "No" && <li>• No tech support</li>}
                {formData.tenure < 12 && <li>• Low tenure (less than 12 months)</li>}
                {selectedModel === "randomForest" && formData.tenure < 6 && formData.contract === "Month-to-month" && (
                  <li>• New customer with month-to-month contract (high risk combination)</li>
                )}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Footer note */}
      <div className="mt-8 bg-blue-50 p-4 rounded-lg text-sm text-gray-700">
        <p><strong>Note:</strong> This is a demonstration model simulating different ML algorithms. In a production environment, these buttons would connect to separate trained models via API endpoints.</p>
      </div>
    </div>
  );
}

// Reusable Input
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

// Reusable Select
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
