// LPO API Client - Add to your existing api.ts or import separately

// Import lookup functions from centralized lookup API
export * from './api-lookup';

// Auto-detect API base URL based on how dashboard is accessed
const getApiBase = () => {
  const hostname = window.location.hostname;
  const apiHost = hostname === 'localhost' ? 'localhost' : hostname;
  return `http://${apiHost}:3010/api`;
};

const API_BASE = getApiBase();

// ============================================
// LPO API
// ============================================

export interface LPO {
  LPOID: number;
  LPOUUID: string;
  LPONumber: string;
  LPODate: string;
  BranchCode: string;
  BranchName: string;
  DepartmentCode: string | null;
  DepartmentName: string | null;
  RequestingBranchID: number | null;
  RequestingDepartmentID: number | null;
  VendorID: number | null;
  VendorName: string;
  VendorCode: string | null;
  CurrencyCode: string;
  SubTotal: number;
  VATAmount: number;
  VATPercent: number;
  DiscountAmount: number;
  DiscountPercent: number;
  TotalAmount: number;
  StatusCode: string;
  StatusName: string;
  ItemCount: number;
  TotalQuantity: number;
  TotalReceived: number;
  CreatedBy: number;
  CreatedByName: string;
  CreatedAt: string;
  DeptApproverName: string | null;
  DeptApprovalDate: string | null;
  GMApproverName: string | null;
  GMApprovalDate: string | null;
  AccApproverName: string | null;
  AccApprovalDate: string | null;
  ExpectedDeliveryDate: string | null;
  SentToVendorDate: string | null;
  QuotationReference: string | null;
  PaymentTerms: string | null;
  Notes: string | null;
  VendorAddress: string | null;
  VendorPhone: string | null;
}

export interface LPOItem {
  LPOItemID: number;
  LineNumber: number;
  ItemDescription: string;
  CategoryID: number | null;
  CategoryName: string | null;
  Quantity: number;
  UnitOfMeasure: string;
  UnitPrice: number;
  TotalPrice: number;
  QuantityReceived: number;
  QuantityPending: number;
  IsFullyReceived: boolean;
  Notes: string | null;
}

export interface LPOReceipt {
  ReceiptID: number;
  ReceiptUUID: string;
  LPOItemID: number;
  ItemDescription: string;
  ReceiptDate: string;
  QuantityReceived: number;
  ReceivedByName: string;
  ReceivedAt: string;
  Condition: string;
  ConditionNotes: string | null;
  SerialNumbers: string | null;
  ReceivedAtBranchName: string;
  Notes: string | null;
  AssetsCreated: number;
}

export interface CreateLPOData {
  branchId: number;
  departmentId?: number;
  vendorId?: number;
  vendorName: string;
  vendorAddress?: string;
  vendorContact?: string;
  vendorPhone?: string;
  quotationReference?: string;
  currencyCode?: string;
  vatPercent?: number;
  discountPercent?: number;
  expectedDeliveryDate?: string;
  deliveryAddress?: string;
  paymentTerms?: string;
  notes?: string;
  items: {
    lineNumber: number;
    description: string;
    categoryId?: number;
    quantity: number;
    unitOfMeasure?: string;
    unitPrice: number;
    totalPrice: number;
    notes?: string;
  }[];
  userId: number;
}

// Get all LPOs with filters
export async function getLPOs(params?: {
  status?: string;
  branch?: string;
  department?: string;
  vendor?: string;
  dateFrom?: string;
  dateTo?: string;
}): Promise<LPO[]> {
  const searchParams = new URLSearchParams();
  if (params?.status) searchParams.append('status', params.status);
  if (params?.branch) searchParams.append('branch', params.branch);
  if (params?.department) searchParams.append('department', params.department);
  if (params?.vendor) searchParams.append('vendor', params.vendor);
  if (params?.dateFrom) searchParams.append('dateFrom', params.dateFrom);
  if (params?.dateTo) searchParams.append('dateTo', params.dateTo);
  
  const url = `${API_BASE}/lpos${searchParams.toString() ? '?' + searchParams.toString() : ''}`;
  const response = await fetch(url);
  return response.json();
}

// Get LPO by UUID
export async function getLPO(uuid: string): Promise<{ lpo: LPO; items: LPOItem[]; receipts: LPOReceipt[] }> {
  const response = await fetch(`${API_BASE}/lpos/${uuid}`);
  return response.json();
}

// Create new LPO
export async function createLPO(data: CreateLPOData): Promise<{ success: boolean; LPOID?: number; LPONumber?: string; LPOUUID?: string; error?: string }> {
  const response = await fetch(`${API_BASE}/lpos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  
  const text = await response.text();
  if (!text) {
    // Empty response - check n8n workflow
    console.error('Empty response from LPO create API');
    return { success: false, error: 'Server returned empty response. Check n8n workflow.' };
  }
  
  try {
    return JSON.parse(text);
  } catch (e) {
    console.error('Invalid JSON response:', text);
    return { success: false, error: `Invalid response: ${text}` };
  }
}

// Update LPO
export async function updateLPO(uuid: string, userId: number, data: Partial<CreateLPOData> & { items?: any[]; deletedItemIds?: any[] }): Promise<{ success: boolean }> {
  const response = await fetch(`${API_BASE}/lpos/${uuid}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, ...data }),
  });
  return response.json();
}

