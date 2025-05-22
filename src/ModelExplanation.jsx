import { useState, useEffect, useCallback, useRef } from "react";
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
import shapSummary from './assets/LogisticRegression_SHAP.png';
import Plot from "react-plotly.js";

// Cache for storing processed data
const dataCache = {
    "Logistic Regression": null,
    "Random Forest": null
};

const modelJsonFiles = {
    "Logistic Regression": {
        shap: "/shap_values_lr.json",
        features: "/feature_names_lr.json",
        values: "/feature_values_lr.json"
    },
    "Random Forest": {
        shap: "/shap_values_rf.json",
        features: "/feature_names_rf.json",
        values: "/feature_values_rf.json"
    }
};

// Function to sample data
const sampleData = (data, sampleSize = 1000) => {
    if (data.length <= sampleSize) return data;
    const step = Math.floor(data.length / sampleSize);
    return data.filter((_, index) => index % step === 0);
};

// Function to process and cache data
const processModelData = async (modelName) => {
    if (dataCache[modelName]) {
        return dataCache[modelName];
    }

    const { shap, features, values } = modelJsonFiles[modelName];
    
    try {
        const [shapData, featureData, valuesData] = await Promise.all([
            fetch(shap).then(res => res.json()),
            fetch(features).then(res => res.json()),
            fetch(values).then(res => res.json())
        ]);

        // Sample the data
        const sampledShapData = sampleData(shapData);
        const sampledValuesData = sampleData(valuesData);

        const featureImportance = featureData.map(feature => {
            const absShapValues = sampledShapData.map(sample => Math.abs(sample[feature]));
            const meanAbsShap = absShapValues.reduce((sum, val) => sum + val, 0) / absShapValues.length;
            return { feature, meanAbsShap };
        });

        featureImportance.sort((a, b) => b.meanAbsShap - a.meanAbsShap);
        const sortedFeatureNames = featureImportance.map(item => item.feature);

        const processedData = {
            shapValues: sampledShapData,
            featureNames: featureData,
            featureValues: sampledValuesData,
            sortedFeatureNames
        };

        // Cache the processed data
        dataCache[modelName] = processedData;
        return processedData;
    } catch (error) {
        console.error(`Error loading data for ${modelName}:`, error);
        throw error;
    }
};

