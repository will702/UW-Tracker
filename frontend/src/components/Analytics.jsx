import React, { useState, useEffect } from 'react';
import { ArrowLeft, BarChart3, TrendingUp, Target, Database, LineChart as LineChartIcon, Calendar } from 'lucide-react';
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
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts';
import { useToast } from '../hooks/use-toast';
import { uwAPI } from '../services/api';

const Analytics = () => {
  const { toast } = useToast();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' or 'performance'
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

  // Performance Charts State
  const [selectedStock, setSelectedStock] = useState('');
  const [timeRange, setTimeRange] = useState('30'); // days
  const [stockPerformanceData, setStockPerformanceData] = useState(null);
  const [performanceLoading, setPerformanceLoading] = useState(false);
  const [availableStocks, setAvailableStocks] = useState([]);

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
      extractAvailableStocks(records);
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

  const extractAvailableStocks = (records) => {
    // Extract stock codes from records for Performance Charts
    const stocks = records
      .filter(record => record.code && record.code.trim() !== '')
      .map(record => ({
        code: record.code,
        companyName: record.companyName,
        underwriters: record.underwriters || [record.uw]
      }))
      .sort((a, b) => a.code.localeCompare(b.code));
    
    setAvailableStocks(stocks);
  };

  const fetchStockPerformance = async (stockCode, days) => {
    if (!stockCode) return;
    
    try {
      setPerformanceLoading(true);
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
      const response = await fetch(`${backendUrl}/api/stocks/performance/${stockCode}?days_back=${days}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch stock data: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.status === 'success') {
        setStockPerformanceData(result);
      } else {
        // Better error handling for Yahoo Finance issues
        let errorMessage = result.error || 'Failed to fetch stock performance data';
        
        if (errorMessage.includes('rate limit') || errorMessage.includes('Rate Limit')) {
          errorMessage = `⏱️ Yahoo Finance temporary issue. Please try again in a moment.`;
        } else if (errorMessage.includes('No data available') || errorMessage.includes('not found')) {
          errorMessage = `📊 Stock symbol "${stockCode}" not found on Yahoo Finance. Please verify the symbol or try a different stock.`;
        } else if (errorMessage.includes('connection') || errorMessage.includes('timeout')) {
          errorMessage = `🌐 Network connection issue. Please check your internet connection and try again.`;
        }
        
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error('Error fetching stock performance:', error);
      toast({
        title: "Stock Data Error",
        description: error.message,
        variant: "destructive"
      });
      setStockPerformanceData(null);
    } finally {
      setPerformanceLoading(false);
    }
  };

  const handleStockSelection = (stockCode) => {
    setSelectedStock(stockCode);
    if (stockCode) {
      fetchStockPerformance(stockCode, timeRange);
    }
  };

  const handleTimeRangeChange = (days) => {
    setTimeRange(days);
    if (selectedStock) {
      fetchStockPerformance(selectedStock, days);
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

  const formatCurrency = (value, currencyInfo) => {
    if (!value || !currencyInfo) return 'N/A';
    
    if (currencyInfo.code === 'IDR') {
      // Indonesian Rupiah - no decimal places, use thousands separator
      return `${currencyInfo.symbol}${value.toLocaleString('id-ID', { maximumFractionDigits: 0 })}`;
    } else {
      // Other currencies - 2 decimal places
      return `${currencyInfo.symbol}${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
  };

  const getCurrencyInfo = (stockData) => {
    if (stockData?.meta_data?.company_info) {
      return {
        code: stockData.meta_data.company_info.currency || 'USD',
        symbol: stockData.meta_data.company_info.currency_symbol || '$'
      };
    }
    // Default to USD for fallback
    return { code: 'USD', symbol: '$' };
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

        {/* Tabs Navigation */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'dashboard'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  Dashboard Analytics
                </div>
              </button>
              <button
                onClick={() => setActiveTab('performance')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'performance'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center">
                  <LineChartIcon className="h-5 w-5 mr-2" />
                  Performance Charts
                </div>
              </button>
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'dashboard' ? (
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
        ) : (
          <div>
            {/* Performance Charts Tab */}
            <div className="bg-white rounded-lg p-6 shadow-sm border mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <LineChartIcon className="h-6 w-6 mr-3 text-blue-500" />
                Stock Performance Charts
              </h2>
              
              {/* Stock Selection and Time Range Controls */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Stock Symbol
                  </label>
                  <select
                    value={selectedStock}
                    onChange={(e) => handleStockSelection(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Choose a stock...</option>
                    {availableStocks.map((stock) => (
                      <option key={stock.code} value={stock.code}>
                        {stock.code} - {stock.companyName}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    💡 Indonesian stocks automatically formatted with .JK suffix and priced in Rupiah (IDR)
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Time Range
                  </label>
                  <div className="flex space-x-2">
                    {[
                      { label: '1W', value: '7' },
                      { label: '1M', value: '30' },
                      { label: '3M', value: '90' },
                      { label: '6M', value: '180' },
                      { label: '1Y', value: '365' }
                    ].map(({ label, value }) => (
                      <button
                        key={value}
                        onClick={() => handleTimeRangeChange(value)}
                        className={`px-4 py-2 text-sm font-medium rounded-md ${
                          timeRange === value
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Performance Chart Display */}
              {performanceLoading ? (
                <div className="flex items-center justify-center h-96">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading stock performance data...</p>
                  </div>
                </div>
              ) : stockPerformanceData ? (
                <div>
                  {/* Stock Info */}
                  <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {stockPerformanceData.symbol} Performance
                      </h3>
                      <div className="text-xs bg-white px-2 py-1 rounded border">
                        📊 Yahoo Finance
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Total Return:</span>
                        <span className={`ml-2 font-medium ${
                          stockPerformanceData.metrics.total_return >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {stockPerformanceData.metrics.total_return_percent?.toFixed(2)}%
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Volatility:</span>
                        <span className="ml-2 font-medium text-gray-900">
                          {stockPerformanceData.metrics.volatility_percent?.toFixed(2)}%
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">First Price:</span>
                        <span className="ml-2 font-medium text-gray-900">
                          {formatCurrency(stockPerformanceData.metrics.first_price, getCurrencyInfo(stockPerformanceData))}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Last Price:</span>
                        <span className="ml-2 font-medium text-gray-900">
                          {formatCurrency(stockPerformanceData.metrics.last_price, getCurrencyInfo(stockPerformanceData))}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Line Chart */}
                  <div className="h-96 mb-6">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={stockPerformanceData.chart_data}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="date" 
                          tickFormatter={(date) => new Date(date).toLocaleDateString()}
                        />
                        <YAxis 
                          tickFormatter={(value) => {
                            const currencyInfo = getCurrencyInfo(stockPerformanceData);
                            if (currencyInfo.code === 'IDR') {
                              return `${currencyInfo.symbol}${Math.round(value).toLocaleString('id-ID')}`;
                            } else {
                              return `${currencyInfo.symbol}${value.toFixed(0)}`;
                            }
                          }}
                        />
                        <Tooltip 
                          labelFormatter={(label) => new Date(label).toLocaleDateString()}
                          formatter={(value, name) => {
                            const currencyInfo = getCurrencyInfo(stockPerformanceData);
                            return [formatCurrency(value, currencyInfo), name];
                          }}
                          contentStyle={{ backgroundColor: '#f8f9fa', border: '1px solid #dee2e6' }}
                        />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="close" 
                          stroke="#3b82f6" 
                          strokeWidth={2}
                          name="Close Price"
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Volume Chart */}
                  <div className="h-64">
                    <h4 className="text-md font-semibold text-gray-900 mb-3">Trading Volume</h4>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={stockPerformanceData.chart_data}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="date" 
                          tickFormatter={(date) => new Date(date).toLocaleDateString()}
                        />
                        <YAxis 
                          tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
                        />
                        <Tooltip 
                          labelFormatter={(label) => new Date(label).toLocaleDateString()}
                          formatter={(value, name) => [`${value.toLocaleString()}`, name]}
                          contentStyle={{ backgroundColor: '#f8f9fa', border: '1px solid #dee2e6' }}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="volume" 
                          stroke="#10b981" 
                          fill="#10b981" 
                          fillOpacity={0.3}
                          name="Volume"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              ) : selectedStock ? (
                <div className="flex items-center justify-center h-96">
                  <div className="text-center">
                    <p className="text-gray-600 mb-2">Failed to load performance data for {selectedStock}</p>
                    <p className="text-sm text-gray-500">
                      This could be due to API rate limits or the stock symbol not being available on Alpha Vantage.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-96">
                  <div className="text-center">
                    <LineChartIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600 mb-2">Select a stock symbol to view performance charts</p>
                    <p className="text-sm text-gray-500">
                      Choose from {availableStocks.length} available stocks from your IPO database
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Analytics;