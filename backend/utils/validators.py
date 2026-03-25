"""Input validation utilities."""
from typing import List, Dict, Any
from .errors import InvalidInputError


def validate_prediction_request(data: Dict[str, Any]) -> None:
    """
    Validate prediction request data.
    
    Args:
        data: Request data dictionary
        
    Raises:
        InvalidInputError: If validation fails
    """
    if not data:
        raise InvalidInputError("Request body is required")
    
    if 'features' not in data:
        raise InvalidInputError("'features' field is required")
    
    features = data['features']
    
    if not isinstance(features, list):
        raise InvalidInputError("'features' must be a list")
    
    from ..config import FEATURE_NAMES

    if len(features) != len(FEATURE_NAMES):
        raise InvalidInputError(f"Expected {len(FEATURE_NAMES)} features, got {len(features)}")
    
    # Validate feature types
    for i, feature in enumerate(features):
        if not isinstance(feature, (int, float)):
            raise InvalidInputError(f"Feature at index {i} must be a number")


def validate_model_key(model_key: str) -> None:
    """
    Validate model key.
    
    Args:
        model_key: Model identifier
        
    Raises:
        InvalidInputError: If model key is invalid
    """
    from ..config import MODEL_CONFIG
    
    if model_key not in MODEL_CONFIG:
        raise InvalidInputError(f"Invalid model key: {model_key}. Must be one of {list(MODEL_CONFIG.keys())}")


def validate_threshold_type(threshold_type: str) -> None:
    """
    Validate threshold type.
    
    Args:
        threshold_type: Threshold type identifier
        
    Raises:
        InvalidInputError: If threshold type is invalid
    """
    from ..config import THRESHOLD_TYPES
    
    if threshold_type not in THRESHOLD_TYPES:
        raise InvalidInputError(f"Invalid threshold type: {threshold_type}. Must be one of {list(THRESHOLD_TYPES.keys())}")





