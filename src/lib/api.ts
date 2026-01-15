// Auto-detect API base URL based on how dashboard is accessed
const getApiBase = () => {
  const hostname = window.location.hostname;
  const apiHost = hostname === 'localhost' ? 'localhost' : hostname;
  return `http://${apiHost}:3010/api`;
};

const API_BASE_URL = getApiBase();

// Fallback users for development when API is unavailable
const FALLBACK_USERS = [
  { UserID: 1, FullName: "Munesh C", Email: "munesh.c@firstexchangeoman.com", DepartmentID: 1, DepartmentName: "Information Technology" },
  { UserID: 2, FullName: "IT Staff 1", Email: "itstaff1@firstexchangeoman.com", DepartmentID: 1, DepartmentName: "Information Technology" },
  { UserID: 3, FullName: "Accounts Staff 1", Email: "accstaff1@firstexchangeoman.com", DepartmentID: 2, DepartmentName: "Accounts" },
  { UserID: 4, FullName: "Marketing Staff 1", Email: "mktstaff1@firstexchangeoman.com", DepartmentID: 3, DepartmentName: "Marketing" },
  { UserID: 5, FullName: "HR Staff 1", Email: "hrstaff1@firstexchangeoman.com", DepartmentID: 4, DepartmentName: "Human Resources" },
  { UserID: 6, FullName: "Operations Staff 1", Email: "opsstaff1@firstexchangeoman.com", DepartmentID: 5, DepartmentName: "Operations" },
  { UserID: 7, FullName: "Compliance Staff 1", Email: "compstaff1@firstexchangeoman.com", DepartmentID: 6, DepartmentName: "Compliance" }
];

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

  const url = `${API_BASE_URL}${endpoint}`;
  console.log(`API Call: ${method} ${url}`);
  
  const response = await fetch(url, config);
  
  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
}

// Fetch users with fallback
async function fetchUsersWithFallback(): Promise<User[]> {
  try {
    const response = await apiCall<{ success: boolean; data: User[] }>('/lookups/users');
    return response.data || [];
  } catch (error) {
    console.log('API unavailable, using fallback users');
    return FALLBACK_USERS;
  }
}

// User Types
export interface User {
  UserID: number;
  FullName: string;
  Email: string;
  DepartmentID: number | null;
  DepartmentName: string | null;
  RoleCode?: string | null;
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
  StoredFilePath?: string;
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
  getUsers: fetchUsersWithFallback,
  
  // Departments
  getDepartments: async () => {
    const response = await apiCall<{ success: boolean; data: Department[] }>('/lookups/departments');
    return response.data || [];
  },
  
  // Categories
  getCategories: async () => {
    const response = await apiCall<{ success: boolean; data: Category[] }>('/lookups/categories');
    return response.data || [];
  },
  
  // Vendors
  getVendors: async () => {
    const response = await apiCall<{ success: boolean; data: Vendor[] }>('/lookups/vendors');
    return response.data || [];
  },
  createVendor: (vendor: Omit<Vendor, 'VendorID'>) =>
    apiCall<Vendor>('/vendor', { method: 'POST', body: vendor }),
  
  // Stats
  getStats: async () => {
    // Compute stats from invoices list
    const response = await apiCall<{ success: boolean; data: { invoices: Invoice[]; total: number } }>('/invoices');
    const invoices = response.data?.invoices || [];

    const pendingReview = invoices.filter(i => i.StatusID === 2).length;
    const pendingApproval = invoices.filter(i => i.StatusID === 3).length;
    const approved = invoices.filter(i => i.StatusID === 4).length;
    const rejected = invoices.filter(i => i.StatusID === 5).length;
    const correctionNeeded = invoices.filter(i => i.StatusID === 6).length;
    const totalApprovedAmount = invoices
      .filter(i => i.StatusID === 4)
      .reduce((sum, i) => sum + (i.TotalAmountOMR || 0), 0);

    return {
      pendingReview,
      pendingApproval,
      approved,
      rejected,
      correctionNeeded,
      totalApprovedAmount,
    };
  },
  
  // Invoices
  getInvoices: async (params?: { status?: string; department?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.department) queryParams.append('department', params.department);
    const queryString = queryParams.toString();
    const response = await apiCall<{ success: boolean; data: { invoices: Invoice[]; total: number } }>(`/invoices${queryString ? `?${queryString}` : ''}`);
    return response.data?.invoices || [];
  },
  
  getInvoice: async (uuid: string) => {
    const response = await apiCall<{ success: boolean; data: InvoiceDetail }>(`/invoices/${uuid}`);
    return response.data;
  },
  
