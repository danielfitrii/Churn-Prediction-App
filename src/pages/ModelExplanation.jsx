import { useState, useEffect, useRef } from "react";
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
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faCheckCircle,
    faExclamationTriangle,
    faCrosshairs,
    faBinoculars,
    faBalanceScale
} from '@fortawesome/free-solid-svg-icons';

import LogisticRegressionShapImg from "../assets/LogisticRegression_SHAP.png";
import RandomForestShapImg from "../assets/RandomForest_SHAP.png";
import XGBoostShapImg from "../assets/XGBoost_SHAP.png";

const modelJsonFiles = {
    "Logistic Regression": { importance: "/feature_importance_lr.json" },
    "Random Forest":        { importance: "/feature_importance_rf.json" },
    "XGBoost":              { importance: "/feature_importance_xgb.json" },
};

const shapImageByModel = {
    "Logistic Regression": LogisticRegressionShapImg,
    "Random Forest":       RandomForestShapImg,
    "XGBoost":             XGBoostShapImg,
};

const featureDisplayNames = {
    "tenure": "Tenure",
    "MonthlyCharges": "MonthlyCharges",
    "TotalCharges": "TotalCharges",
    "Contract_Two year": "2yr Contract",
    "InternetService_Fiber optic": "InternetService_Fiber",
    "PaymentMethod_Electronic check": "PaymentMethod_Electronic",
    "InternetService_No": "InternetService_No",
    "Contract_One year": "1yr Contract",
    "OnlineSecurity_Yes": "OnlineSecurity_Yes",
    "TechSupport_Yes": "TechSupport_Yes",
    "PaperlessBilling_Yes": "PaperlessBilling_Yes",
    "StreamingTV_Yes": "StreamingTV_Yes",
    "PaymentMethod_Credit card (automatic)": "PaymentMethod_Credit",
    "PaymentMethod_Mailed check": "PaymentMethod_Mailed",
};

const modelData = {
    "Logistic Regression": {
        name: "Logistic Regression",
        description:
            "Simple, fast, and interpretable model that estimates churn probability using weighted linear combinations of input features.",
        type: "Classification",
        pipeline:
            "Preprocessing → One-hot encoding → Stratified Train/Test Split → Feature Selection (fit on train only) → Resampling: ADASYN (train only) → Hyperparameter tuning (RandomizedSearchCV + BayesSearchCV, recall) → Evaluation on hold-out test set (default threshold)",
        features: [
            { feature: "Contract_Two year", importance: 2 },
            { feature: "InternetService_No", importance: 1 },
            { feature: "Contract_One year", importance: 1 },
            { feature: "InternetService_Fiber optic", importance: 1 },
            { feature: "PaymentMethod_Electronic check", importance: 1 },
            { feature: "OnlineSecurity_Yes", importance: 0 },
            { feature: "StreamingTV_Yes", importance: 0 },
            { feature: "TechSupport_Yes", importance: 0 },
            { feature: "PaperlessBilling_Yes", importance: 0 },
            { feature: "PaymentMethod_Mailed check", importance: 0 },
            { feature: "PaymentMethod_Credit card (automatic)", importance: 0 },
            { feature: "tenure", importance: 0 },
            { feature: "MonthlyCharges", importance: 0 },
            { feature: "TotalCharges", importance: 0 },
        ],
        metrics: { accuracy: "70.0%", precision: "47.0%", recall: "83.0%", f1: "60.0%" },
        yAxisDomain: [-2, 1],
        yAxisTicks: [-2, -1.5, -1, -0.5, 0, 0.5, 1],
    },
    "Random Forest": {
        name: "Random Forest",
        description:
            "Ensemble of decision trees that captures complex patterns in customer behavior for churn prediction.",
        type: "Classification",
        pipeline:
            "Preprocessing → One-hot encoding → Stratified Train/Test Split → Feature Selection (fit on train only) → Resampling: ADASYN (train only) → Hyperparameter tuning (RandomizedSearchCV + BayesSearchCV, recall) → Evaluation on hold-out test set (default threshold)",
        features: [
            { feature: "tenure", importance: 24 },
            { feature: "MonthlyCharges", importance: 14 },
            { feature: "TotalCharges", importance: 14 },
            { feature: "Contract_Two year", importance: 11 },
            { feature: "InternetService_Fiber optic", importance: 10 },
            { feature: "PaymentMethod_Electronic check", importance: 7 },
            { feature: "InternetService_No", importance: 6 },
            { feature: "Contract_One year", importance: 5 },
            { feature: "OnlineSecurity_Yes", importance: 3 },
            { feature: "TechSupport_Yes", importance: 2 },
            { feature: "PaperlessBilling_Yes", importance: 2 },
            { feature: "StreamingTV_Yes", importance: 1 },
            { feature: "PaymentMethod_Credit card (automatic)", importance: 1 },
            { feature: "PaymentMethod_Mailed check", importance: 1 },
        ],
        metrics: { accuracy: "76.0%", precision: "53.0%", recall: "75.0%", f1: "62.0%" },
        yAxisDomain: [0, 0.25],
        yAxisTicks: [0, 0.05, 0.10, 0.15, 0.20, 0.25],
    },
    "XGBoost": {
        name: "XGBoost",
        description:
            "Gradient-boosted tree model that captures non-linear feature interactions for churn prediction.",
        type: "Classification",
        pipeline:
            "Preprocessing → One-hot encoding → Stratified Train/Test Split → Feature Selection (fit on train only) → Resampling: ADASYN + Tomek (train only) → Hyperparameter tuning (RandomizedSearchCV + BayesSearchCV, recall) → Evaluation on hold-out test set (default threshold)",
        features: [
            { feature: "tenure", importance: 18 },
            { feature: "MonthlyCharges", importance: 14 },
            { feature: "TotalCharges", importance: 12 },
            { feature: "Contract_Two year", importance: 10 },
            { feature: "InternetService_Fiber optic", importance: 9 },
            { feature: "PaymentMethod_Electronic check", importance: 7 },
            { feature: "InternetService_No", importance: 6 },
            { feature: "Contract_One year", importance: 5 },
            { feature: "OnlineSecurity_Yes", importance: 3 },
            { feature: "TechSupport_Yes", importance: 2 },
            { feature: "PaperlessBilling_Yes", importance: 2 },
            { feature: "StreamingTV_Yes", importance: 1 },
            { feature: "PaymentMethod_Credit card (automatic)", importance: 1 },
            { feature: "PaymentMethod_Mailed check", importance: 1 },
        ],
        metrics: { accuracy: "72.0%", precision: "48.0%", recall: "83.0%", f1: "61.0%" },
        yAxisDomain: [0, 0.25],
        yAxisTicks: [0, 0.05, 0.10, 0.15, 0.20, 0.25],
    },
};

