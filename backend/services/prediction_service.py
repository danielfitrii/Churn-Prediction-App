"""Prediction service for handling ML model predictions."""
import joblib
import pandas as pd
from pathlib import Path
from typing import Dict, Any, Optional
from config import MODELS_DIR, MODEL_CONFIG, FEATURE_NAMES, THRESHOLD_TYPES, DEFAULT_THRESHOLD
from utils.errors import ModelNotFoundError, ModelLoadError, InvalidInputError


class PredictionService:
    """Service for handling prediction operations."""
    
    def __init__(self):
        """Initialize the prediction service."""
        self._model_cache: Dict[str, Any] = {}
        self._bundle_cache: Dict[str, Any] = {}
    
    def _load_model_bundle(self, model_key: str) -> Any:
        """
        Load model bundle from disk with caching.
        
        Args:
            model_key: Model identifier
            
        Returns:
            Loaded model object (bundle dict, pipeline, or estimator)
            
        Raises:
            ModelNotFoundError: If model key is invalid
            ModelLoadError: If model fails to load
        """
        if model_key not in MODEL_CONFIG:
            raise ModelNotFoundError(f"Model '{model_key}' not found")
        
        # Check cache first
        if model_key in self._bundle_cache:
            return self._bundle_cache[model_key]
        
        try:
            filename = MODEL_CONFIG[model_key]['filename']
            bundle_path = MODELS_DIR / filename
            
            if not bundle_path.exists():
                raise ModelLoadError(f"Model file not found: {bundle_path}")
            
            bundle = joblib.load(bundle_path)
            self._bundle_cache[model_key] = bundle
            return bundle
            
        except Exception as e:
            raise ModelLoadError(f"Failed to load model '{model_key}': {str(e)}")
    
    def predict(
        self,
        features: list,
        model_key: str = 'logistic',
        threshold_type: str = 'f1'
    ) -> Dict[str, Any]:
        """
        Make a prediction using the specified model.
        
        Args:
            features: List of feature values
            model_key: Model identifier ('logistic' or 'randomForest')
            threshold_type: Threshold type ('f1' or 'cost')
            
        Returns:
            Dictionary containing prediction results
            
        Raises:
            ModelNotFoundError: If model key is invalid
            InvalidInputError: If input is invalid
            ModelLoadError: If model fails to load
        """
        # Load model bundle / estimator
        bundle = self._load_model_bundle(model_key)

        # Resolve model object
        if isinstance(bundle, dict):
            model = bundle.get('pipeline')
            if model is None:
                raise ModelLoadError(f"Model bundle for '{model_key}' missing 'pipeline'")
        else:
            model = bundle

        # Resolve threshold (new models may not ship thresholds)
        threshold_key = THRESHOLD_TYPES.get(threshold_type, 'threshold_f1')
        if isinstance(bundle, dict) and threshold_key in bundle:
            threshold = float(bundle[threshold_key])
        else:
            threshold = float(DEFAULT_THRESHOLD)
        
        # Prepare features as DataFrame
        if len(features) != len(FEATURE_NAMES):
            raise InvalidInputError(
                f"Expected {len(FEATURE_NAMES)} features, got {len(features)}"
            )
        
        X = pd.DataFrame([features], columns=FEATURE_NAMES)
        
        # Make prediction
        try:
            probability = model.predict_proba(X)[0][1]
            prediction = int(probability >= threshold)
            
            return {
                'prediction': prediction,
                'probability': float(probability),
                'threshold': float(threshold),
                'threshold_type': threshold_type
            }
        except Exception as e:
            raise InvalidInputError(f"Prediction failed: {str(e)}")


# Singleton instance
_prediction_service: Optional[PredictionService] = None


def get_prediction_service() -> PredictionService:
    """Get the singleton prediction service instance."""
    global _prediction_service
    if _prediction_service is None:
        _prediction_service = PredictionService()
    return _prediction_service





