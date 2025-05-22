import { useState, useEffect } from "react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
} from "recharts";

export default function ModelExplanation() {
    const [loading, setLoading] = useState(true);
    const [selectedModel, setSelectedModel] = useState("Logistic Regression");

    const logisticFeatures = [
        { feature: "Tenure", importance: 24 },
        { feature: "Monthly Charges", importance: 20 },
        { feature: "Contract Type", importance: 18 },
        { feature: "Online Security", importance: 12 },
        { feature: "Tech Support", importance: 10 },
        { feature: "Paperless Billing", importance: 7 },
        { feature: "Internet Service", importance: 5 },
        { feature: "Payment Method", importance: 4 },
    ];

    const forestFeatures = [
        { feature: "Contract Type", importance: 25 },
        { feature: "Payment Method", importance: 20 },
        { feature: "Internet Service", importance: 18 },
        { feature: "Tenure", importance: 15 },
        { feature: "Monthly Charges", importance: 12 },
        { feature: "Total Charges", importance: 10 },
        { feature: "Online Security", importance: 8 },
        { feature: "Tech Support", importance: 7 },
    ];

    const logisticMetrics = {
        accuracy: "82.4%",
        precision: "79.1%",
        recall: "73.8%",
        f1: "76.3%",
    };

    const forestMetrics = {
        accuracy: "85.0%",
        precision: "80.0%",
        recall: "75.0%",
        f1: "77.0%",
    };

    const modelData = {
        "Logistic Regression": {
            name: "Logistic Regression",
            description:
                "Simple, fast, and interpretable model that estimates churn probability using weighted linear combinations of input features.",
            type: "Classification",
            pipeline: "Preprocessing → Logistic Regression → Churn Probability",
            features: logisticFeatures,
            metrics: logisticMetrics,
        },
        "Random Forest": {
            name: "Random Forest",
            description:
                "Ensemble of decision trees that captures complex patterns in customer behavior for churn prediction.",
            type: "Classification",
            pipeline: "Preprocessing → Random Forest → Churn Probability",
            features: forestFeatures,
            metrics: forestMetrics,
        },
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            setLoading(false);
        }, 800);
        return () => clearTimeout(timer);
    }, []);

    const model = modelData[selectedModel];

    if (loading) {
        return (
            <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
            {/* Tabs */}
            <div className="flex space-x-4 mb-6">
                {Object.keys(modelData).map((modelName) => (
                    <button
                        key={modelName}
                        className={`px-4 py-2 rounded-md ${selectedModel === modelName
                            ? "bg-blue-600 text-white"
                            : "bg-gray-200 text-gray-700"
                            }`}
                        onClick={() => setSelectedModel(modelName)}
                    >
                        {modelName}
                    </button>
                ))}
            </div>

            {/* Model Overview */}
            <section className="mb-6">
                <h1 className="text-3xl font-bold text-blue-700 mb-2">
                    {model.name} Explanation
                </h1>
                <p className="text-gray-700 mb-1">
                    <strong>Type:</strong> {model.type}
                </p>
                <p className="text-gray-700 mb-1">
                    <strong>Description:</strong> {model.description}
                </p>
                <p className="text-gray-700">
                    <strong>Prediction Pipeline:</strong> {model.pipeline}
                </p>
            </section>

            {/* Feature Importance */}
            <section className="mb-6">
                <h2 className="text-2xl font-semibold text-gray-800 mb-2">Feature Importance</h2>

                {model.features && model.features.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart
                            data={model.features}
                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="feature" tick={{ fontSize: 12 }} />
                            <YAxis />
                            <Tooltip formatter={(value) => [`${value}%`, "Importance"]} />
                            <Bar dataKey="importance">
                                {model.features.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={
                                            [
                                                "#60a5fa", // blue-400
                                                "#34d399", // green-400
                                                "#fbbf24", // yellow-400
                                                "#f87171", // red-400
                                                "#a78bfa", // purple-400
                                                "#f472b6", // pink-400
                                                "#38bdf8", // sky-400
                                                "#fb923c", // orange-400
                                                "#4ade80", // emerald-400
                                                "#c084fc", // violet-400
                                            ][index % 10]
                                        }
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                ) : (
                    <p className="text-gray-500">No feature importance data available.</p>
                )}

                <p className="text-gray-700 mt-2">
                    These features have the highest impact on this model’s predictions.
                </p>
            </section>

            {/* Model Metrics */}
            <section className="mb-6">
                <h2 className="text-2xl font-semibold text-gray-800 mb-2">
                    Model Performance
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-green-50 p-4 rounded-lg shadow text-center">
                        <h3 className="text-sm text-gray-600 font-medium mb-1">Accuracy</h3>
                        <p className="text-2xl font-bold text-gray-800">{model.metrics.accuracy}</p>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg shadow text-center">
                        <h3 className="text-sm text-gray-600 font-medium mb-1">Precision</h3>
                        <p className="text-2xl font-bold text-gray-800">{model.metrics.precision}</p>
                    </div>
                    <div className="bg-yellow-50 p-4 rounded-lg shadow text-center">
                        <h3 className="text-sm text-gray-600 font-medium mb-1">Recall</h3>
                        <p className="text-2xl font-bold text-gray-800">{model.metrics.recall}</p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg shadow text-center">
                        <h3 className="text-sm text-gray-600 font-medium mb-1">F1-Score</h3>
                        <p className="text-2xl font-bold text-gray-800">{model.metrics.f1}</p>
                    </div>
                </div>

            </section>

            {/* SHAP Placeholder */}
            <section className="mb-6">
                <h2 className="text-2xl font-semibold text-gray-800 mb-2">
                    SHAP Explanation (Visual Example)
                </h2>
                <div className="border border-dashed border-gray-300 h-64 flex items-center justify-center">
                    <p className="text-gray-500">
                        SHAP waterfall plot for a sample customer goes here.
                    </p>
                </div>
            </section>

            {/* Caveats */}
            <section>
                <h2 className="text-2xl font-semibold text-gray-800 mb-2">
                    Caveats &amp; Limitations
                </h2>
                <p className="text-gray-700 mb-2">
                    Predictions depend on the quality and relevance of the input data. Results may
                    degrade over time if customer behavior evolves. Also, false positives may trigger
                    unnecessary retention actions, while false negatives may lead to missed risks.
                </p>
                <p className="text-gray-700">
                    Always pair predictions with human insight and regularly retrain the model with
                    updated data.
                </p>
            </section>
        </div>
    );
}
