export interface UWRecord {
  _id?: string;
  code: string;
  companyName: string;
  underwriters: string[];
  ipoPrice?: number;
  listingBoard?: string | null;
  listingDate?: string | null;
  returnD1?: number | null;
  returnD2?: number | null;
  returnD3?: number | null;
  returnD4?: number | null;
  returnD5?: number | null;
  returnD6?: number | null;
  returnD7?: number | null;
  record?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

