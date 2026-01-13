import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@/contexts/UserContext';
import { createLPO, getBranches, getDepartments, getCategories, getVendors, uploadQuotation } from '@/lib/api-lpo';
import type { Branch, Department, Category, Vendor } from '@/lib/api-lpo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Plus, Trash2, Upload, FileText, Loader2, Sparkles, Building2, Package, AlertCircle, CheckCircle2, Users } from 'lucide-react';
import { useDropzone } from 'react-dropzone';

interface LPOItem {
  id: string;
  itemDescription: string;
  categoryId: number | null;
  quantity: number;
  unitOfMeasure: string;
  unitPrice: number;
  notes: string;
}

const UNITS = ['EA', 'SET', 'BOX', 'PKT', 'KG', 'LTR', 'MTR', 'HR', 'DAY', 'MONTH', 'YEAR'];

export default function LPOCreate() {
  const navigate = useNavigate();
  const { currentUser } = useUser();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [extractedData, setExtractedData] = useState<any>(null);

  // Lookup data
  const [branches, setBranches] = useState<Branch[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [vendorSearch, setVendorSearch] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    branchId: '',
    departmentId: '',
    vendorId: '',
    vendorName: '',
    vendorAddress: '',
    vendorContact: '',
    vendorPhone: '',
    quotationReference: '',
    currencyCode: 'OMR',
    vatPercent: 5,
    discountPercent: 0,
    expectedDeliveryDate: '',
    deliveryAddress: '',
    paymentTerms: '30 Days',
    notes: '',
  });

  const [items, setItems] = useState<LPOItem[]>([
    { id: Math.random().toString(36).substring(2, 15), itemDescription: '', categoryId: null, quantity: 1, unitOfMeasure: 'EA', unitPrice: 0, notes: '' }
  ]);

  // Derived state for validation
  const selectedBranch = branches.find(b => b.BranchID.toString() === formData.branchId);
  // Use BranchCode check as it's more reliable across API responses
  const isHeadOffice = selectedBranch?.BranchCode === 'HQ' || selectedBranch?.BranchType === 'HEAD_OFFICE';
  const needsDepartment = isHeadOffice && departments.length > 0;
  
  // Validation: Branch is always required, Department required only for Head Office
  const isLocationValid = formData.branchId !== '' && (!needsDepartment || formData.departmentId !== '');
  const canUpload = isLocationValid && !uploading;

  // Load lookup data
  useEffect(() => {
    async function loadLookups() {
      try {
        const [branchData, categoryData, vendorData] = await Promise.all([
          getBranches(),
          getCategories(),
          getVendors(),
        ]);
        setBranches(Array.isArray(branchData) ? branchData : []);
        setCategories(Array.isArray(categoryData) ? categoryData : []);
        setVendors(Array.isArray(vendorData) ? vendorData : []);
      } catch (error) {
        console.error('Error loading lookups:', error);
      }
    }
    loadLookups();
  }, []);

  // Load departments when branch changes
  useEffect(() => {
    async function loadDepartments() {
      if (formData.branchId) {
        try {
          const deptData = await getDepartments(parseInt(formData.branchId));
          setDepartments(Array.isArray(deptData) ? deptData : []);
        } catch (error) {
          console.error('Error loading departments:', error);
          setDepartments([]);
        }
      } else {
        setDepartments([]);
      }
    }
    loadDepartments();
  }, [formData.branchId]);

  // Quotation upload with AI extraction
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    if (!canUpload) return; // Prevent upload if validation fails
    
    const file = acceptedFiles[0];
    setUploading(true);
    
    try {
      const result = await uploadQuotation(
        file, 
        parseInt(formData.branchId),
        formData.departmentId ? parseInt(formData.departmentId) : undefined,
        currentUser?.UserID || 1
      );
      
      if (result.success && result.extractedData) {
        setExtractedData(result.extractedData);
        
        // Pre-fill form with extracted data
        const data = result.extractedData;
        setFormData(prev => ({
          ...prev,
          vendorName: data.vendor?.name || prev.vendorName,
          vendorAddress: data.vendor?.address || prev.vendorAddress,
          vendorContact: data.vendor?.contact_person || prev.vendorContact,
          vendorPhone: data.vendor?.phone || prev.vendorPhone,
          quotationReference: data.quotation_number || prev.quotationReference,
          currencyCode: data.currency || prev.currencyCode,
          vatPercent: data.vat_percent || prev.vatPercent,
          paymentTerms: data.payment_terms || prev.paymentTerms,
        }));
        
        // Pre-fill items
        if (data.items && data.items.length > 0) {
          setItems(data.items.map((item: any, index: number) => ({
            id: Math.random().toString(36).substring(2, 15),
            itemDescription: item.description || '',
            categoryId: null,
            quantity: item.quantity || 1,
            unitOfMeasure: item.unit || 'EA',
            unitPrice: item.unit_price || 0,
            notes: item.specifications || '',
          })));
        }
        
        alert(`Quotation extracted successfully! Confidence: ${data.confidence_score || 0}%`);
      }
    } catch (error) {
      console.error('Error uploading quotation:', error);
      alert('Failed to extract quotation. Please enter details manually.');
    } finally {
      setUploading(false);
    }
  }, [formData.branchId, formData.departmentId, canUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg'],
    },
    maxFiles: 1,
    disabled: !canUpload, // Disable dropzone when validation fails
  });

  // Item management
  const addItem = () => {
    setItems([...items, { id: Math.random().toString(36).substring(2, 15), itemDescription: '', categoryId: null, quantity: 1, unitOfMeasure: 'EA', unitPrice: 0, notes: '' }]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const updateItem = (id: string, field: keyof LPOItem, value: any) => {
    setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  // Calculations
  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  const vatAmount = subtotal * (formData.vatPercent / 100);
  const discountAmount = subtotal * (formData.discountPercent / 100);
  const total = subtotal + vatAmount - discountAmount;

  // Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.branchId) {
      alert('Please select a branch');
      return;
    }
    if (needsDepartment && !formData.departmentId) {
      alert('Please select a department for Head Office');
      return;
    }
    if (!formData.vendorName.trim()) {
      alert('Please enter vendor name');
      return;
    }
    if (items.some(item => !item.itemDescription.trim())) {
      alert('Please fill in all item descriptions');
      return;
    }

    setLoading(true);
    try {
      const result = await createLPO({
        branchId: parseInt(formData.branchId),
        departmentId: formData.departmentId ? parseInt(formData.departmentId) : undefined,
        vendorId: formData.vendorId ? parseInt(formData.vendorId) : undefined,
        vendorName: formData.vendorName,
        vendorAddress: formData.vendorAddress,
        vendorContact: formData.vendorContact,
        vendorPhone: formData.vendorPhone,
        quotationReference: formData.quotationReference,
        currencyCode: formData.currencyCode,
        vatPercent: formData.vatPercent,
        discountPercent: formData.discountPercent,
        expectedDeliveryDate: formData.expectedDeliveryDate || undefined,
        deliveryAddress: formData.deliveryAddress,
        paymentTerms: formData.paymentTerms,
        notes: formData.notes,
        items: items.map((item, index) => ({
          lineNumber: index + 1,
          description: item.itemDescription,
          categoryId: item.categoryId || undefined,
          quantity: item.quantity,
          unitOfMeasure: item.unitOfMeasure || 'EA',
          unitPrice: item.unitPrice,
          totalPrice: item.quantity * item.unitPrice,
          notes: item.notes || undefined,
        })),
        userId: currentUser?.UserID || 1,
      });

      if (result.success) {
        navigate(`/lpo/${result.LPOUUID}`);
      } else {
        console.error('LPO creation failed:', result);
        alert(`Failed to create LPO: ${result.error || result.message || 'Unknown error'}`);
      }
    } catch (error: any) {
      console.error('Error creating LPO:', error);
      alert(`Error creating LPO: ${error.message || 'Network error'}`);
    } finally {
      setLoading(false);
    }
  };

  // Vendor selection
  const handleVendorSelect = (vendorId: string) => {
    const vendor = vendors.find(v => v.VendorID.toString() === vendorId);
    if (vendor) {
      setFormData(prev => ({
        ...prev,
        vendorId,
        vendorName: vendor.VendorName,
        vendorAddress: vendor.Address || '',
        vendorContact: vendor.ContactPerson || '',
        vendorPhone: vendor.Phone || '',
      }));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      {/* Header */}
      <div className="mb-8">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/lpo')}
          className="mb-4 text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to LPOs
        </Button>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Create Local Purchase Order</h1>
        <p className="text-slate-500 mt-1">Fill in the details or upload a quotation for AI extraction</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* STEP 1: Branch & Department - MANDATORY FIRST */}
            <Card className="bg-white/80 backdrop-blur border-0 shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 font-bold text-sm">
                    1
                  </div>
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-slate-600" />
                      Requesting Location
                    </CardTitle>
                    <CardDescription>Select branch and department before uploading quotation</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="flex items-center gap-1">
                    <Building2 className="w-4 h-4 text-slate-500" />
                    Branch <span className="text-red-500">*</span>
                  </Label>
                  <Select 
                    value={formData.branchId} 
                    onValueChange={(v) => setFormData(prev => ({ ...prev, branchId: v, departmentId: '' }))}
                  >
                    <SelectTrigger className={`mt-1.5 bg-white ${!formData.branchId ? 'border-amber-300' : ''}`}>
                      <SelectValue placeholder="Select branch" />
                    </SelectTrigger>
                    <SelectContent>
                      {branches.map(branch => (
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
                  {!formData.branchId && (
                    <p className="text-xs text-amber-600 mt-1">Please select a branch to continue</p>
                  )}
                </div>
                <div>
                  <Label className={`flex items-center gap-1 ${!needsDepartment ? 'text-slate-400' : ''}`}>
                    <Users className="w-4 h-4" />
                    Department {needsDepartment && <span className="text-red-500">*</span>}
                  </Label>
                  <Select 
                    value={formData.departmentId} 
                    onValueChange={(v) => setFormData(prev => ({ ...prev, departmentId: v }))}
                    disabled={!formData.branchId || departments.length === 0}
                  >
                    <SelectTrigger 
                      className={`mt-1.5 bg-white ${
                        !formData.branchId || departments.length === 0 
                          ? 'bg-slate-50 text-slate-400' 
                          : (needsDepartment && !formData.departmentId) 
                            ? 'border-amber-300' 
                            : ''
                      }`}
                    >
                      <SelectValue placeholder={departments.length === 0 ? "N/A for branches" : "Select department"} />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map(dept => (
                        <SelectItem key={dept.DepartmentID} value={dept.DepartmentID.toString()}>
                          {dept.DepartmentName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formData.branchId && departments.length === 0 && (
                    <p className="text-xs text-slate-500 mt-1">Branches don't have departments</p>
                  )}
                  {needsDepartment && !formData.departmentId && (
                    <p className="text-xs text-amber-600 mt-1">Please select a department to continue</p>
                  )}
                </div>

                {/* Selection Summary */}
                {isLocationValid && (
                  <div className="col-span-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2 text-green-700">
                      <CheckCircle2 className="w-4 h-4" />
                      <span className="font-medium">
                        {selectedBranch?.BranchName}
                        {formData.departmentId && departments.length > 0 && (
                          <> — {departments.find(d => d.DepartmentID.toString() === formData.departmentId)?.DepartmentName}</>
                        )}
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* STEP 2: Quotation Upload - Requires Step 1 */}
            <Card className={`bg-white/80 backdrop-blur border-0 shadow-sm overflow-hidden ${!isLocationValid ? 'opacity-60' : ''}`}>
              <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white">
                <div className="flex items-center gap-2">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${
                    isLocationValid ? 'bg-white/20 text-white' : 'bg-white/10 text-white/50'
                  }`}>
                    2
                  </div>
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5" />
                      AI Quotation Extraction
                    </CardTitle>
                    <CardDescription className="text-indigo-100">
                      {isLocationValid 
                        ? 'Upload a quotation PDF or image for automatic data extraction'
                        : 'Complete step 1 to enable quotation upload'}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {/* Validation Warning */}
                {!isLocationValid && (
                  <Alert className="mb-4 border-amber-200 bg-amber-50">
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                    <AlertDescription className="text-amber-700">
                      Please select a branch{needsDepartment ? ' and department' : ''} before uploading a quotation.
                    </AlertDescription>
                  </Alert>
                )}

                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
                    !canUpload
                      ? 'border-slate-200 bg-slate-50 cursor-not-allowed'
                      : isDragActive 
                        ? 'border-indigo-500 bg-indigo-50 cursor-pointer' 
                        : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50 cursor-pointer'
                  }`}
                >
                  <input {...getInputProps()} />
                  {uploading ? (
                    <div className="flex flex-col items-center">
                      <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mb-4" />
                      <p className="text-lg font-medium text-slate-700">Extracting data with AI...</p>
                      <p className="text-sm text-slate-500">This may take a few seconds</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <Upload className={`w-12 h-12 mb-4 ${canUpload ? 'text-slate-400' : 'text-slate-300'}`} />
                      <p className={`text-lg font-medium ${canUpload ? 'text-slate-700' : 'text-slate-400'}`}>
                        {!canUpload 
                          ? 'Select location first to enable upload'
                          : isDragActive 
                            ? 'Drop the file here' 
                            : 'Drag & drop a quotation'}
                      </p>
                      <p className="text-sm text-slate-500 mt-1">or click to browse (PDF, PNG, JPG)</p>
                    </div>
                  )}
                </div>
                {extractedData && (
                  <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-sm text-green-700">
                      ✓ Extracted {extractedData.items?.length || 0} items from quotation 
                      (Confidence: {extractedData.confidence_score || 0}%)
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Vendor */}
            <Card className="bg-white/80 backdrop-blur border-0 shadow-sm">
              <CardHeader>
                <CardTitle>Vendor Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Select Existing Vendor</Label>
                    <Select value={formData.vendorId} onValueChange={handleVendorSelect}>
                      <SelectTrigger className="mt-1.5 bg-white">
                        <SelectValue placeholder="Search or select vendor" />
                      </SelectTrigger>
                      <SelectContent>
                        {vendors.map(vendor => (
                          <SelectItem key={vendor.VendorID} value={vendor.VendorID.toString()}>
                            {vendor.VendorName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Vendor Name *</Label>
                    <Input 
                      value={formData.vendorName}
                      onChange={(e) => setFormData(prev => ({ ...prev, vendorName: e.target.value }))}
                      placeholder="Enter vendor name"
                      className="mt-1.5 bg-white"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Contact Person</Label>
                    <Input 
                      value={formData.vendorContact}
                      onChange={(e) => setFormData(prev => ({ ...prev, vendorContact: e.target.value }))}
                      placeholder="Contact name"
                      className="mt-1.5 bg-white"
                    />
                  </div>
                  <div>
                    <Label>Phone</Label>
                    <Input 
                      value={formData.vendorPhone}
                      onChange={(e) => setFormData(prev => ({ ...prev, vendorPhone: e.target.value }))}
                      placeholder="Phone number"
                      className="mt-1.5 bg-white"
                    />
                  </div>
                </div>
                <div>
                  <Label>Address</Label>
                  <Textarea 
                    value={formData.vendorAddress}
                    onChange={(e) => setFormData(prev => ({ ...prev, vendorAddress: e.target.value }))}
                    placeholder="Vendor address"
                    className="mt-1.5 bg-white"
                    rows={2}
                  />
                </div>
                <div>
                  <Label>Quotation Reference</Label>
                  <Input 
                    value={formData.quotationReference}
                    onChange={(e) => setFormData(prev => ({ ...prev, quotationReference: e.target.value }))}
                    placeholder="e.g., QTN-2025-001"
                    className="mt-1.5 bg-white"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Line Items */}
            <Card className="bg-white/80 backdrop-blur border-0 shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Package className="w-5 h-5 text-slate-600" />
                    Line Items
                  </CardTitle>
                  <Button type="button" variant="outline" size="sm" onClick={addItem}>
                    <Plus className="w-4 h-4 mr-1" />
                    Add Item
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50">
                      <TableHead className="w-[40%]">Description *</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead className="w-[80px]">Qty</TableHead>
                      <TableHead className="w-[80px]">Unit</TableHead>
                      <TableHead className="w-[100px]">Price</TableHead>
                      <TableHead className="w-[100px] text-right">Total</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item, index) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <Input 
                            value={item.itemDescription}
                            onChange={(e) => updateItem(item.id, 'itemDescription', e.target.value)}
                            placeholder="Item description"
                            className="bg-white"
                          />
                        </TableCell>
                        <TableCell>
                          <Select 
                            value={item.categoryId?.toString() || ''} 
                            onValueChange={(v) => updateItem(item.id, 'categoryId', v ? parseInt(v) : null)}
                          >
                            <SelectTrigger className="bg-white">
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                              {categories.map(cat => (
                                <SelectItem key={cat.CategoryID} value={cat.CategoryID.toString()}>
                                  {cat.CategoryName}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Input 
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                            min={0}
                            step={1}
                            className="bg-white"
                          />
                        </TableCell>
                        <TableCell>
                          <Select value={item.unitOfMeasure} onValueChange={(v) => updateItem(item.id, 'unitOfMeasure', v)}>
                            <SelectTrigger className="bg-white">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {UNITS.map(unit => (
                                <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Input 
                            type="number"
                            value={item.unitPrice}
                            onChange={(e) => updateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                            min={0}
                            step={0.001}
                            className="bg-white"
                          />
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {(item.quantity * item.unitPrice).toFixed(3)}
                        </TableCell>
                        <TableCell>
                          <Button 
                            type="button"
                            variant="ghost" 
                            size="icon"
                            onClick={() => removeItem(item.id)}
                            disabled={items.length === 1}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Notes */}
            <Card className="bg-white/80 backdrop-blur border-0 shadow-sm">
              <CardHeader>
                <CardTitle>Additional Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Expected Delivery Date</Label>
                    <Input 
                      type="date"
                      value={formData.expectedDeliveryDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, expectedDeliveryDate: e.target.value }))}
                      className="mt-1.5 bg-white"
                    />
                  </div>
                  <div>
                    <Label>Payment Terms</Label>
                    <Select value={formData.paymentTerms} onValueChange={(v) => setFormData(prev => ({ ...prev, paymentTerms: v }))}>
                      <SelectTrigger className="mt-1.5 bg-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Immediate">Immediate</SelectItem>
                        <SelectItem value="7 Days">7 Days</SelectItem>
                        <SelectItem value="15 Days">15 Days</SelectItem>
                        <SelectItem value="30 Days">30 Days</SelectItem>
                        <SelectItem value="45 Days">45 Days</SelectItem>
                        <SelectItem value="60 Days">60 Days</SelectItem>
                        <SelectItem value="100% Advance">100% Advance</SelectItem>
                        <SelectItem value="50% Advance">50% Advance</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Delivery Address</Label>
                  <Textarea 
                    value={formData.deliveryAddress}
                    onChange={(e) => setFormData(prev => ({ ...prev, deliveryAddress: e.target.value }))}
                    placeholder="Delivery address"
                    className="mt-1.5 bg-white"
                    rows={2}
                  />
                </div>
                <div>
                  <Label>Notes</Label>
                  <Textarea 
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Additional notes..."
                    className="mt-1.5 bg-white"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Summary */}
          <div className="space-y-6">
            <Card className="bg-white/80 backdrop-blur border-0 shadow-sm sticky top-6">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Items</span>
                    <span className="font-medium">{items.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Total Quantity</span>
                    <span className="font-medium">{items.reduce((sum, i) => sum + i.quantity, 0)}</span>
                  </div>
                </div>

                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Subtotal</span>
                    <span className="font-medium">{subtotal.toFixed(3)} {formData.currencyCode}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-slate-600 text-sm">VAT</span>
                    <Input 
                      type="number"
                      value={formData.vatPercent}
                      onChange={(e) => setFormData(prev => ({ ...prev, vatPercent: parseFloat(e.target.value) || 0 }))}
                      className="w-16 h-7 text-sm bg-white"
                      min={0}
                      max={100}
                    />
                    <span className="text-slate-400 text-sm">%</span>
                    <span className="ml-auto font-medium text-sm">{vatAmount.toFixed(3)}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-slate-600 text-sm">Discount</span>
                    <Input 
                      type="number"
                      value={formData.discountPercent}
                      onChange={(e) => setFormData(prev => ({ ...prev, discountPercent: parseFloat(e.target.value) || 0 }))}
                      className="w-16 h-7 text-sm bg-white"
                      min={0}
                      max={100}
                    />
                    <span className="text-slate-400 text-sm">%</span>
                    <span className="ml-auto font-medium text-sm text-red-500">-{discountAmount.toFixed(3)}</span>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold">Total</span>
                    <span className="text-2xl font-bold text-indigo-600">{total.toFixed(3)} {formData.currencyCode}</span>
                  </div>
                </div>

                <div className="pt-4 space-y-3">
                  <Button 
                    type="submit" 
                    className="w-full bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200"
                    disabled={loading || !isLocationValid}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <FileText className="w-4 h-4 mr-2" />
                        Create LPO
                      </>
                    )}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="w-full"
                    onClick={() => navigate('/lpo')}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
