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

if not hasattr(lr_model, 'coef_') or not hasattr(rf_model, 'feature_importances_'):
    raise AttributeError("Model missing required attributes.")
lr_importance = dict(zip(feature_names_lr, map(float, lr_model.coef_[0])))
rf_importance = dict(zip(feature_names_rf, map(float, rf_model.feature_importances_)))

for filename, data in [('feature_importance_lr.json', lr_importance), ('feature_importance_rf.json', rf_importance)]:
    with open(os.path.join(PUBLIC_DIR, filename), 'w') as f:
        json.dump(data, f, indent=2)

print("Feature importances exported to public directory.")
