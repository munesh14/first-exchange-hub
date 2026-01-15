// Centralized Lookup API Client
// All lookup endpoints for vendors, departments, branches, users, payment modes, bank accounts

// Auto-detect API base URL based on how dashboard is accessed
const getApiBase = () => {
  const hostname = window.location.hostname;
  const apiHost = hostname === 'localhost' ? 'localhost' : hostname;
  return `http://${apiHost}:3010/api/lookups`;
};

const API_BASE = getApiBase();

// ============================================
// INTERFACES
// ============================================

export interface Vendor {
  VendorID: number;
  VendorUUID: string;
  VendorCode: string | null;
  VendorName: string;
  TradeName: string | null;
  ContactPerson: string | null;
  Phone: string | null;
  Mobile: string | null;
  Email: string | null;
  Address: string | null;
  City: string | null;
  Country: string;
  TaxNumber: string | null;
  CRNumber: string | null;
  IsActive: boolean;
}

export interface Department {
  DepartmentID: number;
  DepartmentCode: string;
  DepartmentName: string;
  BranchID: number;
  IsActive: boolean;
}

export interface Branch {
  BranchID: number;
  BranchCode: string;
  BranchName: string;
  BranchType: string;
  IsActive: boolean;
}

export interface User {
  UserID: number;
  Username: string;
  FullName: string;
  Email: string;
  DepartmentID: number;
  DepartmentName: string;
  Role: string;
  IsActive: boolean;
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

export interface Category {
  CategoryID: number;
  CategoryCode: string;
  CategoryName: string;
  IsAssetCategory: boolean;
  DepreciationRatePercent: number;
}

// ============================================
// VENDOR LOOKUPS
// ============================================

export async function getVendors(search?: string): Promise<Vendor[]> {
  const url = search
    ? `${API_BASE}/vendors?search=${encodeURIComponent(search)}`
    : `${API_BASE}/vendors`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch vendors: ${response.statusText}`);
  }
  const result = await response.json();
  return result.data || result;
}

export async function createVendor(data: {
  name: string;
  address?: string;
  phone?: string;
  email?: string;
}): Promise<{ success: boolean; vendorId: number }> {
  const response = await fetch(`${API_BASE}/vendors`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      VendorName: data.name,
      Address: data.address,
      Phone: data.phone,
      Email: data.email,
    }),
  });
  if (!response.ok) {
    throw new Error(`Failed to create vendor: ${response.statusText}`);
  }
  const result = await response.json();
  return {
    success: result.success,
    vendorId: result.data?.VendorID || 0,
  };
}

// ============================================
// DEPARTMENT LOOKUPS
// ============================================

export async function getDepartments(branchId?: number): Promise<Department[]> {
  const url = branchId
    ? `${API_BASE}/departments?branchId=${branchId}`
    : `${API_BASE}/departments`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch departments: ${response.statusText}`);
  }
  const result = await response.json();
  return result.data || result;
}

// ============================================
// BRANCH LOOKUPS
// ============================================

export async function getBranches(): Promise<Branch[]> {
  const response = await fetch(`${API_BASE}/branches`);
  if (!response.ok) {
    throw new Error(`Failed to fetch branches: ${response.statusText}`);
  }
  const result = await response.json();
  return result.data || result;
}

// ============================================
// USER LOOKUPS
// ============================================

export async function getUsers(departmentId?: number): Promise<User[]> {
  const url = departmentId
    ? `${API_BASE}/users?departmentId=${departmentId}`
    : `${API_BASE}/users`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch users: ${response.statusText}`);
  }
  const result = await response.json();
  return result.data || result;
}

// ============================================
// PAYMENT MODE LOOKUPS
// ============================================

export async function getPaymentModes(): Promise<PaymentMode[]> {
  const response = await fetch(`${API_BASE}/payment-modes`);
  if (!response.ok) {
    throw new Error(`Failed to fetch payment modes: ${response.statusText}`);
  }
  const result = await response.json();
  return result.data || result;
}

// ============================================
// BANK ACCOUNT LOOKUPS
// ============================================

export async function getBankAccounts(): Promise<BankAccount[]> {
  const response = await fetch(`${API_BASE}/bank-accounts`);
  if (!response.ok) {
    throw new Error(`Failed to fetch bank accounts: ${response.statusText}`);
  }
  const result = await response.json();
  return result.data || result;
}

// ============================================
// CATEGORY LOOKUPS
// ============================================

export async function getCategories(): Promise<Category[]> {
  const response = await fetch(`${API_BASE}/categories`);
  if (!response.ok) {
    throw new Error(`Failed to fetch categories: ${response.statusText}`);
  }
  const result = await response.json();
  return result.data || result;
}
