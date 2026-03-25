"""Custom exception classes for the application."""


class PredictionError(Exception):
    """Base exception for prediction-related errors."""
    pass


class ModelNotFoundError(PredictionError):
    """Raised when a requested model is not found."""
    pass


class InvalidInputError(PredictionError):
    """Raised when input data is invalid."""
    pass


class ModelLoadError(PredictionError):
    """Raised when a model fails to load."""
    pass





