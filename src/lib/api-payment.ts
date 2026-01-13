// Payment API Client

const API_BASE = 'http://172.16.35.76:5679/webhook';

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

export interface PaymentMode {
  ModeID: number;
  ModeCode: string;
  ModeName: string;
  RequiresReference: boolean;
  IsActive: boolean;
}

export interface BankAccount {
  BankAccountID: number;
  BankName: string;
  AccountNumber: string;
  AccountName: string;
  BranchName: string | null;
  IsActive: boolean;
}

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

  const url = `${API_BASE}/payment-api/payments${searchParams.toString() ? '?' + searchParams.toString() : ''}`;
  const response = await fetch(url);
  return response.json();
}

export async function getPaymentModes(): Promise<PaymentMode[]> {
  const response = await fetch(`${API_BASE}/payment-api/modes`);
  return response.json();
}

export async function getBankAccounts(): Promise<BankAccount[]> {
  const response = await fetch(`${API_BASE}/payment-api/bank-accounts`);
  return response.json();
}

export async function recordPayment(data: RecordPaymentData): Promise<{
  success: boolean;
  paymentId?: number;
  error?: string;
}> {
  const response = await fetch(`${API_BASE}/payment-api/payment/record`, {
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
  const response = await fetch(`${API_BASE}/payment-api/pdc/update-status`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ paymentUuid, status, date }),
  });
  return response.json();
}

export async function getPDCTracker(): Promise<Payment[]> {
  const response = await fetch(`${API_BASE}/payment-api/pdc/tracker`);
  return response.json();
}
