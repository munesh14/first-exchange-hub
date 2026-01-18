import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@/contexts/UserContext';
import { createChain, type CreateChainParams } from '@/lib/api-chain';
import { getDepartments, getBranches, getVendors, type Department, type Branch, type Vendor } from '@/lib/api-lookup';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import {
  ArrowLeft,
  Building2,
  FileText,
  Info,
  Loader2,
  ClipboardList,
  Truck,
  Receipt,
  CreditCard,
  ArrowRight,
  CheckCircle,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function NewChain() {
  const navigate = useNavigate();
  const { currentUser } = useUser();
  const { toast } = useToast();

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [departmentId, setDepartmentId] = useState<number | null>(null);
  const [branchId, setBranchId] = useState<number>(1); // Default: Head Office
  const [vendorId, setVendorId] = useState<number | null>(null);
  const [vendorSearch, setVendorSearch] = useState('');
  const [estimatedAmount, setEstimatedAmount] = useState('');

  // Lookup data
  const [departments, setDepartments] = useState<Department[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [vendorSuggestions, setVendorSuggestions] = useState<Vendor[]>([]);

  // UI state
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Load lookup data on mount
  useEffect(() => {
    loadLookupData();
  }, []);

  // Vendor search typeahead
  useEffect(() => {
    if (vendorSearch.length >= 2) {
      const filtered = vendors.filter(v =>
        v.VendorName.toLowerCase().includes(vendorSearch.toLowerCase())
      );
      setVendorSuggestions(filtered.slice(0, 10));
    } else {
      setVendorSuggestions([]);
    }
  }, [vendorSearch, vendors]);

  async function loadLookupData() {
    setLoading(true);
    try {
      const [depts, brs, vnds] = await Promise.all([
        getDepartments(),
        getBranches(),
        getVendors(),
      ]);
      setDepartments(depts);
      setBranches(brs);
      setVendors(vnds);

      // Set default department if user has one
      if (currentUser?.DepartmentID) {
        setDepartmentId(currentUser.DepartmentID);
      }
    } catch (error) {
      console.error('Failed to load lookup data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load form data. Please refresh the page.',
        variant: 'destructive',
      });
    }
    setLoading(false);
  }

  function validate(): boolean {
    const newErrors: { [key: string]: string } = {};

    if (!title.trim()) {
      newErrors.title = 'Title is required';
    } else if (title.trim().length < 3) {
      newErrors.title = 'Title must be at least 3 characters';
    }

    if (!departmentId) {
      newErrors.department = 'Department is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!validate()) {
      toast({
        title: 'Validation Error',
        description: 'Please fix the errors in the form.',
        variant: 'destructive',
      });
      return;
    }

    if (!currentUser?.UserID) {
      toast({
        title: 'Error',
        description: 'User session not found. Please refresh the page.',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);

    try {
      const params: CreateChainParams = {
        title: title.trim(),
        description: description.trim() || undefined,
        departmentId: departmentId!,
        branchId: branchId,
        vendorId: vendorId || undefined,
        hasQuotation: true,
        hasLPO: true,
        hasDeliveryOrder: true,
        hasProforma: true,
        hasInvoice: true,
        estimatedAmount: estimatedAmount ? parseFloat(estimatedAmount) : undefined,
        createdBy: currentUser.UserID,
      };

      const response = await createChain(params);

      if (response.success) {
        toast({
          title: 'Success!',
          description: `Chain ${response.data.chainNumber} created successfully. Add your first document.`,
        });
        navigate(`/chains/${response.data.chainUuid}`);
      }
    } catch (error) {
      console.error('Failed to create chain:', error);
      toast({
        title: 'Error',
        description: 'Failed to create procurement chain. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/chains')}
            className="mb-4 gap-2 hover:bg-white/80"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Chains
          </Button>

          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              CREATE NEW PROCUREMENT CHAIN
            </h1>
            <p className="text-slate-600">Start a new procurement workflow</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Basic Information */}
          <Card className="mb-6 border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-white">
              <CardTitle className="flex items-center gap-2 text-slate-900">
                <div className="h-1 w-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
                BASIC INFORMATION
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              {/* Title */}
              <div>
                <Label htmlFor="title" className="text-slate-700">
                  Title <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., IT Equipment Purchase"
                  className={`mt-1 ${errors.title ? 'border-red-500 focus:ring-red-400' : 'focus:ring-2 focus:ring-blue-400'}`}
                />
                {errors.title && (
                  <p className="text-sm text-red-500 mt-1">{errors.title}</p>
                )}
              </div>

              {/* Description */}
              <div>
                <Label htmlFor="description" className="text-slate-700">
                  Description
                </Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of what's being procured..."
                  rows={3}
                  className="mt-1 focus:ring-2 focus:ring-blue-400"
                />
              </div>

              {/* Department and Branch */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="department" className="text-slate-700">
                    Department <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={departmentId?.toString() || ''}
                    onValueChange={(value) => setDepartmentId(parseInt(value))}
                  >
                    <SelectTrigger
                      id="department"
                      className={`mt-1 ${errors.department ? 'border-red-500' : ''}`}
                    >
                      <SelectValue placeholder="Select department..." />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem key={dept.DepartmentID} value={dept.DepartmentID.toString()}>
                          {dept.DepartmentName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.department && (
                    <p className="text-sm text-red-500 mt-1">{errors.department}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="branch" className="text-slate-700">
                    Branch
                  </Label>
                  <Select
                    value={branchId.toString()}
                    onValueChange={(value) => setBranchId(parseInt(value))}
                  >
                    <SelectTrigger id="branch" className="mt-1">
                      <SelectValue placeholder="Select branch..." />
                    </SelectTrigger>
                    <SelectContent>
                      {branches.map((branch) => (
                        <SelectItem key={branch.BranchID} value={branch.BranchID.toString()}>
                          {branch.BranchName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Vendor */}
              <div>
                <Label htmlFor="vendor" className="text-slate-700">
                  Vendor (optional)
                </Label>
                <Select
                  value={vendorId?.toString() || 'none'}
                  onValueChange={(value) => setVendorId(value === 'none' ? null : parseInt(value))}
                >
                  <SelectTrigger id="vendor" className="mt-1">
                    <SelectValue placeholder="Select vendor..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {vendors.map((vendor) => (
                      <SelectItem key={vendor.VendorID} value={vendor.VendorID.toString()}>
                        {vendor.VendorName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex items-start gap-2 mt-2 text-sm text-slate-500">
                  <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <p>You can add vendor later when uploading quotation</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Workflow Documents */}
          <Card className="mb-6 border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-white">
              <CardTitle className="flex items-center gap-2 text-slate-900">
                <div className="h-1 w-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></div>
                WORKFLOW DOCUMENTS
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center gap-3">
                  <Info className="w-5 h-5 text-blue-600 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-slate-900">Procurement Workflow</h3>
                    <p className="text-sm text-slate-600">
                      All document sections will be available for you to add as your workflow progresses
                    </p>
                  </div>
                </div>

                {/* Workflow Diagram */}
                <div className="bg-gradient-to-br from-slate-50 to-blue-50 p-6 rounded-lg border border-slate-200">
                  <div className="flex items-center justify-between gap-2 overflow-x-auto pb-2">
                    {/* Quotation */}
                    <div className="flex flex-col items-center gap-2 min-w-[100px]">
                      <div className="relative">
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-100 to-blue-50 border-2 border-blue-300 border-dashed flex items-center justify-center">
                          <FileText className="w-6 h-6 text-blue-600" />
                        </div>
                      </div>
                      <div className="text-center">
                        <p className="text-xs font-semibold text-slate-700">Quotation</p>
                        <p className="text-xs text-slate-500 italic">optional</p>
                      </div>
                    </div>

                    {/* Arrow */}
                    <ArrowRight className="w-5 h-5 text-slate-400 flex-shrink-0" />

                    {/* LPO */}
                    <div className="flex flex-col items-center gap-2 min-w-[100px]">
                      <div className="relative">
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-100 to-indigo-50 border-2 border-indigo-300 border-dashed flex items-center justify-center">
                          <ClipboardList className="w-6 h-6 text-indigo-600" />
                        </div>
                      </div>
                      <div className="text-center">
                        <p className="text-xs font-semibold text-slate-700">LPO</p>
                        <p className="text-xs text-slate-500 italic">optional</p>
                      </div>
                    </div>

                    {/* Arrow */}
                    <ArrowRight className="w-5 h-5 text-slate-400 flex-shrink-0" />

                    {/* Delivery Order */}
                    <div className="flex flex-col items-center gap-2 min-w-[100px]">
                      <div className="relative">
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-100 to-purple-50 border-2 border-purple-300 border-dashed flex items-center justify-center">
                          <Truck className="w-6 h-6 text-purple-600" />
                        </div>
                      </div>
                      <div className="text-center">
                        <p className="text-xs font-semibold text-slate-700">Delivery</p>
                        <p className="text-xs text-slate-500 italic">optional</p>
                      </div>
                    </div>

                    {/* Arrow */}
                    <ArrowRight className="w-5 h-5 text-slate-400 flex-shrink-0" />

                    {/* Invoice */}
                    <div className="flex flex-col items-center gap-2 min-w-[100px]">
                      <div className="relative">
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-teal-500 to-teal-600 border-2 border-teal-400 shadow-lg flex items-center justify-center">
                          <Receipt className="w-6 h-6 text-white" />
                        </div>
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center shadow">
                          <CheckCircle className="w-3 h-3 text-white" />
                        </div>
                      </div>
                      <div className="text-center">
                        <p className="text-xs font-bold text-teal-700">Invoice</p>
                        <p className="text-xs text-teal-600 font-semibold">required</p>
                      </div>
                    </div>

                    {/* Arrow */}
                    <ArrowRight className="w-5 h-5 text-slate-400 flex-shrink-0" />

                    {/* Payment */}
                    <div className="flex flex-col items-center gap-2 min-w-[100px]">
                      <div className="relative">
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 border-2 border-emerald-400 shadow-lg flex items-center justify-center">
                          <CreditCard className="w-6 h-6 text-white" />
                        </div>
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center shadow">
                          <CheckCircle className="w-3 h-3 text-white" />
                        </div>
                      </div>
                      <div className="text-center">
                        <p className="text-xs font-bold text-emerald-700">Payment</p>
                        <p className="text-xs text-emerald-600 font-semibold">required</p>
                      </div>
                    </div>
                  </div>

                  {/* Legend */}
                  <div className="mt-6 pt-4 border-t border-slate-300 flex items-center justify-center gap-6 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full border-2 border-blue-300 border-dashed bg-blue-50"></div>
                      <span className="text-slate-600">Optional documents</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-gradient-to-br from-teal-500 to-emerald-500 shadow"></div>
                      <span className="text-slate-600">Required documents</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Estimated Value */}
          <Card className="mb-6 border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-green-50 to-white">
              <CardTitle className="flex items-center gap-2 text-slate-900">
                <div className="h-1 w-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"></div>
                ESTIMATED VALUE
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="amount" className="text-slate-700">
                    Amount (optional)
                  </Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.001"
                    value={estimatedAmount}
                    onChange={(e) => setEstimatedAmount(e.target.value)}
                    placeholder="0.000"
                    className="mt-1 focus:ring-2 focus:ring-blue-400"
                  />
                </div>

                <div>
                  <Label htmlFor="currency" className="text-slate-700">
                    Currency
                  </Label>
                  <Select value="OMR" disabled>
                    <SelectTrigger id="currency" className="mt-1">
                      <SelectValue placeholder="OMR" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="OMR">OMR</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex items-center justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/chains')}
              disabled={submitting}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              disabled={submitting}
              className="gap-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4" />
                  Create Chain & Continue →
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
