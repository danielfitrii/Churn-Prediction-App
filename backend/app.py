"""Flask application for customer churn prediction API."""
import logging
from flask import Flask, request, jsonify
from flask_cors import CORS
from config import ALLOWED_ORIGINS, FLASK_CONFIG
from services.prediction_service import get_prediction_service
from utils.errors import PredictionError, ModelNotFoundError, InvalidInputError
from utils.validators import (
    validate_prediction_request,
    validate_model_key,
    validate_threshold_type
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)

# Configure CORS
CORS(
    app,
    resources={
        r"/*": {
            "origins": ALLOWED_ORIGINS,
            "methods": ["GET", "POST", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"],
            "supports_credentials": False
        }
    }
)


@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    return jsonify({'status': 'healthy', 'service': 'churn-prediction-api'}), 200


@app.route('/api/health', methods=['GET'])
def api_health_check():
    """Health check endpoint (Firebase /api proxy)."""
    return health_check()


@app.route('/predict', methods=['POST'])
def predict():
    """
    Prediction endpoint.
    
    Expected request body:
    {
        "features": [list of 14 feature values],
        "model": "logistic" | "randomForest" (optional, default: "logistic"),
        "threshold_type": "f1" | "cost" (optional, default: "f1")
    }
    """
    try:
        # Get request data
        data = request.get_json()
        
        # Validate request
        validate_prediction_request(data)
        
        # Extract and validate parameters
        features = data['features']
        model_key = data.get('model', 'logistic')
        threshold_type = data.get('threshold_type', 'f1')
        
        validate_model_key(model_key)
        validate_threshold_type(threshold_type)
        
        # Get prediction service and make prediction
        prediction_service = get_prediction_service()
        result = prediction_service.predict(
            features=features,
            model_key=model_key,
            threshold_type=threshold_type
        )
        
        logger.info(f"Prediction successful: model={model_key}, threshold_type={threshold_type}")
        return jsonify(result), 200
        
    except InvalidInputError as e:
        logger.warning(f"Invalid input: {str(e)}")
        return jsonify({'error': str(e)}), 400
    except ModelNotFoundError as e:
        logger.warning(f"Model not found: {str(e)}")
        return jsonify({'error': str(e)}), 404
    except PredictionError as e:
        logger.error(f"Prediction error: {str(e)}")
        return jsonify({'error': str(e)}), 500
    except Exception as e:
        logger.exception(f"Unexpected error: {str(e)}")
        return jsonify({'error': 'An unexpected error occurred'}), 500


@app.route('/api/predict', methods=['POST'])
def api_predict():
    """Prediction endpoint alias (Firebase /api proxy)."""
    return predict()


@app.errorhandler(404)
def not_found(error):
    """Handle 404 errors."""
    return jsonify({'error': 'Endpoint not found'}), 404


@app.errorhandler(405)
def method_not_allowed(error):
    """Handle 405 errors."""
    return jsonify({'error': 'Method not allowed'}), 405


if __name__ == '__main__':
    app.run(
        debug=FLASK_CONFIG['DEBUG'],
        port=FLASK_CONFIG['PORT']
    )