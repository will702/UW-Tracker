import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';

interface Underwriter {
  code: string;
  ipoCount: number;
  totalIPOs: number;
}

export default function Brokers() {
  const [underwriters, setUnderwriters] = useState<Underwriter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUnderwriters = async () => {
      try {
        setLoading(true);
        const response = await apiService.getAllUnderwriters();
        setUnderwriters(response.data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load underwriters');
      } finally {
        setLoading(false);
      }
    };

    fetchUnderwriters();
  }, []);

  const handleUnderwriterClick = (code: string) => {
    // Navigate to records page with underwriter filter
    navigate(`/records?underwriter=${encodeURIComponent(code)}`);
  };

  const filteredUnderwriters = underwriters.filter(uw =>
    search.trim() === '' || uw.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Brokers Reference</h1>
            <p className="mt-2 text-gray-600">
              Reference list of all underwriters (brokers) that have handled IPOs in Indonesia Stock Exchange.
              Search by broker code to find specific underwriters.
            </p>
          </div>
          <div className="ml-4">
            <a
              href="https://www.idx.co.id/id/data-pasar/ringkasan-perdagangan/ringkasan-broker"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2 border border-primary-600 rounded-md shadow-sm text-sm font-medium text-primary-600 bg-white hover:bg-primary-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
            >
              <span className="mr-2">📋</span>
              View Official IDX Broker Reference
              <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white shadow rounded-lg p-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <label htmlFor="broker-search" className="block text-sm font-medium text-gray-700 mb-1">
              Search Broker Code
            </label>
            <input
              type="text"
              id="broker-search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="e.g., CDIA, AH, BC, BM"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
            <p className="mt-1 text-xs text-gray-500">
              💡 Search by broker code. For full broker names and official reference, visit the{" "}
              <a
                href="https://www.idx.co.id/id/data-pasar/ringkasan-perdagangan/ringkasan-broker"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-600 hover:text-primary-800 underline"
              >
                official IDX Broker Reference
              </a>
            </p>
          </div>
        </div>
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
        /* Brokers Table */
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    No.
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Broker Code
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total IPOs Handled
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUnderwriters.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                      {search ? 'No brokers found matching your search' : 'No brokers found'}
                    </td>
                  </tr>
                ) : (
                  filteredUnderwriters.map((uw, index) => (
                      <tr
                        key={uw.code}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {index + 1}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-semibold text-gray-900 font-mono">{uw.code}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-indigo-100 text-indigo-800">
                            {uw.totalIPOs} IPO{uw.totalIPOs !== 1 ? 's' : ''}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <button
                            onClick={() => handleUnderwriterClick(uw.code)}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
                          >
                            View IPOs →
                          </button>
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Summary */}
      {!loading && !error && (
        <div className="mt-4 text-sm text-gray-600">
          Showing {filteredUnderwriters.length} of {underwriters.length} underwriters
        </div>
      )}
    </div>
  );
}

