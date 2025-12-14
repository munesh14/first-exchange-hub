const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://firstxehub:3004/webhook';

interface ApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
}

async function apiCall<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
  const { method = 'GET', body } = options;
  
  const config: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };
  
  if (body) {
    config.body = JSON.stringify(body);
  }
  
  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
  
  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
}

// User Types
export interface User {
  UserID: number;
  FullName: string;
  Email: string;
  DepartmentID: number;
  DepartmentName: string;
}

// Department Types
export interface Department {
  DepartmentID: number;
  DepartmentName: string;
}

// Category Types
export interface Category {
  CategoryID: number;
  CategoryName: string;
}

// Vendor Types
export interface Vendor {
  VendorID: number;
  VendorName: string;
  ContactPerson?: string;
  Phone?: string;
  Email?: string;
}

// Invoice Types
export interface InvoiceItem {
  ItemID?: number;
  LineNumber: number;
  ItemDescription: string;
  Quantity: number;
  UnitOfMeasure: string;
  UnitPrice: number;
  TotalPrice: number;
}

export interface Invoice {
  InvoiceID: number;
  InvoiceUUID: string;
  InvoiceNumber: string;
  InvoiceDate: string;
  DepartmentID?: number;
  DepartmentName: string;
  VendorID?: number;
  VendorName: string;
  CategoryID?: number;
  CategoryName?: string;
  CurrencyCode: string;
  SubTotal?: number;
  TaxAmount?: number;
  DiscountAmount?: number;
  TotalAmount: number;
  StatusCode: string;
  StatusName?: string;
  AIConfidenceScore?: number;
  Notes?: string;
  UploadedBy?: string;
  CreatedAt?: string;
  FileURL?: string;
  FileType?: string;
}

export interface InvoiceDetail {
  invoice: Invoice;
  items: InvoiceItem[];
}

// Stats Types
export interface Stats {
  pendingReview: number;
  pendingApproval: number;
  approved: number;
  rejected: number;
  correctionNeeded: number;
  totalApprovedAmount: number;
}

// Report Types
export interface ReportSummary {
  DepartmentName: string;
  InvoiceCount: number;
  TotalAmountOMR: number;
}

export interface ReportByCategory {
  DepartmentName: string;
  CategoryName: string;
  InvoiceCount: number;
  TotalAmountOMR: number;
}

export interface ReportByVendor {
  DepartmentName: string;
  VendorName: string;
  InvoiceCount: number;
  TotalAmountOMR: number;
}

export interface Report {
  reportType: string;
  year?: number;
  month?: number;
  monthName?: string;
  date?: string;
  weekStart?: string;
  summary: ReportSummary[];
  byCategory: ReportByCategory[];
  byVendor: ReportByVendor[];
  detail: Invoice[];
  totalInvoices: number;
  totalAmountOMR: number;
}

// Asset Types
export interface Asset {
  AssetID: number;
  AssetUUID: string;
  AssetTag: string;
  AssetName: string;
  Description?: string;
  DepartmentID?: number;
  DepartmentName: string;
  CategoryID?: number;
  CategoryName: string;
  LocationID?: number;
  LocationName: string;
  PurchaseDate: string;
  PurchasePriceOMR: number;
  UsefulLifeYears?: number;
  AnnualDepreciation?: number;
  AccumulatedDepreciation?: number;
  CurrentBookValue: number;
  StatusCode: string;
  StatusName: string;
  AssignedTo?: string;
  WarrantyExpiryDate?: string;
  WarrantyStatus: string;
  InvoiceUUID?: string;
}

export interface AssetAuditLog {
  Action: string;
  ActionAt: string;
  ActionBy?: string;
  Notes?: string;
}

export interface AssetDetail {
  asset: Asset;
  auditLog: AssetAuditLog[];
}

export interface AssetStats {
  activeAssets: number;
  underRepair: number;
  disposed: number;
  totalPurchaseValue: number;
  currentBookValue: number;
  warrantyExpiringSoon: number;
}

export interface Location {
  LocationID: number;
  LocationName: string;
}

