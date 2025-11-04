import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Cell,
} from 'recharts';

interface UWPerformance {
  code: string;
  avgReturnD1: number;
  avgReturnD2: number;
  avgReturnD3: number;
  avgReturnD4: number;
  avgReturnD5: number;
  avgReturnD6: number;
  avgReturnD7: number;
  totalDeals: number;
  avgReturnOverall: number;
  successRate: number; // Percentage of deals with positive returns
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

export default function UnderwriterPerformance() {
  const [performance, setPerformance] = useState<UWPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedView, setSelectedView] = useState<'overall' | 'byDay' | 'radar' | 'comparison' | 'allUW'>('allUW');
  const [selectedUnderwriters, setSelectedUnderwriters] = useState<string[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await apiService.getGroupedRecords(10000);
        const records = response.data || [];
        
        // Calculate performance stats per underwriter
        const statsMap = new Map<string, {
          deals: Set<string>;
          d1Returns: number[];
          d2Returns: number[];
          d3Returns: number[];
          d4Returns: number[];
          d5Returns: number[];
          d6Returns: number[];
          d7Returns: number[];
          positiveDeals: number;
        }>();
        
        records.forEach(record => {
          const uwList = record.underwriters && record.underwriters.length > 0
            ? record.underwriters
            : record.uw ? [record.uw] : [];
          
          uwList.forEach(uw => {
            if (!statsMap.has(uw)) {
              statsMap.set(uw, {
                deals: new Set(),
                d1Returns: [],
                d2Returns: [],
                d3Returns: [],
                d4Returns: [],
                d5Returns: [],
                d6Returns: [],
                d7Returns: [],
                positiveDeals: 0,
              });
            }
            
            const stats = statsMap.get(uw)!;
            stats.deals.add(record.code);
            
            // Collect returns for each day
            if (record.returnD1 !== null && record.returnD1 !== undefined) {
              stats.d1Returns.push(record.returnD1);
            }
            if (record.returnD2 !== null && record.returnD2 !== undefined) {
              stats.d2Returns.push(record.returnD2);
            }
            if (record.returnD3 !== null && record.returnD3 !== undefined) {
              stats.d3Returns.push(record.returnD3);
            }
            if (record.returnD4 !== null && record.returnD4 !== undefined) {
              stats.d4Returns.push(record.returnD4);
            }
            if (record.returnD5 !== null && record.returnD5 !== undefined) {
              stats.d5Returns.push(record.returnD5);
            }
            if (record.returnD6 !== null && record.returnD6 !== undefined) {
              stats.d6Returns.push(record.returnD6);
            }
            if (record.returnD7 !== null && record.returnD7 !== undefined) {
              stats.d7Returns.push(record.returnD7);
            }
            
            // Check if deal was successful (positive average return)
            const returns = [
              record.returnD1, record.returnD2, record.returnD3, record.returnD4,
              record.returnD5, record.returnD6, record.returnD7
            ].filter(r => r !== null && r !== undefined) as number[];
            
            if (returns.length > 0) {
              const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
              if (avgReturn > 0) {
                stats.positiveDeals++;
              }
            }
          });
        });
        
        // Convert to performance array
        const performanceArray: UWPerformance[] = Array.from(statsMap.entries()).map(([code, stats]) => {
          const calculateAvg = (arr: number[]) => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
          
          const allReturns = [
            ...stats.d1Returns,
            ...stats.d2Returns,
            ...stats.d3Returns,
            ...stats.d4Returns,
            ...stats.d5Returns,
            ...stats.d6Returns,
            ...stats.d7Returns,
          ];
          
          return {
            code,
            avgReturnD1: calculateAvg(stats.d1Returns),
            avgReturnD2: calculateAvg(stats.d2Returns),
            avgReturnD3: calculateAvg(stats.d3Returns),
            avgReturnD4: calculateAvg(stats.d4Returns),
            avgReturnD5: calculateAvg(stats.d5Returns),
            avgReturnD6: calculateAvg(stats.d6Returns),
            avgReturnD7: calculateAvg(stats.d7Returns),
            totalDeals: stats.deals.size,
            avgReturnOverall: calculateAvg(allReturns),
            successRate: stats.deals.size > 0 ? (stats.positiveDeals / stats.deals.size) * 100 : 0,
          };
        });
        
        // Sort by overall average return
        performanceArray.sort((a, b) => b.avgReturnOverall - a.avgReturnOverall);
        
        setPerformance(performanceArray);
        // Select top 5 by default for comparison
        setSelectedUnderwriters(performanceArray.slice(0, 5).map(p => p.code));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load performance data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const formatPercent = (value: number) => `${(value * 100).toFixed(2)}%`;

  // Prepare data for charts
  const topPerformersData = performance.slice(0, 10).map(p => ({
    name: p.code,
    'Avg Return': p.avgReturnOverall * 100,
    'Total Deals': p.totalDeals,
  }));


  // Performance by Day - Top 5 only, structured like stocks with compounding
  // Start at 1000 and compound each day's return
  const performanceByDay = ['D+0', 'D+1', 'D+2', 'D+3', 'D+4', 'D+5', 'D+6', 'D+7'].map((day, dayIndex) => {
    const dataPoint: any = { day };
    performance.slice(0, 5).forEach(perf => {
      const dayReturns = [
        0, // D+0 starting point
        perf.avgReturnD1,
        perf.avgReturnD2,
        perf.avgReturnD3,
        perf.avgReturnD4,
        perf.avgReturnD5,
        perf.avgReturnD6,
        perf.avgReturnD7,
      ];
      
      // Calculate compounded value starting from 1000
      let value = 1000;
      for (let i = 0; i <= dayIndex; i++) {
        if (i === 0) {
          value = 1000; // Starting value
        } else {
          value = value * (1 + dayReturns[i]); // Compound the return
        }
      }
      dataPoint[perf.code] = value;
    });
    return dataPoint;
  });

  // Create full radar dataset with all days
  const fullRadarData = ['D+1', 'D+2', 'D+3', 'D+4', 'D+5', 'D+6', 'D+7'].map(day => {
    const dayNum = parseInt(day.replace('D+', ''));
    const dataPoint: any = { subject: day, fullMark: 20 };
    selectedUnderwriters.slice(0, 5).forEach(code => {
      const perf = performance.find(p => p.code === code);
      if (perf) {
        const dayReturns = [
          perf.avgReturnD1 * 100,
          perf.avgReturnD2 * 100,
          perf.avgReturnD3 * 100,
          perf.avgReturnD4 * 100,
          perf.avgReturnD5 * 100,
          perf.avgReturnD6 * 100,
          perf.avgReturnD7 * 100,
        ];
        dataPoint[code] = dayReturns[dayNum - 1];
      }
    });
    return dataPoint;
  });

  // Create data for all underwriters comparison - Top 5 individually + Average of the rest
  // Using compounding logic like Performance by Day (starting from 1000)
  const top5 = performance.slice(0, 5);
  const remaining = performance.slice(5);
  
  // Calculate average returns for remaining underwriters
  const avgRemaining = remaining.length > 0 ? {
    code: 'Average (Others)',
    avgReturnD1: remaining.reduce((sum, p) => sum + p.avgReturnD1, 0) / remaining.length,
    avgReturnD2: remaining.reduce((sum, p) => sum + p.avgReturnD2, 0) / remaining.length,
    avgReturnD3: remaining.reduce((sum, p) => sum + p.avgReturnD3, 0) / remaining.length,
    avgReturnD4: remaining.reduce((sum, p) => sum + p.avgReturnD4, 0) / remaining.length,
    avgReturnD5: remaining.reduce((sum, p) => sum + p.avgReturnD5, 0) / remaining.length,
    avgReturnD6: remaining.reduce((sum, p) => sum + p.avgReturnD6, 0) / remaining.length,
    avgReturnD7: remaining.reduce((sum, p) => sum + p.avgReturnD7, 0) / remaining.length,
  } : null;

  const allUWLineData = ['D+0', 'D+1', 'D+2', 'D+3', 'D+4', 'D+5', 'D+6', 'D+7'].map((day, dayIndex) => {
    const dataPoint: any = { day };
    
    // Add top 5 underwriters
    top5.forEach(perf => {
      const dayReturns = [
        0, // D+0 starting point
        perf.avgReturnD1,
        perf.avgReturnD2,
        perf.avgReturnD3,
        perf.avgReturnD4,
        perf.avgReturnD5,
        perf.avgReturnD6,
        perf.avgReturnD7,
      ];
      
      // Calculate compounded value starting from 1000
      let value = 1000;
      for (let i = 0; i <= dayIndex; i++) {
        if (i === 0) {
          value = 1000;
        } else {
          value = value * (1 + dayReturns[i]);
        }
      }
      dataPoint[perf.code] = value;
    });
    
    // Add average of remaining underwriters
    if (avgRemaining) {
      const dayReturns = [
        0, // D+0 starting point
        avgRemaining.avgReturnD1,
        avgRemaining.avgReturnD2,
        avgRemaining.avgReturnD3,
        avgRemaining.avgReturnD4,
        avgRemaining.avgReturnD5,
        avgRemaining.avgReturnD6,
        avgRemaining.avgReturnD7,
      ];
      
      // Calculate compounded value starting from 1000
      let value = 1000;
      for (let i = 0; i <= dayIndex; i++) {
        if (i === 0) {
          value = 1000;
        } else {
          value = value * (1 + dayReturns[i]);
        }
      }
      dataPoint['Average (Others)'] = value;
    }
    
    return dataPoint;
  });

  const comparisonData = selectedUnderwriters.map(code => {
    const perf = performance.find(p => p.code === code);
    if (!perf) return null;
    return {
      name: code,
      'Overall Return': perf.avgReturnOverall * 100,
      'Success Rate': perf.successRate,
      'Total Deals': perf.totalDeals,
    };
  }).filter(Boolean);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h3 className="text-red-800 font-semibold">Error</h3>
        <p className="text-red-600 mt-1">{error}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Underwriter Performance Visualization</h1>
        <p className="mt-2 text-gray-600">
          Interactive charts and visualizations showing underwriter performance metrics across all IPOs.
        </p>
      </div>

      {/* View Selector */}
      <div className="bg-white shadow rounded-lg p-4 mb-6">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedView('overall')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              selectedView === 'overall'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            📊 Overall Performance
          </button>
          <button
            onClick={() => setSelectedView('byDay')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              selectedView === 'byDay'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            📈 Performance by Day
          </button>
          <button
            onClick={() => setSelectedView('radar')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              selectedView === 'radar'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            🎯 Radar Comparison
          </button>
          <button
            onClick={() => setSelectedView('comparison')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              selectedView === 'comparison'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            ⚖️ Side-by-Side Comparison
          </button>
          <button
            onClick={() => setSelectedView('allUW')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              selectedView === 'allUW'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            📉 All Underwriters Comparison
          </button>
        </div>
      </div>

      {/* Overall Performance Chart */}
      {selectedView === 'overall' && (
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Top 10 Underwriters by Average Return</h2>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={topPerformersData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis tickFormatter={(value) => `${value.toFixed(1)}%`} />
              <Tooltip formatter={(value: number) => `${value.toFixed(2)}%`} />
              <Legend />
              <Bar dataKey="Avg Return" fill="#3b82f6" name="Average Return (%)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Performance by Day Chart */}
      {selectedView === 'byDay' && (
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Stock-Style Performance (D+1 to D+7) - Top 5 Underwriters</h2>
          <p className="text-sm text-gray-600 mb-4">
            Each line represents a top 5 underwriter showing compounded performance starting from 1000.
            Each day's return compounds on the previous day's value (like stock prices).
          </p>
          <ResponsiveContainer width="100%" height={500}>
            <LineChart data={performanceByDay}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="day" 
                label={{ value: 'Days', position: 'insideBottom', offset: -5 }}
              />
              <YAxis 
                tickFormatter={(value) => value.toFixed(0)}
                label={{ value: 'Compounded Value (Starting from 1000)', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip 
                formatter={(value: number) => value.toFixed(2)}
                labelFormatter={(label) => `Day: ${label}`}
                contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', border: '1px solid #ccc' }}
              />
              <Legend />
              {performance.slice(0, 5).map((perf, index) => (
                <Line
                  key={perf.code}
                  type="monotone"
                  dataKey={perf.code}
                  stroke={COLORS[index % COLORS.length]}
                  strokeWidth={3}
                  dot={{ r: 5 }}
                  activeDot={{ r: 7 }}
                  name={perf.code}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-600 mb-2">
              <strong>Top 5 Underwriters:</strong> {performance.slice(0, 5).map(p => p.code).join(', ')}
            </p>
            <p className="text-xs text-gray-600">
              <strong>Calculation:</strong> Starting value = 1000. Each day's return compounds: 
              Value = Previous Value × (1 + Return). Example: If D+1 = 5%, then 1000 × 1.05 = 1050.
            </p>
          </div>
        </div>
      )}

      {/* Radar Chart */}
      {selectedView === 'radar' && (
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Radar Comparison</h2>
            <div className="flex flex-wrap gap-2 mb-4">
              {performance.slice(0, 10).map((p) => (
                <button
                  key={p.code}
                  onClick={() => {
                    const newSelection = selectedUnderwriters.includes(p.code)
                      ? selectedUnderwriters.filter(c => c !== p.code)
                      : [...selectedUnderwriters.slice(0, 4), p.code];
                    setSelectedUnderwriters(newSelection);
                  }}
                  className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                    selectedUnderwriters.includes(p.code)
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {p.code}
                </button>
              ))}
            </div>
          </div>
          {fullRadarData.length > 0 && selectedUnderwriters.length > 0 && (
            <ResponsiveContainer width="100%" height={500}>
              <RadarChart data={fullRadarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="subject" />
                <PolarRadiusAxis angle={90} domain={[0, 'auto']} />
                {selectedUnderwriters.slice(0, 5).map((code, index) => {
                  const perf = performance.find(p => p.code === code);
                  if (!perf) return null;
                  return (
                    <Radar
                      key={code}
                      name={code}
                      dataKey={code}
                      stroke={COLORS[index % COLORS.length]}
                      fill={COLORS[index % COLORS.length]}
                      fillOpacity={0.3}
                    />
                  );
                })}
                <Tooltip formatter={(value: number) => `${value.toFixed(2)}%`} />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          )}
        </div>
      )}

      {/* All Underwriters Line Chart */}
      {selectedView === 'allUW' && (
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Top 5 vs Average (Others) - Compounded Performance
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Top 5 underwriters shown individually, with remaining underwriters averaged together.
            All values compound starting from 1000 (like stock prices) to show how outliers move.
          </p>
          <ResponsiveContainer width="100%" height={600}>
            <LineChart data={allUWLineData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="day" 
                label={{ value: 'Days', position: 'insideBottom', offset: -5 }}
              />
              <YAxis 
                tickFormatter={(value) => value.toFixed(0)}
                label={{ value: 'Compounded Value (Starting from 1000)', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip 
                formatter={(value: number) => value.toFixed(2)}
                labelFormatter={(label) => `Day: ${label}`}
                contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', border: '1px solid #ccc' }}
              />
              <Legend />
              {/* Top 5 underwriters */}
              {top5.map((perf, index) => (
                <Line
                  key={perf.code}
                  type="monotone"
                  dataKey={perf.code}
                  stroke={COLORS[index % COLORS.length]}
                  strokeWidth={3}
                  dot={{ r: 5 }}
                  activeDot={{ r: 7 }}
                  name={perf.code}
                />
              ))}
              {/* Average of remaining */}
              {avgRemaining && (
                <Line
                  type="monotone"
                  dataKey="Average (Others)"
                  stroke="#6b7280"
                  strokeWidth={3}
                  strokeDasharray="5 5"
                  dot={{ r: 5 }}
                  activeDot={{ r: 7 }}
                  name="Average (Others)"
                />
              )}
            </LineChart>
          </ResponsiveContainer>
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-600 mb-2">
              <strong>Top 5 Underwriters:</strong> {top5.map(p => p.code).join(', ')}
            </p>
            {avgRemaining && (
              <p className="text-xs text-gray-600 mb-2">
                <strong>Average (Others):</strong> Average of {remaining.length} remaining underwriters (shown as dashed line)
              </p>
            )}
            <p className="text-xs text-gray-600">
              <strong>Calculation:</strong> Starting value = 1000. Each day's return compounds: 
              Value = Previous Value × (1 + Return). This shows how top performers (outliers) compare to the average.
            </p>
          </div>
        </div>
      )}

      {/* Comparison Chart */}
      {selectedView === 'comparison' && (
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Side-by-Side Comparison</h2>
            <div className="flex flex-wrap gap-2 mb-4">
              {performance.slice(0, 15).map((p) => (
                <button
                  key={p.code}
                  onClick={() => {
                    const newSelection = selectedUnderwriters.includes(p.code)
                      ? selectedUnderwriters.filter(c => c !== p.code)
                      : [...selectedUnderwriters, p.code];
                    setSelectedUnderwriters(newSelection);
                  }}
                  className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                    selectedUnderwriters.includes(p.code)
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {p.code}
                </button>
              ))}
            </div>
          </div>
          {comparisonData.length > 0 && (
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={comparisonData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis yAxisId="left" tickFormatter={(value) => `${value.toFixed(1)}%`} />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="Overall Return" fill="#3b82f6" name="Avg Return (%)" />
                <Bar yAxisId="right" dataKey="Success Rate" fill="#10b981" name="Success Rate (%)" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      )}

      {/* Performance Table */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Detailed Performance Metrics</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rank</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Underwriter</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Total Deals</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Avg Return</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Success Rate</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {performance.map((p, index) => (
                <tr key={p.code} className="hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    #{index + 1}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="text-sm font-semibold text-gray-900">{p.code}</span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-center text-sm text-gray-900">
                    {p.totalDeals}
                  </td>
                  <td className={`px-4 py-3 whitespace-nowrap text-center text-sm font-medium ${
                    p.avgReturnOverall >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatPercent(p.avgReturnOverall)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-center text-sm text-gray-900">
                    {p.successRate.toFixed(1)}%
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-center">
                    <button
                      onClick={() => navigate(`/records?underwriter=${encodeURIComponent(p.code)}`)}
                      className="text-primary-600 hover:text-primary-800 text-sm font-medium"
                    >
                      View IPOs →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

