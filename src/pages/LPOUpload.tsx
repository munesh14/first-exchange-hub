import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  ArrowLeft, Upload, FileText, Loader2, Sparkles, CheckCircle2,
  AlertCircle, Edit3, Save, ExternalLink, Home, Plus, Trash2, Building2, Users
} from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { uploadQuotation, updateLPO, createLPO, getBranches, getDepartments } from '@/lib/api-lpo';

// Simple UUID generator that works in HTTP context
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

interface Branch {
  BranchID: number;
  BranchCode: string;
  BranchName: string;
  BranchType: string;
}

interface Department {
  DepartmentID: number;
  DepartmentCode: string;
  DepartmentName: string;
}

interface LPOItem {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
}

interface ExtractedLPO {
  LPOID: number;
  LPOUUID: string;
  LPONumber: string;
  VendorName: string;
  VendorAddress?: string;
  VendorContact?: string;
  VendorPhone?: string;
  QuotationReference?: string;
  SubTotal: number;
  VATAmount: number;
  TotalAmount: number;
  ConfidenceScore: number;
  Items: LPOItem[];
}

const UNITS = ['EA', 'SET', 'BOX', 'PKT', 'KG', 'LTR', 'MTR', 'HR', 'DAY', 'MONTH', 'YEAR'];

// Branch data - Head Office (HQ) is the only one with departments
const BRANCHES: Branch[] = [
  { BranchID: 1, BranchCode: 'HQ', BranchName: 'Head Office', BranchType: 'HEAD_OFFICE' },
  { BranchID: 2, BranchCode: 'GBR', BranchName: 'Ghubrah Branch', BranchType: 'BRANCH' },
  { BranchID: 3, BranchCode: 'RWI', BranchName: 'Ruwi Branch', BranchType: 'BRANCH' },
  { BranchID: 4, BranchCode: 'WKR', BranchName: 'Wadi Kabir Branch', BranchType: 'BRANCH' },
  { BranchID: 5, BranchCode: 'FQB', BranchName: 'Falaj al Qabail Branch', BranchType: 'BRANCH' },
  { BranchID: 6, BranchCode: 'AHI', BranchName: 'Awhi Branch', BranchType: 'BRANCH' },
  { BranchID: 7, BranchCode: 'AQD', BranchName: 'Auqad Branch', BranchType: 'BRANCH' },
  { BranchID: 8, BranchCode: 'SNT', BranchName: 'Sahalnout Branch', BranchType: 'BRANCH' },
];

// Departments - only applicable for Head Office
const DEPARTMENTS: Department[] = [
  { DepartmentID: 1, DepartmentCode: 'IT', DepartmentName: 'Information Technology' },
  { DepartmentID: 2, DepartmentCode: 'ACC', DepartmentName: 'Accounts' },
  { DepartmentID: 3, DepartmentCode: 'HR', DepartmentName: 'Human Resources' },
  { DepartmentID: 4, DepartmentCode: 'OPS', DepartmentName: 'Operations' },
  { DepartmentID: 5, DepartmentCode: 'MKT', DepartmentName: 'Marketing' },
  { DepartmentID: 6, DepartmentCode: 'COMP', DepartmentName: 'Compliance' },
  { DepartmentID: 7, DepartmentCode: 'MISC', DepartmentName: 'Miscellaneous' },
];