// API Functions
export const api = {
  // Users
  getUsers: () => apiCall<User[]>('/invoice-api/users'),
  
  // Departments
  getDepartments: () => apiCall<Department[]>('/invoice-api/departments'),
  
  // Categories
  getCategories: () => apiCall<Category[]>('/invoice-api/categories'),
  
  // Vendors
  getVendors: () => apiCall<Vendor[]>('/invoice-api/vendors'),
  createVendor: (vendor: Omit<Vendor, 'VendorID'>) => 
    apiCall<Vendor>('/invoice-api/vendor', { method: 'POST', body: vendor }),
  
  // Stats
  getStats: () => apiCall<Stats>('/invoice-api/stats'),
  
  // Invoices
  getInvoices: (params?: { status?: string; department?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.department) queryParams.append('department', params.department);
    const queryString = queryParams.toString();
    return apiCall<Invoice[]>(`/invoice-api/invoices${queryString ? `?${queryString}` : ''}`);
  },
  
  getInvoice: (uuid: string) => apiCall<InvoiceDetail>(`/invoice-api/invoice/${uuid}`),
  
  uploadInvoice: (data: {
    file: string;
    fileName: string;
    fileType: string;
    departmentId: number;
    userId: number;
    categoryId: number;
  }) => apiCall<{ uuid: string }>('/invoice-upload', { method: 'POST', body: data }),
  
  updateInvoice: (uuid: string, data: Partial<Invoice> & { items?: InvoiceItem[] }) =>
    apiCall<Invoice>(`/invoice-api/invoice/${uuid}`, { method: 'PUT', body: data }),
  
  submitInvoice: (uuid: string) =>
    apiCall<{ success: boolean }>('/invoice-submit', { method: 'POST', body: { uuid } }),
  
  // Reports
  getDailyReport: (date: string, departmentId?: number) => {
    const params = new URLSearchParams({ date });
    if (departmentId) params.append('departmentId', departmentId.toString());
    return apiCall<Report>(`/invoice-api/report/daily?${params.toString()}`);
  },
  
  getWeeklyReport: (weekStart: string, departmentId?: number) => {
    const params = new URLSearchParams({ weekStart });
    if (departmentId) params.append('departmentId', departmentId.toString());
    return apiCall<Report>(`/invoice-api/report/weekly?${params.toString()}`);
  },
  
  getMonthlyReport: (year: number, month: number, departmentId?: number) => {
    const params = new URLSearchParams({ year: year.toString(), month: month.toString() });
    if (departmentId) params.append('departmentId', departmentId.toString());
    return apiCall<Report>(`/invoice-api/report/monthly?${params.toString()}`);
  },
  
  // Assets
  getAssetStats: () => apiCall<AssetStats>('/invoice-api/asset-stats'),
  
  getAssets: (params?: { department?: string; status?: string; category?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.department) queryParams.append('department', params.department);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.category) queryParams.append('category', params.category);
    const queryString = queryParams.toString();
    return apiCall<Asset[]>(`/invoice-api/assets${queryString ? `?${queryString}` : ''}`);
  },
  
  getAsset: (uuid: string) => apiCall<AssetDetail>(`/invoice-api/asset/${uuid}`),
  
  updateAsset: (data: Partial<Asset>) =>
    apiCall<Asset>('/invoice-api/asset/update', { method: 'POST', body: data }),
  
  updateAssetStatus: (uuid: string, status: string, reason?: string) =>
    apiCall<Asset>('/invoice-api/asset/status', { method: 'POST', body: { uuid, status, reason } }),
  
  transferAsset: (uuid: string, departmentId: number, locationId: number) =>
    apiCall<Asset>('/invoice-api/asset/transfer', { method: 'POST', body: { uuid, departmentId, locationId } }),
  
  getWarrantyExpiring: () => apiCall<Asset[]>('/invoice-api/assets/warranty-expiring'),
  
  getAssetSummaryReport: (departmentId?: number) => {
    const params = departmentId ? `?departmentId=${departmentId}` : '';
    return apiCall<Report>(`/invoice-api/report/asset-summary${params}`);
  },
  
  // Locations
  getLocations: () => apiCall<Location[]>('/invoice-api/locations'),
};