const BAR_COLORS = ["#60a5fa", "#34d399", "#fbbf24", "#f87171", "#a78bfa", "#f472b6", "#38bdf8", "#fb923c"];

export default function ModelExplanation() {
    const [selectedModel, setSelectedModel] = useState("Logistic Regression");
    const [featureImportances, setFeatureImportances] = useState([]);

    const featureImportanceRef = useRef(null);
    const performanceRef = useRef(null);
    const shapRef = useRef(null);

    const model = modelData[selectedModel];

    useEffect(() => {
        const fetchImportances = async () => {
            try {
                const res = await fetch(modelJsonFiles[selectedModel].importance);
                if (!res.ok) throw new Error("Not found");
                const data = await res.json();
                const arr = Object.entries(data).map(([feature, importance]) => ({ feature, importance }));
                setFeatureImportances(arr);
            } catch {
                setFeatureImportances(model.features);
            }
        };
        fetchImportances();
    }, [selectedModel]);

    return (
        <div className="w-full px-8">

            {/* Tabs */}
            <div className="flex space-x-4 mb-6">
                {Object.keys(modelData).map((modelName) => (
                    <button
                        key={modelName}
                        className={`px-4 py-2 rounded-md ${
                            selectedModel === modelName
                                ? "bg-blue-600 text-white"
                                : "bg-gray-200 text-gray-700"
                        }`}
                        onClick={() => setSelectedModel(modelName)}
                    >
                        {modelName}
                    </button>
                ))}
            </div>

            <div className="p-6 bg-white rounded-lg shadow-lg">

                {/* Model Overview */}
                <section className="mb-6">
                    <h1 className="text-3xl font-bold text-blue-700 mb-4">
                        {model.name} Explanation
                    </h1>
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <table className="w-full">
                            <tbody>
                                <tr>
                                    <td className="py-2 font-semibold text-gray-700 w-1/4">Type:</td>
                                    <td className="py-2 text-gray-600">{model.type}</td>
                                </tr>
                                <tr>
                                    <td className="py-2 font-semibold text-gray-700">Description:</td>
                                    <td className="py-2 text-gray-600">{model.description}</td>
                                </tr>
                                <tr>
                                    <td className="py-2 font-semibold text-gray-700">Pipeline:</td>
                                    <td className="py-2 text-gray-600">{model.pipeline}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Feature Importance */}
                <section ref={featureImportanceRef} className="mb-6">
                    <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                        Feature Importance
                    </h2>
                    {featureImportances && featureImportances.length > 0 ? (
                        <div className="flex justify-center">
                            <div style={{ width: "100%", maxWidth: 900 }}>
                                <ResponsiveContainer width="100%" height={500}>
                                    <BarChart
                                        data={featureImportances}
                                        margin={{ top: 20, right: 50, left: 50, bottom: 90 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis
                                            dataKey="feature"
                                            tick={{ fontSize: 12, angle: -45, textAnchor: "end" }}
                                            interval={0}
                                            tickFormatter={(name) => featureDisplayNames[name] || name}
                                        />
                                        <YAxis
                                            domain={model.yAxisDomain}
                                            ticks={model.yAxisTicks}
                                            allowDataOverflow={false}
                                        />
                                        <Tooltip
                                            formatter={(value) => [value, "Importance"]}
                                            contentStyle={{
                                                backgroundColor: "rgba(255,255,255,0.9)",
                                                border: "1px solid #ccc",
                                                borderRadius: "4px",
                                                padding: "8px",
                                            }}
                                        />
                                        <Bar dataKey="importance">
                                            {featureImportances.map((_, index) => (
                                                <Cell
                                                    key={`cell-${index}`}
                                                    fill={BAR_COLORS[index % BAR_COLORS.length]}
                                                />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    ) : (
                        <p className="text-gray-500">No feature importance data available.</p>
                    )}
                </section>

                {/* Model Metrics */}
                <section ref={performanceRef} className="mb-6">
                    <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                        Model Performance
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-green-50 p-4 rounded-lg shadow border-l-4 border-green-500">
                            <div className="flex items-center">
                                <FontAwesomeIcon icon={faCheckCircle} className="h-6 w-6 text-green-500 mr-2" />
                                <div>
                                    <h3 className="text-sm text-gray-600 font-medium">Accuracy</h3>
                                    <p className="text-2xl font-bold text-gray-800">{model.metrics.accuracy}</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-blue-50 p-4 rounded-lg shadow border-l-4 border-blue-500">
                            <div className="flex items-center">
                                <FontAwesomeIcon icon={faCrosshairs} className="h-6 w-6 text-blue-500 mr-2" />
                                <div>
                                    <h3 className="text-sm text-gray-600 font-medium">Precision</h3>
                                    <p className="text-2xl font-bold text-gray-800">{model.metrics.precision}</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-yellow-50 p-4 rounded-lg shadow border-l-4 border-yellow-500">
                            <div className="flex items-center">
                                <FontAwesomeIcon icon={faBinoculars} className="h-6 w-6 text-yellow-500 mr-2" />
                                <div>
                                    <h3 className="text-sm text-gray-600 font-medium">Recall</h3>
                                    <p className="text-2xl font-bold text-gray-800">{model.metrics.recall}</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-purple-50 p-4 rounded-lg shadow border-l-4 border-purple-500">
                            <div className="flex items-center">
                                <FontAwesomeIcon icon={faBalanceScale} className="h-6 w-6 text-purple-500 mr-2" />
                                <div>
                                    <h3 className="text-sm text-gray-600 font-medium">F1-Score</h3>
                                    <p className="text-2xl font-bold text-gray-800">{model.metrics.f1}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* SHAP Summary Image */}
                <section ref={shapRef} className="mb-6">
                    <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                        SHAP Value Distribution
                    </h2>
                    <div className="bg-gray-50 p-4 rounded-lg mb-4">
                        <div className="flex flex-col space-y-2">
                            <div className="flex items-center">
                                <div className="w-4 h-4 bg-red-500 rounded mr-2"></div>
                                <span>Higher SHAP value → More likely to churn</span>
                            </div>
                            <div className="flex items-center">
                                <div className="w-4 h-4 bg-blue-500 rounded mr-2"></div>
                                <span>Lower SHAP value → Less likely to churn</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-center">
                        <img
                            key={selectedModel}
                            src={shapImageByModel[selectedModel]}
                            alt={`${selectedModel} SHAP summary`}
                            className="w-full max-w-4xl rounded-lg shadow"
                        />
                    </div>
                </section>

                {/* Model Limitations — hidden for now
                <section>
                    <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center">
                        <FontAwesomeIcon icon={faExclamationTriangle} className="h-6 w-6 mr-2 text-yellow-500" />
                        Model Limitations
                    </h2>
                    <div className="bg-yellow-50 p-4 rounded-lg">
                        <ul className="list-disc list-inside space-y-2 text-gray-700">
                            <li>Accuracy depends on input data quality and relevance</li>
                            <li>False positives may trigger unnecessary retention efforts</li>
                            <li>False negatives may lead to missed churn risks</li>
                        </ul>
                    </div>
                </section>
                */}

            </div>
        </div>
    );
}
