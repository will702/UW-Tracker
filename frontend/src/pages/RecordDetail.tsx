import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiService } from '../services/api';
import type { UWRecord } from '../types';

export default function RecordDetail() {
  const { id } = useParams<{ id: string }>();
  const [record, setRecord] = useState<UWRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecord = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const data = await apiService.getRecord(id);
        setRecord(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load record');
      } finally {
        setLoading(false);
      }
    };

    fetchRecord();
  }, [id]);

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
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

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error || !record) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h3 className="text-red-800 font-semibold">Error</h3>
        <p className="text-red-600 mt-1">{error || 'Record not found'}</p>
        <Link
          to="/records"
          className="mt-4 inline-block text-primary-600 hover:text-primary-800"
        >
          ← Back to Records
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <Link
          to="/records"
          className="text-sm text-primary-600 hover:text-primary-800 mb-4 inline-block"
        >
          ← Back to Records
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 mt-2">
          {record.companyName}
        </h1>
        <p className="mt-2 text-gray-600">Stock Code: {record.code}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Main Info */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">IPO Information</h2>
          <dl className="grid grid-cols-1 gap-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">Stock Code</dt>
              <dd className="mt-1 text-sm text-gray-900 font-semibold">{record.code}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Company Name</dt>
              <dd className="mt-1 text-sm text-gray-900">{record.companyName}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Underwriters</dt>
              <dd className="mt-1">
                <div className="flex flex-wrap gap-2">
                  {record.underwriters && record.underwriters.length > 0 ? (
                    record.underwriters.map((uw, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                      >
                        {uw}
                      </span>
                    ))
                  ) : record.uw ? (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                      {record.uw}
                    </span>
                  ) : (
                    <span className="text-gray-400">N/A</span>
                  )}
                </div>
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">IPO Price</dt>
              <dd className="mt-1 text-sm text-gray-900 font-semibold">
                {formatPrice(record.ipoPrice)}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Listing Date</dt>
              <dd className="mt-1 text-sm text-gray-900">{formatDate(record.listingDate)}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Listing Board</dt>
              <dd className="mt-1 text-sm text-gray-900">{record.listingBoard || 'N/A'}</dd>
            </div>
            {record.record && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Performance Record</dt>
                <dd className="mt-1 text-sm text-gray-900">{record.record}</dd>
              </div>
            )}
          </dl>
        </div>

        {/* Returns */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Performance Returns</h2>
          <dl className="grid grid-cols-2 gap-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">D+1 Return</dt>
              <dd className="mt-1 text-lg font-semibold">
                {formatReturn(record.returnD1)}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">D+2 Return</dt>
              <dd className="mt-1 text-lg font-semibold">
                {formatReturn(record.returnD2)}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">D+3 Return</dt>
              <dd className="mt-1 text-lg font-semibold">
                {formatReturn(record.returnD3)}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">D+4 Return</dt>
              <dd className="mt-1 text-lg font-semibold">
                {formatReturn(record.returnD4)}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">D+5 Return</dt>
              <dd className="mt-1 text-lg font-semibold">
                {formatReturn(record.returnD5)}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">D+6 Return</dt>
              <dd className="mt-1 text-lg font-semibold">
                {formatReturn(record.returnD6)}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">D+7 Return</dt>
              <dd className="mt-1 text-lg font-semibold">
                {formatReturn(record.returnD7)}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Metadata */}
      <div className="mt-6 bg-gray-50 rounded-lg p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-600">
          {record.createdAt && (
            <div>
              <span className="font-medium">Created:</span> {formatDate(record.createdAt)}
            </div>
          )}
          {record.updatedAt && (
            <div>
              <span className="font-medium">Last Updated:</span> {formatDate(record.updatedAt)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

