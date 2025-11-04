import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiService } from '../services/api';
import type { UWStats } from '../types';
import StatCard from '../components/StatCard';
import UnderwriterHeatmap from '../components/UnderwriterHeatmap';

export default function Dashboard() {
  const [stats, setStats] = useState<UWStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [health, setHealth] = useState<{ status: string; database: string } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [statsData, healthData] = await Promise.all([
          apiService.getStats(),
          apiService.checkHealth(),
        ]);
        setStats(statsData);
        setHealth(healthData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Indonesian IPO Underwriter Performance Tracker
        </p>
      </div>

      {/* Health Status */}
      {health && (
        <div className={`mb-6 rounded-lg p-4 ${
          health.database === 'connected' 
            ? 'bg-green-50 border border-green-200' 
            : 'bg-yellow-50 border border-yellow-200'
        }`}>
          <div className="flex items-center">
            <span className={`inline-block w-3 h-3 rounded-full mr-2 ${
              health.database === 'connected' ? 'bg-green-500' : 'bg-yellow-500'
            }`}></span>
            <span className="text-sm font-medium">
              Database: {health.database}
            </span>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatCard
          title="Total Records"
          value={stats?.totalRecords || 0}
          subtitle="IPOs"
        />
        <StatCard
          title="Underwriters"
          value={stats?.totalUW || 0}
          subtitle="unique"
        />
        <StatCard
          title="Companies"
          value={stats?.totalCompanies || 0}
          subtitle="listed"
        />
        <StatCard
          title="Last Updated"
          value={formatDate(stats?.lastUpdated || null)}
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-white shadow rounded-lg p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-4">
          <Link
            to="/records"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            View All Records
          </Link>
        </div>
      </div>

      {/* Underwriter Heatmap */}
      <UnderwriterHeatmap />
    </div>
  );
}

