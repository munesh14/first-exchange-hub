// Proforma Invoice API Client

// Auto-detect API base URL based on how dashboard is accessed
const getApiBase = () => {
  const hostname = window.location.hostname;
  const apiHost = hostname === 'localhost' ? 'localhost' : hostname;
  return `http://${apiHost}:3010/api`;
};

const API_BASE = getApiBase();

export interface ProformaInvoice {
  ProformaID: number;
  ProformaUUID: string;
  ProformaNumber: string;
  ProformaDate: string;
  LPOID: number | null;
  LPONumber: string | null;
  VendorID: number | null;
  VendorName: string;
  SubTotal: number;
  VATAmount: number;
  TotalAmount: number;
  CurrencyCode: string;
  DueDate: string | null;
  Status: string;
  UploadedBy: number;
  UploadedByName: string;
  UploadedAt: string;
  FileName: string;
}

export async function getProformaInvoices(params?: {
  status?: string;
  lpo?: string;
  vendor?: string;
}): Promise<ProformaInvoice[]> {
  const searchParams = new URLSearchParams();
  if (params?.status) searchParams.append('status', params.status);
  if (params?.lpo) searchParams.append('lpo', params.lpo);
  if (params?.vendor) searchParams.append('vendor', params.vendor);

  const url = `${API_BASE}/proforma-invoices${searchParams.toString() ? '?' + searchParams.toString() : ''}`;
  const response = await fetch(url);
  return response.json();
}

export async function getProformaInvoice(uuid: string): Promise<{ proforma: ProformaInvoice }> {
  const response = await fetch(`${API_BASE}/proforma-invoices/${uuid}`);
  return response.json();
}

export function downloadProformaFile(uuid: string): void {
  const url = `${API_BASE}/proforma-invoices/${uuid}/download`;
  window.open(url, '_blank');
}
