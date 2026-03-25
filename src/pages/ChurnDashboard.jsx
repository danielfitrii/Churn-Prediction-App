import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, LineChart, Line, ResponsiveContainer } from "recharts";
import { FaUsers, FaChartLine, FaClock, FaDollarSign, FaSearch } from "react-icons/fa";
import { collection, getDocs, doc, query, onSnapshot, where } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useAuth } from '../context/AuthContext';
import MockDataButton from '../components/MockDataButton';
import { toast } from 'react-toastify';
import { LightBulbIcon } from '@heroicons/react/24/solid';


export default function ChurnDashboard() {
  const { user } = useAuth();
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
  const [insightsOpen, setInsightsOpen] = useState(false);

  const [sortColumn, setSortColumn] = useState('timestamp');
  const [sortOrder, setSortOrder] = useState('desc');

  const [monthlyChurnData, setMonthlyChurnData] = useState([]);
  const [quarterlyChurnData, setQuarterlyChurnData] = useState([]);
  const [yearlyChurnData, setYearlyChurnData] = useState([]);
  const [churnByFactorData, setChurnByFactorData] = useState([]);
  const [churnBySegmentData, setChurnBySegmentData] = useState([]);

  const [churnByAgeData, setChurnByAgeData] = useState([]);
  const [churnByGenderData, setChurnByGenderData] = useState([]);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];
  const GENDER_COLORS = ['#36A2EB', '#FF6384', '#B39DDB'];

  const highlightText = (text, query) => {
    if (!query) return text;
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase() ?
        <span key={i} className="bg-yellow-200">{part}</span> :
        part
    );
  };

  const handleHeaderClick = (column) => {
    if (sortColumn === column) {
      if (sortOrder === 'asc') {
        setSortOrder('desc');
      } else {
        setSortColumn('timestamp');
        setSortOrder('desc');
      }
    } else {
      setSortColumn(column);
      setSortOrder('asc');
    }
  };

  useEffect(() => {
    if (!user?.uid) {
      setStatistics({
        totalCustomers: 0,
        churnRate: 0,
        averageTenure: 0,
        averageMonthlyCharges: 0,
        recentPredictions: []
      });
      setMonthlyChurnData([]);
      setQuarterlyChurnData([]);
      setYearlyChurnData([]);
      setChurnByFactorData([]);
      setChurnBySegmentData([]);
      setChurnByAgeData([]);
      setChurnByGenderData([]);
      setLoading(false);
      return;
    }
    setLoading(true);

    const counterRef = doc(db, 'metadata', 'counters');
    const unsubscribeCounter = onSnapshot(counterRef, (docSnapshot) => {
      const totalCustomers = docSnapshot.exists() ? docSnapshot.data().customerCount || 0 : 0;
      setStatistics(prevStats => ({
        ...prevStats,
        totalCustomers: totalCustomers
      }));
    }, (error) => {
      console.error("Error listening to counter document:", error);
    });

    const predictionsQuery = query(collection(db, 'predictions'), where('userId', '==', user.uid));
    const unsubscribeAllPredictions = onSnapshot(predictionsQuery, (querySnapshot) => {
      let totalTenure = 0;
      let totalMonthlyCharges = 0;
      let totalChurnProbability = 0;
      const totalPredictions = querySnapshot.size;

      setStatistics(prevStats => ({
        ...prevStats,
        totalCustomers: totalPredictions
      }));

      const monthly = {};
      const quarterly = {};
      const yearly = {};
      const factors = {};
      const segments = {};
      let churnedCustomersCount = 0;

      const ageData = {};
      const genderData = {};

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

        if (timestamp) {
          const year = timestamp.getFullYear();
          const month = timestamp.getMonth();
          const quarter = Math.floor(month / 3);
          const displayYearShort = String(year).slice(-2);

          const monthKey = `${year}-${month}`;
          const monthLabel = `${timestamp.toLocaleString('default', { month: 'short' })} '${displayYearShort}`;
          if (!monthly[monthKey]) {
            monthly[monthKey] = { totalProbability: 0, count: 0, name: monthLabel, sortKey: year * 12 + month };
          }
          monthly[monthKey].totalProbability += churnProbability;
          monthly[monthKey].count++;

          const quarterKey = `${year}-Q${quarter + 1}`;
          const quarterLabel = `Q${quarter + 1} '${displayYearShort}`;
          if (!quarterly[quarterKey]) {
            quarterly[quarterKey] = { totalProbability: 0, count: 0, name: quarterLabel, sortKey: year * 4 + quarter };
          }
          quarterly[quarterKey].totalProbability += churnProbability;
          quarterly[quarterKey].count++;

          const yearKey = `${year}`;
          if (!yearly[yearKey]) {
            yearly[yearKey] = { totalProbability: 0, count: 0, name: `${year}`, sortKey: year };
          }
          yearly[yearKey].totalProbability += churnProbability;
          yearly[yearKey].count++;
        }

        if (churnProbability > 50) {
          churnedCustomersCount++;

          if (contract === "Month-to-month") {
            if (!factors["Month-to-month Contract"]) factors["Month-to-month Contract"] = { count: 0, description: "No long-term commitment, higher flexibility for customers to switch." };
            factors["Month-to-month Contract"].count++;
          }
          if (techSupport === "No") {
            if (!factors["No Tech Support"]) factors["No Tech Support"] = { count: 0, description: "Lack of technical assistance for service issues." };
            factors["No Tech Support"].count++;
          }
          if (internetService === "Fiber optic") {
            if (!factors["Fiber Optic Internet"]) factors["Fiber Optic Internet"] = { count: 0, description: "Premium internet service with higher expectations." };
            factors["Fiber Optic Internet"].count++;
          }
          if (paymentMethod === "Electronic check") {
            if (!factors["Electronic Check"]) factors["Electronic Check"] = { count: 0, description: "Manual recurring billing method requiring monthly action." };
            factors["Electronic Check"].count++;
          }
          if (onlineSecurity === "No") {
            if (!factors["No Online Security"]) factors["No Online Security"] = { count: 0, description: "Missing essential security features for online protection." };
            factors["No Online Security"].count++;
          }
          if (monthlyCharges > 80) {
            if (!factors["High Monthly Charge"]) factors["High Monthly Charge"] = { count: 0, description: "Premium pricing above market average." };
            factors["High Monthly Charge"].count++;
          }

          const age = Number(data.customerInfo?.age) || 0;
          const gender = data.customerInfo?.gender || 'Unknown';

          let ageGroup;
          if (age >= 18 && age <= 30) ageGroup = '18-30';
          else if (age > 30 && age <= 50) ageGroup = '31-50';
          else if (age > 50) ageGroup = '51+';
          else ageGroup = 'Unknown';

          if (!ageData[ageGroup]) {
            ageData[ageGroup] = { total: 0, churned: 0, name: ageGroup };
          }
          ageData[ageGroup].total++;
          if (churnProbability > 50) {
            ageData[ageGroup].churned++;
          }

          if (!genderData[gender]) {
            genderData[gender] = { total: 0, churned: 0, name: gender };
          }
          genderData[gender].total++;
          if (churnProbability > 50) {
            genderData[gender].churned++;
          }
        }
      });

      const averageTenure = totalPredictions > 0 ? (totalTenure / totalPredictions).toFixed(1) : 0;
      const averageMonthlyCharges = totalPredictions > 0 ? (totalMonthlyCharges / totalPredictions).toFixed(2) : 0;
      const averageChurnRate = totalPredictions > 0 ? (totalChurnProbability / totalPredictions).toFixed(1) : 0;

      setStatistics(prevStats => ({
        ...prevStats,
        churnRate: parseFloat(averageChurnRate),
        averageTenure: parseFloat(averageTenure),
        averageMonthlyCharges: parseFloat(averageMonthlyCharges),
      }));

      const formatTrendData = (data) => Object.values(data)
        .map(item => ({
          name: item.name,
          churnRate: item.count > 0 ? (item.totalProbability / item.count).toFixed(1) : 0,
          sortKey: item.sortKey
        }))
        .sort((a, b) => {
          if (typeof a.sortKey === 'number' && typeof b.sortKey === 'number') return a.sortKey - b.sortKey;
          return a.name.localeCompare(b.name);
        });

      const formatFactorData = (data) => Object.entries(data)
        .map(([name, item]) => ({
          name,
          value: churnedCustomersCount > 0 ? parseFloat(((item.count / churnedCustomersCount) * 100).toFixed(1)) : 0,
          description: item.description
        }))
        .sort((a, b) => b.value - a.value);

      const formatAgeData = (data) => Object.values(data)
        .map(item => ({
          name: item.name,
          value: churnedCustomersCount > 0 ? parseFloat(((item.churned / churnedCustomersCount) * 100).toFixed(1)) : 0
        }))
        .sort((a, b) => a.name.localeCompare(b.name));

      const formatGenderData = (data) => Object.values(data)
        .map(item => ({
          name: item.name,
          value: churnedCustomersCount > 0 ? parseFloat(((item.churned / churnedCustomersCount) * 100).toFixed(1)) : 0
        }))
        .sort((a, b) => {
          const order = ['Male', 'Female', 'Undisclosed'];
          return order.indexOf(a.name) - order.indexOf(b.name);
        });

      setMonthlyChurnData(formatTrendData(monthly));
      setQuarterlyChurnData(formatTrendData(quarterly));
      setYearlyChurnData(formatTrendData(yearly));
      setChurnByFactorData(formatFactorData(factors));
      setChurnByAgeData(formatAgeData(ageData));
      setChurnByGenderData(formatGenderData(genderData));

      const allPredictionsData = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          customer: data.customerInfo?.name || 'N/A',
          probability: parseFloat(data.prediction?.churnProbability) || 0,
          status: data.prediction?.riskLevel || 'N/A',
          model: data.prediction?.model || 'N/A',
          date: data.timestamp?.toDate().toLocaleDateString() || 'N/A',
          timestamp: data.timestamp,
          region: data.customerInfo?.region || 'N/A',
        };
      });

      setStatistics(prevStats => ({
        ...prevStats,
        recentPredictions: allPredictionsData
      }));

      setLoading(false);

    }, (error) => {
      console.error("Error listening to all predictions:", error);
      setLoading(false);
    });

    return () => {
      unsubscribeCounter();
      unsubscribeAllPredictions();
    };

  }, [user]);

  const getChartData = () => {
    switch (timeframe) {
      case "month": return monthlyChurnData;
      case "quarter": return quarterlyChurnData;
      case "year": return yearlyChurnData;
      default: return monthlyChurnData;
    }
  };

  const filteredPredictions = statistics.recentPredictions.filter(prediction =>
    prediction.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
    prediction.region.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sortedPredictions = filteredPredictions.sort((a, b) => {
    const aValue = a[sortColumn];
    const bValue = b[sortColumn];
    let comparison = 0;

    if (sortColumn === 'probability') {
      comparison = aValue - bValue;
    } else if (sortColumn === 'date' || sortColumn === 'timestamp') {
      const aTime = a.timestamp?.toDate().getTime() || 0;
      const bTime = b.timestamp?.toDate().getTime() || 0;
      comparison = aTime - bTime;
    } else {
      if (aValue > bValue) comparison = 1;
      else if (aValue < bValue) comparison = -1;
    }

    return sortOrder === 'desc' ? comparison * -1 : comparison;
  });

  function getDashboardInsights() {
    const p1 = [], p2 = [], p3 = [], p4 = [];

    if (statistics.churnRate > 70) {
      p1.push("Churn rate is very high. Immediate action is recommended.");
    } else if (statistics.churnRate > 50) {
      p1.push("Churn rate is above average. Consider reviewing retention strategies.");
    }
    if (churnByFactorData.length > 0) {
      const topFactor = churnByFactorData[0];
      p1.push(`Top churn factor: ${topFactor.name} (${topFactor.value}%). ${topFactor.description || ''}`);
    }
    if (statistics.averageMonthlyCharges > 80) {
      p1.push("Average monthly charges are high. Consider if pricing impacts churn.");
    }

    if (monthlyChurnData && monthlyChurnData.length > 2) {
      const last = monthlyChurnData[monthlyChurnData.length - 1].churnRate;
      const prev = monthlyChurnData[monthlyChurnData.length - 2].churnRate;
      if (last > prev) {
        p2.push("Churn rate is increasing in the most recent period.");
      } else if (last < prev) {
        p2.push("Churn rate is decreasing in the most recent period.");
      } else {
        p2.push("Churn rate is stable in the most recent period.");
      }
    }

    if (statistics.churnRate <= 50 && statistics.churnRate > 0) {
      p3.push("Churn rate is within a healthy range.");
    } else if (statistics.churnRate === 0) {
      p3.push("No churn data available yet.");
    }
    if (statistics.averageTenure < 12 && statistics.averageTenure > 0) {
      p3.push("Most customers are relatively new (average tenure < 1 year).");
    } else if (statistics.averageTenure >= 12) {
      p3.push("Customer base has a healthy average tenure (>= 1 year).");
    }

    if (statistics.recentPredictions && statistics.recentPredictions.length > 0) {
      const regionCounts = {};
      statistics.recentPredictions.forEach(pred => {
        if (pred.region) regionCounts[pred.region] = (regionCounts[pred.region] || 0) + 1;
      });
      const mostCommonRegion = Object.entries(regionCounts).sort((a, b) => b[1] - a[1])[0];
      if (mostCommonRegion) {
        p4.push(`Most predictions are from the region: ${mostCommonRegion[0]}.`);
      }
    }
    if (statistics.recentPredictions && statistics.recentPredictions.length > 0) {
      const contractCounts = {};
      statistics.recentPredictions.forEach(pred => {
        if (pred.status === 'High' && pred.model) {
          contractCounts[pred.model] = (contractCounts[pred.model] || 0) + 1;
        }
      });
      const mostCommonContract = Object.entries(contractCounts).sort((a, b) => b[1] - a[1])[0];
      if (mostCommonContract) {
        p4.push(`Most high-risk churn predictions used the model: ${mostCommonContract[0]}.`);
      }
    }

    return [
      { type: 'heading', text: 'Immediate Risks & Action Items' },
      ...p1.map((text) => ({ type: 'item', text })),
      { type: 'heading', text: 'Performance Trends' },
      ...p2.map((text) => ({ type: 'item', text })),
      { type: 'heading', text: 'General Health Benchmarks' },
      ...p3.map((text) => ({ type: 'item', text })),
      { type: 'heading', text: 'Administrative & Technical Context' },
      ...p4.map((text) => ({ type: 'item', text })),
    ];
  }

  return (
    <div className="w-full px-8 p-6 bg-white rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-blue-700">Customer Churn Dashboard</h1>
        {user?.email === 'churnpredictor@gmail.com' && <MockDataButton />}
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

          {/* Insights — collapsible, collapsed by default */}
          <div className="mt-2 mb-8 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded">
            <button
              type="button"
              className="w-full flex items-center justify-between text-left"
              onClick={() => setInsightsOpen((v) => !v)}
              aria-expanded={insightsOpen}
              aria-controls="overall-insights-content"
            >
              <h3 className="font-bold text-yellow-800 flex items-center gap-2">
                <LightBulbIcon className="h-4 w-4 text-yellow-500" />
                Insights
              </h3>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`h-5 w-5 text-yellow-700 transition-transform ${insightsOpen ? 'rotate-180' : 'rotate-0'}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {insightsOpen && (
              <div id="overall-insights-content" className="mt-3">
                <ul className="text-yellow-900 space-y-1">
                  {getDashboardInsights().map((entry, idx) => (
                    <li
                      key={idx}
                      className={entry.type === 'heading' ? 'mt-3 first:mt-0 font-semibold text-yellow-900' : 'list-disc ml-5'}
                    >
                      {entry.text}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Churn Rate Trend</h2>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setTimeframe("month")}
                    className={`px-3 py-1 text-sm font-medium rounded-md transition-colors duration-200 ${
                      timeframe === "month" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >Monthly</button>
                  <button
                    onClick={() => setTimeframe("quarter")}
                    className={`px-3 py-1 text-sm font-medium rounded-md transition-colors duration-200 ${
                      timeframe === "quarter" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >Quarterly</button>
                  <button
                    onClick={() => setTimeframe("year")}
                    className={`px-3 py-1 text-sm font-medium rounded-md transition-colors duration-200 ${
                      timeframe === "year" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >Yearly</button>
                </div>
              </div>
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
                      <div key="tooltip">
                        <p className="font-bold">Factor: {name}</p>
                        <p className="text-sm text-gray-600">{props.payload.description}</p>
                      </div>
                    ]}
                    contentStyle={{ backgroundColor: 'white', border: '1px solid #ccc', borderRadius: '4px', padding: '10px' }}
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
            <div className="col-span-1 flex flex-col gap-8">
              <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Churn by Age Group</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={churnByAgeData}
                      cx="50%"
                      cy="45%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                      labelLine={true}
                    >
                      {churnByAgeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => [`${value}%`, "Churn Rate"]}
                      contentStyle={{ backgroundColor: 'white', border: '1px solid #ccc', borderRadius: '4px' }}
                    />
                    <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{ marginTop: '10px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Churn by Gender</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={churnByGenderData}
                      cx="50%"
                      cy="45%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                      labelLine={true}
                    >
                      {churnByGenderData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={GENDER_COLORS[index % GENDER_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => [`${value}%`, "Churn Rate"]}
                      contentStyle={{ backgroundColor: 'white', border: '1px solid #ccc', borderRadius: '4px' }}
                    />
                    <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{ marginTop: '10px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Recent Predictions Table */}
            <div className="col-span-2 bg-white p-6 rounded-lg shadow border border-gray-200">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-3">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">Recent Churn Predictions</h2>
                  <button
                    onClick={async () => {
                      if (!user?.uid) return;
                      try {
                        const predictionsQuery = query(collection(db, 'predictions'), where('userId', '==', user.uid));
                        const querySnapshot = await getDocs(predictionsQuery);
                        const predictions = querySnapshot.docs.map(doc => doc.data());
                        if (predictions.length === 0) {
                          toast.info('No predictions found to export.');
                          return;
                        }
                        const tableRows = predictions.map(data => ({
                          Customer: data.customerInfo?.name || 'N/A',
                          Region: data.customerInfo?.region || 'N/A',
                          Date: data.timestamp?.toDate ? data.timestamp.toDate().toLocaleDateString() : 'N/A',
                          Probability: (parseFloat(data.prediction?.churnProbability) || 0) + '%',
                          Model: data.prediction?.model || 'N/A',
                          Status: data.prediction?.riskLevel || 'N/A',
                        }));
                        const csvHeaders = Object.keys(tableRows[0]).join(',');
                        const csvRows = tableRows.map(row => Object.values(row).map(val => typeof val === 'string' ? `"${val.replace(/"/g, '""')}"` : val).join(','));
                        const csvContent = [csvHeaders, ...csvRows].join('\n');
                        const blob = new Blob([csvContent], { type: 'text/csv' });
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = 'my_churn_predictions.csv';
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        window.URL.revokeObjectURL(url);
                      } catch (err) {
                        toast.error('Failed to export predictions.');
                      }
                    }}
                    className="mt-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-md text-sm font-medium transition-colors duration-200 shadow-sm"
                  >
                    Download Data
                  </button>
                </div>
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
              <div className="overflow-x-auto overflow-y-auto h-170">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0 z-10">
                    <tr>
                      <th
                        className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider bg-gray-50 cursor-pointer ${sortColumn === 'customer' ? 'text-gray-900' : 'text-gray-500'}`}
                        style={{ userSelect: 'none' }}
                        onClick={() => handleHeaderClick('customer')}
                      >
                        Customer {sortColumn === 'customer' && sortOrder === 'asc' && ' ↑'}{sortColumn === 'customer' && sortOrder === 'desc' && ' ↓'}
                      </th>
                      <th
                        className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider bg-gray-50 cursor-pointer ${sortColumn === 'region' ? 'text-gray-900' : 'text-gray-500'}`}
                        style={{ userSelect: 'none' }}
                        onClick={() => handleHeaderClick('region')}
                      >
                        Region {sortColumn === 'region' && sortOrder === 'asc' && ' ↑'}{sortColumn === 'region' && sortOrder === 'desc' && ' ↓'}
                      </th>
                      <th
                        className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider bg-gray-50 cursor-pointer ${sortColumn === 'date' ? 'text-gray-900' : 'text-gray-500'}`}
                        style={{ userSelect: 'none' }}
                        onClick={() => handleHeaderClick('date')}
                      >
                        Date {sortColumn === 'date' && sortOrder === 'asc' && ' ↑'}{sortColumn === 'date' && sortOrder === 'desc' && ' ↓'}
                      </th>
                      <th
                        className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider bg-gray-50 cursor-pointer ${sortColumn === 'model' ? 'text-gray-900' : 'text-gray-500'}`}
                        style={{ userSelect: 'none' }}
                        onClick={() => handleHeaderClick('model')}
                      >
                        Model {sortColumn === 'model' && sortOrder === 'asc' && ' ↑'}{sortColumn === 'model' && sortOrder === 'desc' && ' ↓'}
                      </th>
                      <th
                        className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider bg-gray-50 cursor-pointer ${sortColumn === 'probability' ? 'text-gray-900' : 'text-gray-500'}`}
                        style={{ userSelect: 'none' }}
                        onClick={() => handleHeaderClick('probability')}
                      >
                        Probability {sortColumn === 'probability' && sortOrder === 'asc' && ' ↑'}{sortColumn === 'probability' && sortOrder === 'desc' && ' ↓'}
                      </th>
                      <th
                        className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider bg-gray-50 cursor-pointer ${sortColumn === 'status' ? 'text-gray-900' : 'text-gray-500'}`}
                        style={{ userSelect: 'none' }}
                        onClick={() => handleHeaderClick('status')}
                      >
                        Status {sortColumn === 'status' && sortOrder === 'asc' && ' ↑'}{sortColumn === 'status' && sortOrder === 'desc' && ' ↓'}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {sortedPredictions.map((prediction) => (
                      <tr key={prediction.id} className="hover:bg-gray-50 cursor-pointer">
                        <td className="px-6 py-4 text-sm font-medium text-blue-600 hover:text-blue-800">
                          {highlightText(prediction.customer, searchQuery)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {highlightText(prediction.region, searchQuery)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{prediction.date}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">{prediction.model}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-left">{prediction.probability}%</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                            ${prediction.status === "Low" ? "bg-green-100 text-green-800" :
                              prediction.status === "Medium" ? "bg-yellow-100 text-yellow-800" :
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
