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
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faCheckCircle, 
    faExclamationTriangle, 
    faChartBar, 
    faFileAlt,
    faArrowUp,
    faArrowDown,
    faChartArea,
    faCrosshairs,
    faBinoculars,
    faBalanceScale
} from '@fortawesome/free-solid-svg-icons';

// Cache for storing processed data
const dataCache = {
    "Logistic Regression": null,
    "Random Forest": null
};

const modelJsonFiles = {
    "Logistic Regression": {
        shap: "/shap_values_lr.json",
        features: "/feature_names_lr.json",
        values: "/feature_values_lr.json",
        importance: "/feature_importance_lr.json"
    },
    "Random Forest": {
        shap: "/shap_values_rf.json",
        features: "/feature_names_rf.json",
        values: "/feature_values_rf.json",
        importance: "/feature_importance_rf.json"
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
    const [featureImportances, setFeatureImportances] = useState([]);
    
    // Create a ref for the worker
    const workerRef = useRef(null);

    // Add refs for scroll targets
    const featureImportanceRef = useRef(null);
    const performanceRef = useRef(null);
    const shapRef = useRef(null);

    const scrollToSection = (ref) => {
        ref.current?.scrollIntoView({ behavior: 'smooth' });
    };

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

    // Fetch feature importances when model changes
    useEffect(() => {
        const fetchImportances = async () => {
            try {
                const res = await fetch(modelJsonFiles[selectedModel].importance);
                if (!res.ok) throw new Error('Not found');
                const data = await res.json();
                // Convert object to array for recharts
                const arr = Object.entries(data).map(([feature, importance]) => ({ feature, importance }));
                setFeatureImportances(arr);
            } catch (e) {
                // fallback to hardcoded importances if fetch fails
                setFeatureImportances(modelData[selectedModel].features);
            }
        };
        fetchImportances();
    }, [selectedModel]);

    const modelData = {
        "Logistic Regression": {
            name: "Logistic Regression",
            description:
                "Simple, fast, and interpretable model that estimates churn probability using weighted linear combinations of input features.",
            type: "Classification",
            pipeline: "Preprocessing → RFE → Tomek Links → Logistic Regression → Threshold Tuning",
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
                { feature: "TotalCharges", importance: 0 }
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
                { feature: "PaymentMethod_Mailed check", importance: 1 }
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

    // Short display names for features
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
        "PaymentMethod_Mailed check": "PaymentMethod_Mailed"
    };

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
        <div className="max-w-4xl mx-auto">

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
                    <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center">
                        Feature Importance
                    </h2>

                    {featureImportances && featureImportances.length > 0 ? (
                        <div className="flex justify-center">
                            <div style={{ width: '100%', maxWidth: 900 }}>
                                <ResponsiveContainer width="100%" height={500}>
                                    <BarChart
                                        data={featureImportances}
                                        margin={{ top: 20, right: 50, left: 50, bottom: 90 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis 
                                            dataKey="feature" 
                                            tick={{ fontSize: 12, angle: -45, textAnchor: 'end' }}
                                            interval={0}
                                            tickFormatter={name => featureDisplayNames[name] || name}
                                        />
                                        <YAxis 
                                            domain={selectedModel === "Logistic Regression" ? [-2, 1] : [0, 0.25]}
                                            ticks={selectedModel === "Logistic Regression" ? [-2, -1.5, -1, -0.5, 0, 0.5, 1] : [0, 0.05, 0.10, 0.15, 0.20, 0.25]}
                                        />
                                        <Tooltip 
                                            formatter={(value) => [value, "Importance"]}
                                            contentStyle={{
                                                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                                border: '1px solid #ccc',
                                                borderRadius: '4px',
                                                padding: '8px'
                                            }}
                                        />
                                        <Bar dataKey="importance">
                                            {featureImportances.map((entry, index) => (
                                                <Cell
                                                    key={`cell-${index}`}
                                                    fill={
                                                        [
                                                            "#60a5fa",
                                                            "#34d399",
                                                            "#fbbf24",
                                                            "#f87171",
                                                            "#a78bfa",
                                                            "#f472b6",
                                                            "#38bdf8",
                                                            "#fb923c",
                                                        ][index % 8]
                                                    }
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
                    <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center">
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

                {/* SHAP Violin Plot */}
                <section ref={shapRef} className="mb-6">
                    <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center">
                        SHAP Value Distribution
                    </h2>
                    
                    {/* SHAP Legend */}
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
                                },
                                hovertemplate: 
                                    '<b>%{y}</b><br>' +
                                    'SHAP Value: %{x:.3f}<br>' +
                                    'Feature Value: %{marker.color:.3f}<br>' +
                                    '<extra></extra>'
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
            </div>
        </div>
    );
}
