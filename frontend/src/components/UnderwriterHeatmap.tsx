import { useEffect, useState } from 'react';
import { apiService } from '../services/api';

interface UWStats {
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
}

export default function UnderwriterHeatmap() {
  const [uwStats, setUwStats] = useState<Map<string, UWStats>>(new Map());
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'avgReturnD1' | 'avgReturnD2' | 'avgReturnD3' | 'avgReturnD4' | 'avgReturnD5' | 'avgReturnD6' | 'avgReturnD7' | 'avgReturnOverall' | 'totalDeals'>('avgReturnOverall');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await apiService.getGroupedRecords(10000);
        const records = response.data || [];
        
        // Calculate stats per underwriter
        const statsMap = new Map<string, { returns: number[]; deals: Set<string> }>();
        
        records.forEach(record => {
          const uwList = record.underwriters && record.underwriters.length > 0
            ? record.underwriters
            : record.uw ? [record.uw] : [];
          
          uwList.forEach(uw => {
            if (!statsMap.has(uw)) {
              statsMap.set(uw, { returns: [], deals: new Set() });
            }
            const stats = statsMap.get(uw)!;
            stats.deals.add(record.code);
            
            // Calculate average return for this deal (D+1 to D+7)
            const returns = [
              record.returnD1, record.returnD2, record.returnD3, record.returnD4,
              record.returnD5, record.returnD6, record.returnD7
            ].filter(r => r !== null && r !== undefined) as number[];
            
            if (returns.length > 0) {
              const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
              stats.returns.push(avgReturn);
            }
          });
        });
        
        // Convert to final stats
        const finalStats = new Map<string, UWStats>();
        
        records.forEach(record => {
          const uwList = record.underwriters && record.underwriters.length > 0
            ? record.underwriters
            : record.uw ? [record.uw] : [];
          
          uwList.forEach(uw => {
            if (!finalStats.has(uw)) {
              const stats = statsMap.get(uw)!;
              const allReturns = stats.returns;
              const avgReturnOverall = allReturns.length > 0
                ? allReturns.reduce((a, b) => a + b, 0) / allReturns.length
                : 0;
              
              // Calculate D+1 through D+7 averages
              const d1Returns: number[] = [];
              const d2Returns: number[] = [];
              const d3Returns: number[] = [];
              const d4Returns: number[] = [];
              const d5Returns: number[] = [];
              const d6Returns: number[] = [];
              const d7Returns: number[] = [];
              
              records.forEach(r => {
                const rUwList = r.underwriters && r.underwriters.length > 0
                  ? r.underwriters
                  : r.uw ? [r.uw] : [];
                
                if (rUwList.includes(uw)) {
                  if (r.returnD1 !== null && r.returnD1 !== undefined) d1Returns.push(r.returnD1);
                  if (r.returnD2 !== null && r.returnD2 !== undefined) d2Returns.push(r.returnD2);
                  if (r.returnD3 !== null && r.returnD3 !== undefined) d3Returns.push(r.returnD3);
                  if (r.returnD4 !== null && r.returnD4 !== undefined) d4Returns.push(r.returnD4);
                  if (r.returnD5 !== null && r.returnD5 !== undefined) d5Returns.push(r.returnD5);
                  if (r.returnD6 !== null && r.returnD6 !== undefined) d6Returns.push(r.returnD6);
                  if (r.returnD7 !== null && r.returnD7 !== undefined) d7Returns.push(r.returnD7);
                }
              });
              
              const calculateAvg = (arr: number[]) => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
              
              finalStats.set(uw, {
                code: uw,
                avgReturnD1: calculateAvg(d1Returns),
                avgReturnD2: calculateAvg(d2Returns),
                avgReturnD3: calculateAvg(d3Returns),
                avgReturnD4: calculateAvg(d4Returns),
                avgReturnD5: calculateAvg(d5Returns),
                avgReturnD6: calculateAvg(d6Returns),
                avgReturnD7: calculateAvg(d7Returns),
                totalDeals: stats.deals.size,
                avgReturnOverall,
              });
            }
          });
        });
        
        setUwStats(finalStats);
      } catch (err) {
        console.error('Error fetching heatmap data:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const getColorClass = (value: number) => {
    if (value >= 0.15) return 'bg-green-600 text-white';
    if (value >= 0.10) return 'bg-green-500 text-white';
    if (value >= 0.05) return 'bg-green-400 text-white';
    if (value >= 0) return 'bg-green-200 text-gray-800';
    if (value >= -0.05) return 'bg-yellow-200 text-gray-800';
    if (value >= -0.10) return 'bg-orange-300 text-gray-800';
    if (value >= -0.15) return 'bg-red-400 text-white';
    return 'bg-red-600 text-white';
  };

  const sortedStats = Array.from(uwStats.values()).sort((a, b) => {
    return b[sortBy] - a[sortBy];
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900">Underwriter Performance Heatmap</h2>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm"
        >
          <option value="avgReturnOverall">Sort by: Overall Avg Return</option>
          <option value="avgReturnD1">Sort by: D+1 Avg Return</option>
          <option value="avgReturnD2">Sort by: D+2 Avg Return</option>
          <option value="avgReturnD3">Sort by: D+3 Avg Return</option>
          <option value="avgReturnD4">Sort by: D+4 Avg Return</option>
          <option value="avgReturnD5">Sort by: D+5 Avg Return</option>
          <option value="avgReturnD6">Sort by: D+6 Avg Return</option>
          <option value="avgReturnD7">Sort by: D+7 Avg Return</option>
          <option value="totalDeals">Sort by: Total Deals</option>
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase sticky left-0 bg-gray-50 z-10">Underwriter</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Total Deals</th>
                <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase">Avg D+1</th>
                <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase">Avg D+2</th>
                <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase">Avg D+3</th>
                <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase">Avg D+4</th>
                <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase">Avg D+5</th>
                <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase">Avg D+6</th>
                <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase">Avg D+7</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Avg Overall</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedStats.map((stat) => (
                <tr key={stat.code} className="hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap sticky left-0 bg-white z-10">
                    <span className="text-sm font-medium text-gray-900">{stat.code}</span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-center">
                    <span className="text-sm text-gray-900">{stat.totalDeals}</span>
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap text-center">
                    <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getColorClass(stat.avgReturnD1)}`}>
                      {(stat.avgReturnD1 * 100).toFixed(2)}%
                    </span>
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap text-center">
                    <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getColorClass(stat.avgReturnD2)}`}>
                      {(stat.avgReturnD2 * 100).toFixed(2)}%
                    </span>
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap text-center">
                    <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getColorClass(stat.avgReturnD3)}`}>
                      {(stat.avgReturnD3 * 100).toFixed(2)}%
                    </span>
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap text-center">
                    <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getColorClass(stat.avgReturnD4)}`}>
                      {(stat.avgReturnD4 * 100).toFixed(2)}%
                    </span>
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap text-center">
                    <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getColorClass(stat.avgReturnD5)}`}>
                      {(stat.avgReturnD5 * 100).toFixed(2)}%
                    </span>
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap text-center">
                    <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getColorClass(stat.avgReturnD6)}`}>
                      {(stat.avgReturnD6 * 100).toFixed(2)}%
                    </span>
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap text-center">
                    <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getColorClass(stat.avgReturnD7)}`}>
                      {(stat.avgReturnD7 * 100).toFixed(2)}%
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-center">
                    <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getColorClass(stat.avgReturnOverall)}`}>
                      {(stat.avgReturnOverall * 100).toFixed(2)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
      </div>

      <div className="mt-4 flex items-center gap-4 text-xs text-gray-500">
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 bg-green-600 rounded"></span>
          <span>&gt; 15%</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 bg-green-400 rounded"></span>
          <span>5-15%</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 bg-yellow-200 rounded"></span>
          <span>0-5%</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 bg-orange-300 rounded"></span>
          <span>-5 to 0%</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 bg-red-600 rounded"></span>
          <span>&lt; -5%</span>
        </div>
      </div>
    </div>
  );
}

