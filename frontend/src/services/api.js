import axios from 'axios';

// Backend URL configuration
const getBackendURL = () => {
  // 1. Check environment variable first
  if (process.env.REACT_APP_BACKEND_URL) {
    return process.env.REACT_APP_BACKEND_URL;
  }
  
  // 2. Check if we're in production (Vercel)
  if (window.location.hostname.includes('vercel.app')) {
    // Railway backend URL - your actual Railway URL
    return 'https://fixed-uw-tracker-production.up.railway.app';
  }
  
  // 3. Local development fallback
  return window.location.origin.replace(/:\\d+$/, ':8000');
};

const BACKEND_URL = getBackendURL();
const API = `${BACKEND_URL}/api`;

// Debug logging
console.log('🔧 Backend URL:', BACKEND_URL);
console.log('🔧 API Base URL:', API);
console.log('🔧 Environment:', process.env.NODE_ENV);
console.log('🔧 Hostname:', window.location.hostname);

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for logging (disabled in production)
apiClient.interceptors.request.use(
  (config) => {
    // console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
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
    // console.log(`API Response: ${response.status} ${response.config.url}`);
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
      
      // Use the correct endpoint from the deployed backend
      const response = await apiClient.get('/uw-data/simple', { params });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch UW records: ${error.message}`);
    }
  },

  // Get UW statistics
  getStats: async () => {
    try {
      const response = await apiClient.get('/uw-data/stats');
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

// Sentiment Analysis API functions
export const sentimentAPI = {
  // Get technical sentiment analysis for a stock
  getTechnicalSentiment: async (symbol, daysBack = 30) => {
    try {
      const response = await apiClient.get(`/sentiment/technical/${symbol}`, {
        params: { days_back: daysBack }
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch technical sentiment: ${error.message}`);
    }
  },

  // Get comprehensive sentiment analysis for a stock
  getComprehensiveSentiment: async (symbol, daysBack = 30) => {
    try {
      const response = await apiClient.get(`/sentiment/comprehensive/${symbol}`, {
        params: { days_back: daysBack }
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch comprehensive sentiment: ${error.message}`);
    }
  },

  // Get batch sentiment analysis for multiple stocks
  getBatchSentiment: async (symbols, daysBack = 30) => {
    try {
      const response = await apiClient.get('/sentiment/batch', {
        params: { 
          symbols: symbols, // Pass as array, not joined string
          days_back: daysBack 
        }
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch batch sentiment: ${error.message}`);
    }
  }
};

// Fundamental Analysis API functions
export const fundamentalAPI = {
  // Get fundamental analysis for a stock
  getFundamentalAnalysis: async (symbol, daysBack = 30) => {
    try {
      const response = await apiClient.get(`/fundamental/${symbol}`, {
        params: { days_back: daysBack }
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch fundamental analysis: ${error.message}`);
    }
  },

  // Get batch fundamental analysis for multiple stocks
  getBatchFundamental: async (symbols, daysBack = 30) => {
    try {
      const response = await apiClient.get('/fundamental/batch', {
        params: { 
          symbols: symbols,
          days_back: daysBack 
        }
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch batch fundamental analysis: ${error.message}`);
    }
  }
};

// Combined Analysis API functions
export const analysisAPI = {
  // Get combined technical sentiment and fundamental analysis
  getCombinedAnalysis: async (symbol, daysBack = 30) => {
    try {
      const response = await apiClient.get(`/analysis/combined/${symbol}`, {
        params: { days_back: daysBack }
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch combined analysis: ${error.message}`);
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