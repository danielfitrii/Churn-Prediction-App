from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import numpy as np
import os

app = Flask(__name__)
CORS(app, origins=["https://churn-prediction-ba530.web.app"])  # Apply CORS to the app with specific origin

# Load both models
models = {
    'logistic': joblib.load(os.path.join('models', 'lr_tomek_rfe_tuned.joblib')),
    'randomForest': joblib.load(os.path.join('models', 'rf_adasyn_rfe_tuned.joblib'))
}

@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.get_json()
        features = np.array(data['features']).reshape(1, -1)
        print('Received features:', features, 'Shape:', features.shape)
        model_key = data.get('model', 'logistic')
        if model_key not in models:
            return jsonify({'error': f"Model '{model_key}' not found."}), 400
        model = models[model_key]
        prediction = model.predict(features)
        probability = model.predict_proba(features)
        return jsonify({
            'prediction': int(prediction[0]),
            'probability': float(probability[0][1])
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 400

if __name__ == '__main__':
    app.run(debug=True, port=5000)