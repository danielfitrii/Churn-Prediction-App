# Customer Churn Prediction App

A full-stack web application for predicting customer churn using machine learning models. This application provides an intuitive interface for businesses to identify customers at risk of churning and take proactive retention measures.

![Tech Stack](https://img.shields.io/badge/React-19.0.0-61DAFB?logo=react)
![Python](https://img.shields.io/badge/Python-3.9-3776AB?logo=python)
![Flask](https://img.shields.io/badge/Flask-2.3-000000?logo=flask)
![Firebase](https://img.shields.io/badge/Firebase-11.10.0-FFCA28?logo=firebase)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4.1.4-38B2AC?logo=tailwind-css)

## 🚀 Features

### Core Functionality
- **Dual Model Support**: Choose between Logistic Regression and Random Forest models
  - **Logistic Regression**: Balanced approach with higher precision, ideal when false alarms are costly
  - **Random Forest**: High recall model that prioritizes catching potential churners
- **Prediction Strategies**: 
  - F1-optimized (Accurate): Balanced predictions for reliability
  - Cost-effective: Minimizes business costs
- **Customer Information Management**: Track customer details including name, age, gender, and region
- **Real-time Predictions**: Get instant churn probability scores with risk level classification (Low/Medium/High)

### Dashboard & Analytics
- **Comprehensive Dashboard**: View statistics and trends
  - Total customers tracked
  - Churn rate calculations
  - Average tenure and monthly charges
  - Recent predictions overview
- **Interactive Charts**: 
  - Monthly, quarterly, and yearly churn trends
  - Churn analysis by factors (contract type, payment method, etc.)
  - Demographic analysis (age, gender, region)
  - Segment-based churn patterns
- **Advanced Filtering**: Search and sort predictions by various criteria
- **Timeframe Analysis**: Analyze churn patterns across different time periods

### Model Explanation
- **SHAP Value Visualizations**: Understand how features contribute to predictions
- **Feature Importance Analysis**: See which factors most influence churn risk
- **Model Comparison**: Compare insights from both machine learning models

### User Management
- **Authentication System**: Secure user registration and login
- **User Profiles**: Manage user information and preferences
- **Session Management**: Configurable session timeout settings
- **Password Recovery**: Forgot password and reset functionality

### Additional Features
- **Retention Strategies**: Get personalized recommendations based on prediction results
- **Key Churn Factors**: Identify specific risk factors for each customer
- **Prediction History**: Track all predictions with timestamps
- **Mock Data Generation**: Generate sample data for testing and demonstration

## 🛠️ Tech Stack

### Frontend
- **React 19.0.0** - UI framework
- **Vite 6.3.1** - Build tool and dev server
- **React Router DOM 7.5.0** - Client-side routing
- **TailwindCSS 4.1.4** - Utility-first CSS framework
- **Recharts 2.15.2** - Chart library for data visualization
- **React Plotly.js 2.6.0** - Advanced plotting and visualization
- **React Toastify 11.0.5** - Toast notifications
- **Firebase 11.10.0** - Authentication and Firestore database

### Backend
- **Python 3.9** - Programming language
- **Flask 2.3+** - Web framework
- **Flask-CORS 3.0.10+** - Cross-origin resource sharing
- **scikit-learn 1.3+** - Machine learning library
- **Pandas** - Data manipulation
- **NumPy 1.26+** - Numerical computing
- **Joblib 1.2+** - Model serialization
- **Gunicorn** - WSGI HTTP server

### Deployment
- **Google Cloud Run** - Backend container hosting
- **Firebase Hosting** - Frontend static hosting
- **Firestore** - NoSQL database
- **Docker** - Containerization

## 📁 Project Structure

```
Churn-Prediction-App/
├── backend/
│   ├── app.py                    # Flask API server
│   ├── models/                   # Trained ML models
│   │   ├── logreg_tomek_weighted_final_bundle.joblib
│   │   └── rf_tomek_weighted_final_bundle.joblib
│   ├── requirements.txt          # Python dependencies
│   ├── convert.py                # Data conversion utilities
│   └── export_feature_importance.py
├── src/
│   ├── components/               # React components
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   ├── Settings.jsx
│   │   ├── Sidebar.jsx
│   │   ├── Header.jsx
│   │   └── ...
│   ├── context/                  # React context providers
│   │   ├── AuthContext.jsx
│   │   └── SettingsContext.jsx
│   ├── ChurnPredictionApp.jsx    # Main prediction interface
│   ├── ChurnDashboard.jsx        # Analytics dashboard
│   ├── ModelExplanation.jsx      # Model interpretability
│   ├── firebaseConfig.js         # Firebase configuration
│   └── firebaseHelpers.js        # Firebase utility functions
├── public/                       # Static assets
├── dist/                         # Build output
├── Dockerfile                    # Docker configuration for backend
├── firebase.json                 # Firebase configuration
├── firestore.rules               # Firestore security rules
├── package.json                  # Node.js dependencies
└── vite.config.js               # Vite configuration
```

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **Python** (3.9 or higher)
- **npm** or **yarn**
- **Google Cloud SDK** (for deployment)
- **Firebase CLI** (for deployment)
- **Docker** (optional, for local container testing)

## 🔧 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/churn-prediction-app.git
cd churn-prediction-app
```

### 2. Frontend Setup

```bash
# Install dependencies
npm install

# Create environment file
cp .env.example .env.local
```

Edit `.env.local` and add your Firebase configuration:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_BACKEND_URL=http://localhost:5000  # For local development
VITE_PROD_BACKEND_URL=your_production_backend_url  # For production
```

### 3. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 4. Firebase Setup

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Authentication (Email/Password)
3. Create a Firestore database
4. Update `firestore.rules` with your security rules
5. Copy your Firebase config to `.env.local`

## 🚀 Running Locally

### Start Backend Server

```bash
cd backend
python app.py
```

The backend will run on `http://localhost:5000`

### Start Frontend Development Server

```bash
npm run dev
```

The frontend will run on `http://localhost:5173`

## 📦 Building for Production

### Frontend Build

```bash
npm run build
```

This creates an optimized production build in the `dist/` directory.

### Backend Docker Build

```bash
docker build -t churn-prediction-backend .
```

## 🌐 Deployment

### Backend Deployment (Google Cloud Run)

```bash
# Deploy to Cloud Run
gcloud run deploy churn-prediction-flask-app \
  --source . \
  --region asia-southeast1 \
  --platform managed \
  --allow-unauthenticated \
  --port 8080
```

### Frontend Deployment (Firebase Hosting)

```bash
# Build the frontend
npm run build

# Deploy to Firebase
firebase deploy --only hosting
```

### Environment Variables

For production, set the following environment variables:

**Backend (Cloud Run):**
- `CORS_ORIGINS` - Comma-separated list of allowed origins (optional)

**Frontend (Build-time):**
- All `VITE_*` variables should be set in your CI/CD pipeline or build environment

## 📡 API Documentation

### Endpoint: `/predict`

**Method:** `POST`

**Request Body:**
```json
{
  "features": [12, 70, 840, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1, 1],
  "model": "logistic",
  "threshold_type": "f1"
}
```

**Response:**
```json
{
  "prediction": 1,
  "probability": 0.9046,
  "threshold": 0.6,
  "threshold_type": "f1"
}
```

**Feature Order:**
1. tenure
2. MonthlyCharges
3. TotalCharges
4. Contract_One year
5. Contract_Two year
6. PaymentMethod_Credit card (automatic)
7. PaymentMethod_Electronic check
8. PaymentMethod_Mailed check
9. InternetService_Fiber optic
10. InternetService_No
11. OnlineSecurity_Yes
12. TechSupport_Yes
13. StreamingTV_Yes
14. PaperlessBilling_Yes

## 🔒 Security

- Firestore security rules are configured in `firestore.rules`
- CORS is configured to allow only specified origins
- User authentication is handled by Firebase Auth
- All API endpoints validate input data

## 🧪 Testing

```bash
# Run linter
npm run lint

# Test backend (if tests are added)
cd backend
pytest
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- scikit-learn team for the machine learning libraries
- React and Vite communities
- Firebase for authentication and hosting services
- All contributors and users of this project

## 📧 Contact

For questions or support, please open an issue on GitHub.

---

**Note:** Make sure to keep your Firebase credentials and API keys secure. Never commit `.env` files to version control.

