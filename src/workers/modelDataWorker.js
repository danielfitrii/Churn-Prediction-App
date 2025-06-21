// Function to sample data with smaller sample size
const sampleData = (data, sampleSize = 500) => {
    if (data.length <= sampleSize) return data;
    const step = Math.floor(data.length / sampleSize);
    return data.filter((_, index) => index % step === 0);
};

// Process the data with optimizations
const processData = (shapData, featureData, valuesData) => {
    // Sample data with smaller size
    const sampledShapData = sampleData(shapData);
    const sampledValuesData = sampleData(valuesData);

    // Calculate feature importance more efficiently
    const featureImportance = featureData.map((feature, idx) => {
        const meanAbsShap = sampledShapData.reduce((sum, sample) => 
            sum + Math.abs(sample[idx]), 0) / sampledShapData.length;
        return { feature, meanAbsShap };
    });

    // Sort features by importance
    featureImportance.sort((a, b) => b.meanAbsShap - a.meanAbsShap);
    
    // Only keep top 10 features for better performance
    const topFeatures = featureImportance.slice(0, 10).map(item => item.feature);

    // Prepare data for visualization
    const processedData = {
        shapValues: sampledShapData,
        featureNames: featureData,
        featureValues: sampledValuesData,
        sortedFeatureNames: topFeatures
    };

    return processedData;
};

// Listen for messages from the main thread
self.addEventListener('message', async (e) => {
    const { modelName, urls } = e.data;
    
    try {
        // Fetch all data in parallel
        const [shapData, featureData, valuesData] = await Promise.all([
            fetch(urls.shap).then(res => res.json()),
            fetch(urls.features).then(res => res.json()),
            fetch(urls.values).then(res => res.json())
        ]);

        // Process the data
        const processedData = processData(shapData, featureData, valuesData);

        // Send the processed data back to the main thread
        self.postMessage({
            type: 'success',
            modelName,
            data: processedData
        });
    } catch (error) {
        // Send error back to the main thread
        self.postMessage({
            type: 'error',
            modelName,
            error: error.message
        });
    }
}); 