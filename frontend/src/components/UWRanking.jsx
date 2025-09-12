import React, { useState, useEffect, useMemo } from 'react';
import { ArrowUpDown, ChevronUp, ChevronDown, TrendingUp, Award, Trophy, Medal, Target, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import { uwAPI } from '../services/api';

const UWRanking = () => {
  const [uwData, setUwData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState({
    key: 'avgReturn7Days',
    direction: 'desc'
  });

  // Fetch all UW data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const response = await uwAPI.getAllRecords('', 1000, 0);
        setUwData(response.data || []);
      } catch (error) {
        console.error('Error fetching UW data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Calculate UW performance statistics
  const uwPerformanceStats = useMemo(() => {
    if (!uwData.length) return [];

    // Group data by underwriter
    const uwStats = {};

    uwData.forEach(record => {
      const underwriters = Array.isArray(record.underwriters) 
        ? record.underwriters 
        : [record.uw || record.underwriters].filter(Boolean);

      underwriters.forEach(uw => {
        if (!uw) return;

        if (!uwStats[uw]) {
          uwStats[uw] = {
            name: uw,
            totalDeals: 0,
            returns: {
              D1: [],
              D2: [],
              D3: [],
              D4: [],
              D5: [],
              D6: [],
              D7: []
            }
          };
        }

        uwStats[uw].totalDeals += 1;

        // Collect returns for each day
        ['D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7'].forEach((day, index) => {
          const returnKey = `returnD${index + 1}`;
          const returnValue = record[returnKey];
          if (returnValue !== null && returnValue !== undefined && !isNaN(returnValue)) {
            uwStats[uw].returns[day].push(parseFloat(returnValue));
          }
        });
      });
    });

    // Calculate averages and rankings
    const uwRankings = Object.values(uwStats).map(uw => {
      const avgReturns = {};
      let totalSum = 0;
      let totalCount = 0;

      ['D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7'].forEach(day => {
        const returns = uw.returns[day];
        if (returns.length > 0) {
          const avg = returns.reduce((sum, val) => sum + val, 0) / returns.length;
          avgReturns[day] = avg;
          totalSum += avg;
          totalCount += 1;
        } else {
          avgReturns[day] = 0;
        }
      });

      const avgReturn7Days = totalCount > 0 ? totalSum / totalCount : 0;

      return {
        ...uw,
        avgReturns,
        avgReturn7Days,
        totalReturns: totalSum
      };
    });

    // Filter UW with at least 2 deals for meaningful statistics
    return uwRankings.filter(uw => uw.totalDeals >= 2);
  }, [uwData]);

  // Sort UW rankings
  const sortedRankings = useMemo(() => {
    if (!sortConfig.key) return uwPerformanceStats;

    const sorted = [...uwPerformanceStats].sort((a, b) => {
      let aValue, bValue;

      if (sortConfig.key.startsWith('D')) {
        aValue = a.avgReturns[sortConfig.key] || 0;
        bValue = b.avgReturns[sortConfig.key] || 0;
      } else {
        aValue = a[sortConfig.key] || 0;
        bValue = b[sortConfig.key] || 0;
      }

      if (sortConfig.direction === 'asc') {
        return aValue - bValue;
      } else {
        return bValue - aValue;
      }
    });

    return sorted;
  }, [uwPerformanceStats, sortConfig]);

  // Handle sorting
  const handleSort = (key) => {
    let direction = 'desc';
    if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'asc';
    }
    setSortConfig({ key, direction });
  };

  // Get sort icon
  const getSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey) {
      return <ArrowUpDown className="h-4 w-4 text-gray-400" />;
    }
    
    return sortConfig.direction === 'asc' 
      ? <ChevronUp className="h-4 w-4 text-indigo-600" />
      : <ChevronDown className="h-4 w-4 text-indigo-600" />;
  };

  // Get rank badge
  const getRankBadge = (index) => {
    if (index === 0) return <Trophy className="h-4 w-4 text-yellow-500" />;
    if (index === 1) return <Medal className="h-4 w-4 text-gray-400" />;
    if (index === 2) return <Award className="h-4 w-4 text-amber-600" />;
    return <span className="text-sm font-medium text-gray-500">#{index + 1}</span>;
  };

  // Format percentage
  const formatPercent = (value) => {
    if (value === null || value === undefined || isNaN(value)) return '-';
    const color = value >= 0 ? 'text-green-600' : 'text-red-600';
    return <span className={color}>{value.toFixed(2)}%</span>;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat ranking underwriter...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Navigation */}
        <div className="mb-6">
          <Link to="/">
            <Button variant="outline" className="flex items-center space-x-2">
              <ArrowLeft className="h-4 w-4" />
              <span>Kembali ke Data Table</span>
            </Button>
          </Link>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <Target className="h-8 w-8 text-indigo-600" />
            <h1 className="text-3xl font-bold text-gray-900">Ranking Performance Underwriter</h1>
          </div>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Analisis performa underwriter berdasarkan rata-rata return D+1 hingga D+7 setelah IPO. 
            Ranking berdasarkan rata-rata return 7 hari setelah listing.
          </p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-indigo-600">{sortedRankings.length}</div>
              <div className="text-sm text-gray-600">Total UW (≥2 deals)</div>
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {sortedRankings.length > 0 ? formatPercent(sortedRankings[0]?.avgReturn7Days) : '-'}
              </div>
              <div className="text-sm text-gray-600">Best Performer</div>
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">
                {sortedRankings.length > 0 
                  ? formatPercent(sortedRankings.reduce((sum, uw) => sum + uw.avgReturn7Days, 0) / sortedRankings.length)
                  : '-'
                }
              </div>
              <div className="text-sm text-gray-600">Market Average</div>
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-indigo-600">
                {uwData.length}
              </div>
              <div className="text-sm text-gray-600">Total IPO Records</div>
            </div>
          </Card>
        </div>

        {/* Ranking Table */}
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span>Ranking Performance Underwriter</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="font-semibold text-gray-900 w-16">Rank</TableHead>
                    <TableHead className="font-semibold text-gray-900">Underwriter</TableHead>
                    <TableHead className="font-semibold text-gray-900 text-center">Total Deals</TableHead>
                    <TableHead 
                      className="font-semibold text-gray-900 cursor-pointer hover:bg-gray-100 select-none transition-colors text-center"
                      onClick={() => handleSort('avgReturn7Days')}
                      title="Average Return 7 Days After IPO"
                    >
                      <div className="flex items-center justify-center space-x-1">
                        <span>Avg 7-Day Return</span>
                        {getSortIcon('avgReturn7Days')}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="font-semibold text-gray-900 cursor-pointer hover:bg-gray-100 select-none transition-colors text-center"
                      onClick={() => handleSort('D1')}
                    >
                      <div className="flex items-center justify-center space-x-1">
                        <span>Avg D+1</span>
                        {getSortIcon('D1')}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="font-semibold text-gray-900 cursor-pointer hover:bg-gray-100 select-none transition-colors text-center"
                      onClick={() => handleSort('D2')}
                    >
                      <div className="flex items-center justify-center space-x-1">
                        <span>Avg D+2</span>
                        {getSortIcon('D2')}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="font-semibold text-gray-900 cursor-pointer hover:bg-gray-100 select-none transition-colors text-center"
                      onClick={() => handleSort('D3')}
                    >
                      <div className="flex items-center justify-center space-x-1">
                        <span>Avg D+3</span>
                        {getSortIcon('D3')}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="font-semibold text-gray-900 cursor-pointer hover:bg-gray-100 select-none transition-colors text-center"
                      onClick={() => handleSort('D4')}
                    >
                      <div className="flex items-center justify-center space-x-1">
                        <span>Avg D+4</span>
                        {getSortIcon('D4')}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="font-semibold text-gray-900 cursor-pointer hover:bg-gray-100 select-none transition-colors text-center"
                      onClick={() => handleSort('D5')}
                    >
                      <div className="flex items-center justify-center space-x-1">
                        <span>Avg D+5</span>
                        {getSortIcon('D5')}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="font-semibold text-gray-900 cursor-pointer hover:bg-gray-100 select-none transition-colors text-center"
                      onClick={() => handleSort('D6')}
                    >
                      <div className="flex items-center justify-center space-x-1">
                        <span>Avg D+6</span>
                        {getSortIcon('D6')}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="font-semibold text-gray-900 cursor-pointer hover:bg-gray-100 select-none transition-colors text-center"
                      onClick={() => handleSort('D7')}
                    >
                      <div className="flex items-center justify-center space-x-1">
                        <span>Avg D+7</span>
                        {getSortIcon('D7')}
                      </div>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedRankings.map((uw, index) => (
                    <TableRow key={uw.name} className="hover:bg-gray-50">
                      <TableCell className="font-medium">
                        <div className="flex items-center justify-center">
                          {getRankBadge(index)}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        <Badge variant="outline" className="font-medium">
                          {uw.name}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary">
                          {uw.totalDeals}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center font-medium">
                        {formatPercent(uw.avgReturn7Days)}
                      </TableCell>
                      <TableCell className="text-center">{formatPercent(uw.avgReturns.D1)}</TableCell>
                      <TableCell className="text-center">{formatPercent(uw.avgReturns.D2)}</TableCell>
                      <TableCell className="text-center">{formatPercent(uw.avgReturns.D3)}</TableCell>
                      <TableCell className="text-center">{formatPercent(uw.avgReturns.D4)}</TableCell>
                      <TableCell className="text-center">{formatPercent(uw.avgReturns.D5)}</TableCell>
                      <TableCell className="text-center">{formatPercent(uw.avgReturns.D6)}</TableCell>
                      <TableCell className="text-center">{formatPercent(uw.avgReturns.D7)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Footer Note */}
        <div className="text-center mt-6 text-sm text-gray-500">
          <p>* Hanya underwriter dengan minimal 2 deals yang ditampilkan untuk akurasi statistik</p>
          <p>* Ranking berdasarkan rata-rata return 7 hari setelah IPO (D+1 hingga D+7)</p>
        </div>
      </div>
    </div>
  );
};

export default UWRanking;