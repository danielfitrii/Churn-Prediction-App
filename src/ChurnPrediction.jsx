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

  const [selectedModel, setSelectedModel] = useState("logistic");
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [modelInfo, setModelInfo] = useState({
    logistic: {
      accuracy: "82.4%",
      precision: "79.1%",
      recall: "73.8%",
      description: "Simple, fast, and provides probability estimates. Good for understanding feature importance."
    },
    randomForest: {
      accuracy: "87.2%",
      precision: "84.5%",
      recall: "79.3%",
      description: "Ensemble method with higher accuracy. Better handles non-linear relationships and feature interactions."
    }
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleModelChange = (model) => {
    setSelectedModel(model);
    // Clear previous prediction when changing models
    setPrediction(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);

    // Simulate API call with different algorithms
    setTimeout(() => {
      let churnScore = 0;

      // Base factors for both models
      if (formData.contract === "Month-to-month") churnScore += 30;
      else if (formData.contract === "One year") churnScore += 15;

      if (formData.paymentMethod === "Electronic check") churnScore += 20;
      if (formData.internetService === "Fiber optic") churnScore += 15;
      if (formData.onlineSecurity === "No") churnScore += 10;
      if (formData.techSupport === "No") churnScore += 10;

      churnScore -= Math.min(formData.tenure / 2, 20);

      if (formData.monthlyCharges > 80) churnScore += 15;

      // Model-specific adjustments to simulate different algorithms
      if (selectedModel === "logistic") {
        // Logistic regression tends to be more linear in how it weighs features
        churnScore = churnScore * 0.95;
        // Add some randomness within a reasonable range
        churnScore += (Math.random() * 6) - 3;
      } else {
        // Random Forest can capture more complex relationships
        if (formData.tenure < 6 && formData.contract === "Month-to-month") {
          churnScore += 10; // Interaction effect
        }
        if (formData.monthlyCharges > 90 && formData.internetService === "Fiber optic") {
          churnScore += 8; // Another interaction effect
        }
        // Random Forest tends to be more confident at extremes
        if (churnScore > 50) churnScore *= 1.1;
        if (churnScore < 20) churnScore *= 0.9;
        // Add some different randomness
        churnScore += (Math.random() * 8) - 4;
      }

      // Normalize to percentage (0-100%)
      const normalizedScore = Math.max(0, Math.min(100, churnScore));

      setPrediction({
        churnProbability: normalizedScore.toFixed(1),
        riskLevel: normalizedScore < 30 ? "Low" : normalizedScore < 70 ? "Medium" : "High",
        model: selectedModel === "logistic" ? "Logistic Regression" : "Random Forest"
      });
      setLoading(false);
    }, 800);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h1 className="text-3xl font-bold text-blue-700 mb-6">Customer Churn Prediction</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                onClick={() => handleModelChange("logistic")}
              >
                Logistic Regression
              </button>
              <button
                type="button"
                className={`px-4 py-2 text-sm font-medium border-l border-gray-300 ${selectedModel === "randomForest"
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                onClick={() => handleModelChange("randomForest")}
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tenure (months)
                </label>
                <input
                  type="number"
                  name="tenure"
                  value={formData.tenure}
                  onChange={handleChange}
                  className="w-full border-gray-300 rounded-md shadow-sm px-3 py-2 border"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Monthly Charges ($)
                </label>
                <input
                  type="number"
                  name="monthlyCharges"
                  value={formData.monthlyCharges}
                  onChange={handleChange}
                  className="w-full border-gray-300 rounded-md shadow-sm px-3 py-2 border"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Total Charges ($)
                </label>
                <input
                  type="number"
                  name="totalCharges"
                  value={formData.totalCharges}
                  onChange={handleChange}
                  className="w-full border-gray-300 rounded-md shadow-sm px-3 py-2 border"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contract Type
                </label>
                <select
                  name="contract"
                  value={formData.contract}
                  onChange={handleChange}
                  className="w-full border-gray-300 rounded-md shadow-sm px-3 py-2 border"
                >
                  <option value="Month-to-month">Month-to-month</option>
                  <option value="One year">One year</option>
                  <option value="Two year">Two year</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Method
                </label>
                <select
                  name="paymentMethod"
                  value={formData.paymentMethod}
                  onChange={handleChange}
                  className="w-full border-gray-300 rounded-md shadow-sm px-3 py-2 border"
                >
                  <option value="Electronic check">Electronic check</option>
                  <option value="Mailed check">Mailed check</option>
                  <option value="Bank transfer">Bank transfer</option>
                  <option value="Credit card">Credit card</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Internet Service
                </label>
                <select
                  name="internetService"
                  value={formData.internetService}
                  onChange={handleChange}
                  className="w-full border-gray-300 rounded-md shadow-sm px-3 py-2 border"
                >
                  <option value="DSL">DSL</option>
                  <option value="Fiber optic">Fiber optic</option>
                  <option value="No">No</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Online Security
                </label>
                <select
                  name="onlineSecurity"
                  value={formData.onlineSecurity}
                  onChange={handleChange}
                  className="w-full border-gray-300 rounded-md shadow-sm px-3 py-2 border"
                >
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tech Support
                </label>
                <select
                  name="techSupport"
                  value={formData.techSupport}
                  onChange={handleChange}
                  className="w-full border-gray-300 rounded-md shadow-sm px-3 py-2 border"
                >
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Streaming TV
                </label>
                <select
                  name="streamingTV"
                  value={formData.streamingTV}
                  onChange={handleChange}
                  className="w-full border-gray-300 rounded-md shadow-sm px-3 py-2 border"
                >
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Paperless Billing
                </label>
                <select
                  name="paperlessBilling"
                  value={formData.paperlessBilling}
                  onChange={handleChange}
                  className="w-full border-gray-300 rounded-md shadow-sm px-3 py-2 border"
                >
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>
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
                {formData.contract === "Month-to-month" && (
                  <li>• Month-to-month contract increases churn risk</li>
                )}
                {formData.paymentMethod === "Electronic check" && (
                  <li>• Electronic check payment method</li>
                )}
                {formData.internetService === "Fiber optic" && (
                  <li>• Fiber optic internet service</li>
                )}
                {formData.onlineSecurity === "No" && (
                  <li>• No online security</li>
                )}
                {formData.techSupport === "No" && (
                  <li>• No tech support</li>
                )}
                {formData.tenure < 12 && (
                  <li>• Low tenure (less than 12 months)</li>
                )}
                {selectedModel === "randomForest" && formData.tenure < 6 && formData.contract === "Month-to-month" && (
                  <li>• New customer with month-to-month contract (high risk combination)</li>
                )}
              </ul>
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 bg-blue-50 p-4 rounded-lg text-sm text-gray-700">
        <p><strong>Note:</strong> This is a demonstration model simulating different ML algorithms. In a production environment, these buttons would connect to separate trained models via API endpoints.</p>
      </div>
    </div>
  );
}