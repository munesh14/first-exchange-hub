// Asset API Client

const API_BASE = 'http://172.16.35.76:5679/webhook';

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
  const response = await fetch(`${API_BASE}/asset-api/pending`);
  return response.json();
}

export async function putAssetToUse(
  assetUuid: string,
  putToUseDate: string,
  userId: number
): Promise<{ success: boolean; assetTag?: string; error?: string }> {
  const response = await fetch(`${API_BASE}/asset-api/put-to-use`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ assetUuid, putToUseDate, userId }),
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

  const url = `${API_BASE}/asset-api/assets${searchParams.toString() ? '?' + searchParams.toString() : ''}`;
  const response = await fetch(url);
  return response.json();
}
