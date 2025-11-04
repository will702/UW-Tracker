import type { UWRecord, UWStats, UWDataResponse, PaginationParams } from '../types';

// Use relative URLs in dev (Vite proxy) or absolute URLs in production
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? '/api' : 'http://localhost:8000/api');

async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    let errorMessage = `HTTP error! status: ${response.status}`;
    try {
      const error = await response.json();
      errorMessage = error.detail || error.message || errorMessage;
    } catch {
      // If response is not JSON, use status text
      errorMessage = `${response.status}: ${response.statusText || errorMessage}`;
    }
    throw new Error(errorMessage);
  }

  return response.json();
}

export const apiService = {
  // Get UW records with pagination and search
  async getRecords(params: PaginationParams = {}): Promise<UWDataResponse> {
    const { limit = 100, offset = 0, search } = params;
    const queryParams = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
    });
    
    if (search) {
      queryParams.append('search', search);
    }
    
    return fetchAPI<UWDataResponse>(`/uw-data-grouped/simple?${queryParams}`);
  },

  // Get simple records (fast endpoint)
  async getSimpleRecords(limit: number = 100, search?: string): Promise<UWDataResponse> {
    const queryParams = new URLSearchParams({
      limit: limit.toString(),
    });
    
    if (search) {
      queryParams.append('search', search);
    }
    
    return fetchAPI<UWDataResponse>(`/uw-data-grouped/simple?${queryParams}`);
  },

  // Get grouped records (grouped by stock code with all underwriters)
  async getGroupedRecords(limit: number = 100, search?: string, searchType: 'stock' | 'underwriter' = 'underwriter'): Promise<UWDataResponse> {
    const queryParams = new URLSearchParams({
      limit: limit.toString(),
      search_type: searchType,
    });
    
    if (search) {
      queryParams.append('search', search);
    }
    
    return fetchAPI<UWDataResponse>(`/uw-data-grouped/grouped?${queryParams}`);
  },

  // Get statistics
  async getStats(): Promise<UWStats> {
    return fetchAPI<UWStats>('/uw-data-grouped/stats');
  },

  // Get all unique underwriters with statistics
  async getAllUnderwriters(): Promise<{ data: Array<{ code: string; ipoCount: number; totalIPOs: number }>; total: number }> {
    return fetchAPI<{ data: Array<{ code: string; ipoCount: number; totalIPOs: number }>; total: number }>('/uw-data-grouped/underwriters');
  },

  // Get single record by ID
  async getRecord(id: string): Promise<UWRecord> {
    return fetchAPI<UWRecord>(`/uw-data-grouped/${id}`);
  },

  // Health check
  async checkHealth(): Promise<{ status: string; database: string }> {
    return fetchAPI<{ status: string; database: string }>('/healthz');
  },

  // Create record
  async createRecord(data: any): Promise<UWRecord> {
    return fetchAPI<UWRecord>('/uw-data-grouped/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Delete record
  async deleteRecord(id: string): Promise<{ message: string }> {
    return fetchAPI<{ message: string }>(`/uw-data-grouped/${id}`, {
      method: 'DELETE',
    });
  },
};

