"""Configuration settings for the Flask application."""
import os
from pathlib import Path

# Base directory
BASE_DIR = Path(__file__).parent

# Models directory
MODELS_DIR = BASE_DIR / 'models'

# Model configurations
MODEL_CONFIG = {
    'logistic': {
        'filename': 'LR_ADA.joblib',
        'display_name': 'Logistic Regression (ADASYN)'
    },
    'randomForest': {
        'filename': 'RF_ADA.joblib',
        'display_name': 'Random Forest (ADASYN)'
    },
    'xgboost': {
        'filename': 'XGB_ADATomek.joblib',
        'display_name': 'XGBoost (ADASYN + Tomek)'
    },
}

# Feature names in the order expected by the model
FEATURE_NAMES = [
    'SeniorCitizen',
    'tenure',
    'PhoneService_Yes',
    'MultipleLines_Yes',
    'InternetService_Fiber optic',
    'InternetService_No',
    'OnlineSecurity_Yes',
    'StreamingTV_Yes',
    'StreamingMovies_Yes',
    'Contract_One year',
    'Contract_Two year',
    'PaymentMethod_Electronic check',
]

# CORS Configuration
ALLOWED_ORIGINS = [
    "https://churn-prediction-app-92228.web.app",
    "https://churn-prediction-ba530.web.app",
    "http://localhost:5173",
    "http://localhost:3000"
]

# Add additional origins from environment variable
if os.getenv('CORS_ORIGINS'):
    ALLOWED_ORIGINS.extend(os.getenv('CORS_ORIGINS').split(','))

# Flask Configuration
FLASK_CONFIG = {
    'DEBUG': os.getenv('FLASK_DEBUG', 'False').lower() == 'true',
    'PORT': int(os.getenv('PORT', 5000))
}

# Threshold types
THRESHOLD_TYPES = {
    'f1': 'threshold_f1',
    'cost': 'threshold_cost'
}

# Default threshold when models don't ship thresholds
DEFAULT_THRESHOLD = float(os.getenv('DEFAULT_THRESHOLD', 0.5))





