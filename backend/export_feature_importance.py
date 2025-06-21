import json
import os
from joblib import load
from sklearn.pipeline import Pipeline

# Paths
MODEL_DIR = os.path.join(os.path.dirname(__file__), 'models')
PUBLIC_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'public'))

LR_MODEL_PATH = os.path.join(MODEL_DIR, 'logreg_tomek_weighted_final_bundle.joblib')
RF_MODEL_PATH = os.path.join(MODEL_DIR, 'rf_tomek_weighted_final_bundle.joblib')

with open(os.path.join(PUBLIC_DIR, 'feature_names_lr.json')) as f:
    feature_names_lr = json.load(f)

with open(os.path.join(PUBLIC_DIR, 'feature_names_rf.json')) as f:
    feature_names_rf = json.load(f)

# Load model bundles
lr_bundle = load(LR_MODEL_PATH)
rf_bundle = load(RF_MODEL_PATH)

# Extract model pipeline
lr_pipeline = lr_bundle['pipeline']
rf_pipeline = rf_bundle['pipeline']

# Extract model from pipeline (assumes model is the last step)
lr_model = lr_pipeline.steps[-1][1]
rf_model = rf_pipeline.steps[-1][1]

# Logistic Regression coefficients
if hasattr(lr_model, 'coef_'):
    lr_coefs = lr_model.coef_[0]
    lr_importance = dict(zip(feature_names_lr, map(float, lr_coefs)))
else:
    raise AttributeError("Logistic Regression model does not have 'coef_' attribute.")

# Random Forest feature importances
if hasattr(rf_model, 'feature_importances_'):
    rf_importances = rf_model.feature_importances_
    rf_importance = dict(zip(feature_names_rf, map(float, rf_importances)))
else:
    raise AttributeError("Random Forest model does not have 'feature_importances_' attribute.")

# Write to JSON
with open(os.path.join(PUBLIC_DIR, 'feature_importance_lr.json'), 'w') as f:
    json.dump(lr_importance, f, indent=2)

with open(os.path.join(PUBLIC_DIR, 'feature_importance_rf.json'), 'w') as f:
    json.dump(rf_importance, f, indent=2)

print("Feature importances exported to public directory.")
