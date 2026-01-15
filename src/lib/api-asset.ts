// Asset API Client

// Auto-detect API base URL based on how dashboard is accessed
const getApiBase = () => {
  const hostname = window.location.hostname;
  const apiHost = hostname === 'localhost' ? 'localhost' : hostname;
  return `http://${apiHost}:3010/api`;
};

const API_BASE = getApiBase();

export interface Asset {
  AssetID: number;
  AssetUUID: string;
  AssetTag: string | null;
  ItemDescription: string;
  CategoryID: number | null;
  CategoryName: string | null;
  BranchID: number;
  BranchName: string;
  DepartmentID: number | null;
  DepartmentName: string | null;
  Condition: string;
  Status: string; // PENDING, ACTIVE, DISPOSED, etc.
  ReceivedDate: string;
  PutToUseDate: string | null;
  PurchaseValue: number | null;
  CurrentValue: number | null;
  SerialNumber: string | null;
  Notes: string | null;
}

export async function getPendingAssets(): Promise<Asset[]> {
  const response = await fetch(`${API_BASE}/assets/pending`);
  return response.json();
}

export async function putAssetToUse(
  assetUuid: string,
  putToUseDate: string,
  userId: number
): Promise<{ success: boolean; assetTag?: string; error?: string }> {
  const response = await fetch(`${API_BASE}/assets/${assetUuid}/put-to-use`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ putToUseDate, userId }),
  });
  return response.json();
}

export async function getAssets(params?: {
  status?: string;
  branch?: string;
  department?: string;
  category?: string;
}): Promise<Asset[]> {
  const searchParams = new URLSearchParams();
  if (params?.status) searchParams.append('status', params.status);
  if (params?.branch) searchParams.append('branch', params.branch);
  if (params?.department) searchParams.append('department', params.department);
  if (params?.category) searchParams.append('category', params.category);

  const url = `${API_BASE}/assets${searchParams.toString() ? '?' + searchParams.toString() : ''}`;
  const response = await fetch(url);
  return response.json();
}
