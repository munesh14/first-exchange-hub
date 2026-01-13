import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@/lib/api';

interface UserContextType {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  isUserModalOpen: boolean;
  setIsUserModalOpen: (open: boolean) => void;
  canAccessReports: boolean;
  canAccessAssets: boolean;
  // LPO Approval Permissions
  isHOD: boolean;
  isGM: boolean;
  isFinalApprover: boolean;  // Ms. Nafha - Final Approving Authority
  isAccountsHOD: boolean;    // Mr. George - Accounts Department Head
  canApproveForDepartment: (departmentId: number | null, departmentName?: string | null) => boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

const STORAGE_KEY = 'firstexchange_current_user';

export function UserProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUserState] = useState<User | null>(null);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem(STORAGE_KEY);
    if (storedUser) {
      try {
        setCurrentUserState(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    } else {
      setIsUserModalOpen(true);
    }
    setIsInitialized(true);
  }, []);

  const setCurrentUser = (user: User | null) => {
    setCurrentUserState(user);
    if (user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  // IT = 1, Accounts = 2
  const canAccessReports = currentUser?.DepartmentID === 1 || currentUser?.DepartmentID === 2;
  const canAccessAssets = currentUser?.DepartmentID === 1 || currentUser?.DepartmentID === 2;

  // =====================================================
  // LPO Approval Permissions - Updated Hierarchy
  // =====================================================
  // Flow: Staff → Dept HOD → GM (>100 OMR) → Final Approver
  //
  // UserID 1  = Munesh C (HOD-IT, Admin)
  // UserID 8  = Ms. Nafha (FINAL_APPROVER - Final Approving Authority)
  // UserID 9  = Ms. Shamsa (GM - General Manager, approves >100 OMR)
  // UserID 10 = Mr. George (HOD - Accounts Department Head)
  // =====================================================

  // Department Heads (can approve for their department)
  const isHOD = currentUser?.Role === 'HOD' || 
                currentUser?.Role === 'ADMIN' || 
                currentUser?.IsDeptHead === true ||
                currentUser?.UserID === 1 ||   // Munesh (IT HOD)
                currentUser?.UserID === 10;    // George (Accounts HOD)
  
  // General Manager (approves amounts > 100 OMR)
  const isGM = currentUser?.Role === 'GM' || 
               currentUser?.UserID === 9;      // Shamsa
  
  // Final Approving Authority (final step in approval chain)
  const isFinalApprover = currentUser?.Role === 'FINAL_APPROVER' || 
                          currentUser?.UserID === 8;  // Nafha
  
  // Accounts Department Head specifically (Mr. George)
  const isAccountsHOD = (currentUser?.DepartmentID === 2 && currentUser?.IsDeptHead === true) ||
                        currentUser?.UserID === 10;    // George
  
  const canApproveForDepartment = (departmentId: number | null, departmentName?: string | null) => {
    if (!currentUser) return false;
    
    // Final approver can approve any department's LPO at final stage
    if (isFinalApprover) return true;
    
    // GM can approve any department's LPO at GM stage
    if (isGM) return true;
    
    // HOD can only approve their own department
    if (departmentId && currentUser.DepartmentID === departmentId) return isHOD;
    if (departmentName && currentUser.DepartmentName === departmentName) return isHOD;
    
    return false;
  };

  if (!isInitialized) {
    return null;
  }

  return (
    <UserContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        isUserModalOpen,
        setIsUserModalOpen,
        canAccessReports,
        canAccessAssets,
        isHOD,
        isGM,
        isFinalApprover,
        isAccountsHOD,
        canApproveForDepartment,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
