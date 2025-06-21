import json
import os

# Set the path to your public directory
public_dir = os.path.join(os.getcwd(), 'public')

def load_json(filename):
    with open(os.path.join(public_dir, filename), 'r') as f:
        return json.load(f)

def save_json(filename, data):
    with open(os.path.join(public_dir, filename), 'w') as f:
        json.dump(data, f)

def ensure_list_of_lists(data):
    # If data is a list of dicts, convert to list of lists
    if isinstance(data, list) and len(data) > 0 and isinstance(data[0], dict):
        # Sort keys to ensure consistent order
        keys = sorted(data[0].keys())
        return [[row[k] for k in keys] for row in data]
    return data

def ensure_list_of_strings(data):
    # If data is a dict, convert to list of its values
    if isinstance(data, dict):
        return list(data.values())
    return data

# Process LR files
feature_values_lr = ensure_list_of_lists(load_json('feature_values_lr.json'))
shap_values_lr = ensure_list_of_lists(load_json('shap_values_lr.json'))
try:
    feature_names_lr = ensure_list_of_strings(load_json('feature_names_lr.json'))
except FileNotFoundError:
    feature_names_lr = None

save_json('feature_values_lr.json', feature_values_lr)
save_json('shap_values_lr.json', shap_values_lr)
if feature_names_lr:
    save_json('feature_names_lr.json', feature_names_lr)

# Process RF files
feature_values_rf = ensure_list_of_lists(load_json('feature_values_rf.json'))
shap_values_rf = ensure_list_of_lists(load_json('shap_values_rf.json'))
try:
    feature_names_rf = ensure_list_of_strings(load_json('feature_names_rf.json'))
except FileNotFoundError:
    feature_names_rf = None

save_json('feature_values_rf.json', feature_values_rf)
save_json('shap_values_rf.json', shap_values_rf)
if feature_names_rf:
    save_json('feature_names_rf.json', feature_names_rf)

print("Conversion complete! All files are now in the correct format for the frontend.")