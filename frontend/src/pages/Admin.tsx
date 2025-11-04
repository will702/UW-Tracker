import { useEffect, useState } from 'react';
import { apiService } from '../services/api';
import type { UWRecord } from '../types';

export default function Admin() {
  const [records, setRecords] = useState<UWRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    companyName: '',
    underwriters: '',
    ipoPrice: '',
    returnD1: '',
    returnD2: '',
    returnD3: '',
    returnD4: '',
    returnD5: '',
    returnD6: '',
    returnD7: '',
    listingBoard: '',
    listingDate: '',
  });

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      // Use simple endpoint to get actual MongoDB _ids for deletion
      const response = await apiService.getSimpleRecords(100);
      // Group records by code manually for display
      const groupedMap = new Map();
      (response.data || []).forEach(record => {
        if (!groupedMap.has(record.code)) {
          groupedMap.set(record.code, record);
        }
      });
      setRecords(Array.from(groupedMap.values()));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load records');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, code: string) => {
    if (!confirm(`Are you sure you want to delete record for ${code}?`)) {
      return;
    }

    try {
      await apiService.deleteRecord(id);
      setSuccess(`Record ${code} deleted successfully`);
      fetchRecords();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete record');
      setTimeout(() => setError(null), 5000);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const underwritersArray = formData.underwriters.split(',').map(uw => uw.trim().toUpperCase()).filter(Boolean);
      
      const recordData = {
        code: formData.code.toUpperCase(),
        companyName: formData.companyName,
        underwriters: underwritersArray,
        ipoPrice: parseFloat(formData.ipoPrice),
        returnD1: formData.returnD1 ? parseFloat(formData.returnD1) : null,
        returnD2: formData.returnD2 ? parseFloat(formData.returnD2) : null,
        returnD3: formData.returnD3 ? parseFloat(formData.returnD3) : null,
        returnD4: formData.returnD4 ? parseFloat(formData.returnD4) : null,
        returnD5: formData.returnD5 ? parseFloat(formData.returnD5) : null,
        returnD6: formData.returnD6 ? parseFloat(formData.returnD6) : null,
        returnD7: formData.returnD7 ? parseFloat(formData.returnD7) : null,
        listingBoard: formData.listingBoard,
        listingDate: formData.listingDate ? new Date(formData.listingDate).toISOString() : new Date().toISOString(),
      };

      await apiService.createRecord(recordData);
      setSuccess(`Record ${formData.code} added successfully`);
      setShowAddForm(false);
      setFormData({
        code: '',
        companyName: '',
        underwriters: '',
        ipoPrice: '',
        returnD1: '',
        returnD2: '',
        returnD3: '',
        returnD4: '',
        returnD5: '',
        returnD6: '',
        returnD7: '',
        listingBoard: '',
        listingDate: '',
      });
      fetchRecords();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create record');
      setTimeout(() => setError(null), 5000);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="mt-2 text-gray-600">Manage IPO records</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
        >
          {showAddForm ? 'Cancel' : '+ Add Record'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <p className="text-green-600">{success}</p>
        </div>
      )}

      {showAddForm && (
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Add New Record</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stock Code *</label>
              <input
                type="text"
                required
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company Name *</label>
              <input
                type="text"
                required
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Underwriters (comma-separated) *</label>
              <input
                type="text"
                required
                value={formData.underwriters}
                onChange={(e) => setFormData({ ...formData, underwriters: e.target.value })}
                placeholder="AH, BC, CD"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">IPO Price *</label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.ipoPrice}
                onChange={(e) => setFormData({ ...formData, ipoPrice: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Return D+1</label>
              <input
                type="number"
                step="0.0001"
                value={formData.returnD1}
                onChange={(e) => setFormData({ ...formData, returnD1: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Return D+2</label>
              <input
                type="number"
                step="0.0001"
                value={formData.returnD2}
                onChange={(e) => setFormData({ ...formData, returnD2: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Return D+3</label>
              <input
                type="number"
                step="0.0001"
                value={formData.returnD3}
                onChange={(e) => setFormData({ ...formData, returnD3: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Return D+4</label>
              <input
                type="number"
                step="0.0001"
                value={formData.returnD4}
                onChange={(e) => setFormData({ ...formData, returnD4: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Return D+5</label>
              <input
                type="number"
                step="0.0001"
                value={formData.returnD5}
                onChange={(e) => setFormData({ ...formData, returnD5: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Return D+6</label>
              <input
                type="number"
                step="0.0001"
                value={formData.returnD6}
                onChange={(e) => setFormData({ ...formData, returnD6: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Return D+7</label>
              <input
                type="number"
                step="0.0001"
                value={formData.returnD7}
                onChange={(e) => setFormData({ ...formData, returnD7: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Listing Board</label>
              <select
                value={formData.listingBoard}
                onChange={(e) => setFormData({ ...formData, listingBoard: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">Select...</option>
                <option value="Utama">Utama</option>
                <option value="Pengembangan">Pengembangan</option>
                <option value="Akselerasi">Akselerasi</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Listing Date *</label>
              <input
                type="date"
                required
                value={formData.listingDate}
                onChange={(e) => setFormData({ ...formData, listingDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div className="md:col-span-2">
              <button
                type="submit"
                className="w-full px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
              >
                Add Record
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Company</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Underwriters</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {records.map((record) => (
                <tr key={record._id} className="hover:bg-gray-50">
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">{record.code}</td>
                  <td className="px-4 py-4 text-sm text-gray-900">{record.companyName}</td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-1">
                      {(record.underwriters || (record.uw ? [record.uw] : [])).map((uw, idx) => (
                        <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                          {uw}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleDelete(record._id, record.code)}
                      className="text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                      Delete
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

