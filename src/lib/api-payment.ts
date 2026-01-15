// Payment API Client

// Import types and functions from centralized lookup API
import type { PaymentMode, BankAccount } from './api-lookup';
import { getPaymentModes, getBankAccounts } from './api-lookup';

// Re-export for backward compatibility
export type { PaymentMode, BankAccount };
export { getPaymentModes, getBankAccounts };

// Auto-detect API base URL based on how dashboard is accessed
const getApiBase = () => {
  const hostname = window.location.hostname;
  const apiHost = hostname === 'localhost' ? 'localhost' : hostname;
  return `http://${apiHost}:3010/api`;
};

const API_BASE = getApiBase();

export interface Payment {
  PaymentID: number;
  PaymentUUID: string;
  InvoiceID: number | null;
  LPOID: number | null;
  PaymentDate: string;
  Amount: number;
  CurrencyCode: string;
  PaymentModeID: number;
  ModeName: string;
  PaymentCategory: string; // ADVANCE, PDC, BALANCE, FULL
  ReferenceNumber: string | null;
  BankName: string | null;
  BankAccountID: number | null;
  BankAccountName: string | null;
  ChequeNumber: string | null;
  ChequeDate: string | null;
  PDCStatus: string | null; // PENDING, DEPOSITED, CLEARED, BOUNCED, CANCELLED
  DepositedDate: string | null;
  ClearedDate: string | null;
  PaymentType: string;
  Status: string;
  Notes: string | null;
  RecordedByName: string;
  RecordedAt: string;
}

// PaymentMode and BankAccount interfaces now imported from api-lookup.ts

export interface RecordPaymentData {
  invoiceId?: number;
  lpoId?: number;
  paymentDate: string;
  amount: number;
  paymentModeId: number;
  paymentCategory: 'ADVANCE' | 'PDC' | 'BALANCE' | 'FULL';
  referenceNumber?: string;
  bankName?: string;
  bankAccountId?: number;
  chequeNumber?: string;
  chequeDate?: string;
  notes?: string;
  recordedBy: number;
}

export async function getPayments(params?: {
  type?: string;
  status?: string;
  pdcStatus?: string;
  dateFrom?: string;
  dateTo?: string;
}): Promise<Payment[]> {
  const searchParams = new URLSearchParams();
  if (params?.type) searchParams.append('type', params.type);
  if (params?.status) searchParams.append('status', params.status);
  if (params?.pdcStatus) searchParams.append('pdcStatus', params.pdcStatus);
  if (params?.dateFrom) searchParams.append('dateFrom', params.dateFrom);
  if (params?.dateTo) searchParams.append('dateTo', params.dateTo);

  const url = `${API_BASE}/payments${searchParams.toString() ? '?' + searchParams.toString() : ''}`;
  const response = await fetch(url);
  return response.json();
}

// getPaymentModes() and getBankAccounts() now imported from api-lookup.ts

export async function recordPayment(data: RecordPaymentData): Promise<{
  success: boolean;
  paymentId?: number;
  error?: string;
}> {
  const response = await fetch(`${API_BASE}/payments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return response.json();
}

export async function updatePDCStatus(
  paymentUuid: string,
  status: string,
  date?: string
): Promise<{ success: boolean; error?: string }> {
  const response = await fetch(`${API_BASE}/payments/${paymentUuid}/pdc-status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, date }),
  });
  return response.json();
}

export async function getPDCTracker(): Promise<Payment[]> {
  const response = await fetch(`${API_BASE}/payments/pdc-tracker`);
  return response.json();
}
