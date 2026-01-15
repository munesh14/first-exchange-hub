// Document Chain API Client

// Auto-detect API base URL based on how dashboard is accessed
const getApiBase = () => {
  const hostname = window.location.hostname;
  // If accessing via localhost (SSH tunnel), use localhost
  // Otherwise use the same hostname (production, or firstxehub)
  const apiHost = hostname === 'localhost' ? 'localhost' : hostname;
  return `http://${apiHost}:3010/api`;
};

const API_BASE = getApiBase();

// ==================== Types ====================

export interface ChainStatus {
  id: number;
  code: string;
  name: string;
  color: string;
}

export interface ChainVendor {
  id: number | null;
  name: string;
}

export interface ChainDepartment {
  id: number;
  name: string;
}

export interface ChainBranch {
  id: number | null;
  name: string | null;
}

export interface ChainAmounts {
  estimated: number;
  invoiced: number;
  paid: number;
  balance: number;
}

export interface ChainDocumentCounts {
  quotations: number;
  lpos: number;
  deliveryOrders: number;
  invoices: number;
  payments: number;
  assets: number;
}

export interface ChainExpectedDocs {
  hasQuotation: boolean;
  hasLPO: boolean;
  hasDeliveryOrder: boolean;
  hasProforma: boolean;
  hasInvoice: boolean;
}

export interface ChainCreatedBy {
  id: string;
  name: string;
}

// Chain summary for list view
export interface ChainSummary {
  chainId: number;
  chainUuid: string;
  chainNumber: string;
  title: string;
  description: string | null;
  vendor: ChainVendor;
  department: ChainDepartment;
  status: ChainStatus;
  amounts: ChainAmounts;
  documentCounts: ChainDocumentCounts;
  currentStage: string;
  createdBy: ChainCreatedBy;
  createdAt: string;
  updatedAt: string;
}

// Full chain detail
export interface ChainDetail extends ChainSummary {
  branch: ChainBranch;
  expectedDocuments: ChainExpectedDocs;
  isDirectPurchase: boolean;
  notes: string | null;
}

// Activity log entry
export interface ActivityLogEntry {
  logId: number;
  activityType: string;
  activityDescription: string;
  oldStatus: ChainStatus | null;
  newStatus: ChainStatus | null;
  performedBy: ChainCreatedBy;
  performedAt: string;
  notes: string | null;
}

// Document entries in chain
export interface ChainQuotation {
  quotationId: number;
  quotationUuid: string;
  quotationNumber: string;
  vendorName: string;
  quotationDate: string;
  totalAmount: number;
  status: string;
}

export interface ChainLPO {
  lpoId: number;
  lpoUuid: string;
  lpoNumber: string;
  vendorName: string;
  lpoDate: string;
  totalAmount: number;
  status: string;
}

export interface ChainDeliveryOrder {
  doId: number;
  doUuid: string;
  doNumber: string;
  deliveryDate: string;
  status: string;
  itemsReceived: number;
  itemsTotal: number;
}

export interface ChainInvoice {
  invoiceId: number;
  invoiceUuid: string;
  invoiceNumber: string;
  vendorName: string;
  invoiceDate: string;
  totalAmount: number;
  status: string;
}

export interface ChainPayment {
  paymentId: number;
  paymentUuid: string;
  referenceNumber: string;
  paymentDate: string;
  amount: number;
  paymentMethod: string;
}

export interface ChainAsset {
  assetId: number;
  assetUuid: string;
  assetTag: string;
  assetName: string;
  department: string;
  status: string;
}

export interface ChainDocuments {
  quotations: ChainQuotation[];
  lpos: ChainLPO[];
  deliveryOrders: ChainDeliveryOrder[];
  invoices: ChainInvoice[];
  payments: ChainPayment[];
}

// Full chain response with all documents
export interface ChainFullResponse {
  chain: ChainDetail;
  documents: ChainDocuments;
  assets: ChainAsset[];
  activityLog: ActivityLogEntry[];
}

// List response with pagination
export interface ChainListResponse {
  success: boolean;
  data: {
    chains: ChainSummary[];
    pagination: {
      total: number;
      limit: number;
      offset: number;
      hasMore: boolean;
    };
    filters: {
      status: string | null;
      departmentId: number | null;
      search: string | null;
      fromDate: string | null;
      toDate: string | null;
    };
  };
}

// Stats response
export interface ChainStats {
  total: number;
  byStatus: { status: string; count: number; color: string }[];
  byDepartment: { department: string; count: number }[];
  recentActivity: number;
}

// Legacy types for backwards compatibility
export interface DocumentChain {
  ChainID: number;
  ChainUUID: string;
  QuotationID: number | null;
  QuotationNumber: string | null;
  LPOID: number | null;
  LPONumber: string | null;
  DOID: number | null;
  DONumber: string | null;
  ProformaID: number | null;
  ProformaNumber: string | null;
  InvoiceID: number | null;
  InvoiceNumber: string | null;
  CreatedAt: string;
}

export interface TimelineEvent {
  EventType: string;
  Reference: string | null;
  EventDate: string;
  EventBy: string | null;
  Description: string;
  Amount: number | null;
}

