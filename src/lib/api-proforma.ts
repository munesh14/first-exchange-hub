// Proforma Invoice API Client

const API_BASE = 'http://172.16.35.76:5679/webhook';

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

  const url = `${API_BASE}/proforma-api/proforma-invoices${searchParams.toString() ? '?' + searchParams.toString() : ''}`;
  const response = await fetch(url);
  return response.json();
}

export async function getProformaInvoice(uuid: string): Promise<{ proforma: ProformaInvoice }> {
  const response = await fetch(`${API_BASE}/proforma-api/proforma?uuid=${uuid}`);
  return response.json();
}

export function downloadProformaFile(uuid: string): void {
  const url = `${API_BASE}/proforma-api/proforma/download?uuid=${uuid}`;
  window.open(url, '_blank');
}
