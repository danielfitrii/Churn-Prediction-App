import { useState, useRef } from "react";
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebaseConfig';
import { useAuth } from './context/AuthContext';
import { runTransaction, doc } from 'firebase/firestore';
import { useSettings } from './context/SettingsContext';
import { toast } from 'react-toastify';

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
  const [totalChargesOverridden, setTotalChargesOverridden] = useState(false);

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

  const { settings } = useSettings();

  const [lastPredictedFormData, setLastPredictedFormData] = useState(null);

  const [thresholdType, setThresholdType] = useState('f1'); // 'f1' or 'cost'

  const showPredictionStrategy = settings.showPredictionStrategy; // Toggle to true to show the Prediction Strategy section

  // Auto-calculate totalCharges if not overridden
  function autoUpdateTotalCharges(nextFormData) {
    if (!totalChargesOverridden) {
      return {
        ...nextFormData,
        totalCharges: Number(nextFormData.tenure) * Number(nextFormData.monthlyCharges)
      };
    }
    return nextFormData;
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    let nextFormData = {
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    };
    // If user edits totalCharges, set override flag
    if (name === "totalCharges") {
      setTotalChargesOverridden(true);
    } else if (name === "tenure" || name === "monthlyCharges") {
      nextFormData = autoUpdateTotalCharges(nextFormData);
    }
    setFormData(nextFormData);
  };

  // Reset button to revert to auto-calc
  const handleResetTotalCharges = () => {
    setFormData((prev) => ({
      ...prev,
      totalCharges: Number(prev.tenure) * Number(prev.monthlyCharges)
    }));
    setTotalChargesOverridden(false);
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
    setLastPredictedFormData(formData);
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
      const result = await makePrediction(encodedFeatures, selectedModel, thresholdType);
      
      const predictionResult = {
        churnProbability: (result.probability * 100).toFixed(1),
        riskLevel: result.probability < 0.3 ? 'Low' : result.probability < 0.7 ? 'Medium' : 'High',
        model: selectedModel === 'logistic' ? 'Logistic Regression' : 'Random Forest',
        ...(result.threshold_type !== undefined && { thresholdType: result.threshold_type }),
        ...(result.threshold !== undefined && { threshold: result.threshold }),
      };
      
      setPrediction(predictionResult);

      // Show notification on prediction success
      if (settings.notificationType === 'toast') {
        toast.success('Prediction completed!');
      } else if (settings.notificationType === 'builtin') {
        setPrediction(prev => ({ ...prev, notificationMessage: 'Prediction completed!' }));
      }

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
            model: predictionResult.model,
            ...(predictionResult.thresholdType !== undefined && { thresholdType: predictionResult.thresholdType }),
            ...(predictionResult.threshold !== undefined && { threshold: predictionResult.threshold }),
          },
          userId: user?.uid,
          timestamp: serverTimestamp()
        };

        const docRef = await addDoc(collection(db, 'predictions'), predictionData);
      } catch (error) {
        // Don't throw the error to the user, just log it
      }
    } catch (error) {
      setPrediction({
        churnProbability: 'Error',
        riskLevel: 'Error',
        model: 'Error',
        thresholdType: 'Error',
        threshold: 'Error'
      });
    }
    setLoading(false);
  };

  const makePrediction = async (features, model, thresholdType) => {
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
        body: JSON.stringify({ features, model, threshold_type: thresholdType }),
      });
      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }
      return {
        prediction: data.prediction,
        probability: data.probability,
        threshold_type: data.threshold_type,
        threshold: data.threshold
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
    <div className="w-full px-8 p-6 bg-white rounded-lg shadow-lg">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-blue-700 mb-2">Customer Churn Prediction</h1>
        <p className="text-gray-600 text-lg">Predict whether a customer is likely to churn based on their usage profile</p>
      </div>
      <div className="max-w-3xl w-full mx-auto mb-6 p-6 bg-blue-50 rounded-xl shadow-lg customer-info-card">
        <h2 className="text-2xl font-bold text-blue-900 text-center mb-1">Customer Basic Information</h2>
        <hr className="border-t border-blue-100 mb-6" />
        <form className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 w-full customer-info-grid">
          <div className="form-group">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              id="name"
              type="text"
              name="name"
              value={customerInfo.name}
              onChange={handleCustomerInfoChange}
              placeholder="Enter name"
              className="w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition"
            />
          </div>
          <div className="form-group">
            <label htmlFor="age" className="block text-sm font-medium text-gray-700 mb-1">Age</label>
            <input
              id="age"
              type="number"
              name="age"
              value={customerInfo.age}
              onChange={handleCustomerInfoChange}
              placeholder="Enter age"
              min="0"
              className="w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition"
            />
          </div>
          <div className="form-group">
            <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
            <select
              id="gender"
              name="gender"
              value={customerInfo.gender}
              onChange={handleCustomerInfoChange}
              className="w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition"
            >
              <option value="">Select gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Undisclosed">Undisclosed</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="region" className="block text-sm font-medium text-gray-700 mb-1">Region</label>
            <select
              id="region"
              name="region"
              value={customerInfo.region}
              onChange={handleCustomerInfoChange}
              className="w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition"
            >
              <option value="">Select region</option>
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
                <h3 className="text-sm font-semibold text-blue-800">
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input
                      type="number"
                      name="totalCharges"
                      value={formData.totalCharges}
                      onChange={handleChange}
                      className="w-full border-gray-300 rounded-md shadow-sm px-3 py-2 border focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      min="0"
                    />
                    {totalChargesOverridden && (
                      <button type="button" onClick={handleResetTotalCharges} className="ml-2 px-2 py-1 text-xs bg-gray-200 rounded hover:bg-gray-300">Reset</button>
                    )}
                  </div>
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
                    <option value="DSL">DSL (Digital Subscriber Line)</option>
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

            {showPredictionStrategy && (
              <div className="mb-4 flex items-center whitespace-nowrap">
                <label className="block text-gray-700 font-medium flex items-center mr-4 mb-0 whitespace-nowrap">
                  <span className="relative group flex items-center">
                    <svg
                      className="h-5 w-5 text-blue-400 cursor-pointer mr-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      style={{ minWidth: '20px' }}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span className="absolute left-6 top-1 z-10 hidden group-hover:block bg-gray-800 text-white text-xs rounded px-3 py-2 w-72 shadow-lg whitespace-normal break-words">
                      <b>Accurate (F1-optimized):</b> Best for achieving balanced and reliable predictions.<br /><br />
                      <b>Cost-effective:</b> Designed to minimize business costs, even at the expense of more false positives.
                    </span>
                  </span>
                  <span className="ml-1">Prediction Strategy:</span>
                </label>
                <div className="flex gap-4 items-center whitespace-nowrap">
                  <label className="inline-flex items-center whitespace-nowrap">
                    <input
                      type="radio"
                      className="form-radio"
                      name="thresholdType"
                      value="f1"
                      checked={thresholdType === 'f1'}
                      onChange={() => setThresholdType('f1')}
                    />
                    <span className="ml-2">Accurate (F1-optimized)</span>
                  </label>
                  <label className="inline-flex items-center whitespace-nowrap">
                    <input
                      type="radio"
                      className="form-radio"
                      name="thresholdType"
                      value="cost"
                      checked={thresholdType === 'cost'}
                      onChange={() => setThresholdType('cost')}
                    />
                    <span className="ml-2">Cost-effective</span>
                  </label>
                </div>
              </div>
            )}

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
              {(!isCustomerInfoComplete && !loading) && (
                <div className="mt-2 text-sm text-yellow-600 text-center">
                  Please fill in all customer basic information to enable prediction.
                </div>
              )}
            </div>
          </form>
        </div>

        <div className={`bg-gray-50 p-6 rounded-lg overflow-y-auto ${settings.showPredictionStrategy ? 'max-h-268' : 'max-h-258'}`}>
          <h2 className="text-xl font-semibold text-gray-800 mb-4 text-center">Prediction Result</h2>

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
              <div className="text-xl font-medium text-gray-700 mb-2 text-center">
                {prediction.riskLevel} Risk
              </div>
              <div className="text-sm text-blue-600 font-medium mb-4 text-center">
                {prediction.model}
              </div>
              {prediction.thresholdType && (
                <div className="text-sm text-gray-500 mb-2 text-center">
                  Strategy: {prediction.thresholdType === 'f1' ? 'Accurate (F1-optimized)' : 'Cost-effective'} (Threshold: {prediction.threshold})
                </div>
              )}
              <div className="text-base text-gray-600 max-w-md mb-2 text-left">
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

          {prediction && lastPredictedFormData && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="font-medium text-gray-700 mb-3">Key Churn Factors:</h3>
              <ul className="text-sm text-gray-600 space-y-2">
                {lastPredictedFormData.contract === "Month-to-month" && (
                  <li className="flex items-start">
                    <svg className="h-4 w-4 text-red-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span className="flex-grow">Month-to-month contract increases churn risk</span>
                  </li>
                )}
                {lastPredictedFormData.paymentMethod === "Electronic check" && (
                  <li className="flex items-start">
                    <svg className="h-4 w-4 text-red-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span className="flex-grow">Electronic check payment method</span>
                  </li>
                )}
                {lastPredictedFormData.internetService === "Fiber optic" && (
                  <li className="flex items-start">
                    <svg className="h-4 w-4 text-red-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span className="flex-grow">Fiber optic internet service</span>
                  </li>
                )}
                {lastPredictedFormData.onlineSecurity === "No" && (
                  <li className="flex items-start">
                    <svg className="h-4 w-4 text-red-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span className="flex-grow">No online security</span>
                  </li>
                )}
                {lastPredictedFormData.techSupport === "No" && (
                  <li className="flex items-start">
                    <svg className="h-4 w-4 text-red-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span className="flex-grow">No tech support</span>
                  </li>
                )}
                {lastPredictedFormData.tenure < 12 && (
                  <li className="flex items-start">
                    <svg className="h-4 w-4 text-red-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span className="flex-grow">Low tenure (less than 12 months)</span>
                  </li>
                )}
                {selectedModel === "randomForest" && lastPredictedFormData && lastPredictedFormData.tenure < 6 && lastPredictedFormData.contract === "Month-to-month" && (
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

          {/* Retention Strategies Section */}
          {prediction && lastPredictedFormData && (
            <div className="mt-8 bg-green-50 p-4 rounded-lg border border-green-200">
              <h3 className="text-base font-semibold text-green-800 mb-2">Retention Strategies:</h3>
              <ul className="space-y-2 text-green-900">
                {/* Dynamic strategies based on risk and factors */}
                {prediction.riskLevel === 'High' && (
                  <>
                    <li className="flex items-start"><svg className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg><span>Contact the customer immediately with a personalized offer or discount.</span></li>
                    <li className="flex items-start"><svg className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg><span>Assign a dedicated support representative to address concerns.</span></li>
                  </>
                )}
                {prediction.riskLevel === 'Medium' && (
                  <>
                    <li className="flex items-start"><svg className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg><span>Send a targeted email with loyalty rewards or service improvements.</span></li>
                    <li className="flex items-start"><svg className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg><span>Offer a free trial of premium features or support.</span></li>
                  </>
                )}
                {prediction.riskLevel === 'Low' && (
                  <li className="flex items-start"><svg className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg><span>Continue providing excellent service and monitor satisfaction.</span></li>
                )}
                {lastPredictedFormData.contract === 'Month-to-month' && (
                  <li className="flex items-start"><svg className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg><span>Encourage switching to a longer-term contract with incentives.</span></li>
                )}
                {lastPredictedFormData.paymentMethod === 'Electronic check' && (
                  <li className="flex items-start"><svg className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg><span>Promote more secure or convenient payment methods (e.g., credit card, auto-pay).</span></li>
                )}
                {lastPredictedFormData.internetService === 'Fiber optic' && (
                  <li className="flex items-start"><svg className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg><span>Highlight the benefits and reliability of your fiber optic service.</span></li>
                )}
                {lastPredictedFormData.onlineSecurity === 'No' && (
                  <li className="flex items-start"><svg className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg><span>Offer a free or discounted online security package.</span></li>
                )}
                {lastPredictedFormData.techSupport === 'No' && (
                  <li className="flex items-start"><svg className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg><span>Promote premium or 24/7 tech support options.</span></li>
                )}
                {lastPredictedFormData.tenure < 12 && (
                  <li className="flex items-start"><svg className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg><span>Send a welcome package or onboarding materials to new customers.</span></li>
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

      {settings.notificationType === 'builtin' && prediction?.notificationMessage && (
        <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
          {prediction.notificationMessage}
        </div>
      )}
    </div>
  );
}