import { db } from '../firebaseConfig';
import { collection, addDoc, serverTimestamp, doc, setDoc } from 'firebase/firestore';

// Mock data generation functions
const generateRandomCustomer = (id) => {
  const firstNames = ['John', 'Jane', 'Michael', 'Sarah', 'David', 'Emma', 'James', 'Lisa', 'Robert', 'Maria'];
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];
  const regions = ['North', 'South', 'East', 'West', 'Central'];
  const genders = ['Male', 'Female', 'Undisclosed'];

  return {
    customerID: id,
    name: `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`,
    gender: genders[Math.floor(Math.random() * genders.length)],
    age: Math.floor(Math.random() * (70 - 18) + 18),
    region: regions[Math.floor(Math.random() * regions.length)]
  };
};

const generateRandomFeatures = () => {
  const contracts = ['Month-to-month', 'One year', 'Two year'];
  const paymentMethods = ['Electronic check', 'Credit card (automatic)', 'Mailed check'];
  const internetServices = ['Fiber optic', 'No', 'DSL'];
  const yesNoOptions = ['Yes', 'No'];

  return {
    tenure: Math.floor(Math.random() * 72) + 1, // 1-72 months
    monthlyCharges: Math.floor(Math.random() * 120) + 20, // $20-$140
    totalCharges: Math.floor(Math.random() * 10000) + 100, // $100-$10100
    contract: contracts[Math.floor(Math.random() * contracts.length)],
    paymentMethod: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
    internetService: internetServices[Math.floor(Math.random() * internetServices.length)],
    onlineSecurity: yesNoOptions[Math.floor(Math.random() * yesNoOptions.length)],
    techSupport: yesNoOptions[Math.floor(Math.random() * yesNoOptions.length)],
    streamingTV: yesNoOptions[Math.floor(Math.random() * yesNoOptions.length)],
    paperlessBilling: yesNoOptions[Math.floor(Math.random() * yesNoOptions.length)]
  };
};

const generateRandomPrediction = () => {
  const probability = Math.random();
  const riskLevel = probability < 0.3 ? 'Low' : probability < 0.7 ? 'Medium' : 'High';
  const models = ['Logistic Regression', 'Random Forest'];

  return {
    probability: probability,
    churnProbability: (probability * 100).toFixed(1),
    riskLevel: riskLevel,
    model: models[Math.floor(Math.random() * models.length)]
  };
};

// Function to insert mock data
export const insertMockData = async (userId, numberOfRecords = 50, startYear, endYear) => {
  try {
    // First, set up the counter
    // Note: The counter might need adjustment if inserting data across multiple runs
    // or for multiple users in a more complex scenario.
    await setDoc(doc(db, 'metadata', 'counters'), {
      customerCount: numberOfRecords // This will overwrite, might need to read first if adding to existing data
    });

    // Calculate a random timestamp within the given year range
    const generateRandomTimestamp = (start, end) => {
        const startDate = new Date(start, 0, 1); // January 1st of start year
        const endDate = new Date(end + 1, 0, 1); // January 1st of year after end year
        const startMillis = startDate.getTime();
        const endMillis = endDate.getTime();
        const randomMillis = startMillis + Math.random() * (endMillis - startMillis);
        return new Date(randomMillis);
    };

    // Determine the year range to use if not provided
    const currentYear = new Date().getFullYear();
    const dataStartYear = startYear || currentYear - 2; // Default to current year and 2 years prior
    const dataEndYear = endYear || currentYear;       // Default to current year

    // Insert mock predictions
    for (let i = 1; i <= numberOfRecords; i++) {
      const predictionData = {
        customerInfo: generateRandomCustomer(i),
        features: generateRandomFeatures(),
        prediction: generateRandomPrediction(),
        userId: userId,
        // Use a randomly generated timestamp within the range
        timestamp: generateRandomTimestamp(dataStartYear, dataEndYear)
      };

      await addDoc(collection(db, 'predictions'), predictionData);
      console.log(`Inserted prediction ${i} of ${numberOfRecords}`);
    }

    console.log('Successfully inserted mock data!');
  } catch (error) {
    console.error('Error inserting mock data:', error);
  }
}; 