export default function ModelExplanation() {
    const [loading, setLoading] = useState(true);
    const [selectedModel, setSelectedModel] = useState("Logistic Regression");
    const [shapValues, setShapValues] = useState([]);
    const [featureNames, setFeatureNames] = useState([]);
    const [featureValues, setFeatureValues] = useState([]);
    const [sortedFeatureNames, setSortedFeatureNames] = useState([]);
    const [error, setError] = useState(null);
    
    // Create a ref for the worker
    const workerRef = useRef(null);

    // Initialize worker
    useEffect(() => {
        console.log('Initializing Web Worker...');
        workerRef.current = new Worker(new URL('./workers/modelDataWorker.js', import.meta.url));
        
        // Cleanup worker on component unmount
        return () => {
            console.log('Terminating Web Worker...');
            workerRef.current?.terminate();
        };
    }, []);

    // Load model data using Web Worker
    const loadModelData = useCallback(async (modelName) => {
        console.log(`Loading data for model: ${modelName}`);
        setLoading(true);
        setError(null);

        // Check cache first
        if (dataCache[modelName]) {
            console.log('Using cached data');
            const cachedData = dataCache[modelName];
            setShapValues(cachedData.shapValues);
            setFeatureNames(cachedData.featureNames);
            setFeatureValues(cachedData.featureValues);
            setSortedFeatureNames(cachedData.sortedFeatureNames);
            setLoading(false);
            return;
        }

        console.log('Fetching new data from worker...');
        // Set up worker message handler
        workerRef.current.onmessage = (e) => {
            const { type, modelName: workerModelName, data, error: workerError } = e.data;
            
            if (type === 'success') {
                console.log('Worker processing completed successfully');
                // Cache the processed data
                dataCache[workerModelName] = data;
                
                // Update state with processed data
                setShapValues(data.shapValues);
                setFeatureNames(data.featureNames);
                setFeatureValues(data.featureValues);
                setSortedFeatureNames(data.sortedFeatureNames);
                setLoading(false);
            } else {
                console.error('Worker error:', workerError);
                setError(workerError || "Failed to load model data");
                setLoading(false);
            }
        };

        // Send data to worker for processing
        workerRef.current.postMessage({
            modelName,
            urls: modelJsonFiles[modelName]
        });
    }, []);

    // Initial load
    useEffect(() => {
        loadModelData(selectedModel);
    }, [selectedModel, loadModelData]);

    // Handle model change
    const handleModelChange = (modelName) => {
        setSelectedModel(modelName);
    };

    const modelData = {
        "Logistic Regression": {
            name: "Logistic Regression",
            description:
                "Simple, fast, and interpretable model that estimates churn probability using weighted linear combinations of input features.",
            type: "Classification",
            pipeline: "Preprocessing → RFE → Tomek Links → Logistic Regression → Threshold Tuning",
            features: [
                { feature: "tenure", importance: 24 },
                { feature: "Total Charges", importance: 21 },
                { feature: "Internet Service", importance: 20 },
                { feature: "Contract Type", importance: 19 },
                { feature: "Online Security", importance: 12 },
                { feature: "Tech Support", importance: 10 },
                { feature: "Streaming TV", importance: 8 },
                { feature: "Paperless Billing", importance: 6 }
            ],
            metrics: {
                accuracy: "78.0%",
                precision: "56.0%",
                recall: "74.0%",
                f1: "64.0%"
            },
        },
        "Random Forest": {
            name: "Random Forest",
            description:
                "Ensemble of decision trees that captures complex patterns in customer behavior for churn prediction.",
            type: "Classification",
            pipeline: "Preprocessing → RFE → ADASYN → Random Forest → Threshold Tuning",
            features: [
                { feature: "Total Charges", importance: 21 },
                { feature: "Monthly Charges", importance: 19 },
                { feature: "Tenure", importance: 17 },
                { feature: "Payment Method", importance: 13 },
                { feature: "Internet Service", importance: 11 },
                { feature: "Paperless Billing", importance: 9 },
                { feature: "Contract Type", importance: 8 },
                { feature: "Streaming TV", importance: 6 }
            ],
            metrics: {
                accuracy: "76.0%",
                precision: "55.0%",
                recall: "62.0%",
                f1: "58.0%"
            },
        },
    };

    const model = modelData[selectedModel];

    if (loading) {
        return (
            <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-blue-500"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
                <div className="text-red-500 text-center">
                    <p className="text-xl font-semibold mb-2">Error</p>
                    <p>{error}</p>
                    <button 
                        onClick={() => loadModelData(selectedModel)}
                        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                        Retry
                    </button>
                </div>
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
                        className={`px-4 py-2 rounded-md ${
                            selectedModel === modelName
                                ? "bg-blue-600 text-white"
                                : "bg-gray-200 text-gray-700"
                        }`}
                        onClick={() => handleModelChange(modelName)}
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
                    These features have the highest impact on this model's predictions.
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

            {/* SHAP Violin Plot */}
            <section className="mb-6">
                <h2 className="text-2xl font-semibold text-gray-800 mb-2">
                    SHAP Value Distribution (Violin Plot)
                </h2>
                {shapValues.length && featureNames.length && featureValues.length && sortedFeatureNames.length ? (
                    <Plot
                        data={sortedFeatureNames.map((feature, i) => ({
                            type: "scatter",
                            mode: "markers",
                            x: shapValues.map(sample => sample[feature]),
                            y: Array(shapValues.length).fill(feature),
                            name: feature,
                            marker: {
                                color: featureValues.map(sample => sample[feature]),
                                colorscale: 'RdBu',
                                showscale: i === 0,
                                colorbar: i === 0 ? {
                                    title: 'Feature value',
                                    thickness: 15,
                                    x: 1.05,
                                } : undefined,
                                size: 4,
                                opacity: 0.6,
                                line: {
                                    width: 0.2,
                                    color: 'gray'
                                }
                            }
                        }))}
                        layout={{
                            title: "SHAP Value Distribution per Feature",
                            xaxis: { 
                                title: "SHAP value (impact on model output)",
                                autorange: true,
                                fixedrange: true
                            },
                            yaxis: { 
                                title: "Feature", 
                                type: 'category', 
                                autorange: 'reversed',
                                fixedrange: true
                            },
                            margin: {
                                l: Math.max(...sortedFeatureNames.map(f => f.length)) * 7.5,
                                r: 120, 
                                t: 40, 
                                b: 40
                            },
                            height: 600,
                            showlegend: false,
                            hovermode: 'closest',
                            dragmode: false,
                            modebar: {
                                remove: ['lasso2d', 'select2d', 'zoom2d', 'pan2d']
                            }
                        }}
                        config={{ 
                            responsive: true,
                            displayModeBar: false,
                            staticPlot: false,
                            displaylogo: false,
                            modeBarButtonsToRemove: ['lasso2d', 'select2d', 'zoom2d', 'pan2d'],
                            scrollZoom: false
                        }}
                        style={{ width: "100%" }}
                        useResizeHandler={true}
                        frames={[]}
                    />
                ) : (
                    <div>Loading SHAP violin plot...</div>
                )}
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
