/**
 * Application constants
 */

// Model configurations
export const MODELS = {
  LOGISTIC_ADA: 'logisticAda',
  RANDOM_FOREST_ADA: 'randomForestAda',
  XGB_ADA_TOMEK: 'xgbAdaTomek',
};

export const MODEL_DISPLAY_NAMES = {
  [MODELS.LOGISTIC_ADA]: 'Logistic Regression (ADASYN)',
  [MODELS.RANDOM_FOREST_ADA]: 'Random Forest (ADASYN)',
  [MODELS.XGB_ADA_TOMEK]: 'XGBoost (ADASYN + Tomek)',
};

export const MODEL_INFO = {
  [MODELS.LOGISTIC_ADA]: {
    displayName: 'Logistic Regression (ADASYN)',
    description: `A linear model trained with ADASYN resampling. It’s typically more stable/interpretable, and can work well when you want a simple probability estimate.`,
    tip: 'Tip: Tenure, contract type, and internet service are often strong churn signals.',
  },
  [MODELS.RANDOM_FOREST_ADA]: {
    displayName: 'Random Forest (ADASYN)',
    description: `An ensemble model trained with ADASYN resampling. It can capture non-linear patterns and interactions between churn drivers.`,
    tip: 'Tip: This model can be more sensitive to combinations of factors.',
  },
  [MODELS.XGB_ADA_TOMEK]: {
    displayName: 'XGBoost (ADASYN + Tomek)',
    description: `Gradient-boosted trees trained with ADASYN + Tomek links. Often performs strongly on tabular churn datasets.`,
    tip: 'Tip: Try this when you want a strong general-purpose classifier.',
  },
};

// Threshold types
export const THRESHOLD_TYPES = {
  F1: 'f1',
  COST: 'cost',
};

export const THRESHOLD_DISPLAY_NAMES = {
  [THRESHOLD_TYPES.F1]: 'Accurate (F1-optimized)',
  [THRESHOLD_TYPES.COST]: 'Cost-effective',
};

// Risk levels
export const RISK_LEVELS = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  ERROR: 'Error',
};

// Risk level thresholds
export const RISK_THRESHOLDS = {
  LOW: 0.3,
  MEDIUM: 0.7,
};

// Contract types
export const CONTRACT_TYPES = {
  MONTH_TO_MONTH: 'Month-to-month',
  ONE_YEAR: 'One year',
  TWO_YEAR: 'Two year',
};

// Payment methods
export const PAYMENT_METHODS = {
  ELECTRONIC_CHECK: 'Electronic check',
  MAILED_CHECK: 'Mailed check',
  CREDIT_CARD_AUTO: 'Credit card (automatic)',
};

// Internet service types
export const INTERNET_SERVICE_TYPES = {
  DSL: 'DSL',
  FIBER_OPTIC: 'Fiber optic',
  NONE: 'No',
};

// Yes/No options
export const YES_NO_OPTIONS = {
  YES: 'Yes',
  NO: 'No',
};

// Malaysian states/regions
export const REGIONS = [
  { value: 'Johor', label: 'Johor' },
  { value: 'Kedah', label: 'Kedah' },
  { value: 'Kelantan', label: 'Kelantan' },
  { value: 'Melaka', label: 'Melaka' },
  { value: 'Negeri Sembilan', label: 'Negeri Sembilan' },
  { value: 'Pahang', label: 'Pahang' },
  { value: 'Perak', label: 'Perak' },
  { value: 'Perlis', label: 'Perlis' },
  { value: 'Pulau Pinang', label: 'Pulau Pinang' },
  { value: 'Sabah', label: 'Sabah' },
  { value: 'Sarawak', label: 'Sarawak' },
  { value: 'Selangor', label: 'Selangor' },
  { value: 'Terengganu', label: 'Terengganu' },
  { value: 'WPKualaLumpur', label: 'Wilayah Persekutuan (Kuala Lumpur)' },
  { value: 'WPLabuan', label: 'Wilayah Persekutuan (Labuan)' },
  { value: 'WPPutrajaya', label: 'Wilayah Persekutuan (Putrajaya)' },
];

// Gender options
export const GENDER_OPTIONS = [
  { value: 'Male', label: 'Male' },
  { value: 'Female', label: 'Female' },
  { value: 'Undisclosed', label: 'Undisclosed' },
];

// Form validation limits
export const FORM_LIMITS = {
  TENURE: { min: 0, max: 120 },
  MONTHLY_CHARGES: { min: 0, max: 200 },
  TOTAL_CHARGES: { min: 0 },
};

// Default form values
export const DEFAULT_FORM_DATA = {
  tenure: 12,
  monthlyCharges: 70,
  totalCharges: 840,
  seniorCitizen: YES_NO_OPTIONS.NO,
  phoneService: YES_NO_OPTIONS.YES,
  multipleLines: YES_NO_OPTIONS.NO,
  contract: CONTRACT_TYPES.MONTH_TO_MONTH,
  paymentMethod: PAYMENT_METHODS.ELECTRONIC_CHECK,
  internetService: INTERNET_SERVICE_TYPES.FIBER_OPTIC,
  onlineSecurity: YES_NO_OPTIONS.NO,
  techSupport: YES_NO_OPTIONS.NO,
  streamingTV: YES_NO_OPTIONS.YES,
  streamingMovies: YES_NO_OPTIONS.NO,
  paperlessBilling: YES_NO_OPTIONS.YES,
};

// API endpoints
export const API_ENDPOINTS = {
  PREDICT: '/predict',
  HEALTH: '/health',
};

