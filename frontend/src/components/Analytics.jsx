import React, { useState, useEffect } from 'react';
import { ArrowLeft, BarChart3, TrendingUp, Target, Database } from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { useToast } from '../hooks/use-toast';
import { uwAPI } from '../services/api';

const Analytics = () => {
  const { toast } = useToast();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard'); // Only dashboard now
  const [uwAnalytics, setUwAnalytics] = useState({
    successRateData: [],
    marketShareData: [],
    heatmapData: [],
    summaryStats: {
      totalUW: 0,
      bestPerformer: { uw: '', avgReturn: 0 },
      worstPerformer: { uw: '', avgReturn: 0 },
      marketAverage: 0
    }
  });


  // Color palette for charts
  const COLORS = [
    '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8',
    '#82CA9D', '#FFC658', '#FF7C7C', '#8DD1E1', '#D084D0'
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await uwAPI.getAllRecords('', 1000, 0);
      const records = response.data || [];
      setData(records);
      processAnalyticsData(records);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch data for analytics",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };


  const processAnalyticsData = (records) => {
    // Process data for underwriter analytics
    const uwStats = {};
    
    records.forEach(record => {
      // Handle both grouped and non-grouped underwriter data
      const underwriters = Array.isArray(record.underwriters) 
        ? record.underwriters 
        : [record.uw || record.underwriter];
      
      underwriters.forEach(uw => {
        if (!uw) return;
        
        if (!uwStats[uw]) {
          uwStats[uw] = {
            totalDeals: 0,
            totalReturns: {
              d1: 0, d2: 0, d3: 0, d4: 0, d5: 0, d6: 0, d7: 0
            },
            validReturns: {
              d1: 0, d2: 0, d3: 0, d4: 0, d5: 0, d6: 0, d7: 0
            }
          };
        }
        
        uwStats[uw].totalDeals++;
        
        // Process daily returns
        ['returnD1', 'returnD2', 'returnD3', 'returnD4', 'returnD5', 'returnD6', 'returnD7'].forEach((field, index) => {
          const day = `d${index + 1}`;
          const returnValue = record[field];
          if (returnValue !== null && returnValue !== undefined && !isNaN(returnValue)) {
            uwStats[uw].totalReturns[day] += parseFloat(returnValue);
            uwStats[uw].validReturns[day]++;
          }
        });
      });
    });

    // Calculate averages and prepare chart data
    const successRateData = [];
    const marketShareData = [];
    const heatmapData = [];
    
    let bestPerformer = { uw: '', avgReturn: -Infinity };
    let worstPerformer = { uw: '', avgReturn: Infinity };
    let totalMarketReturn = 0;
    let uwCount = 0;

    Object.entries(uwStats).forEach(([uw, stats]) => {
      // Calculate average 7-day return
      let totalAvgReturn = 0;
      let validDays = 0;
      
      ['d1', 'd2', 'd3', 'd4', 'd5', 'd6', 'd7'].forEach(day => {
        if (stats.validReturns[day] > 0) {
          totalAvgReturn += stats.totalReturns[day] / stats.validReturns[day];
          validDays++;
        }
      });
      
      const avgReturn = validDays > 0 ? totalAvgReturn / validDays : 0;
      
      // Track best and worst performers
      if (avgReturn > bestPerformer.avgReturn) {
        bestPerformer = { uw, avgReturn };
      }
      if (avgReturn < worstPerformer.avgReturn) {
        worstPerformer = { uw, avgReturn };
      }
      
      totalMarketReturn += avgReturn;
      uwCount++;
      
      // Success rate data (for bar chart)
      successRateData.push({
        uw: uw,
        avgReturn: avgReturn,
        totalDeals: stats.totalDeals,
        successRate: avgReturn > 0 ? avgReturn : 0
      });
      
      // Market share data (for pie chart)
      marketShareData.push({
        name: uw,
        value: stats.totalDeals,
        percentage: 0 // Will be calculated after all data is processed
      });
      
      // Heatmap data (daily performance)
      const heatmapRow = {
        uw: uw,
        d1: stats.validReturns.d1 > 0 ? (stats.totalReturns.d1 / stats.validReturns.d1) : 0,
        d2: stats.validReturns.d2 > 0 ? (stats.totalReturns.d2 / stats.validReturns.d2) : 0,
        d3: stats.validReturns.d3 > 0 ? (stats.totalReturns.d3 / stats.validReturns.d3) : 0,
        d4: stats.validReturns.d4 > 0 ? (stats.totalReturns.d4 / stats.validReturns.d4) : 0,
        d5: stats.validReturns.d5 > 0 ? (stats.totalReturns.d5 / stats.validReturns.d5) : 0,
        d6: stats.validReturns.d6 > 0 ? (stats.totalReturns.d6 / stats.validReturns.d6) : 0,
        d7: stats.validReturns.d7 > 0 ? (stats.totalReturns.d7 / stats.validReturns.d7) : 0,
      };
      heatmapData.push(heatmapRow);
    });

    // Calculate market share percentages
    const totalDeals = marketShareData.reduce((sum, item) => sum + item.value, 0);
    marketShareData.forEach(item => {
      item.percentage = ((item.value / totalDeals) * 100).toFixed(1);
    });

    // Sort data
    successRateData.sort((a, b) => b.avgReturn - a.avgReturn);
    marketShareData.sort((a, b) => b.value - a.value);
    heatmapData.sort((a, b) => b.d7 - a.d7); // Sort by D+7 performance

    const marketAverage = uwCount > 0 ? totalMarketReturn / uwCount : 0;

    setUwAnalytics({
      successRateData: successRateData.slice(0, 20), // Top 20 for readability
      marketShareData: marketShareData.slice(0, 10), // Top 10 for pie chart
      heatmapData: heatmapData.slice(0, 15), // Top 15 for heatmap
      summaryStats: {
        totalUW: uwCount,
        bestPerformer,
        worstPerformer,
        marketAverage
      }
    });
  };

  const formatPercent = (value) => {
    if (value === null || value === undefined || isNaN(value)) return '0.00%';
    const percentage = (value * 100).toFixed(2);
    return value > 0 ? `+${percentage}%` : `${percentage}%`;
  };

  const getPerformanceColor = (value) => {
    if (value > 0.1) return '#22c55e'; // Green for >10%
    if (value > 0.05) return '#84cc16'; // Light green for >5%
    if (value > 0) return '#eab308'; // Yellow for positive
    if (value > -0.05) return '#f97316'; // Orange for small negative
    return '#ef4444'; // Red for large negative
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analytics data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button 
            onClick={() => window.history.back()}
            className="flex items-center text-gray-600 hover:text-gray-800 mb-4"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Kembali ke Data Table
          </button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <BarChart3 className="h-8 w-8 mr-3 text-blue-500" />
                Analytics Dashboard
              </h1>
              <p className="text-gray-600 mt-2">
                Analisis mendalam performa underwriter IPO berdasarkan data historis
              </p>
            </div>
          </div>
        </div>

        {/* Dashboard Content */}
          <div>
            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg p-6 shadow-sm border">
                <div className="flex items-center">
                  <Database className="h-8 w-8 text-blue-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total UW</p>
                    <p className="text-2xl font-semibold text-gray-900">{uwAnalytics.summaryStats.totalUW}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg p-6 shadow-sm border">
                <div className="flex items-center">
                  <TrendingUp className="h-8 w-8 text-green-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Best Performer</p>
                    <p className="text-lg font-semibold text-gray-900">{uwAnalytics.summaryStats.bestPerformer.uw}</p>
                    <p className="text-sm text-green-600">{formatPercent(uwAnalytics.summaryStats.bestPerformer.avgReturn)}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg p-6 shadow-sm border">
                <div className="flex items-center">
                  <Target className="h-8 w-8 text-orange-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Market Average</p>
                    <p className="text-2xl font-semibold text-gray-900">{formatPercent(uwAnalytics.summaryStats.marketAverage)}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg p-6 shadow-sm border">
                <div className="flex items-center">
                  <Database className="h-8 w-8 text-purple-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Records</p>
                    <p className="text-2xl font-semibold text-gray-900">{data.length}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Success Rate Bar Chart */}
              <div className="bg-white rounded-lg p-6 shadow-sm border">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Top 20 UW Success Rates</h3>
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={uwAnalytics.successRateData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="uw" 
                        angle={-45}
                        textAnchor="end"
                        height={100}
                        fontSize={12}
                      />
                      <YAxis tickFormatter={(value) => `${(value * 100).toFixed(0)}%`} />
                      <Tooltip 
                        formatter={(value, name) => [formatPercent(value), 'Avg Return']}
                        labelFormatter={(uw) => `UW: ${uw}`}
                        contentStyle={{ backgroundColor: '#f8f9fa', border: '1px solid #dee2e6' }}
                      />
                      <Bar 
                        dataKey="avgReturn" 
                        fill="#3b82f6"
                        name="Average Return"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Market Share Pie Chart */}
              <div className="bg-white rounded-lg p-6 shadow-sm border">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Top 10 UW Market Share (by Deals)</h3>
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={uwAnalytics.marketShareData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percentage }) => `${name} (${percentage}%)`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {uwAnalytics.marketShareData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value) => [`${value} deals`, 'Total Deals']}
                        contentStyle={{ backgroundColor: '#f8f9fa', border: '1px solid #dee2e6' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>

            {/* Performance Heatmap */}
            <div className="mt-8">
              <div className="bg-white rounded-lg p-6 shadow-sm border">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">UW Daily Performance Heatmap (Top 15)</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-3 font-medium text-gray-900">UW</th>
                        <th className="text-center py-2 px-3 font-medium text-gray-900">D+1</th>
                        <th className="text-center py-2 px-3 font-medium text-gray-900">D+2</th>
                        <th className="text-center py-2 px-3 font-medium text-gray-900">D+3</th>
                        <th className="text-center py-2 px-3 font-medium text-gray-900">D+4</th>
                        <th className="text-center py-2 px-3 font-medium text-gray-900">D+5</th>
                        <th className="text-center py-2 px-3 font-medium text-gray-900">D+6</th>
                        <th className="text-center py-2 px-3 font-medium text-gray-900">D+7</th>
                      </tr>
                    </thead>
                    <tbody>
                      {uwAnalytics.heatmapData.map((row, index) => (
                        <tr key={index} className="border-b hover:bg-gray-50">
                          <td className="py-2 px-3 font-medium text-gray-900">{row.uw}</td>
                          {['d1', 'd2', 'd3', 'd4', 'd5', 'd6', 'd7'].map(day => (
                            <td 
                              key={day} 
                              className="py-2 px-3 text-center text-sm font-medium"
                              style={{ 
                                backgroundColor: `${getPerformanceColor(row[day])}20`,
                                color: getPerformanceColor(row[day])
                              }}
                            >
                              {formatPercent(row[day])}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Legend for Heatmap */}
            <div className="mt-4 bg-white rounded-lg p-4 shadow-sm border">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Performance Color Guide:</h4>
              <div className="flex flex-wrap gap-4 text-xs">
                <div className="flex items-center">
                  <div className="w-4 h-4 rounded mr-2" style={{ backgroundColor: '#22c55e' }}></div>
                  <span>Excellent (&gt;10%)</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 rounded mr-2" style={{ backgroundColor: '#84cc16' }}></div>
                  <span>Good (5-10%)</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 rounded mr-2" style={{ backgroundColor: '#eab308' }}></div>
                  <span>Positive (0-5%)</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 rounded mr-2" style={{ backgroundColor: '#f97316' }}></div>
                  <span>Slightly Negative (0 to -5%)</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 rounded mr-2" style={{ backgroundColor: '#ef4444' }}></div>
                  <span>Poor (&lt;-5%)</span>
                </div>
              </div>
            </div>
          </div>
      </div>
    </div>
  );
};

export default Analytics;