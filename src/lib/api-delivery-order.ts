// Delivery Order API Client

// Auto-detect API base URL based on how dashboard is accessed
const getApiBase = () => {
  const hostname = window.location.hostname;
  const apiHost = hostname === 'localhost' ? 'localhost' : hostname;
  return `http://${apiHost}:3010/api`;
};

const API_BASE = getApiBase();

// ============================================
// DELIVERY ORDER TYPES
// ============================================

export interface DeliveryOrder {
  DOID: number;
  DOUUID: string;
  DONumber: string;
  DODate: string;
  LPOID: number | null;
  LPONumber: string | null;
  LPOUuid: string | null;
  VendorID: number | null;
  VendorName: string;
  BranchID: number;
  BranchName: string;
  DepartmentID: number | null;
  DepartmentName: string | null;
  ReceivedBy: number | null;
  ReceivedByName: string | null;
  ReceivedDate: string | null;
  ExpectedDeliveryDate: string | null;
  ActualDeliveryDate: string | null;
  DeliveryNotes: string | null;
  Status: string;
  StatusName: string;
  CreatedBy: number;
  CreatedByName: string;
  CreatedAt: string;
  ItemCount: number;
  TotalQuantity: number;
  ReceivedQuantity: number;
  PendingQuantity: number;
}

export interface DeliveryOrderItem {
  DOItemID: number;
  LineNumber: number;
  LPOItemID: number | null;
  ItemDescription: string;
  Quantity: number;
  UnitOfMeasure: string;
  ReceivedQuantity: number;
  PendingQuantity: number;
  Status: string;
  Notes: string | null;
}

export interface DeliveryOrderReceipt {
  ReceiptID: number;
  ReceiptUUID: string;
  DOItemID: number;
  ItemDescription: string;
  ReceiptDate: string;
  QuantityReceived: number;
  ReceivedByName: string;
  ReceivedAt: string;
  Condition: string;
  ConditionNotes: string | null;
  SerialNumbers: string | null;
  ReceivedAtBranchID: number;
  ReceivedAtBranchName: string;
  Notes: string | null;
  AssetsCreated: number;
  AssetTags: string[] | null;
}

export interface CreateDOData {
  lpoId?: number;
  vendorId?: number;
  vendorName: string;
  branchId: number;
  departmentId?: number;
  doDate: string;
  expectedDeliveryDate?: string;
  deliveryNotes?: string;
  items: {
    lpoItemId?: number;
    lineNumber: number;
    description: string;
    quantity: number;
    unitOfMeasure: string;
    notes?: string;
  }[];
  createdBy: number;
}

export interface ReceiveItemData {
  doItemId: number;
  quantityReceived: number;
  receiptDate: string;
  receivedBy: number;
  receivedAtBranchId: number;
  condition?: string;
  conditionNotes?: string;
  serialNumbers?: string[];
  notes?: string;
}

// ============================================
// DELIVERY ORDER API FUNCTIONS
// ============================================

// Get all delivery orders with optional filters
export async function getDeliveryOrders(params?: {
  status?: string;
  lpo?: string;
  vendor?: string;
  dateFrom?: string;
  dateTo?: string;
}): Promise<DeliveryOrder[]> {
  const searchParams = new URLSearchParams();
  if (params?.status) searchParams.append('status', params.status);
  if (params?.lpo) searchParams.append('lpo', params.lpo);
  if (params?.vendor) searchParams.append('vendor', params.vendor);
  if (params?.dateFrom) searchParams.append('dateFrom', params.dateFrom);
  if (params?.dateTo) searchParams.append('dateTo', params.dateTo);

  const url = `${API_BASE}/delivery-orders${searchParams.toString() ? '?' + searchParams.toString() : ''}`;
  const response = await fetch(url);
  return response.json();
}

// Get single delivery order by UUID
export async function getDeliveryOrder(uuid: string): Promise<{
  deliveryOrder: DeliveryOrder;
  items: DeliveryOrderItem[];
  receipts: DeliveryOrderReceipt[];
}> {
  const response = await fetch(`${API_BASE}/delivery-orders/${uuid}`);
  return response.json();
}

// Create new delivery order
export async function createDeliveryOrder(
  data: CreateDOData
): Promise<{
  success: boolean;
  doId?: number;
  doUuid?: string;
  doNumber?: string;
  error?: string;
}> {
  const response = await fetch(`${API_BASE}/delivery-orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  return response.json();
}

// Receive items (partial or full)
export async function receiveDeliveryItems(
  data: ReceiveItemData
): Promise<{
  success: boolean;
  receiptId?: number;
  assetsCreated?: { assetId: number; assetTag: string }[];
  error?: string;
}> {
  const response = await fetch(`${API_BASE}/delivery-orders/receive`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  return response.json();
}

// Complete delivery order
export async function completeDeliveryOrder(
  uuid: string,
  userId: number
): Promise<{ success: boolean; error?: string }> {
  const response = await fetch(`${API_BASE}/delivery-orders/${uuid}/complete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ doUuid: uuid, userId }),
  });

  return response.json();
}

// Cancel delivery order
export async function cancelDeliveryOrder(
  uuid: string,
  userId: number,
  reason: string
): Promise<{ success: boolean; error?: string }> {
  const response = await fetch(`${API_BASE}/delivery-orders/${uuid}/cancel`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, reason }),
  });

  return response.json();
}

// Get delivery order statistics
export async function getDeliveryOrderStats(): Promise<{
  TotalDOs: number;
  PendingDOs: number;
  PartiallyReceived: number;
  FullyReceived: number;
  Completed: number;
}> {
  const response = await fetch(`${API_BASE}/delivery-orders/stats`);
  return response.json();
}
