export interface UWRecord {
  _id: string;
  underwriters?: string[];  // Array format (new)
  uw?: string;  // Single string format (legacy)
  code: string;
  companyName: string;
  ipoPrice: number;
  returnD1?: number | null;
  returnD2?: number | null;
  returnD3?: number | null;
  returnD4?: number | null;
  returnD5?: number | null;
  returnD6?: number | null;
  returnD7?: number | null;
  listingBoard?: string | null;
  listingDate: string;
  record?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface UWStats {
  totalRecords: number;
  totalUW: number;
  totalCompanies: number;
  lastUpdated: string | null;
}

export interface UWDataResponse {
  data: UWRecord[];
  total: number;
  count: number;
}

export interface PaginationParams {
  limit?: number;
  offset?: number;
  search?: string;
}

