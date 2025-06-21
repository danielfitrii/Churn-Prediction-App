from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import numpy as np
import os
import pandas as pd

app = Flask(__name__)
# Allow both development and production origins
CORS(app, origins=["https://churn-prediction-ba530.web.app", "http://localhost:5173"])

# Load both models
models = {
    'logistic': joblib.load(os.path.join('models', 'logreg_tomek_weighted_final_bundle.joblib'))['pipeline'],
    'randomForest': joblib.load(os.path.join('models', 'rf_tomek_weighted_final_bundle.joblib'))['pipeline']
}

feature_names = [
    'tenure', 'MonthlyCharges', 'TotalCharges',
    'Contract_One year', 'Contract_Two year',
    'PaymentMethod_Credit card (automatic)', 'PaymentMethod_Electronic check',
    'PaymentMethod_Mailed check', 'InternetService_Fiber optic',
    'InternetService_No', 'OnlineSecurity_Yes', 'TechSupport_Yes',
    'StreamingTV_Yes', 'PaperlessBilling_Yes'
]

@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.get_json()
        features = data['features']
        threshold_type = data.get('threshold_type', 'f1')  # default to F1
        X = pd.DataFrame([features], columns=feature_names)
        model_key = data.get('model', 'logistic')
        if model_key not in models:
            return jsonify({'error': f"Model '{model_key}' not found."}), 400
        # Map model_key to correct filename
        bundle_filenames = {
            'logistic': 'logreg_tomek_weighted_final_bundle.joblib',
            'randomForest': 'rf_tomek_weighted_final_bundle.joblib'
        }
        bundle_filename = bundle_filenames[model_key]
        bundle = joblib.load(os.path.join('models', bundle_filename))
        model = bundle['pipeline']
        threshold = bundle['threshold_f1'] if threshold_type == 'f1' else bundle['threshold_cost']
        probability = model.predict_proba(X)[0][1]
        prediction = int(probability >= threshold)
        print(f"[Prediction Log] Model: {model_key}, Threshold type: {threshold_type}, Threshold: {threshold}, Probability: {probability}, Prediction: {prediction}")
        return jsonify({
            'prediction': prediction,
            'probability': float(probability),
            'threshold': float(threshold),
            'threshold_type': threshold_type
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 400

if __name__ == '__main__':
    app.run(debug=True, port=5000)