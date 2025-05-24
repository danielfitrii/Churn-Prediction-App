import { useState, useRef } from "react";
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebaseConfig';
import { useAuth } from './context/AuthContext';
import { runTransaction, doc } from 'firebase/firestore';

export default function ChurnPredictionApp() {
  const { user } = useAuth();
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
    name: '',
    gender: '',
    age: '',
    region: ''
  });

  const [showMissingInfoWarning, setShowMissingInfoWarning] = useState(false);

  const isCustomerInfoComplete = customerInfo.name && customerInfo.gender && customerInfo.age && customerInfo.region;

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
      
      const predictionResult = {
        churnProbability: (result.probability * 100).toFixed(1),
        riskLevel: result.probability < 0.3 ? 'Low' : result.probability < 0.7 ? 'Medium' : 'High',
        model: selectedModel === 'logistic' ? 'Logistic Regression' : 'Random Forest'
      };
      
      setPrediction(predictionResult);

      // Save prediction to Firestore with auto-incremented Customer ID
      try {
        // Get a new auto-incremented Customer ID within a transaction
        const nextCustomerId = await runTransaction(db, async (transaction) => {
          const counterRef = doc(db, 'metadata', 'counters');
          const counterDoc = await transaction.get(counterRef);

          let currentCount = 0;
          if (counterDoc.exists()) {
            currentCount = counterDoc.data().customerCount || 0;
          }

          const newCount = currentCount + 1;
          transaction.set(counterRef, { customerCount: newCount });
          return newCount;
        });

        const predictionData = {
          customerInfo: {
            customerID: nextCustomerId, // Use the auto-incremented ID
            name: customerInfo.name,
            gender: customerInfo.gender,
            age: customerInfo.age,
            region: customerInfo.region
          },
          features: {
            tenure: Number(formData.tenure),
            monthlyCharges: Number(formData.monthlyCharges),
            totalCharges: Number(formData.totalCharges),
            contract: formData.contract,
            paymentMethod: formData.paymentMethod,
            internetService: formData.internetService,
            onlineSecurity: formData.onlineSecurity,
            techSupport: formData.techSupport,
            streamingTV: formData.streamingTV,
            paperlessBilling: formData.paperlessBilling
          },
          prediction: {
            probability: result.probability,
            churnProbability: predictionResult.churnProbability,
            riskLevel: predictionResult.riskLevel,
            model: predictionResult.model
          },
          userId: user?.uid,
          timestamp: serverTimestamp()
        };

        const docRef = await addDoc(collection(db, 'predictions'), predictionData);
        console.log('Prediction saved with ID:', docRef.id);
      } catch (error) {
        console.error('Error saving prediction to Firestore:', error);
        // Don't throw the error to the user, just log it
      }
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
      // Use local backend URL in development, deployed URL in production
      const backendUrl = import.meta.env.DEV 
        ? 'http://localhost:5000/predict'
        : 'https://churn-prediction-flask-app-307074742286.asia-southeast1.run.app/predict';
        
      const response = await fetch(backendUrl, {
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
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-blue-700 mb-2">Customer Churn Prediction</h1>
        <p className="text-gray-600 text-lg">Predict whether a customer is likely to churn based on their usage profile</p>
      </div>
      <div className="mb-6 p-4 bg-blue-50 rounded-lg shadow flex flex-col items-center justify-center">
        <form className="flex flex-col md:flex-row md:space-x-4 items-center w-full justify-center">
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
              <option value="Undisclosed">Undisclosed</option>
            </select>
          </div>
          <div className="mb-2 md:mb-0 w-48">
            <label className="block text-sm font-medium text-gray-700 mb-1">Region</label>
            <select
              name="region"
              value={customerInfo.region}
              onChange={handleCustomerInfoChange}
              className="w-full border-gray-300 rounded-md shadow-sm px-3 py-2 border text-center bg-white"
            >
              <option value="">Select Region</option>
              <option value="Johor">Johor</option>
              <option value="Kedah">Kedah</option>
              <option value="Kelantan">Kelantan</option>
              <option value="Melaka">Melaka</option>
              <option value="Negeri Sembilan">Negeri Sembilan</option>
              <option value="Pahang">Pahang</option>
              <option value="Perak">Perak</option>
              <option value="Perlis">Perlis</option>
              <option value="Pulau Pinang">Pulau Pinang</option>
              <option value="Sabah">Sabah</option>
              <option value="Sarawak">Sarawak</option>
              <option value="Selangor">Selangor</option>
              <option value="Terengganu">Terengganu</option>
              <option value="WPKualaLumpur">Wilayah Persekutuan (Kuala Lumpur)</option>
              <option value="WPLabuan">Wilayah Persekutuan (Labuan)</option>
              <option value="WPPutrajaya">Wilayah Persekutuan (Putrajaya)</option>
            </select>
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

            <div className="flex bg-white rounded-lg shadow-sm border border-gray-300 overflow-hidden">
              <button
                type="button"
                className={`px-4 py-2 text-sm font-medium transition-colors duration-200 ${
                  selectedModel === "logistic"
                    ? "bg-blue-600 text-white shadow-inner"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                }`}
                onClick={() => handleModelChange("logistic")}
              >
                <span className="flex items-center">
                  Logistic Regression
                </span>
              </button>
              <button
                type="button"
                className={`px-4 py-2 text-sm font-medium border-l border-gray-300 transition-colors duration-200 ${
                  selectedModel === "randomForest"
                    ? "bg-blue-600 text-white shadow-inner"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                }`}
                onClick={() => handleModelChange("randomForest")}
              >
                <span className="flex items-center">
                  Random Forest
                </span>
              </button>
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg mb-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">
                  {selectedModel === "logistic" ? "Logistic Regression" : "Random Forest"} Model
                </h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>{modelInfo[selectedModel].description}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 p-3 rounded-lg mb-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">{modelInfo[selectedModel].tip}</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Service Details Section */}
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Service Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tenure (months)
                    <span className="text-gray-500 text-xs ml-1">(0-120)</span>
                  </label>
                  <input
                    type="number"
                    name="tenure"
                    value={formData.tenure}
                    onChange={handleChange}
                    className="w-full border-gray-300 rounded-md shadow-sm px-3 py-2 border focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    min="0"
                    max="120"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Monthly Charges ($)
                    <span className="text-gray-500 text-xs ml-1">(0-200)</span>
                  </label>
                  <input
                    type="number"
                    name="monthlyCharges"
                    value={formData.monthlyCharges}
                    onChange={handleChange}
                    className="w-full border-gray-300 rounded-md shadow-sm px-3 py-2 border focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    min="0"
                    max="200"
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
                    className="w-full border-gray-300 rounded-md shadow-sm px-3 py-2 border focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                    className="w-full border-gray-300 rounded-md shadow-sm px-3 py-2 border focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="Month-to-month">Month-to-month</option>
                    <option value="One year">One year</option>
                    <option value="Two year">Two year</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Support & Billing Section */}
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Support & Billing</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Method
                  </label>
                  <select
                    name="paymentMethod"
                    value={formData.paymentMethod}
                    onChange={handleChange}
                    className="w-full border-gray-300 rounded-md shadow-sm px-3 py-2 border focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                    className="w-full border-gray-300 rounded-md shadow-sm px-3 py-2 border focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                    className="w-full border-gray-300 rounded-md shadow-sm px-3 py-2 border focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                    className="w-full border-gray-300 rounded-md shadow-sm px-3 py-2 border focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                    className="w-full border-gray-300 rounded-md shadow-sm px-3 py-2 border focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                    className="w-full border-gray-300 rounded-md shadow-sm px-3 py-2 border focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-md transition duration-300 text-lg shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading || !isCustomerInfoComplete}
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Analyzing...
                  </span>
                ) : (
                  "Predict Churn Risk"
                )}
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
              <div className={`text-6xl font-bold mb-2 ${
                prediction.riskLevel === "Low"
                  ? "text-green-500"
                  : prediction.riskLevel === "Medium"
                    ? "text-yellow-500"
                    : "text-red-500"
              }`}>
                {prediction.churnProbability}%
              </div>
              <div className="text-xl font-medium text-gray-700 mb-2">
                {prediction.riskLevel} Risk
              </div>
              <div className="text-sm text-blue-600 font-medium mb-4">
                {prediction.model}
              </div>
              <div className="text-sm text-gray-600 text-center max-w-md">
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
            <div className="h-64 flex flex-col items-center justify-center text-gray-400 text-center">
              <svg className="h-12 w-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-lg">Enter customer data and click "Predict Churn Risk" to see the prediction</p>
            </div>
          )}

          {prediction && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="font-medium text-gray-700 mb-3">Key Churn Factors:</h3>
              <ul className="text-sm text-gray-600 space-y-2">
                {formData.contract === "Month-to-month" && (
                  <li className="flex items-start">
                    <svg className="h-4 w-4 text-red-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span className="flex-grow">Month-to-month contract increases churn risk</span>
                  </li>
                )}
                {formData.paymentMethod === "Electronic check" && (
                  <li className="flex items-start">
                    <svg className="h-4 w-4 text-red-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span className="flex-grow">Electronic check payment method</span>
                  </li>
                )}
                {formData.internetService === "Fiber optic" && (
                  <li className="flex items-start">
                    <svg className="h-4 w-4 text-red-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span className="flex-grow">Fiber optic internet service</span>
                  </li>
                )}
                {formData.onlineSecurity === "No" && (
                  <li className="flex items-start">
                    <svg className="h-4 w-4 text-red-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span className="flex-grow">No online security</span>
                  </li>
                )}
                {formData.techSupport === "No" && (
                  <li className="flex items-start">
                    <svg className="h-4 w-4 text-red-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span className="flex-grow">No tech support</span>
                  </li>
                )}
                {formData.tenure < 12 && (
                  <li className="flex items-start">
                    <svg className="h-4 w-4 text-red-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span className="flex-grow">Low tenure (less than 12 months)</span>
                  </li>
                )}
                {selectedModel === "randomForest" && formData.tenure < 6 && formData.contract === "Month-to-month" && (
                  <li className="flex items-start">
                    <svg className="h-4 w-4 text-red-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span className="flex-grow">New customer with month-to-month contract (high risk combination)</span>
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 bg-blue-50 p-4 rounded-lg border border-blue-100">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">About the Models</h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>This application uses trained machine learning models to predict customer churn risk based on historical data patterns. The models are regularly updated to maintain accuracy and adapt to changing customer behavior patterns.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}