// Submit LPO for approval
export async function submitLPO(uuid: string, userId: number, comment?: string): Promise<{ success: boolean }> {
  const response = await fetch(`${API_BASE}/lpos/${uuid}/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ lpoUuid: uuid, userId, comment }),
  });
  return response.json();
}

// Approve LPO - level determined by current status
export async function approveLPO(uuid: string, userId: number, level: 'department' | 'gm' | 'accounts', comment?: string): Promise<{ success: boolean }> {
  const response = await fetch(`${API_BASE}/lpos/${uuid}/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, level, comments: comment }),
  });

  const text = await response.text();
  if (!text) {
    // Empty response but HTTP 200 means success
    return { success: response.ok };
  }

  try {
    return JSON.parse(text);
  } catch (e) {
    // If response is not JSON but HTTP 200, assume success
    return { success: response.ok };
  }
}

// Reject LPO
export async function rejectLPO(uuid: string, userId: number, reason: string): Promise<{ success: boolean }> {
  const response = await fetch(`${API_BASE}/lpos/${uuid}/reject`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ lpoUuid: uuid, userId, reason }),
  });
  
  const text = await response.text();
  if (!text) return { success: response.ok };
  try {
    return JSON.parse(text);
  } catch (e) {
    return { success: response.ok };
  }
}

// Send LPO to vendor
export async function sendLPOToVendor(uuid: string, userId: number): Promise<{ success: boolean }> {
  const response = await fetch(`${API_BASE}/lpos/${uuid}/send-to-vendor`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId }),
  });
  return response.json();
}

// Receive goods
export async function receiveGoods(data: {
  lpoItemId: number;
  quantityReceived: number;
  receiptDate: string;
  receivedBy: number;
  receivedAtBranchId: number;
  condition?: string;
  conditionNotes?: string;
  serialNumbers?: string[];
  notes?: string;
}): Promise<{ success: boolean; receiptId: number; assetsCreated: { assetId: number; assetTag: string }[] }> {
  const response = await fetch(`${API_BASE}/lpos/receive`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return response.json();
}

// Get LPO stats
export async function getLPOStats(): Promise<{
  Draft: number;
  PendingDeptApproval: number;
  PendingAccApproval: number;
  Approved: number;
  SentToVendor: number;
  PartiallyReceived: number;
  FullyReceived: number;
  Invoiced: number;
  Closed: number;
  Cancelled: number;
  TotalLPOs: number;
  TotalValuePending: number;
  TotalValueApproved: number;
}> {
  const response = await fetch(`${API_BASE}/lpos/stats`);
  return response.json();
}

// Upload quotation for AI extraction
export async function uploadQuotation(file: File, branchId: number, departmentId?: number, userId?: number): Promise<{
  success: boolean;
  lpo: LPO;
  extractedData: any;
  confidenceScore: number;
}> {
  const base64 = await fileToBase64(file);
  const response = await fetch(`${API_BASE}/lpos/upload`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      file: base64,
      fileName: file.name,
      fileType: file.type,
      branchId,
      departmentId,
      userId: userId || 1,
    }),
  });
  return response.json();
}

// ============================================
// VENDOR API
// ============================================
// Vendor types and functions now imported from api-lookup.ts

// ============================================
// PAYMENT API
// ============================================

export interface Payment {
  PaymentID: number;
  PaymentUUID: string;
  InvoiceID: number;
  PaymentDate: string;
  Amount: number;
  CurrencyCode: string;
  PaymentModeID: number;
  ModeName: string;
  ReferenceNumber: string | null;
  BankName: string | null;
  PaymentType: string;
  Status: string;
  Notes: string | null;
  RecordedByName: string;
  RecordedAt: string;
}

// PaymentMode interface and getPaymentModes() now imported from api-lookup.ts

export async function getInvoicePayments(invoiceUuid: string): Promise<{ invoice: any; payments: Payment[]; summary: any }> {
  const response = await fetch(`${API_BASE}/invoices/${invoiceUuid}/payments`);
  return response.json();
}

export async function recordPayment(data: {
  invoiceId: number;
  paymentDate: string;
  amount: number;
  paymentModeId: number;
  referenceNumber?: string;
  bankName?: string;
  paymentType?: string;
  notes?: string;
  recordedBy: number;
}): Promise<{ success: boolean; paymentId: number }> {
  const response = await fetch(`${API_BASE}/payments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return response.json();
}

export async function getOverdueInvoices(): Promise<any[]> {
  const response = await fetch(`${API_BASE}/payments/overdue`);
  return response.json();
}

// ============================================
// LOOKUP DATA
// ============================================
// Branch, Department, Category interfaces and lookup functions now imported from api-lookup.ts

// ============================================
// HELPERS
// ============================================

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]);
    };
    reader.onerror = error => reject(error);
  });
}

// ============================================
// PDF DOWNLOAD
// ============================================

/**
 * Download LPO PDF
 * Opens PDF in new tab (browser will handle download via Content-Disposition header)
 */
export function downloadLPOPdf(uuid: string): void {
  const url = `${API_BASE}/lpos/${uuid}/pdf`;
  window.open(url, '_blank');
}

/**
 * Get PDF URL for opening in new tab
 */
export function getLPOPdfUrl(uuid: string): string {
  return `${API_BASE}/lpos/${uuid}/pdf`;
}
