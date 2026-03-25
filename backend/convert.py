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

for model in ['lr', 'rf']:
    feature_values = ensure_list_of_lists(load_json(f'feature_values_{model}.json'))
    shap_values = ensure_list_of_lists(load_json(f'shap_values_{model}.json'))
    try:
        feature_names = ensure_list_of_strings(load_json(f'feature_names_{model}.json'))
    except FileNotFoundError:
        feature_names = None
    save_json(f'feature_values_{model}.json', feature_values)
    save_json(f'shap_values_{model}.json', shap_values)
    if feature_names:
        save_json(f'feature_names_{model}.json', feature_names)

print("Conversion complete! All files are now in the correct format for the frontend.")