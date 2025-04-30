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
        console.log("Submitted data:", formData, "Model:", selectedModel);
    };

    return (
        <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
            <h1 className="text-3xl font-bold text-blue-700 mb-4">
                Customer Churn Prediction
            </h1>

            {/* Model selection toggle buttons */}
            <div className="flex space-x-4 mb-4">
                <button
                    type="button"
                    className={`px-4 py-2 rounded ${selectedModel === "logistic"
                            ? "bg-blue-600 text-white"
                            : "bg-gray-200 text-gray-700"
                        }`}
                    onClick={() => setSelectedModel("logistic")}
                >
                    Logistic Regression
                </button>
                <button
                    type="button"
                    className={`px-4 py-2 rounded ${selectedModel === "randomForest"
                            ? "bg-blue-600 text-white"
                            : "bg-gray-200 text-gray-700"
                        }`}
                    onClick={() => setSelectedModel("randomForest")}
                >
                    Random Forest
                </button>
            </div>

            {/* Model info block */}
            <div className="bg-blue-50 p-4 rounded-lg mb-6 text-sm text-blue-900">
                <p className="font-medium mb-1">
                    {selectedModel === "logistic"
                        ? "Logistic Regression"
                        : "Random Forest"}{" "}
                    Model
                </p>
                <p className="mb-2">{modelInfo[selectedModel].description}</p>
                <div className="grid grid-cols-3 gap-4 text-xs">
                    <div>
                        <span className="font-semibold">Accuracy:</span>{" "}
                        {modelInfo[selectedModel].accuracy}
                    </div>
                    <div>
                        <span className="font-semibold">Precision:</span>{" "}
                        {modelInfo[selectedModel].precision}
                    </div>
                    <div>
                        <span className="font-semibold">Recall:</span>{" "}
                        {modelInfo[selectedModel].recall}
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                        name="tenure"
                        label="Tenure (months)"
                        value={formData.tenure}
                        onChange={handleChange}
                    />
                    <Input
                        name="monthlyCharges"
                        label="Monthly Charges ($)"
                        value={formData.monthlyCharges}
                        onChange={handleChange}
                    />
                    <Input
                        name="totalCharges"
                        label="Total Charges ($)"
                        value={formData.totalCharges}
                        onChange={handleChange}
                    />
                    <Select
                        name="contract"
                        label="Contract Type"
                        value={formData.contract}
                        onChange={handleChange}
                        options={["Month-to-month", "One year", "Two year"]}
                    />
                    <Select
                        name="paymentMethod"
                        label="Payment Method"
                        value={formData.paymentMethod}
                        onChange={handleChange}
                        options={[
                            "Electronic check",
                            "Mailed check",
                            "Bank transfer",
                            "Credit card",
                        ]}
                    />
                    <Select
                        name="internetService"
                        label="Internet Service"
                        value={formData.internetService}
                        onChange={handleChange}
                        options={["DSL", "Fiber optic", "No"]}
                    />
                    <Select
                        name="onlineSecurity"
                        label="Online Security"
                        value={formData.onlineSecurity}
                        onChange={handleChange}
                        options={["Yes", "No"]}
                    />
                    <Select
                        name="techSupport"
                        label="Tech Support"
                        value={formData.techSupport}
                        onChange={handleChange}
                        options={["Yes", "No"]}
                    />
                    <Select
                        name="streamingTV"
                        label="Streaming TV"
                        value={formData.streamingTV}
                        onChange={handleChange}
                        options={["Yes", "No"]}
                    />
                    <Select
                        name="paperlessBilling"
                        label="Paperless Billing"
                        value={formData.paperlessBilling}
                        onChange={handleChange}
                        options={["Yes", "No"]}
                    />
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

// Reusable input and select components
function Input({ name, label, value, onChange }) {
    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
                {label}
            </label>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
                {label}
            </label>
            <select
                name={name}
                value={value}
                onChange={onChange}
                className="w-full border-gray-300 rounded-md shadow-sm px-3 py-2 border"
            >
                {options.map((opt) => (
                    <option key={opt} value={opt}>
                        {opt}
                    </option>
                ))}
            </select>
        </div>
    );
}
