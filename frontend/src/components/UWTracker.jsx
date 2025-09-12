import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Search, FileText, TrendingUp, RefreshCw, Plus, AlertCircle, ChevronUp, ChevronDown, ArrowUpDown, ChevronLeft, ChevronRight, Target } from 'lucide-react';
import { Link } from 'react-router-dom';
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
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(100);

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
      
      const response = await uwAPI.getAllRecords(search, 1000, 0); // Get all data for client-side pagination
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

  // Calculate average return 7 days for each record
  const dataWithAvgReturn = useMemo(() => {
    return uwData.map(record => {
      const returns = [];
      ['returnD1', 'returnD2', 'returnD3', 'returnD4', 'returnD5', 'returnD6', 'returnD7'].forEach(key => {
        const value = record[key];
        if (value !== null && value !== undefined && !isNaN(value)) {
          returns.push(parseFloat(value));
        }
      });
      
      const avgReturn7Days = returns.length > 0 
        ? returns.reduce((sum, val) => sum + val, 0) / returns.length 
        : 0;
      
      return {
        ...record,
        avgReturn7Days
      };
    });
  }, [uwData]);

  // Sorting functionality - Sort data based on current sort configuration
  const sortedData = useMemo(() => {
    if (!sortConfig.key) return uwData;

    const sortableData = [...uwData];
    
    sortableData.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortConfig.key) {
        case 'underwriters':
          // Sort by first underwriter name
          aValue = Array.isArray(a.underwriters) ? a.underwriters[0] || '' : (a.uw || a.underwriters || '');
          bValue = Array.isArray(b.underwriters) ? b.underwriters[0] || '' : (b.uw || b.underwriters || '');
          break;
        case 'code':
          aValue = a.code || '';
          bValue = b.code || '';
          break;
        case 'companyName':
          aValue = a.companyName || '';
          bValue = b.companyName || '';
          break;
        case 'ipoPrice':
          aValue = a.ipoPrice || 0;
          bValue = b.ipoPrice || 0;
          break;
        case 'returnD1':
        case 'returnD2':  
        case 'returnD3':
        case 'returnD4':
        case 'returnD5':
        case 'returnD6':
        case 'returnD7':
          aValue = a[sortConfig.key] || 0;
          bValue = b[sortConfig.key] || 0;
          break;
        case 'listingDate':
          aValue = new Date(a.listingDate || 0);
          bValue = new Date(b.listingDate || 0);
          break;
        default:
          aValue = a[sortConfig.key] || '';
          bValue = b[sortConfig.key] || '';
      }

      // Handle different data types
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        // String comparison (case insensitive)
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      } else if (typeof aValue === 'number' && typeof bValue === 'number') {
        // Number comparison
        return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
      } else if (aValue instanceof Date && bValue instanceof Date) {
        // Date comparison
        return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      return 0;
    });

    return sortableData;
  }, [uwData, sortConfig]);

  // Pagination functionality
  const totalPages = Math.ceil(uwData.length / itemsPerPage);
  
  // Get current page data from sorted data
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sortedData.slice(startIndex, endIndex);
  }, [sortedData, currentPage, itemsPerPage]);

  // Calculate displayed range
  const displayedRange = useMemo(() => {
    if (uwData.length === 0) return { start: 0, end: 0, total: 0 };
    
    const start = (currentPage - 1) * itemsPerPage + 1;
    const end = Math.min(currentPage * itemsPerPage, uwData.length);
    return { start, end, total: uwData.length };
  }, [currentPage, itemsPerPage, uwData.length]);

  // Handle page change
  const handlePageChange = (page) => {
    setCurrentPage(page);
    // Scroll to top when page changes
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Reset to page 1 when sorting changes
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
    setCurrentPage(1); // Reset to first page when sorting
  };

  // Pagination component
  const Pagination = () => {
    if (totalPages <= 1) return null;

    const getPageNumbers = () => {
      const pages = [];
      const maxVisiblePages = 5;
      
      if (totalPages <= maxVisiblePages) {
        for (let i = 1; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        if (currentPage <= 3) {
          for (let i = 1; i <= 4; i++) pages.push(i);
          pages.push('...');
          pages.push(totalPages);
        } else if (currentPage >= totalPages - 2) {
          pages.push(1);
          pages.push('...');
          for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
        } else {
          pages.push(1);
          pages.push('...');
          for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
          pages.push('...');
          pages.push(totalPages);
        }
      }
      
      return pages;
    };

    return (
      <div className="flex items-center justify-between px-6 py-4 bg-white border-t">
        <div className="flex items-center space-x-2 text-sm text-gray-700">
          <span>
            Menampilkan <span className="font-medium">{displayedRange.start}</span> - <span className="font-medium">{displayedRange.end}</span> dari <span className="font-medium">{displayedRange.total}</span> data
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="flex items-center space-x-1"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Previous</span>
          </Button>
          
          <div className="flex items-center space-x-1">
            {getPageNumbers().map((page, index) => (
              <React.Fragment key={index}>
                {page === '...' ? (
                  <span className="px-2 py-1 text-gray-400">...</span>
                ) : (
                  <Button
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePageChange(page)}
                    className={`min-w-[40px] ${
                      currentPage === page 
                        ? 'bg-indigo-600 text-white' 
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </Button>
                )}
              </React.Fragment>
            ))}
          </div>
          
          <Button
            variant="outline" 
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="flex items-center space-x-1"
          >
            <span>Next</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };

  // Get sort icon for header
  const getSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey) {
      return <ArrowUpDown className="h-4 w-4 text-gray-400" />;
    }
    
    return sortConfig.direction === 'asc' 
      ? <ChevronUp className="h-4 w-4 text-indigo-600" />
      : <ChevronDown className="h-4 w-4 text-indigo-600" />;
  };

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
          <p className="text-gray-600 mb-6">
            Analisis performa historis underwriter IPO berdasarkan data listing dan performa saham
          </p>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-center space-x-4 mb-8">
            <Link to="/ranking">
              <Button variant="outline" className="flex items-center space-x-2">
                <Target className="h-4 w-4" />
                <span>Ranking Performance UW</span>
              </Button>
            </Link>
          </div>

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
              <div className="text-2xl font-bold text-indigo-600">{displayedRange.end - displayedRange.start + 1}</div>
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
          
          {/* Sorting Info */}
          {sortConfig.key && (
            <div className="mt-4 text-center">
              <div className="inline-flex items-center space-x-2 text-sm text-gray-600 bg-blue-50 px-3 py-1 rounded-full">
                <span>Diurutkan berdasarkan:</span>
                <span className="font-medium text-indigo-600">
                  {sortConfig.key === 'underwriters' && 'UW'}
                  {sortConfig.key === 'code' && 'Kode Saham'}
                  {sortConfig.key === 'companyName' && 'Nama Perusahaan'}
                  {sortConfig.key === 'ipoPrice' && 'Harga IPO'}
                  {sortConfig.key === 'returnD1' && 'Return D+1'}
                  {sortConfig.key === 'returnD2' && 'Return D+2'}
                  {sortConfig.key === 'returnD3' && 'Return D+3'}
                  {sortConfig.key === 'returnD4' && 'Return D+4'}
                  {sortConfig.key === 'returnD5' && 'Return D+5'}
                  {sortConfig.key === 'returnD6' && 'Return D+6'}
                  {sortConfig.key === 'returnD7' && 'Return D+7'}
                  {sortConfig.key === 'listingDate' && 'Tanggal Listing'}
                </span>
                <span className="text-indigo-500">
                  {sortConfig.direction === 'asc' ? '↑' : '↓'}
                  {(sortConfig.key === 'underwriters' || sortConfig.key === 'code' || sortConfig.key === 'companyName') 
                    ? (sortConfig.direction === 'asc' ? ' (A-Z)' : ' (Z-A)')
                    : (sortConfig.direction === 'asc' ? ' (Terkecil)' : ' (Terbesar)')
                  }
                </span>
                <button
                  onClick={() => setSortConfig({ key: null, direction: 'asc' })}
                  className="text-gray-400 hover:text-gray-600 ml-2"
                  title="Reset sorting"
                >
                  ×
                </button>
              </div>
            </div>
          )}
        </Card>

        {/* Data Table */}
        <Card className="overflow-hidden">
          {sortedData.length === 0 && !isSearching ? (
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
                    <TableHead 
                      className="font-semibold text-gray-900 cursor-pointer hover:bg-gray-100 select-none transition-colors"
                      onClick={() => handleSort('underwriters')}
                      title="Klik untuk sort berdasarkan UW (A-Z / Z-A)"
                    >
                      <div className="flex items-center justify-between">
                        <span>UW</span>
                        {getSortIcon('underwriters')}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="font-semibold text-gray-900 cursor-pointer hover:bg-gray-100 select-none transition-colors"
                      onClick={() => handleSort('code')}
                      title="Klik untuk sort berdasarkan Kode Saham (A-Z / Z-A)"
                    >
                      <div className="flex items-center justify-between">
                        <span>Kode</span>
                        {getSortIcon('code')}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="font-semibold text-gray-900 cursor-pointer hover:bg-gray-100 select-none transition-colors"
                      onClick={() => handleSort('companyName')}
                      title="Klik untuk sort berdasarkan Nama Perusahaan (A-Z / Z-A)"
                    >
                      <div className="flex items-center justify-between">
                        <span>Nama Perusahaan</span>
                        {getSortIcon('companyName')}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="font-semibold text-gray-900 cursor-pointer hover:bg-gray-100 select-none transition-colors"
                      onClick={() => handleSort('ipoPrice')}
                      title="Klik untuk sort berdasarkan Harga IPO (Terbesar-Terkecil / Terkecil-Terbesar)"
                    >
                      <div className="flex items-center justify-between">
                        <span>Harga IPO</span>
                        {getSortIcon('ipoPrice')}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="font-semibold text-gray-900 cursor-pointer hover:bg-gray-100 select-none transition-colors"
                      onClick={() => handleSort('returnD1')}
                      title="Klik untuk sort berdasarkan Return D+1 (Terbesar-Terkecil / Terkecil-Terbesar)"
                    >
                      <div className="flex items-center justify-between">
                        <span>D+1</span>
                        {getSortIcon('returnD1')}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="font-semibold text-gray-900 cursor-pointer hover:bg-gray-100 select-none transition-colors"
                      onClick={() => handleSort('returnD2')}
                      title="Klik untuk sort berdasarkan Return D+2 (Terbesar-Terkecil / Terkecil-Terbesar)"
                    >
                      <div className="flex items-center justify-between">
                        <span>D+2</span>
                        {getSortIcon('returnD2')}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="font-semibold text-gray-900 cursor-pointer hover:bg-gray-100 select-none transition-colors"
                      onClick={() => handleSort('returnD3')}
                      title="Klik untuk sort berdasarkan Return D+3 (Terbesar-Terkecil / Terkecil-Terbesar)"
                    >
                      <div className="flex items-center justify-between">
                        <span>D+3</span>
                        {getSortIcon('returnD3')}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="font-semibold text-gray-900 cursor-pointer hover:bg-gray-100 select-none transition-colors"
                      onClick={() => handleSort('returnD4')}
                      title="Klik untuk sort berdasarkan Return D+4 (Terbesar-Terkecil / Terkecil-Terbesar)"
                    >
                      <div className="flex items-center justify-between">
                        <span>D+4</span>
                        {getSortIcon('returnD4')}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="font-semibold text-gray-900 cursor-pointer hover:bg-gray-100 select-none transition-colors"
                      onClick={() => handleSort('returnD5')}
                      title="Klik untuk sort berdasarkan Return D+5 (Terbesar-Terkecil / Terkecil-Terbesar)"
                    >
                      <div className="flex items-center justify-between">
                        <span>D+5</span>
                        {getSortIcon('returnD5')}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="font-semibold text-gray-900 cursor-pointer hover:bg-gray-100 select-none transition-colors"
                      onClick={() => handleSort('returnD6')}
                      title="Klik untuk sort berdasarkan Return D+6 (Terbesar-Terkecil / Terkecil-Terbesar)"
                    >
                      <div className="flex items-center justify-between">
                        <span>D+6</span>
                        {getSortIcon('returnD6')}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="font-semibold text-gray-900 cursor-pointer hover:bg-gray-100 select-none transition-colors"
                      onClick={() => handleSort('returnD7')}
                      title="Klik untuk sort berdasarkan Return D+7 (Terbesar-Terkecil / Terkecil-Terbesar)"
                    >
                      <div className="flex items-center justify-between">
                        <span>D+7</span>
                        {getSortIcon('returnD7')}
                      </div>
                    </TableHead>
                    <TableHead className="font-semibold text-gray-900">Papan</TableHead>
                    <TableHead 
                      className="font-semibold text-gray-900 cursor-pointer hover:bg-gray-100 select-none transition-colors"
                      onClick={() => handleSort('listingDate')}
                      title="Klik untuk sort berdasarkan Tanggal Listing (⬇️ Terbaru / ⬆️ Terlama)"
                    >
                      <div className="flex items-center justify-between">
                        <span>Tanggal Listing</span>
                        {getSortIcon('listingDate')}
                      </div>
                    </TableHead>
                    <TableHead className="font-semibold text-gray-900">Record</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedData.map((item) => (
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
          
          {/* Pagination */}
          {uwData.length > 0 && <Pagination />}
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