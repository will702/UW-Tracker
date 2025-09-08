import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for logging
apiClient.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    console.log(`API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('API Response Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// UW Data API functions
export const uwAPI = {
  // Get all UW records with optional search and pagination
  getAllRecords: async (search = '', limit = 100, offset = 0) => {
    try {
      const params = { limit, offset };
      if (search) params.search = search;
      
      const response = await apiClient.get('/uw-data', { params });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch UW records: ${error.message}`);
    }
  },

  // Get UW statistics
  getStats: async () => {
    try {
      const response = await apiClient.get('/uw-data/stats/');
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch UW stats: ${error.message}`);
    }
  },

  // Create new UW record
  createRecord: async (recordData) => {
    try {
      const response = await apiClient.post('/uw-data', recordData);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to create UW record: ${error.message}`);
    }
  },

  // Update UW record
  updateRecord: async (recordId, updateData) => {
    try {
      const response = await apiClient.put(`/uw-data/${recordId}`, updateData);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to update UW record: ${error.message}`);
    }
  },

  // Delete UW record
  deleteRecord: async (recordId) => {
    try {
      const response = await apiClient.delete(`/uw-data/${recordId}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to delete UW record: ${error.message}`);
    }
  },

  // Bulk upload UW records
  bulkUpload: async (records) => {
    try {
      const response = await apiClient.post('/uw-data/bulk', { data: records });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to bulk upload UW records: ${error.message}`);
    }
  },

  // Get single UW record by ID
  getRecord: async (recordId) => {
    try {
      const response = await apiClient.get(`/uw-data/${recordId}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch UW record: ${error.message}`);
    }
  }
};

// Utility functions for formatting
export const formatReturn = (returnValue) => {
  if (returnValue === null || returnValue === undefined) return '-';
  if (returnValue === 0) return "0.00%";
  const percentage = (returnValue * 100).toFixed(2);
  return returnValue > 0 ? `+${percentage}%` : `${percentage}%`;
};

export const formatPrice = (price) => {
  if (!price) return '-';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(price);
};

export const formatDate = (dateString) => {
  if (!dateString) return '-';
  try {
    return new Date(dateString).toLocaleDateString('id-ID');
  } catch {
    return dateString;
  }
};

export default apiClient;