// Quotation API Client

// Auto-detect API base URL based on how dashboard is accessed
const getApiBase = () => {
  const hostname = window.location.hostname;
  const apiHost = hostname === 'localhost' ? 'localhost' : hostname;
  return `http://${apiHost}:3010/api`;
};

const API_BASE = getApiBase();

// ============================================
// QUOTATION TYPES
// ============================================

export interface Quotation {
  QuotationID: number;
  QuotationUUID: string;
  QuotationNumber: string;
  QuotationDate: string;
  VendorID: number | null;
  VendorName: string;
  VendorAddress: string | null;
  VendorPhone: string | null;
  VendorEmail: string | null;
  DepartmentID: number;
  DepartmentName: string;
  BranchID: number;
  BranchName: string;
  CategoryID: number | null;
  CategoryName: string | null;
  SubTotal: number;
  VATAmount: number;
  VATPercent: number;
  DiscountAmount: number;
  TotalAmount: number;
  CurrencyCode: string;
  ValidityDays: number | null;
  DeliveryTerms: string | null;
  PaymentTerms: string | null;
  Notes: string | null;
  IsSelected: boolean;
  SelectedBy: number | null;
  SelectedByName: string | null;
  SelectedAt: string | null;
  SelectionNotes: string | null;
  Status: string;
  UploadedBy: number;
  UploadedByName: string;
  UploadedAt: string;
  FileName: string;
  FilePath: string;
  ItemCount: number;
}

export interface QuotationItem {
  QuotationItemID: number;
  LineNumber: number;
  ItemDescription: string;
  Quantity: number;
  UnitOfMeasure: string;
  UnitPrice: number;
  TotalPrice: number;
  Notes: string | null;
}

export interface UploadQuotationData {
  departmentId: number;
  branchId?: number;
  categoryId?: number;
  uploadedBy: number;
  notes?: string;
}

// ============================================
// QUOTATION API FUNCTIONS
// ============================================

// Get all quotations with optional filters
export async function getQuotations(params?: {
  status?: string;
  department?: string;
  vendor?: string;
  dateFrom?: string;
  dateTo?: string;
  isSelected?: boolean;
}): Promise<Quotation[]> {
  const searchParams = new URLSearchParams();
  if (params?.status) searchParams.append('status', params.status);
  if (params?.department) searchParams.append('department', params.department);
  if (params?.vendor) searchParams.append('vendor', params.vendor);
  if (params?.dateFrom) searchParams.append('dateFrom', params.dateFrom);
  if (params?.dateTo) searchParams.append('dateTo', params.dateTo);
  if (params?.isSelected !== undefined) searchParams.append('isSelected', params.isSelected.toString());

  const url = `${API_BASE}/quotations${searchParams.toString() ? '?' + searchParams.toString() : ''}`;
  const response = await fetch(url);
  return response.json();
}

// Get single quotation by UUID
export async function getQuotation(uuid: string): Promise<{
  quotation: Quotation;
  items: QuotationItem[];
}> {
  const response = await fetch(`${API_BASE}/quotations/${uuid}`);
  const result = await response.json();

  // Handle Express API response format: { success, data: { quotation, lineItems } }
  if (!result.success || !result.data) {
    throw new Error('Quotation not found');
  }

  return {
    quotation: result.data.quotation,
    items: result.data.lineItems || []
  };
}

// Upload quotation file for AI extraction
export async function uploadQuotationFile(
  file: File,
  data: UploadQuotationData
): Promise<{
  success: boolean;
  quotationId?: number;
  quotationUuid?: string;
  quotationNumber?: string;
  extractedData?: any;
  confidenceScore?: number;
  error?: string;
}> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('departmentId', data.departmentId.toString());
  if (data.branchId) formData.append('branchId', data.branchId.toString());
  if (data.categoryId) formData.append('categoryId', data.categoryId.toString());
  formData.append('uploadedBy', data.uploadedBy.toString());
  if (data.notes) formData.append('notes', data.notes);

  const response = await fetch(`${API_BASE}/quotations/upload`, {
    method: 'POST',
    body: formData,
  });

  return response.json();
}

// Select a quotation (mark as selected for LPO creation)
export async function selectQuotation(
  uuid: string,
  userId: number,
  selectionNotes?: string
): Promise<{ success: boolean; error?: string }> {
  const response = await fetch(`${API_BASE}/quotations/${uuid}/select`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      quotationUuid: uuid,
      selectedBy: userId,
      selectionNotes,
    }),
  });

  return response.json();
}

// Create LPO from selected quotation
export async function createLPOFromQuotation(
  quotationUuid: string,
  userId: number,
  additionalData?: {
    expectedDeliveryDate?: string;
    paymentTerms?: string;
    notes?: string;
  }
): Promise<{
  success: boolean;
  lpoId?: number;
  lpoUuid?: string;
  lpoNumber?: string;
  error?: string;
}> {
  const response = await fetch(`${API_BASE}/quotations/${quotationUuid}/create-lpo`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      quotationUuid,
      userId,
      ...additionalData,
    }),
  });

  return response.json();
}

// Delete quotation
export async function deleteQuotation(
  uuid: string,
  userId: number
): Promise<{ success: boolean; error?: string }> {
  const response = await fetch(`${API_BASE}/quotations/${uuid}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId,
    }),
  });

  return response.json();
}

// Get quotation statistics
export async function getQuotationStats(): Promise<{
  TotalQuotations: number;
  SelectedQuotations: number;
  PendingQuotations: number;
  TotalValue: number;
  SelectedValue: number;
}> {
  const response = await fetch(`${API_BASE}/quotations/stats`);
  return response.json();
}

// Download quotation file
export function downloadQuotationFile(uuid: string): void {
  const url = `${API_BASE}/quotations/${uuid}/download`;
  window.open(url, '_blank');
}
