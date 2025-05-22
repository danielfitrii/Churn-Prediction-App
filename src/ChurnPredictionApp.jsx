import { useState, useRef } from "react";

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
      description: `This model provides a more balanced approach, aiming to reduce false alarms (higher precision) while still identifying most churners. It's slightly more conservative, meaning fewer non-churners will be flagged unnecessarily, but there's a slightly higher chance of missing some churners.\n\nWhen to choose:\n- When the cost of false alarms is a concern (e.g., limited retention resources).`,
      tip: 'Tip: For this model, Contract Type and Tenure most affect predictions.'
    },
    randomForest: {
      description: `This model prioritizes catching as many potential churners as possible (high recall). It's designed to minimize the risk of missing a customer who is likely to leave. It may recommend actions for some customers who are not at risk (lower precision), but it ensures that few churners are overlooked.\n\nWhen to choose:\n- When the cost of missing a churner is high.\n- When your team prefers proactive retention, even with some false alarms.`,
      tip: 'Tip: For this model, Payment Method and Internet Service most affect predictions.'
    }
  });

  const [customerInfo, setCustomerInfo] = useState({
    customerID: '',
    name: '',
    gender: '',
    age: ''
  });

  const [showMissingInfoWarning, setShowMissingInfoWarning] = useState(false);

  const isCustomerInfoComplete = customerInfo.customerID && customerInfo.name && customerInfo.gender && customerInfo.age;

  const warningRef = useRef(null);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setShowMissingInfoWarning(false);
    if (!isCustomerInfoComplete) {
      setShowMissingInfoWarning(true);
      setLoading(false);
      setTimeout(() => {
        if (warningRef.current) {
          warningRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 50);
      return;
    }
    setLoading(true);
    setPrediction(null);
    try {
      // Encode features to match model's one-hot encoding
      const encodedFeatures = [
        Number(formData.tenure),
        Number(formData.monthlyCharges),
        Number(formData.totalCharges),
        // Contract
        formData.contract === "One year" ? 1 : 0,
        formData.contract === "Two year" ? 1 : 0,
        // Payment Method
        formData.paymentMethod === "Credit card (automatic)" ? 1 : 0,
        formData.paymentMethod === "Electronic check" ? 1 : 0,
        formData.paymentMethod === "Mailed check" ? 1 : 0,
        // Internet Service
        formData.internetService === "Fiber optic" ? 1 : 0,
        formData.internetService === "No" ? 1 : 0,
        // Yes/No features
        formData.onlineSecurity === "Yes" ? 1 : 0,
        formData.techSupport === "Yes" ? 1 : 0,
        formData.streamingTV === "Yes" ? 1 : 0,
        formData.paperlessBilling === "Yes" ? 1 : 0
      ];
      console.log('Encoded features:', encodedFeatures, 'Length:', encodedFeatures.length);
      const result = await makePrediction(encodedFeatures, selectedModel);
      setPrediction({
        churnProbability: (result.probability * 100).toFixed(1),
        riskLevel: result.probability < 0.3 ? 'Low' : result.probability < 0.7 ? 'Medium' : 'High',
        model: selectedModel === 'logistic' ? 'Logistic Regression' : 'Random Forest'
      });
    } catch (error) {
      setPrediction({
        churnProbability: 'Error',
        riskLevel: 'Error',
        model: 'Error'
      });
    }
    setLoading(false);
  };

  const makePrediction = async (features, model) => {
    try {
      const response = await fetch('http://localhost:5000/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ features, model }),
      });
      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }
      return {
        prediction: data.prediction,
        probability: data.probability
      };
    } catch (error) {
      console.error('Error making prediction:', error);
      throw error;
    }
  };

  const handleCustomerInfoChange = (e) => {
    const { name, value } = e.target;
    setCustomerInfo({ ...customerInfo, [name]: value });
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h1 className="text-3xl font-bold text-blue-700 mb-6 text-center">Customer Churn Prediction</h1>
      <div className="mb-6 p-4 bg-blue-50 rounded-lg shadow flex flex-col items-center justify-center">
        <form className="flex flex-col md:flex-row md:space-x-4 items-center w-full justify-center">
          <div className="mb-2 md:mb-0 w-32">
            <label className="block text-sm font-medium text-gray-700 mb-1">Customer ID</label>
            <input
              type="text"
              name="customerID"
              value={customerInfo.customerID}
              onChange={handleCustomerInfoChange}
              className="w-full border-gray-300 rounded-md shadow-sm px-3 py-2 border text-center bg-white"
            />
          </div>
          <div className="mb-2 md:mb-0 w-48">
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              name="name"
              value={customerInfo.name}
              onChange={handleCustomerInfoChange}
              className="w-full border-gray-300 rounded-md shadow-sm px-3 py-2 border text-center bg-white"
            />
          </div>
          <div className="mb-2 md:mb-0 w-40">
            <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
            <select
              name="gender"
              value={customerInfo.gender}
              onChange={handleCustomerInfoChange}
              className="w-full border-gray-300 rounded-md shadow-sm px-3 py-2 border text-center bg-white"
            >
              <option value="">Select</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </div>
          <div className="w-32">
            <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
            <input
              type="number"
              name="age"
              value={customerInfo.age}
              onChange={handleCustomerInfoChange}
              className="w-full border-gray-300 rounded-md shadow-sm px-3 py-2 border text-center bg-white"
              min="0"
            />
          </div>
        </form>
      </div>
      {showMissingInfoWarning && (
        <div ref={warningRef} className="mb-4 text-red-600 font-medium text-center">
          Please fill in all customer basic information before predicting.
        </div>
      )}
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
            <pre className="whitespace-pre-wrap font-sans text-blue-800 mb-2" style={{ background: 'transparent', border: 'none', padding: 0 }}>{modelInfo[selectedModel].description}</pre>
          </div>

          <div className="bg-yellow-50 p-2 rounded text-xs text-yellow-800 mb-4 text-center">
            {modelInfo[selectedModel].tip}
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
                  <option value="Bank transfer (automatic)">Bank transfer (automatic)</option>
                  <option value="Credit card (automatic)">Credit card (automatic)</option>
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