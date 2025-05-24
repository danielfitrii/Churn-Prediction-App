import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, LineChart, Line, ResponsiveContainer } from "recharts";
import { FaUsers, FaChartLine, FaClock, FaDollarSign, FaSearch } from "react-icons/fa";
import { collection, getDocs, doc, getDoc, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from './firebaseConfig';

export default function ChurnDashboard() {
  const [statistics, setStatistics] = useState({
    totalCustomers: 0,
    churnRate: 0,
    averageTenure: 0,
    averageMonthlyCharges: 0,
    recentPredictions: []
  });

  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState("month");
  const [searchQuery, setSearchQuery] = useState("");

  // State for chart data
  const [monthlyChurnData, setMonthlyChurnData] = useState([]);
  const [quarterlyChurnData, setQuarterlyChurnData] = useState([]);
  const [yearlyChurnData, setYearlyChurnData] = useState([]);
  const [churnByFactorData, setChurnByFactorData] = useState([]); // State for churn factors
  const [churnBySegmentData, setChurnBySegmentData] = useState([]); // State for churn by segment

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  // Helper function to highlight matching text
  const highlightText = (text, query) => {
    if (!query) return text;

    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase() ?
        <span key={i} className="bg-yellow-200">{part}</span> :
        part
    );
  };

  // Simulate data loading with real-time listeners
  useEffect(() => {
    setLoading(true);

    // Listener for Total Customers from metadata
    const counterRef = doc(db, 'metadata', 'counters');
    const unsubscribeCounter = onSnapshot(counterRef, (docSnapshot) => {
      const totalCustomers = docSnapshot.exists() ? docSnapshot.data().customerCount || 0 : 0;
      setStatistics(prevStats => ({
        ...prevStats,
        totalCustomers: totalCustomers
      }));
    }, (error) => {
      console.error("Error listening to counter document:", error);
      // Handle error if necessary
    });

    // Listener for all Predictions (for overall stats and charts)
    const predictionsCollectionRef = collection(db, 'predictions');
    const unsubscribeAllPredictions = onSnapshot(predictionsCollectionRef, (querySnapshot) => {
      let totalTenure = 0;
      let totalMonthlyCharges = 0;
      let totalChurnProbability = 0;
      const totalPredictions = querySnapshot.size;

      // Process data for overall statistics and charts
      const monthly = {};
      const quarterly = {};
      const yearly = {};
      const factors = {};
      const segments = {};
      let churnedCustomersCount = 0;

      querySnapshot.docs.forEach(doc => {
        const data = doc.data();
        const timestamp = data.timestamp?.toDate();
        const tenure = data.features?.tenure || 0;
        const monthlyCharges = data.features?.monthlyCharges || 0;
        const churnProbability = parseFloat(data.prediction?.churnProbability) || 0;
        const contract = data.features?.contract;
        const internetService = data.features?.internetService;
        const onlineSecurity = data.features?.onlineSecurity;
        const techSupport = data.features?.techSupport;
        const paymentMethod = data.features?.paymentMethod;

        totalTenure += tenure;
        totalMonthlyCharges += monthlyCharges;
        totalChurnProbability += churnProbability;

        // Data for Churn Rate Trend chart (using average probability)
        if (timestamp) {
          const year = timestamp.getFullYear();
          const month = timestamp.getMonth(); // 0-indexed
          const quarter = Math.floor(month / 3);

          // Monthly
          const monthKey = `${year}-${month}`;
          if (!monthly[monthKey]) {
            monthly[monthKey] = { totalProbability: 0, count: 0, name: `${timestamp.toLocaleString('default', { month: 'short' })} ${year}` };
          }
          monthly[monthKey].totalProbability += churnProbability;
          monthly[monthKey].count++;

          // Quarterly
          const quarterKey = `${year}-Q${quarter + 1}`;
          if (!quarterly[quarterKey]) {
            quarterly[quarterKey] = { totalProbability: 0, count: 0, name: `Q${quarter + 1} ${year}` };
          }
          quarterly[quarterKey].totalProbability += churnProbability;
          quarterly[quarterKey].count++;

          // Yearly
          const yearKey = `${year}`;
          if (!yearly[yearKey]) {
            yearly[yearKey] = { totalProbability: 0, count: 0, name: `${year}` };
          }
          yearly[yearKey].totalProbability += churnProbability;
          yearly[yearKey].count++;
        }

        // Data for Churn Factors and Segments charts (counting churned customers > 50% probability)
        if (churnProbability > 50) {
           churnedCustomersCount++; // Increment count of churned customers

          // Churn Factors (Example: Contract Type - Month-to-month)
          if (contract === "Month-to-month") { // Using >50% as churn for factors
             if (!factors["Month-to-month Contract"]) factors["Month-to-month Contract"] = { count: 0, description: "No long-term commitment, higher flexibility for customers to switch" };
             factors["Month-to-month Contract"].count++;
          }
          // Add other factors as needed based on your mock data and prediction features
          if (techSupport === "No") {
            if (!factors["No Tech Support"]) factors["No Tech Support"] = { count: 0, description: "Lack of technical assistance for service issues" };
            factors["No Tech Support"].count++;
          }
           if (internetService === "Fiber optic") {
            if (!factors["Fiber Optic Internet"]) factors["Fiber Optic Internet"] = { count: 0, description: "Premium internet service with higher expectations" };
            factors["Fiber Optic Internet"].count++;
          }
           if (paymentMethod === "Electronic check") {
            if (!factors["Electronic Check"]) factors["Electronic Check"] = { count: 0, description: "Manual recurring billing method requiring monthly action" };
            factors["Electronic Check"].count++;
          }
          if (onlineSecurity === "No") {
            if (!factors["No Online Security"]) factors["No Online Security"] = { count: 0, description: "Missing essential security features for online protection" };
            factors["No Online Security"].count++;
          }
          if (monthlyCharges > 80) { // Example threshold for high charges
             if (!factors["High Monthly Charge"]) factors["High Monthly Charge"] = { count: 0, description: "Premium pricing above market average" };
             factors["High Monthly Charge"].count++;
          }

          // Churn by Segment (Example: Tenure)
          let segmentName;
          if (tenure < 6) segmentName = "New Customers (<6mo)";
          else if (tenure >= 6 && tenure <= 24) segmentName = "Regular (6mo-2yr)";
          else segmentName = "Loyal (>2yr)";

          if (!segments[segmentName]) segments[segmentName] = { count: 0, name: segmentName };
          segments[segmentName].count++;
        }

      });

      // Calculate averages for KPI cards
      const averageTenure = totalPredictions > 0 ? (totalTenure / totalPredictions).toFixed(1) : 0;
      const averageMonthlyCharges = totalPredictions > 0 ? (totalMonthlyCharges / totalPredictions).toFixed(2) : 0;
      const averageChurnRate = totalPredictions > 0 ? (totalChurnProbability / totalPredictions).toFixed(1) : 0;

      setStatistics(prevStats => ({
        ...prevStats,
        churnRate: parseFloat(averageChurnRate),
        averageTenure: parseFloat(averageTenure),
        averageMonthlyCharges: parseFloat(averageMonthlyCharges),
        // recentPredictions is handled by processing all data below
      }));

      // Format data for charts
      const formatTrendData = (data) => Object.values(data)
        .map(item => ({ name: item.name, churnRate: item.count > 0 ? (item.totalProbability / item.count).toFixed(1) : 0 }))
        .sort((a, b) => { // Custom sort for months and quarters to be in chronological order
            if (a.name.startsWith('Q') && b.name.startsWith('Q')) {
                const [aQuarter, aYear] = a.name.split(' ');
                const [bQuarter, bYear] = b.name.split(' ');
                if (aYear !== bYear) return aYear.localeCompare(bYear);
                return aQuarter.localeCompare(bQuarter);
            } else if (a.name.length <= 3 && b.name.length <= 3) { // Assuming month names are 3 chars or less
                 const monthOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                 // Need year information to sort months correctly across years. Revisit data structure if needed.
                 // For now, sorting just by month name might not be accurate across years.
                 // Let's use the full timestamp for sorting if possible, or update the monthly data structure to include year.
                 // Let's adjust the monthly key and sorting to be year-month for proper sorting.
                 const reformatMonthlyForSort = Object.entries(monthly).map(([key, value]) => {
                    const [year, monthIndex] = key.split('-');
                    const date = new Date(year, parseInt(monthIndex));
                     return { name: `${date.toLocaleString('default', { month: 'short' })} ${year}`, churnRate: value.count > 0 ? (value.totalProbability / value.count).toFixed(1) : 0, timestamp: date.getTime() };
                 });
                 // Sort monthly data chronologically
                 return reformatMonthlyForSort.sort((a,b) => a.timestamp - b.timestamp);

            } else {
                return a.name.localeCompare(b.name); // Default localeCompare for yearly
            }
         });

      // Calculate percentages for factors and segments based on total churned customers
      const formatFactorData = (data) => Object.entries(data)
         .map(([name, item]) => ({
            name,
            value: churnedCustomersCount > 0 ? parseFloat(((item.count / churnedCustomersCount) * 100).toFixed(1)) : 0,
            description: item.description
         }))
         .sort((a, b) => b.value - a.value); // Sort by value (percentage)

       const formatSegmentData = (data) => Object.entries(data)
         .map(([name, item]) => ({
            name,
            value: churnedCustomersCount > 0 ? parseFloat(((item.count / churnedCustomersCount) * 100).toFixed(1)) : 0,
         }))
         .sort((a, b) => a.name.localeCompare(b.name)); // Sort by segment name


      setMonthlyChurnData(formatTrendData(monthly));
      setQuarterlyChurnData(formatTrendData(quarterly));
      setYearlyChurnData(formatTrendData(yearly));
      setChurnByFactorData(formatFactorData(factors));
      setChurnBySegmentData(formatSegmentData(segments));

      // Process and set data for Recent Predictions table (using all fetched data)
      const allPredictionsData = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            customer: data.customerInfo?.name || 'N/A',
            probability: parseFloat(data.prediction?.churnProbability) || 0,
            status: data.prediction?.riskLevel || 'N/A',
            date: data.timestamp?.toDate().toLocaleDateString() || 'N/A',
        };
      });

      // Sort all predictions by timestamp descending for the "Recent Predictions" table
      allPredictionsData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setStatistics(prevStats => ({
          ...prevStats,
          recentPredictions: allPredictionsData // Set all fetched and sorted predictions
      }));

      setLoading(false); // Set loading to false after all data is processed

    }, (error) => {
      console.error("Error listening to all predictions:", error);
      setLoading(false);
      // Handle error if necessary
    });

    // Listener for Recent Predictions (latest 5)
    // REMOVED: const recentPredictionsQuery = query(predictionsCollectionRef, orderBy('timestamp', 'desc')/*, limit(5)*/);
    // REMOVED: const unsubscribeRecentPredictions = onSnapshot(recentPredictionsQuery, (querySnapshot) => { ... });

    // Cleanup function to unsubscribe from listeners
    return () => {
      unsubscribeCounter();
      unsubscribeAllPredictions();
      // REMOVED: unsubscribeRecentPredictions();
    };

  }, []); // Empty dependency array means this effect runs once on mount and cleans up on unmount

  // Get chart data based on selected timeframe
  const getChartData = () => {
    switch (timeframe) {
      case "month":
        return monthlyChurnData;
      case "quarter":
        return quarterlyChurnData;
      case "year":
        return yearlyChurnData;
      default:
        return monthlyChurnData;
    }
  };

  // Filter predictions based on search query
  const filteredPredictions = statistics.recentPredictions.filter(prediction =>
    prediction.customer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-blue-700">Customer Churn Dashboard</h1>

        <div className="flex space-x-3">
          <button
            className={`px-4 py-2 rounded-md transition-all duration-200 ${timeframe === "month"
              ? "bg-blue-600 text-white font-bold shadow-lg"
              : "bg-gray-200 hover:bg-gray-300"
              }`}
            onClick={() => setTimeframe("month")}
          >
            Monthly
          </button>
          <button
            className={`px-4 py-2 rounded-md transition-all duration-200 ${timeframe === "quarter"
              ? "bg-blue-600 text-white font-bold shadow-lg"
              : "bg-gray-200 hover:bg-gray-300"
              }`}
            onClick={() => setTimeframe("quarter")}
          >
            Quarterly
          </button>
          <button
            className={`px-4 py-2 rounded-md transition-all duration-200 ${timeframe === "year"
              ? "bg-blue-600 text-white font-bold shadow-lg"
              : "bg-gray-200 hover:bg-gray-300"
              }`}
            onClick={() => setTimeframe("year")}
          >
            Yearly
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-20 w-20 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="bg-blue-50 p-6 rounded-lg shadow hover:shadow-lg transition-shadow duration-200 border-l-4 border-blue-600">
              <div className="flex items-center space-x-3 mb-2">
                <FaUsers className="text-2xl text-blue-600" />
                <h3 className="text-gray-500 text-sm font-medium">Total Customers</h3>
              </div>
              <p className="text-3xl font-bold text-gray-800">{statistics.totalCustomers.toLocaleString()}</p>
            </div>

            <div className="bg-red-50 p-6 rounded-lg shadow hover:shadow-lg transition-shadow duration-200 border-l-4 border-red-600">
              <div className="flex items-center space-x-3 mb-2">
                <FaChartLine className="text-2xl text-red-600" />
                <h3 className="text-gray-500 text-sm font-medium">Current Churn Rate</h3>
              </div>
              <p className="text-3xl font-bold text-red-600">{statistics.churnRate}%</p>
            </div>

            <div className="bg-green-50 p-6 rounded-lg shadow hover:shadow-lg transition-shadow duration-200 border-l-4 border-green-600">
              <div className="flex items-center space-x-3 mb-2">
                <FaClock className="text-2xl text-green-600" />
                <h3 className="text-gray-500 text-sm font-medium">Avg. Tenure (months)</h3>
              </div>
              <p className="text-3xl font-bold text-gray-800">{statistics.averageTenure}</p>
            </div>

            <div className="bg-purple-50 p-6 rounded-lg shadow hover:shadow-lg transition-shadow duration-200 border-l-4 border-purple-600">
              <div className="flex items-center space-x-3 mb-2">
                <FaDollarSign className="text-2xl text-purple-600" />
                <h3 className="text-gray-500 text-sm font-medium">Avg. Monthly Charges</h3>
              </div>
              <p className="text-3xl font-bold text-gray-800">${statistics.averageMonthlyCharges}</p>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Churn Trend Chart */}
            <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Churn Rate Trend</h2>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={getChartData()} margin={{ top: 5, right: 35, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
                  <Tooltip
                    formatter={(value) => [`${value}%`, "Churn Rate"]}
                    contentStyle={{ backgroundColor: 'white', border: '1px solid #ccc', borderRadius: '4px' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="churnRate"
                    stroke="#ff4d6d"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Churn Factors Chart */}
            <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Top Churn Factors</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={churnByFactorData} layout="vertical" margin={{ top: 5, right: 30, left: 30, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
                  <YAxis type="category" dataKey="name" width={120} />
                  <Tooltip
                    formatter={(value, name, props) => [
                      `% of Churned: ${value}%`,
                      <div>
                        <p className="font-bold">Factor: {name}</p>
                        <p className="text-sm text-gray-600">{props.payload.description}</p>
                      </div>
                    ]}
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                      padding: '10px'
                    }}
                  />
                  <Bar dataKey="value" fill="#8884d8">
                    {churnByFactorData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Bottom Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Segment Pie Chart */}
            <div className="col-span-1 bg-white p-6 rounded-lg shadow border border-gray-200">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Churn by Customer Segment</h2>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={churnBySegmentData}
                    cx="50%"
                    cy="45%" // move pie a bit up to give space for legend
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ value }) => `${value}%`}
                    labelLine={true}
                  >
                    {churnBySegmentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [`${value}%`, "Churned Customers"]}
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                    }}
                  />
                  <Legend
                    layout="horizontal"
                    verticalAlign="bottom"
                    align="center"
                    wrapperStyle={{ marginTop: '10px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Recent Predictions Table */}
            <div className="col-span-2 bg-white p-6 rounded-lg shadow border border-gray-200">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Recent Churn Predictions</h2>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search customers..."
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <FaSearch className="absolute left-3 top-3 text-gray-400" />
                </div>
              </div>
              <div className="overflow-x-auto overflow-y-auto h-80">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Probability</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredPredictions.map((prediction) => (
                      <tr
                        key={prediction.id}
                        className={`hover:bg-gray-50 cursor-pointer`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600 hover:text-blue-800">
                          {highlightText(prediction.customer, searchQuery)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{prediction.date}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{prediction.probability}%</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                            ${prediction.status === "Low Risk" ? "bg-green-100 text-green-800" :
                              prediction.status === "Medium Risk" ? "bg-yellow-100 text-yellow-800" :
                                "bg-red-100 text-red-800"}`}>
                            {prediction.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}