export default function LPOUpload() {
  const navigate = useNavigate();
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Success modal state
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdLPO, setCreatedLPO] = useState<ExtractedLPO | null>(null);

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editedLPO, setEditedLPO] = useState<ExtractedLPO | null>(null);

  // Manual entry mode
  const [isManualEntry, setIsManualEntry] = useState(false);

  // Branch/Department selection - NO defaults, user must select
  const [branchId, setBranchId] = useState<string>('');
  const [departmentId, setDepartmentId] = useState<string>('');

  // Derived state for validation
  const selectedBranch = BRANCHES.find(b => b.BranchID.toString() === branchId);
  // Use BranchCode check as it's more reliable across API/static data
  const isHeadOffice = selectedBranch?.BranchCode === 'HQ' || selectedBranch?.BranchType === 'HEAD_OFFICE';
  const needsDepartment = isHeadOffice;
  
  // Validation: Branch is always required, Department required only for Head Office
  const isSelectionValid = branchId !== '' && (!needsDepartment || departmentId !== '');
  const canUpload = isSelectionValid && !uploading;

  // Reset department when branch changes (if switching away from Head Office)
  useEffect(() => {
    if (!isHeadOffice) {
      setDepartmentId('');
    }
  }, [branchId, isHeadOffice]);

  // File upload handler
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    if (!canUpload) return;

    const file = acceptedFiles[0];
    setUploading(true);
    setUploadError(null);

    try {
      // Use the Express API upload function
      const result = await uploadQuotation(
        file,
        parseInt(branchId),
        departmentId ? parseInt(departmentId) : undefined,
        1 // Default user - should come from auth context
      );

      if (result.success) {
        // Debug logging
        console.log('[LPOUpload] API Response:', result);
        console.log('[LPOUpload] extractedData:', result.extractedData);
        console.log('[LPOUpload] lineItems:', result.extractedData?.lineItems);
        console.log('[LPOUpload] lineItems length:', result.extractedData?.lineItems?.length);

        // Map the Express API response to our LPO format
        const lpoData: ExtractedLPO = {
          LPOID: result.lpo?.LPOID,
          LPOUUID: result.lpo?.LPOUUID,
          LPONumber: result.lpo?.LPONumber,
          VendorName: result.extractedData?.vendorName || result.lpo?.VendorName || 'Unknown Vendor',
          VendorAddress: result.extractedData?.vendorAddress || result.lpo?.VendorAddress,
          VendorContact: result.extractedData?.vendorEmail,
          VendorPhone: result.extractedData?.vendorPhone,
          QuotationReference: result.extractedData?.quotationNumber || result.lpo?.QuotationReference,
          SubTotal: result.extractedData?.subTotal || result.lpo?.SubTotal || 0,
          VATAmount: result.extractedData?.vatAmount || result.lpo?.VATAmount || 0,
          TotalAmount: result.extractedData?.totalAmount || result.lpo?.TotalAmount || 0,
          ConfidenceScore: Math.round((result.confidenceScore || 0) * 100), // Convert 0.95 to 95
          Items: (result.extractedData?.lineItems || []).map((item: any) => ({
            id: generateUUID(),
            description: item.description || '',
            quantity: item.quantity || 1,
            unit: item.unitOfMeasure || 'EA',
            unitPrice: item.unitPrice || 0,
            totalPrice: item.totalPrice || 0,
          })),
        };

        console.log('[LPOUpload] Mapped LPO data:', lpoData);
        console.log('[LPOUpload] Items count:', lpoData.Items.length);
        console.log('[LPOUpload] Confidence Score:', lpoData.ConfidenceScore);

        setCreatedLPO(lpoData);
        setEditedLPO({ ...lpoData });
        setShowSuccessModal(true);
        console.log('[LPOUpload] Success modal should now be visible');
      } else {
        setUploadError(result.error || 'Failed to process quotation');
      }
    } catch (error: any) {
      console.error('Error uploading quotation:', error);
      setUploadError(error.message || 'Network error. Please check your connection and try again.');
    } finally {
      setUploading(false);
    }
  }, [branchId, departmentId, canUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg'],
    },
    maxFiles: 1,
    disabled: !canUpload,
  });

  // Save LPO (create for manual entry, update for AI extraction)
  const handleSaveEdits = async () => {
    if (!editedLPO) return;

    // Validate that items have valid quantities and prices
    const hasInvalidItems = editedLPO.Items.some(
      item => item.quantity <= 0 || item.unitPrice < 0 || !item.description.trim()
    );

    if (hasInvalidItems) {
      alert('Please ensure all items have valid quantities, prices, and descriptions.');
      return;
    }

    // Validate vendor name
    if (!editedLPO.VendorName.trim()) {
      alert('Please enter vendor name.');
      return;
    }

    setSaving(true);
    try {
      // Calculate totals from edited items
      const totals = calculateTotals(editedLPO);

      if (isManualEntry) {
        // CREATE new LPO for manual entry
        const result = await createLPO({
          branchId: parseInt(branchId),
          departmentId: departmentId ? parseInt(departmentId) : undefined,
          vendorName: editedLPO.VendorName,
          vendorAddress: editedLPO.VendorAddress,
          vendorContact: editedLPO.VendorContact,
          vendorPhone: editedLPO.VendorPhone,
          quotationReference: editedLPO.QuotationReference,
          currencyCode: 'OMR',
          vatPercent: 5,
          discountPercent: 0,
          items: editedLPO.Items.map((item, idx) => ({
            lineNumber: idx + 1,
            description: item.description,
            quantity: item.quantity,
            unitOfMeasure: item.unit,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
          })),
          userId: 1, // Default user - should come from auth context
        });

        if (result.success && result.LPOUUID) {
          // Navigate to the newly created LPO
          navigate(`/lpo/${result.LPOUUID}`);
        } else {
          alert('Failed to create LPO: ' + (result.error || 'Unknown error'));
        }
      } else {
        // UPDATE existing LPO from AI extraction
        const result = await updateLPO(
          editedLPO.LPOUUID,
          1, // Default user - should come from auth context
          {
            vendorName: editedLPO.VendorName,
            vendorAddress: editedLPO.VendorAddress,
            vendorContact: editedLPO.VendorContact,
            vendorPhone: editedLPO.VendorPhone,
            quotationReference: editedLPO.QuotationReference,
            subTotal: totals.subtotal,
            vatAmount: totals.vatAmount,
            totalAmount: totals.total,
            items: editedLPO.Items.map((item, idx) => ({
              lineNumber: idx + 1,
              description: item.description,
              quantity: item.quantity,
              unitOfMeasure: item.unit,
              unitPrice: item.unitPrice,
              totalPrice: item.totalPrice,
            })),
          }
        );

        if (result.success) {
          // Update createdLPO with the edited values AND calculated totals
          const updatedLPO = {
            ...editedLPO,
            SubTotal: totals.subtotal,
            VATAmount: totals.vatAmount,
            TotalAmount: totals.total,
          };
          setCreatedLPO(updatedLPO);
          setEditedLPO(updatedLPO);
          setIsEditing(false);
        } else {
          alert('Failed to save changes: ' + (result.error || 'Unknown error'));
        }
      }
    } catch (error: any) {
      console.error('Error saving LPO:', error);
      alert('Failed to save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Update item in edit mode
  const updateItem = (id: string, field: keyof LPOItem, value: any) => {
    if (!editedLPO) return;
    setEditedLPO({
      ...editedLPO,
      Items: editedLPO.Items.map(item => {
        if (item.id === id) {
          const updated = { ...item, [field]: value };
          // Recalculate total if quantity or price changed
          if (field === 'quantity' || field === 'unitPrice') {
            // Ensure valid numbers (not NaN)
            const qty = isNaN(updated.quantity) ? 0 : updated.quantity;
            const price = isNaN(updated.unitPrice) ? 0 : updated.unitPrice;
            updated.quantity = qty;
            updated.unitPrice = price;
            updated.totalPrice = qty * price;
          }
          return updated;
        }
        return item;
      }),
    });
  };

  // Add new item in edit mode
  const addItem = () => {
    if (!editedLPO) return;
    setEditedLPO({
      ...editedLPO,
      Items: [...editedLPO.Items, {
        id: generateUUID(),
        description: '',
        quantity: 1,
        unit: 'EA',
        unitPrice: 0,
        totalPrice: 0,
      }],
    });
  };

  // Remove item in edit mode
  const removeItem = (id: string) => {
    if (!editedLPO || editedLPO.Items.length <= 1) return;
    setEditedLPO({
      ...editedLPO,
      Items: editedLPO.Items.filter(item => item.id !== id),
    });
  };

  // Calculate totals for edited LPO
  const calculateTotals = (lpo: ExtractedLPO) => {
    const subtotal = lpo.Items.reduce((sum, item) => sum + item.totalPrice, 0);
    const vatAmount = subtotal * 0.05; // 5% VAT
    const total = subtotal + vatAmount;
    return { subtotal, vatAmount, total };
  };

  // Manual entry handler
  const handleManualEntry = () => {
    if (!isSelectionValid) {
      alert('Please select branch and department before creating LPO manually.');
      return;
    }

    // Create empty LPO with defaults
    const emptyLPO: ExtractedLPO = {
      LPOID: 0,
      LPOUUID: '',
      LPONumber: 'Draft',
      VendorName: '',
      VendorAddress: '',
      VendorContact: '',
      VendorPhone: '',
      QuotationReference: '',
      SubTotal: 0,
      VATAmount: 0,
      TotalAmount: 0,
      ConfidenceScore: 0,
      Items: [{
        id: generateUUID(),
        description: '',
        quantity: 1,
        unit: 'EA',
        unitPrice: 0,
        totalPrice: 0,
      }],
    };

    setCreatedLPO(emptyLPO);
    setEditedLPO({ ...emptyLPO });
    setIsManualEntry(true);
    setIsEditing(true); // Start in edit mode
    setShowSuccessModal(true);
  };

  // Navigation handlers
  const handleViewLPO = () => {
    if (createdLPO) {
      navigate(`/lpo/${createdLPO.LPOUUID}`);
    }
  };

  const handleGoToDashboard = () => {
    navigate('/lpo');
  };

  const handleCloseAndContinue = () => {
    setShowSuccessModal(false);
    setCreatedLPO(null);
    setEditedLPO(null);
    setIsEditing(false);
    setIsManualEntry(false);
    // Keep the branch/department selection for next upload
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/lpo')}
            className="mb-4 text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to LPO List
          </Button>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-100 rounded-xl">
                <Sparkles className="w-8 h-8 text-indigo-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">Create Local Purchase Order</h1>
                <p className="text-slate-500">Upload quotation for AI extraction or enter details manually</p>
              </div>
            </div>
          </div>
        </div>

        {/* Step 1: Branch/Department Selection - MANDATORY */}
        <Card className="mb-6 bg-white/80 backdrop-blur border-0 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 font-bold text-sm">
                1
              </div>
              <div>
                <CardTitle className="text-lg">Select Location</CardTitle>
                <CardDescription>Choose the requesting branch and department before uploading</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Branch Selection */}
              <div>
                <Label className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-slate-500" />
                  Branch <span className="text-red-500">*</span>
                </Label>
                <Select value={branchId} onValueChange={setBranchId}>
                  <SelectTrigger className={`mt-1.5 bg-white ${!branchId ? 'border-amber-300' : ''}`}>
                    <SelectValue placeholder="Select branch..." />
                  </SelectTrigger>
                  <SelectContent>
                    {BRANCHES.map(branch => (
                      <SelectItem key={branch.BranchID} value={branch.BranchID.toString()}>
                        <div className="flex items-center gap-2">
                          <span>{branch.BranchName}</span>
                          {branch.BranchType === 'HEAD_OFFICE' && (
                            <Badge variant="secondary" className="text-xs">HQ</Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!branchId && (
                  <p className="text-xs text-amber-600 mt-1">Please select a branch to continue</p>
                )}
              </div>

              {/* Department Selection - Only for Head Office */}
              <div>
                <Label className={`flex items-center gap-2 ${!isHeadOffice ? 'text-slate-400' : ''}`}>
                  <Users className="w-4 h-4" />
                  Department {isHeadOffice && <span className="text-red-500">*</span>}
                </Label>
                <Select 
                  value={departmentId} 
                  onValueChange={setDepartmentId}
                  disabled={!isHeadOffice}
                >
                  <SelectTrigger 
                    className={`mt-1.5 bg-white ${
                      !isHeadOffice ? 'bg-slate-50 text-slate-400' : 
                      (isHeadOffice && !departmentId) ? 'border-amber-300' : ''
                    }`}
                  >
                    <SelectValue placeholder={isHeadOffice ? "Select department..." : "N/A for branches"} />
                  </SelectTrigger>
                  <SelectContent>
                    {DEPARTMENTS.map(dept => (
                      <SelectItem key={dept.DepartmentID} value={dept.DepartmentID.toString()}>
                        {dept.DepartmentName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!isHeadOffice && branchId && (
                  <p className="text-xs text-slate-500 mt-1">Branches don't have departments</p>
                )}
                {isHeadOffice && !departmentId && (
                  <p className="text-xs text-amber-600 mt-1">Please select a department to continue</p>
                )}
              </div>
            </div>

            {/* Selection Summary */}
            {isSelectionValid && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 text-green-700">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="font-medium">
                    {selectedBranch?.BranchName}
                    {isHeadOffice && departmentId && (
                      <> — {DEPARTMENTS.find(d => d.DepartmentID.toString() === departmentId)?.DepartmentName}</>
                    )}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Step 2: Upload Area */}
        <Card className={`bg-white/80 backdrop-blur border-0 shadow-sm ${!isSelectionValid ? 'opacity-60' : ''}`}>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${
                isSelectionValid ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400'
              }`}>
                2
              </div>
              <div>
                <CardTitle className="text-lg">Upload Quotation</CardTitle>
                <CardDescription>
                  {isSelectionValid 
                    ? 'Drag and drop a PDF or image of a vendor quotation'
                    : 'Complete step 1 to enable upload'}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Validation Warning */}
            {!isSelectionValid && (
              <Alert className="mb-4 border-amber-200 bg-amber-50">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-700">
                  Please select a branch{isHeadOffice ? ' and department' : ''} before uploading a quotation.
                </AlertDescription>
              </Alert>
            )}

            {/* Upload Error */}
            {uploadError && (
              <Alert className="mb-4 border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-700">{uploadError}</AlertDescription>
              </Alert>
            )}

            {/* Dropzone */}
            <div
              {...getRootProps()}
              className={`
                border-2 border-dashed rounded-xl p-12 text-center
                transition-all duration-200
                ${!canUpload 
                  ? 'border-slate-200 bg-slate-50 cursor-not-allowed' 
                  : isDragActive 
                    ? 'border-indigo-500 bg-indigo-50 cursor-pointer' 
                    : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50 cursor-pointer'
                }
                ${uploading ? 'pointer-events-none' : ''}
              `}
            >
              <input {...getInputProps()} />
              
              {uploading ? (
                <div className="flex flex-col items-center gap-4">
                  <div className="p-4 bg-indigo-100 rounded-full animate-pulse">
                    <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
                  </div>
                  <div>
                    <p className="text-lg font-medium text-slate-700">Processing quotation...</p>
                    <p className="text-sm text-slate-500 mt-1">AI is extracting vendor and item details</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4">
                  <div className={`p-4 rounded-full ${canUpload ? 'bg-slate-100' : 'bg-slate-200'}`}>
                    <Upload className={`w-12 h-12 ${canUpload ? 'text-slate-400' : 'text-slate-300'}`} />
                  </div>
                  <div>
                    <p className={`text-lg font-medium ${canUpload ? 'text-slate-700' : 'text-slate-400'}`}>
                      {!canUpload 
                        ? 'Select location first to enable upload'
                        : isDragActive 
                          ? 'Drop the file here' 
                          : 'Drag & drop a quotation file'}
                    </p>
                    <p className="text-sm text-slate-500 mt-1">
                      Supports PDF, PNG, JPG (max 10MB)
                    </p>
                  </div>
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="mt-2"
                    disabled={!canUpload}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Browse Files
                  </Button>
                </div>
              )}
            </div>

            {/* Manual Entry Option */}
            {isSelectionValid && (
              <div className="mt-6 pt-6 border-t border-slate-200">
                <div className="text-center">
                  <p className="text-sm text-slate-600 mb-3">Don't have a quotation file?</p>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleManualEntry}
                    className="gap-2"
                  >
                    <Edit3 className="w-4 h-4" />
                    Skip Upload / Enter Manually
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Success Modal with Edit Capability */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${isManualEntry ? 'bg-blue-100' : 'bg-green-100'}`}>
                {isManualEntry ? (
                  <Edit3 className="w-6 h-6 text-blue-600" />
                ) : (
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                )}
              </div>
              <div>
                <DialogTitle className="text-xl">
                  {isManualEntry ? 'Create LPO Manually' : 'LPO Created Successfully'}
                </DialogTitle>
                <DialogDescription>
                  {isManualEntry
                    ? 'Enter vendor and item details below, then click "Create LPO" to save.'
                    : `${createdLPO?.LPONumber} has been created in DRAFT status. Review and edit if needed.`
                  }
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {createdLPO && (
            <div className="space-y-4 mt-4">
              {/* Confidence Score - Only show for AI extraction */}
              {!isManualEntry && (
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-500" />
                    <span className="text-sm font-medium">AI Confidence Score</span>
                  </div>
                  <Badge
                    variant={createdLPO.ConfidenceScore >= 80 ? "default" : createdLPO.ConfidenceScore >= 50 ? "secondary" : "destructive"}
                    className={createdLPO.ConfidenceScore >= 80 ? "bg-green-500" : ""}
                  >
                    {createdLPO.ConfidenceScore}%
                  </Badge>
                </div>
              )}

              {/* Edit Toggle - Hide for manual entry (already in edit mode) */}
              {!isManualEntry && (
                <div className="flex justify-end">
                  <Button
                    variant={isEditing ? "default" : "outline"}
                    size="sm"
                    onClick={() => setIsEditing(!isEditing)}
                  >
                    <Edit3 className="w-4 h-4 mr-2" />
                    {isEditing ? 'Editing Mode' : 'Edit Details'}
                  </Button>
                </div>
              )}

              {/* Vendor Details */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Vendor Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-slate-500">Vendor Name</Label>
                      {isEditing ? (
                        <Input 
                          value={editedLPO?.VendorName || ''}
                          onChange={(e) => setEditedLPO(prev => prev ? {...prev, VendorName: e.target.value} : null)}
                          className="mt-1"
                        />
                      ) : (
                        <p className="font-medium">{createdLPO.VendorName}</p>
                      )}
                    </div>
                    <div>
                      <Label className="text-slate-500">Quotation Reference</Label>
                      {isEditing ? (
                        <Input 
                          value={editedLPO?.QuotationReference || ''}
                          onChange={(e) => setEditedLPO(prev => prev ? {...prev, QuotationReference: e.target.value} : null)}
                          className="mt-1"
                        />
                      ) : (
                        <p className="font-medium">{createdLPO.QuotationReference || '-'}</p>
                      )}
                    </div>
                    <div>
                      <Label className="text-slate-500">Contact Person</Label>
                      {isEditing ? (
                        <Input 
                          value={editedLPO?.VendorContact || ''}
                          onChange={(e) => setEditedLPO(prev => prev ? {...prev, VendorContact: e.target.value} : null)}
                          className="mt-1"
                        />
                      ) : (
                        <p className="font-medium">{createdLPO.VendorContact || '-'}</p>
                      )}
                    </div>
                    <div>
                      <Label className="text-slate-500">Phone</Label>
                      {isEditing ? (
                        <Input 
                          value={editedLPO?.VendorPhone || ''}
                          onChange={(e) => setEditedLPO(prev => prev ? {...prev, VendorPhone: e.target.value} : null)}
                          className="mt-1"
                        />
                      ) : (
                        <p className="font-medium">{createdLPO.VendorPhone || '-'}</p>
                      )}
                    </div>
                    <div className="col-span-2">
                      <Label className="text-slate-500">Address</Label>
                      {isEditing ? (
                        <Textarea 
                          value={editedLPO?.VendorAddress || ''}
                          onChange={(e) => setEditedLPO(prev => prev ? {...prev, VendorAddress: e.target.value} : null)}
                          className="mt-1"
                          rows={2}
                        />
                      ) : (
                        <p className="font-medium">{createdLPO.VendorAddress || '-'}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Line Items */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-base">Line Items</CardTitle>
                    {isEditing && (
                      <Button size="sm" variant="outline" onClick={addItem}>
                        <Plus className="w-4 h-4 mr-1" /> Add Item
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">#</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="w-20">Qty</TableHead>
                        <TableHead className="w-24">Unit</TableHead>
                        <TableHead className="w-28 text-right">Price</TableHead>
                        <TableHead className="w-28 text-right">Total</TableHead>
                        {isEditing && <TableHead className="w-12"></TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(isEditing ? editedLPO?.Items : createdLPO.Items)?.map((item, index) => (
                        <TableRow key={item.id}>
                          <TableCell className="text-slate-500">{index + 1}</TableCell>
                          <TableCell>
                            {isEditing ? (
                              <Input 
                                value={item.description}
                                onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                                className="min-w-[200px]"
                              />
                            ) : (
                              item.description
                            )}
                          </TableCell>
                          <TableCell>
                            {isEditing ? (
                              <Input 
                                type="number"
                                value={item.quantity}
                                onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                                min={0}
                                className="w-20"
                              />
                            ) : (
                              item.quantity
                            )}
                          </TableCell>
                          <TableCell>
                            {isEditing ? (
                              <Select 
                                value={item.unit} 
                                onValueChange={(v) => updateItem(item.id, 'unit', v)}
                              >
                                <SelectTrigger className="w-20">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {UNITS.map(unit => (
                                    <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : (
                              item.unit
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {isEditing ? (
                              <Input 
                                type="number"
                                value={item.unitPrice}
                                onChange={(e) => updateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                                min={0}
                                step={0.001}
                                className="w-28 text-right"
                              />
                            ) : (
                              item.unitPrice.toFixed(3)
                            )}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {item.totalPrice.toFixed(3)}
                          </TableCell>
                          {isEditing && (
                            <TableCell>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => removeItem(item.id)}
                                disabled={(editedLPO?.Items.length || 0) <= 1}
                                className="text-red-500 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {/* Totals */}
                  <div className="mt-4 pt-4 border-t">
                    {(() => {
                      const lpo = isEditing ? editedLPO : createdLPO;
                      const totals = lpo ? calculateTotals(lpo) : { subtotal: 0, vatAmount: 0, total: 0 };
                      return (
                        <div className="flex justify-end">
                          <div className="w-64 space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-slate-500">Subtotal</span>
                              <span className="font-medium">{totals.subtotal.toFixed(3)} OMR</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-slate-500">VAT (5%)</span>
                              <span className="font-medium">{totals.vatAmount.toFixed(3)} OMR</span>
                            </div>
                            <div className="flex justify-between pt-2 border-t">
                              <span className="font-semibold">Total</span>
                              <span className="font-bold text-lg text-indigo-600">{totals.total.toFixed(3)} OMR</span>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            {isEditing ? (
              <>
                <Button variant="outline" onClick={() => {
                  setEditedLPO({ ...createdLPO! });
                  setIsEditing(false);
                }}>
                  Cancel
                </Button>
                <Button onClick={handleSaveEdits} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {isManualEntry ? 'Creating...' : 'Saving...'}
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      {isManualEntry ? 'Create LPO' : 'Save Changes'}
                    </>
                  )}
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={handleCloseAndContinue}>
                  Upload Another
                </Button>
                <Button variant="outline" onClick={handleGoToDashboard}>
                  <Home className="w-4 h-4 mr-2" />
                  Go to Dashboard
                </Button>
                <Button onClick={handleViewLPO}>
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View LPO Details
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
