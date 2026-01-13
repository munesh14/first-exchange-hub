// Document Chain API Client

const API_BASE = 'http://172.16.35.76:5679/webhook';

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

export async function getChainByDocument(type: string, id: number): Promise<{ success: boolean; chain: DocumentChain | null }> {
  const response = await fetch(`${API_BASE}/chain-api/by-document?type=${type}&id=${id}`);
  return response.json();
}

export async function getChainTimeline(uuid: string): Promise<{ success: boolean; timeline: TimelineEvent[] }> {
  const response = await fetch(`${API_BASE}/chain-api/timeline?uuid=${uuid}`);
  return response.json();
}
