import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Search, FileText, TrendingUp, RefreshCw, Plus, AlertCircle, ChevronUp, ChevronDown, ArrowUpDown } from 'lucide-react';
import { Input } from './ui/input';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import { uwAPI, formatReturn, formatPrice, formatDate } from '../services/api';

const UWTracker = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [uwData, setUwData] = useState([]);
  const [stats, setStats] = useState({
    totalRecords: 0,
    totalUW: 0,
    totalCompanies: 0,
    lastUpdated: null
  });
  const [error, setError] = useState(null);
  const [displayedCount, setDisplayedCount] = useState(0);
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: 'asc'
  });

  // Debounced search function
  const debounce = useCallback((func, wait) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }, []);

  // Fetch UW data from API
  const fetchUWData = useCallback(async (search = '') => {
    try {
      setIsSearching(true);
      setError(null);
      
      const response = await uwAPI.getAllRecords(search, 100, 0);
      setUwData(response.data || []);
      setDisplayedCount(response.count || 0);
    } catch (err) {
      console.error('Error fetching UW data:', err);
      setError(`Failed to load data: ${err.message}`);
      setUwData([]);
      setDisplayedCount(0);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Fetch statistics
  const fetchStats = useCallback(async () => {
    try {
      const statsData = await uwAPI.getStats();
      setStats(statsData);
    } catch (err) {
      console.error('Error fetching stats:', err);
      // Don't show error for stats, just use default values
    }
  }, []);

  // Debounced search handler
  const debouncedSearch = useMemo(
    () => debounce((searchValue) => fetchUWData(searchValue), 300),
    [debounce, fetchUWData]
  );

  // Initial data load
  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true);
      await Promise.all([
        fetchUWData(),
        fetchStats()
      ]);
      setIsLoading(false);
    };

    loadInitialData();
  }, [fetchUWData, fetchStats]);

  // Handle search input change
  const handleSearchChange = (value) => {
    setSearchTerm(value);
    debouncedSearch(value);
  };

  // Refresh all data
  const handleRefresh = async () => {
    setIsLoading(true);
    await Promise.all([
      fetchUWData(searchTerm),
      fetchStats()
    ]);
    setIsLoading(false);
  };

  // Utility functions for styling
  const getReturnColor = (returnValue) => {
    if (returnValue === null || returnValue === undefined) return 'text-gray-400';
    if (returnValue > 0) return 'text-green-600';
    if (returnValue < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getBoardBadgeColor = (board) => {
    switch (board) {
      case 'Utama':
        return 'bg-blue-100 text-blue-800';
      case 'Pengembangan':
        return 'bg-green-100 text-green-800';
      case 'Akselerasi':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading UW Tracker data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="bg-indigo-600 p-2 rounded-lg">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">UW Tracker</h1>
                <p className="text-sm text-gray-500">Track Record Underwriter IPO</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRefresh}
                disabled={isLoading}
                className="flex items-center space-x-2"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </Button>
              <span className="text-sm text-gray-600">Mode Tamu</span>
              <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700">
                Login
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Track Record Underwriter IPO Indonesia
          </h2>
          <p className="text-gray-600 mb-8">
            Analisis performa historis underwriter IPO berdasarkan data listing dan performa saham
          </p>

          {/* Search Bar */}
          <div className="max-w-md mx-auto relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              type="text"
              placeholder="Cari berdasarkan kode UW saja"
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10 pr-4 py-3 w-full rounded-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
            />
            {isSearching && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
              </div>
            )}
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert className="mb-6" variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Stats */}
        <Card className="p-6 mb-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-indigo-600">{stats.totalRecords}</div>
              <div className="text-sm text-gray-600">Total Data</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-indigo-600">{displayedCount}</div>
              <div className="text-sm text-gray-600">Menampilkan</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-indigo-600">{stats.totalUW}</div>
              <div className="text-sm text-gray-600">Total UW</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-indigo-600">{stats.totalCompanies}</div>
              <div className="text-sm text-gray-600">Total Perusahaan</div>
            </div>
          </div>
        </Card>

        {/* Data Table */}
        <Card className="overflow-hidden">
          {uwData.length === 0 && !isSearching ? (
            <div className="text-center py-12">
              <TrendingUp className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">
                {searchTerm ? 'Tidak ada data yang sesuai dengan pencarian' : 'Tidak ada data yang tersedia'}
              </p>
              {!searchTerm && (
                <Button 
                  onClick={handleRefresh} 
                  className="mt-4"
                  variant="outline"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Muat Data
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="font-semibold text-gray-900">UW</TableHead>
                    <TableHead className="font-semibold text-gray-900">Kode</TableHead>
                    <TableHead className="font-semibold text-gray-900">Nama Perusahaan</TableHead>
                    <TableHead className="font-semibold text-gray-900">Harga IPO</TableHead>
                    <TableHead className="font-semibold text-gray-900">D+1</TableHead>
                    <TableHead className="font-semibold text-gray-900">D+2</TableHead>
                    <TableHead className="font-semibold text-gray-900">D+3</TableHead>
                    <TableHead className="font-semibold text-gray-900">D+4</TableHead>
                    <TableHead className="font-semibold text-gray-900">D+5</TableHead>
                    <TableHead className="font-semibold text-gray-900">D+6</TableHead>
                    <TableHead className="font-semibold text-gray-900">D+7</TableHead>
                    <TableHead className="font-semibold text-gray-900">Papan</TableHead>
                    <TableHead className="font-semibold text-gray-900">Tanggal Listing</TableHead>
                    <TableHead className="font-semibold text-gray-900">Record</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {uwData.map((item) => (
                    <TableRow key={item._id} className="hover:bg-gray-50">
                      <TableCell className="font-medium text-indigo-600">
                        {Array.isArray(item.underwriters) ? (
                          <div className="flex flex-wrap gap-1">
                            {item.underwriters.map((uw, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {uw}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          item.uw || item.underwriters
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{item.code}</TableCell>
                      <TableCell className="max-w-xs">
                        <div className="truncate" title={item.companyName}>
                          {item.companyName}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{formatPrice(item.ipoPrice)}</TableCell>
                      <TableCell className={`font-medium ${getReturnColor(item.returnD1)}`}>
                        {formatReturn(item.returnD1)}
                      </TableCell>
                      <TableCell className={`font-medium ${getReturnColor(item.returnD2)}`}>
                        {formatReturn(item.returnD2)}
                      </TableCell>
                      <TableCell className={`font-medium ${getReturnColor(item.returnD3)}`}>
                        {formatReturn(item.returnD3)}
                      </TableCell>
                      <TableCell className={`font-medium ${getReturnColor(item.returnD4)}`}>
                        {formatReturn(item.returnD4)}
                      </TableCell>
                      <TableCell className={`font-medium ${getReturnColor(item.returnD5)}`}>
                        {formatReturn(item.returnD5)}
                      </TableCell>
                      <TableCell className={`font-medium ${getReturnColor(item.returnD6)}`}>
                        {formatReturn(item.returnD6)}
                      </TableCell>
                      <TableCell className={`font-medium ${getReturnColor(item.returnD7)}`}>
                        {formatReturn(item.returnD7)}
                      </TableCell>
                      <TableCell>
                        <Badge className={getBoardBadgeColor(item.listingBoard)}>
                          {item.listingBoard}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {formatDate(item.listingDate)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-medium">
                          {item.record || '-'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>

        {/* Footer with last updated info */}
        {stats.lastUpdated && (
          <div className="text-center mt-6 text-sm text-gray-500">
            Data terakhir diperbarui: {formatDate(stats.lastUpdated)}
          </div>
        )}
      </main>
    </div>
  );
};

export default UWTracker;