// ==================== API Functions ====================

export interface ChainListParams {
  status?: string;
  departmentId?: number;
  search?: string;
  fromDate?: string;
  toDate?: string;
  limit?: number;
  offset?: number;
}

// List chains with optional filters
export async function listChains(params: ChainListParams = {}): Promise<ChainListResponse> {
  const queryParams = new URLSearchParams();
  if (params.status) queryParams.append('status', params.status);
  if (params.departmentId) queryParams.append('departmentId', params.departmentId.toString());
  if (params.search) queryParams.append('search', params.search);
  if (params.fromDate) queryParams.append('fromDate', params.fromDate);
  if (params.toDate) queryParams.append('toDate', params.toDate);
  if (params.limit) queryParams.append('limit', params.limit.toString());
  if (params.offset) queryParams.append('offset', params.offset.toString());

  const query = queryParams.toString();
  const url = `${API_BASE}/chains${query ? `?${query}` : ''}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch chains: ${response.statusText}`);
  }

  // Express API returns: { success, count, data: [...chains] }
  // Frontend expects: { success, data: { chains, pagination, filters } }
  const apiResponse = await response.json();

  const limit = params.limit || 20;
  const offset = params.offset || 0;
  const total = apiResponse.count || apiResponse.data.length;

  // Transform API response to match frontend expectations
  const transformedChains: ChainSummary[] = apiResponse.data.map((chain: any) => ({
    chainId: chain.ChainID,
    chainUuid: chain.ChainUUID,
    chainNumber: chain.ChainNumber,
    title: chain.Title,
    description: chain.Description || null,
    vendor: {
      id: chain.VendorID,
      name: chain.VendorName || ''
    },
    department: {
      id: chain.DepartmentID || 0,
      name: chain.DepartmentName || ''
    },
    status: {
      id: chain.StatusID,
      code: chain.CurrentStage || 'DRAFT',
      name: chain.CurrentStage || 'Draft',
      color: chain.StatusID === 8 ? 'green' : chain.StatusID === 1 ? 'gray' : 'blue'
    },
    amounts: {
      estimated: chain.TotalEstimatedAmount || 0,
      invoiced: chain.TotalInvoicedAmount || 0,
      paid: chain.TotalPaidAmount || 0,
      balance: chain.BalanceAmount || 0
    },
    documentCounts: {
      quotations: chain.QuotationCount || 0,
      lpos: chain.LPOCount || 0,
      deliveryOrders: chain.DOCount || 0,
      invoices: chain.InvoiceCount || 0,
      payments: chain.PaymentCount || 0,
      assets: chain.AssetCount || 0
    },
    currentStage: chain.CurrentStage || 'DRAFT',
    createdBy: {
      id: chain.CreatedBy?.toString() || '0',
      name: chain.CreatedByName || ''
    },
    createdAt: chain.CreatedAt,
    updatedAt: chain.UpdatedAt
  }));

  return {
    success: apiResponse.success,
    data: {
      chains: transformedChains,
      pagination: {
        total,
        limit,
        offset,
        hasMore: (offset + limit) < total
      },
      filters: {
        status: params.status || null,
        departmentId: params.departmentId || null,
        search: params.search || null,
        fromDate: params.fromDate || null,
        toDate: params.toDate || null
      }
    }
  };
}

// Get chain detail by UUID
export async function getChainDetail(uuid: string): Promise<{ success: boolean; data: ChainFullResponse }> {
  const response = await fetch(`${API_BASE}/chains/${uuid}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch chain: ${response.statusText}`);
  }
  return response.json();
}

// Get chain stats for dashboard
export async function getChainStats(): Promise<{ success: boolean; data: ChainStats }> {
  const response = await fetch(`${API_BASE}/chains/stats`);
  if (!response.ok) {
    throw new Error(`Failed to fetch chain stats: ${response.statusText}`);
  }
  return response.json();
}

// Create new chain
export interface CreateChainParams {
  title: string;
  description?: string;
  vendorId?: number;
  vendorName?: string;
  departmentId: number;
  branchId?: number;
  hasQuotation?: boolean;
  hasLPO?: boolean;
  hasDeliveryOrder?: boolean;
  hasProforma?: boolean;
  hasInvoice?: boolean;
  isDirectPurchase?: boolean;
  estimatedAmount?: number;
  createdBy: number;
  notes?: string;
}

export async function createChain(params: CreateChainParams): Promise<{ success: boolean; data: { chainId: number; chainUuid: string; chainNumber: string } }> {
  const response = await fetch(`${API_BASE}/chains`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!response.ok) {
    throw new Error(`Failed to create chain: ${response.statusText}`);
  }
  return response.json();
}

// Legacy functions for backwards compatibility
export async function getChainByDocument(type: string, id: number): Promise<{ success: boolean; chain: DocumentChain | null }> {
  const response = await fetch(`${API_BASE}/chains/by-document?type=${type}&id=${id}`);
  return response.json();
}

export async function getChainTimeline(uuid: string): Promise<{ success: boolean; timeline: TimelineEvent[] }> {
  const response = await fetch(`${API_BASE}/chains/${uuid}/timeline`);
  return response.json();
}
