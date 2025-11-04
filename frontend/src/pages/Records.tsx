import { useEffect, useState, useMemo } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import type { UWRecord } from '../types';
import { exportToJSON, exportToExcel } from '../utils/export';

type SortField = 'code' | 'companyName' | 'returnD1' | 'returnD2' | 'returnD3' | 'returnD4' | 'returnD5' | 'returnD6' | 'returnD7' | null;
type SortDirection = 'asc' | 'desc' | null;

export default function Records() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [records, setRecords] = useState<UWRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState(() => searchParams.get('underwriter') || '');
  const [searchType, setSearchType] = useState<'stock' | 'underwriter'>(() => 
    searchParams.get('underwriter') ? 'underwriter' : 'underwriter'
  );
  const [total, setTotal] = useState(0);
  const [limit, setLimit] = useState(50);
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [showSummary, setShowSummary] = useState(false);

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        setLoading(true);
        // Use grouped endpoint to show stocks with all underwriters combined
        const response = await apiService.getGroupedRecords(limit, search || undefined, searchType);
        setRecords(response.data || []);
        setTotal(response.total || 0);
        
        // Auto-show summary when underwriter search returns results
        if (searchType === 'underwriter' && search.trim() && response.data && response.data.length > 0) {
          setShowSummary(true);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load records');
      } finally {
        setLoading(false);
      }
    };

    // Debounce search
    const timeoutId = setTimeout(() => {
      fetchRecords();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [search, limit, searchType]);

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatReturn = (value: number | null | undefined) => {
    if (value === null || value === undefined) return '-';
    const percent = (value * 100).toFixed(2);
    const color = value >= 0 ? 'text-green-600' : 'text-red-600';
    return <span className={color}>{percent}%</span>;
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortField(null);
        setSortDirection(null);
      } else {
        setSortDirection('asc');
      }
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedRecords = useMemo(() => {
    if (!sortField || !sortDirection) return records;
    
    return [...records].sort((a, b) => {
      let aVal: any = a[sortField];
      let bVal: any = b[sortField];
      
      // Handle null/undefined values
      if (aVal === null || aVal === undefined) aVal = sortField.startsWith('return') ? -Infinity : '';
      if (bVal === null || bVal === undefined) bVal = sortField.startsWith('return') ? -Infinity : '';
      
      if (sortDirection === 'asc') {
        return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
      } else {
        return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
      }
    });
  }, [records, sortField, sortDirection]);

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <span className="ml-1 text-gray-400">↕</span>;
    }
    return <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>;
  };

  const handleDownloadJSON = async () => {
    try {
      // Fetch ALL records for download
      const response = await apiService.getGroupedRecords(10000);
      const allRecords = response.data || [];
      exportToJSON(allRecords, 'uw-records.json');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to download records');
    }
  };

  const handleDownloadExcel = async () => {
    try {
      // Fetch ALL records for download
      const response = await apiService.getGroupedRecords(10000);
      const allRecords = response.data || [];
      exportToExcel(allRecords);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to download records');
    }
  };

  return (
    <div>
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">IPO Records</h1>
          <p className="mt-2 text-gray-600">
            Browse and search Indonesian IPO underwriter performance records. Records are grouped by stock code with all underwriters combined.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleDownloadJSON}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            📥 Download JSON
          </button>
          <button
            onClick={handleDownloadExcel}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            📊 Download Excel
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white shadow rounded-lg p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="search" className="block text-sm font-medium text-gray-700">
                Search
              </label>
              {/* Toggle Button - Enhanced for better visibility */}
              <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-1">
                <button
                  type="button"
                  onClick={() => setSearchType('stock')}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors duration-200 ${
                    searchType === 'stock'
                      ? 'bg-white text-primary-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  📊 Stock Code
                </button>
                <button
                  type="button"
                  onClick={() => setSearchType('underwriter')}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors duration-200 ${
                    searchType === 'underwriter'
                      ? 'bg-white text-primary-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  🏦 Underwriter
                </button>
              </div>
            </div>
            <input
              type="text"
              id="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={searchType === 'stock' ? 'e.g., BBCA, BBRI' : 'Type underwriter code (e.g., CDIA, AH, BC)'}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
            <div className="mt-1 flex items-center gap-2">
              {searchType === 'underwriter' && search.trim() ? (
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-xs text-primary-600 font-medium">
                    💡 Tip: Partial matches work! Type "cdia" to find all IPOs with CDIA underwriter
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowSummary(!showSummary)}
                    className="inline-flex items-center px-3 py-1 text-xs font-medium rounded-md bg-primary-600 text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors"
                  >
                    {showSummary ? '📊 Hide' : '✓ Show'} Complete History
                  </button>
                  <span className="text-xs text-gray-500">
                    (Showing all underwriters for each IPO)
                  </span>
                </div>
              ) : (
                <p className="text-xs text-gray-500">
                  {searchType === 'stock' 
                    ? 'Search by stock code or company name' 
                    : '💡 Tip: Partial matches work! Type "cdia" to find all IPOs with CDIA underwriter'}
                </p>
              )}
            </div>
          </div>
          <div className="sm:w-48">
            <label htmlFor="limit" className="block text-sm font-medium text-gray-700 mb-1">
              Limit
            </label>
            <select
              id="limit"
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={200}>200</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Count and Summary */}
      <div className="mb-4 space-y-2">
        <div className="text-sm text-gray-600">
          Showing {records.length} of {total} records
        </div>
        
        {/* Summary Section for Underwriter Search */}
        {searchType === 'underwriter' && search.trim() && records.length > 0 && (
          <div className={`bg-blue-50 border border-blue-200 rounded-lg p-4 ${showSummary ? 'block' : 'hidden'}`}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-blue-900 mb-2">
                  📋 Complete Underwriter History for "{search.toUpperCase()}"
                </h3>
                <p className="text-xs text-blue-700 mb-3">
                  Below are all IPOs where <strong>{search.toUpperCase()}</strong> was involved as an underwriter. 
                  Each IPO shows <strong>all underwriters</strong> that participated, so you can see the complete history.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div className="bg-white rounded p-2">
                    <div className="font-semibold text-gray-700">Total IPOs Found</div>
                    <div className="text-2xl font-bold text-primary-600">{records.length}</div>
                  </div>
                  <div className="bg-white rounded p-2">
                    <div className="font-semibold text-gray-700">Unique Underwriters</div>
                    <div className="text-2xl font-bold text-primary-600">
                      {new Set(records.flatMap(r => r.underwriters || (r.uw ? [r.uw] : []))).size}
                    </div>
                  </div>
                  <div className="bg-white rounded p-2">
                    <div className="font-semibold text-gray-700">Average UW Count</div>
                    <div className="text-2xl font-bold text-primary-600">
                      {(records.reduce((sum, r) => {
                        const uwList = r.underwriters || (r.uw ? [r.uw] : []);
                        return sum + (uwList.length || 0);
                      }, 0) / records.length).toFixed(1)}
                    </div>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-blue-200">
                  <p className="text-xs text-blue-600">
                    💡 <strong>Tip:</strong> The matched underwriter ({search.toUpperCase()}) is highlighted in 
                    <span className="inline-flex items-center px-2 py-0.5 mx-1 rounded text-xs font-medium bg-primary-600 text-white">
                      dark blue
                    </span>
                    in the table below. Other underwriters in the same IPO are shown in light blue.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowSummary(false)}
                className="ml-4 text-blue-600 hover:text-blue-800"
              >
                ✕
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <h3 className="text-red-800 font-semibold">Error</h3>
          <p className="text-red-600 mt-1">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        /* Records Table */
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <div className="overflow-x-auto" style={{ maxHeight: '80vh' }}>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Code
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Company
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    UW Count
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Underwriters
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    IPO Price
                  </th>
                  <th 
                    className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('returnD1')}
                  >
                    D+1 <SortIcon field="returnD1" />
                  </th>
                  <th 
                    className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('returnD2')}
                  >
                    D+2 <SortIcon field="returnD2" />
                  </th>
                  <th 
                    className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('returnD3')}
                  >
                    D+3 <SortIcon field="returnD3" />
                  </th>
                  <th 
                    className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('returnD4')}
                  >
                    D+4 <SortIcon field="returnD4" />
                  </th>
                  <th 
                    className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('returnD5')}
                  >
                    D+5 <SortIcon field="returnD5" />
                  </th>
                  <th 
                    className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('returnD6')}
                  >
                    D+6 <SortIcon field="returnD6" />
                  </th>
                  <th 
                    className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('returnD7')}
                  >
                    D+7 <SortIcon field="returnD7" />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Listing Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Board
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {records.length === 0 ? (
                  <tr>
                    <td colSpan={13} className="px-6 py-4 text-center text-gray-500">
                      No records found
                    </td>
                  </tr>
                ) : (
                  sortedRecords.map((record) => {
                    const uwList = record.underwriters && record.underwriters.length > 0 
                      ? record.underwriters 
                      : record.uw ? [record.uw] : [];
                    const uwCount = uwList.length;
                    
                    // Check if any underwriter matches the search term (for highlighting)
                    const searchUpper = searchType === 'underwriter' && search.trim() 
                      ? search.toUpperCase().trim() 
                      : '';
                    const hasMatchingUW = searchUpper && uwList.some(uw => 
                      uw && uw.toUpperCase().includes(searchUpper)
                    );
                    
                    return (
                      <tr
                        key={record._id}
                        className={`hover:bg-gray-50 ${hasMatchingUW ? 'bg-primary-50' : ''}`}
                        onClick={(e) => {
                          // Only navigate if clicking on the row, not on buttons or links
                          const target = e.target as HTMLElement;
                          if (target.tagName !== 'BUTTON' && 
                              target.tagName !== 'A' &&
                              !target.closest('button') &&
                              !target.closest('a')) {
                            navigate(`/records/${record._id}`);
                          }
                        }}
                      >
                        <td className="px-4 py-4 whitespace-nowrap">
                          <Link
                            to={`/records/${record._id}`}
                            className="text-sm font-medium text-primary-600 hover:text-primary-800"
                          >
                            {record.code}
                          </Link>
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-sm text-gray-900 max-w-xs truncate" title={record.companyName}>
                            {record.companyName}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-center">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800">
                            {uwCount}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {uwList.length > 0 ? (
                              uwList.map((uw, idx) => {
                                // Highlight the matched underwriter
                                const isMatched = searchUpper && uw && uw.toUpperCase().includes(searchUpper);
                                return (
                                  <button
                                    key={idx}
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      // Set search to this underwriter and switch to underwriter mode
                                      setSearch(uw);
                                      setSearchType('underwriter');
                                      setSearchParams({ underwriter: uw });
                                    }}
                                    className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium cursor-pointer transition-all hover:scale-105 ${
                                      isMatched
                                        ? 'bg-primary-600 text-white font-semibold ring-2 ring-primary-300 hover:bg-primary-700'
                                        : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                                    }`}
                                    title={isMatched ? `Matched underwriter: ${uw} (click to filter)` : `Click to filter by ${uw}`}
                                  >
                                    {uw}
                                    {isMatched && <span className="ml-1">✓</span>}
                                  </button>
                                );
                              })
                            ) : (
                              <span className="text-gray-400 text-xs">-</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatPrice(record.ipoPrice)}
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm text-center">
                          {formatReturn(record.returnD1)}
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm text-center">
                          {formatReturn(record.returnD2)}
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm text-center">
                          {formatReturn(record.returnD3)}
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm text-center">
                          {formatReturn(record.returnD4)}
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm text-center">
                          {formatReturn(record.returnD5)}
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm text-center">
                          {formatReturn(record.returnD6)}
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm text-center">
                          {formatReturn(record.returnD7)}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(record.listingDate)}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                          {record.listingBoard || '-'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