  getInvoiceFile: (path: string) => 
    apiCall<{ success: boolean; fileName: string; mimeType: string; data: string }>(`/file?path=${encodeURIComponent(path)}`),
  
  uploadInvoice: (data: {
    file: string;
    fileName: string;
    fileType: string;
    departmentId: number;
    userId: number;
    categoryId: number;
  }) => apiCall<{ uuid: string }>('/invoices/upload', { method: 'POST', body: data }),
  
  updateInvoice: (data: { invoiceUuid: string; updates: Partial<Invoice> & { items?: InvoiceItem[] }; userId: number }) =>
    apiCall<{ success: boolean }>('/invoice/update', { method: 'POST', body: data }),
  
  submitInvoice: (data: { invoiceUuid: string; userId: number; comment?: string }) =>
    apiCall<{ success: boolean }>('/invoice/submit', { method: 'POST', body: data }),
  
  approveInvoice: (data: { invoiceUuid: string; action: 'approve' | 'reject' | 'correction'; userId: number; comment?: string; omrAmount?: number }) =>
    apiCall<{ success: boolean }>('/invoice/approve', { method: 'POST', body: data }),
  
  // Reports
  getDailyReport: (date: string, departmentId?: number) => {
    const params = new URLSearchParams({ date });
    if (departmentId) params.append('departmentId', departmentId.toString());
    return apiCall<Report>(`/report/daily?${params.toString()}`);
  },
  
  getWeeklyReport: (weekStart: string, departmentId?: number) => {
    const params = new URLSearchParams({ weekStart });
    if (departmentId) params.append('departmentId', departmentId.toString());
    return apiCall<Report>(`/report/weekly?${params.toString()}`);
  },
  
  getMonthlyReport: (year: number, month: number, departmentId?: number) => {
    const params = new URLSearchParams({ year: year.toString(), month: month.toString() });
    if (departmentId) params.append('departmentId', departmentId.toString());
    return apiCall<Report>(`/report/monthly?${params.toString()}`);
  },
  
  // Assets
  getAssetStats: async () => {
    // Compute stats from assets list
    const response = await apiCall<{ success: boolean; data: Asset[] }>('/assets');
    const assets = response.data || [];

    const activeAssets = assets.filter(a => a.StatusID === 2).length;
    const underRepair = assets.filter(a => a.StatusID === 4).length;
    const disposed = assets.filter(a => a.StatusID === 5).length;
    const totalPurchaseValue = assets.reduce((sum, a) => sum + (a.PurchasePriceOMR || 0), 0);
    const currentBookValue = assets.reduce((sum, a) => sum + (a.CurrentBookValue || 0), 0);
    const warrantyExpiringSoon = assets.filter(a => {
      if (!a.WarrantyExpiryDate) return false;
      const expiryDate = new Date(a.WarrantyExpiryDate);
      const now = new Date();
      const daysUntilExpiry = Math.floor((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return daysUntilExpiry > 0 && daysUntilExpiry <= 30;
    }).length;

    return {
      activeAssets,
      underRepair,
      disposed,
      totalPurchaseValue,
      currentBookValue,
      warrantyExpiringSoon,
    };
  },

  getAssets: async (params?: { department?: string; status?: string; category?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.department) queryParams.append('department', params.department);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.category) queryParams.append('category', params.category);
    const queryString = queryParams.toString();
    const response = await apiCall<{ success: boolean; data: Asset[] }>(`/assets${queryString ? `?${queryString}` : ''}`);
    return response.data || [];
  },
  
  getAsset: (uuid: string) => apiCall<AssetDetail>(`/asset/${uuid}`),
  
  updateAsset: (data: Partial<Asset>) =>
    apiCall<Asset>('/asset/update', { method: 'POST', body: data }),
  
  updateAssetStatus: (uuid: string, status: string, reason?: string) =>
    apiCall<Asset>('/asset/status', { method: 'POST', body: { uuid, status, reason } }),
  
  transferAsset: (uuid: string, departmentId: number, locationId: number) =>
    apiCall<Asset>('/asset/transfer', { method: 'POST', body: { uuid, departmentId, locationId } }),
  
  getWarrantyExpiring: () => apiCall<Asset[]>('/assets/warranty-expiring'),
  
  getAssetSummaryReport: (departmentId?: number) => {
    const params = departmentId ? `?departmentId=${departmentId}` : '';
    return apiCall<Report>(`/report/asset-summary${params}`);
  },
  
  // Locations
  getLocations: () => apiCall<Location[]>('/locations'),
};
