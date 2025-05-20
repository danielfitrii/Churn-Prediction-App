import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, LineChart, Line, ResponsiveContainer } from "recharts";

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

  // Mock data for demonstrations
  const churnByFactorData = [
    { name: "Month-to-month Contract", value: 42 },
    { name: "No Tech Support", value: 27 },
    { name: "Fiber Optic Internet", value: 24 },
    { name: "Electronic Check", value: 23 },
    { name: "No Online Security", value: 19 },
    { name: "High Monthly Charge", value: 16 }
  ];
  
  const monthlyChurnData = [
    { name: "Jan", churnRate: 18.4 },
    { name: "Feb", churnRate: 17.9 },
    { name: "Mar", churnRate: 19.2 },
    { name: "Apr", churnRate: 18.7 },
    { name: "May", churnRate: 17.3 },
    { name: "Jun", churnRate: 16.8 },
    { name: "Jul", churnRate: 16.4 },
    { name: "Aug", churnRate: 15.9 },
    { name: "Sep", churnRate: 15.6 },
    { name: "Oct", churnRate: 16.1 },
    { name: "Nov", churnRate: 16.8 },
    { name: "Dec", churnRate: 17.5 }
  ];
  
  const quarterlyChurnData = [
    { name: "Q1", churnRate: 18.5 },
    { name: "Q2", churnRate: 17.6 },
    { name: "Q3", churnRate: 16.0 },
    { name: "Q4", churnRate: 16.8 }
  ];
  
  const yearlyChurnData = [
    { name: "2021", churnRate: 21.4 },
    { name: "2022", churnRate: 19.7 },
    { name: "2023", churnRate: 18.2 },
    { name: "2024", churnRate: 16.8 },
    { name: "2025", churnRate: 15.6 }
  ];
  
  const churnBySegmentData = [
    { name: "New Customers (<6mo)", value: 32 },
    { name: "Regular (6mo-2yr)", value: 21 },
    { name: "Loyal (>2yr)", value: 11 },
  ];
  
  const recentPredictions = [
    { id: 1, customer: "Alex Johnson", probability: 82, status: "High Risk", date: "2025-04-10" },
    { id: 2, customer: "Sarah Williams", probability: 12, status: "Low Risk", date: "2025-04-11" },
    { id: 3, customer: "Michael Chen", probability: 43, status: "Medium Risk", date: "2025-04-12" },
    { id: 4, customer: "Taylor Roberts", probability: 76, status: "High Risk", date: "2025-04-12" },
    { id: 5, customer: "Jamie Garcia", probability: 24, status: "Low Risk", date: "2025-04-13" }
  ];
  
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];
  
  // Simulate data loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setStatistics({
        totalCustomers: 7254,
        churnRate: 16.8,
        averageTenure: 17.2,
        averageMonthlyCharges: 64.76,
        recentPredictions: recentPredictions
      });
      setLoading(false);
    }, 800);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Get chart data based on selected timeframe
  const getChartData = () => {
    switch(timeframe) {
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
  
  return (
    <div className="max-w-6xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-blue-700">Customer Churn Dashboard</h1>
        
        <div className="flex space-x-2">
          <button 
            className={`px-4 py-2 rounded-md ${timeframe === "month" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
            onClick={() => setTimeframe("month")}
          >
            Monthly
          </button>
          <button 
            className={`px-4 py-2 rounded-md ${timeframe === "quarter" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
            onClick={() => setTimeframe("quarter")}
          >
            Quarterly
          </button>
          <button 
            className={`px-4 py-2 rounded-md ${timeframe === "year" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg shadow">
              <h3 className="text-gray-500 text-sm font-medium">Total Customers</h3>
              <p className="text-3xl font-bold text-gray-800">{statistics.totalCustomers.toLocaleString()}</p>
            </div>
            
            <div className="bg-red-50 p-4 rounded-lg shadow">
              <h3 className="text-gray-500 text-sm font-medium">Current Churn Rate</h3>
              <p className="text-3xl font-bold text-red-600">{statistics.churnRate}%</p>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg shadow">
              <h3 className="text-gray-500 text-sm font-medium">Avg. Tenure (months)</h3>
              <p className="text-3xl font-bold text-gray-800">{statistics.averageTenure}</p>
            </div>
            
            <div className="bg-purple-50 p-4 rounded-lg shadow">
              <h3 className="text-gray-500 text-sm font-medium">Avg. Monthly Charges</h3>
              <p className="text-3xl font-bold text-gray-800">${statistics.averageMonthlyCharges}</p>
            </div>
          </div>
          
          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Churn Trend Chart */}
            <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Churn Rate Trend</h2>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={getChartData()} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 25]} />
                  <Tooltip formatter={(value) => [`${value}%`, "Churn Rate"]} />
                  <Line type="monotone" dataKey="churnRate" stroke="#ff4d6d" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            
            {/* Churn Factors Chart */}
            <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Top Churn Factors</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={churnByFactorData} layout="vertical" margin={{ top: 5, right: 30, left: 140, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" domain={[0, 50]} />
                  <YAxis type="category" dataKey="name" width={120} />
                  <Tooltip formatter={(value) => [`${value}%`, "Contribution"]} />
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Segment Pie Chart */}
            <div className="col-span-1 bg-white p-4 rounded-lg shadow border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Churn by Customer Segment</h2>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={churnBySegmentData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({name, value}) => `${name}: ${value}%`}
                  >
                    {churnBySegmentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value}%`, "Churn Rate"]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            {/* Recent Predictions Table */}
            <div className="col-span-2 bg-white p-4 rounded-lg shadow border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Recent Churn Predictions</h2>
              <div className="overflow-x-auto">
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
                    {statistics.recentPredictions.map((prediction) => (
                      <tr key={prediction.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{prediction.customer}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{prediction.date}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{prediction.probability}%</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
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