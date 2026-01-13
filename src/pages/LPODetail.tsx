import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUser } from '@/contexts/UserContext';
import { getLPO, updateLPO, submitLPO, approveLPO, rejectLPO, sendLPOToVendor, receiveGoods, getBranches, getCategories, downloadLPOPdf } from '@/lib/api-lpo';
import type { LPO, LPOItem, LPOReceipt, Branch, Category } from '@/lib/api-lpo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft, FileText, Clock, CheckCircle, XCircle, Truck, Package,
  Send, ThumbsUp, ThumbsDown, Loader2, Building2, User, Calendar,
  AlertCircle, History, Box, Tag, Pencil, Save, X, Plus, Trash2, Download, RefreshCw
} from 'lucide-react';

const STATUS_CONFIG: Record<string, { color: string; bg: string; icon: React.ReactNode }> = {
  DRAFT: { color: 'text-gray-700', bg: 'bg-gray-100', icon: <FileText className="w-4 h-4" /> },
  PENDING_DEPT_APPROVAL: { color: 'text-yellow-700', bg: 'bg-yellow-100', icon: <Clock className="w-4 h-4" /> },
  PENDING_GM_APPROVAL: { color: 'text-amber-700', bg: 'bg-amber-100', icon: <Clock className="w-4 h-4" /> },
  PENDING_ACC_APPROVAL: { color: 'text-orange-700', bg: 'bg-orange-100', icon: <Clock className="w-4 h-4" /> },
  APPROVED: { color: 'text-green-700', bg: 'bg-green-100', icon: <CheckCircle className="w-4 h-4" /> },
  SENT_TO_VENDOR: { color: 'text-indigo-700', bg: 'bg-indigo-100', icon: <Truck className="w-4 h-4" /> },
  PARTIALLY_RECEIVED: { color: 'text-purple-700', bg: 'bg-purple-100', icon: <Package className="w-4 h-4" /> },
  FULLY_RECEIVED: { color: 'text-green-700', bg: 'bg-green-100', icon: <Package className="w-4 h-4" /> },
  INVOICED: { color: 'text-teal-700', bg: 'bg-teal-100', icon: <FileText className="w-4 h-4" /> },
  CLOSED: { color: 'text-gray-600', bg: 'bg-gray-200', icon: <CheckCircle className="w-4 h-4" /> },
  CANCELLED: { color: 'text-red-700', bg: 'bg-red-100', icon: <XCircle className="w-4 h-4" /> },
  REJECTED_DEPT: { color: 'text-red-700', bg: 'bg-red-100', icon: <XCircle className="w-4 h-4" /> },
  REJECTED_GM: { color: 'text-red-700', bg: 'bg-red-100', icon: <XCircle className="w-4 h-4" /> },
  REJECTED_ACC: { color: 'text-red-700', bg: 'bg-red-100', icon: <XCircle className="w-4 h-4" /> },
};

const CONDITIONS = ['NEW', 'GOOD', 'DAMAGED', 'DEFECTIVE'];
const UNITS = ['EA', 'SET', 'BOX', 'PKT', 'KG', 'LTR', 'MTR', 'HR', 'DAY', 'MONTH', 'YEAR'];

interface EditItem {
  LPOItemID: number | null; // null for new items
  LineNumber: number;
  ItemDescription: string;
  CategoryID: number | null;
  Quantity: number;
  UnitOfMeasure: string;
  UnitPrice: number;
  Notes: string;
  isNew?: boolean;
  isDeleted?: boolean;
}

export default function LPODetail() {
  const { uuid } = useParams<{ uuid: string }>();
  const navigate = useNavigate();
  const { currentUser, isHOD, isGM, isFinalApprover, canApproveForDepartment } = useUser();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [lpo, setLpo] = useState<LPO | null>(null);
  const [items, setItems] = useState<LPOItem[]>([]);
  const [receipts, setReceipts] = useState<LPOReceipt[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    vendorName: '',
    vendorAddress: '',
    vendorPhone: '',
    quotationReference: '',
    expectedDeliveryDate: '',
    paymentTerms: '',
    notes: '',
    vatPercent: 5,
    discountPercent: 0,
  });
  const [editItems, setEditItems] = useState<EditItem[]>([]);

  // Dialogs
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showReceiveDialog, setShowReceiveDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState<LPOItem | null>(null);

  // Form state for dialogs
  const [comment, setComment] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [receiveForm, setReceiveForm] = useState({
    quantity: 1,
    receiptDate: new Date().toISOString().split('T')[0],
    branchId: '',
    condition: 'NEW',
    conditionNotes: '',
    serialNumbers: '',
    notes: '',
  });

  useEffect(() => {
    loadData();
    loadBranches();
    loadCategories();
  }, [uuid]);

  async function loadData() {
    if (!uuid) return;
    setLoading(true);
    try {
      const data = await getLPO(uuid);
      setLpo(data.lpo);
      setItems(Array.isArray(data.items) ? data.items : []);
      setReceipts(Array.isArray(data.receipts) ? data.receipts : []);
    } catch (error) {
      console.error('Error loading LPO:', error);
    }
    setLoading(false);
    setRefreshing(false);
  }

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  async function loadBranches() {
    try {
      const data = await getBranches();
      setBranches(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading branches:', error);
    }
  }

  async function loadCategories() {
    try {
      const data = await getCategories();
      setCategories(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  }

  // Initialize edit mode
  const startEditing = () => {
    if (!lpo) return;
    setEditForm({
      vendorName: lpo.VendorName || '',
      vendorAddress: lpo.VendorAddress || '',
      vendorPhone: lpo.VendorPhone || '',
      quotationReference: lpo.QuotationReference || '',
      expectedDeliveryDate: lpo.ExpectedDeliveryDate ? lpo.ExpectedDeliveryDate.split('T')[0] : '',
      paymentTerms: lpo.PaymentTerms || '30 Days',
      notes: lpo.Notes || '',
      vatPercent: lpo.VATPercent || 5,
      discountPercent: lpo.DiscountPercent || 0,
    });
    setEditItems(items.map(item => ({
      LPOItemID: item.LPOItemID,
      LineNumber: item.LineNumber,
      ItemDescription: item.ItemDescription,
      CategoryID: item.CategoryID,
      Quantity: item.Quantity,
      UnitOfMeasure: item.UnitOfMeasure || 'EA',
      UnitPrice: item.UnitPrice,
      Notes: item.Notes || '',
    })));
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditForm({
      vendorName: '',
      vendorAddress: '',
      vendorPhone: '',
      quotationReference: '',
      expectedDeliveryDate: '',
      paymentTerms: '',
      notes: '',
      vatPercent: 5,
      discountPercent: 0,
    });
    setEditItems([]);
  };

  // Calculate totals for edit mode
  const calculateEditTotals = () => {
    const activeItems = editItems.filter(item => !item.isDeleted);
    const subtotal = activeItems.reduce((sum, item) => sum + (item.Quantity * item.UnitPrice), 0);
    const vatAmount = subtotal * (editForm.vatPercent / 100);
    const discountAmount = subtotal * (editForm.discountPercent / 100);
    const total = subtotal + vatAmount - discountAmount;
    return { subtotal, vatAmount, discountAmount, total };
  };

  // Add new item in edit mode
  const addEditItem = () => {
    const maxLineNumber = Math.max(0, ...editItems.map(i => i.LineNumber));
    setEditItems([...editItems, {
      LPOItemID: null,
      LineNumber: maxLineNumber + 1,
      ItemDescription: '',
      CategoryID: null,
      Quantity: 1,
      UnitOfMeasure: 'EA',
      UnitPrice: 0,
      Notes: '',
      isNew: true,
    }]);
  };

  // Remove item in edit mode
  const removeEditItem = (index: number) => {
    const item = editItems[index];
    if (item.isNew) {
      // New item - just remove it
      setEditItems(editItems.filter((_, i) => i !== index));
    } else {
      // Existing item - mark as deleted
      const updated = [...editItems];
      updated[index] = { ...updated[index], isDeleted: true };
      setEditItems(updated);
    }
  };

  // Update item field in edit mode
  const updateEditItem = (index: number, field: keyof EditItem, value: any) => {
    const updated = [...editItems];
    updated[index] = { ...updated[index], [field]: value };
    setEditItems(updated);
  };

  // Save changes
  const handleSave = async () => {
    if (!uuid || !lpo || !currentUser) return;
    setActionLoading(true);
    try {
      // Prepare items for API
      const itemsToSave = editItems
        .filter(item => !item.isDeleted)
        .map((item, idx) => ({
          lpoItemId: item.LPOItemID,
          lineNumber: idx + 1,
          itemDescription: item.ItemDescription,
          categoryId: item.CategoryID,
          quantity: item.Quantity,
          unitOfMeasure: item.UnitOfMeasure,
          unitPrice: item.UnitPrice,
          notes: item.Notes,
          isNew: item.isNew || false,
        }));

      const deletedItemIds = editItems
        .filter(item => item.isDeleted && item.LPOItemID)
        .map(item => item.LPOItemID);

      const { subtotal, vatAmount, total } = calculateEditTotals();

      await updateLPO(uuid, currentUser.UserID, {
        vendorName: editForm.vendorName,
        vendorAddress: editForm.vendorAddress,
        vendorPhone: editForm.vendorPhone,
        quotationReference: editForm.quotationReference,
        expectedDeliveryDate: editForm.expectedDeliveryDate,
        paymentTerms: editForm.paymentTerms,
        notes: editForm.notes,
        vatPercent: editForm.vatPercent,
        discountPercent: editForm.discountPercent,
        subTotal: subtotal,
        vatAmount: vatAmount,
        totalAmount: total,
        items: itemsToSave,
        deletedItemIds: deletedItemIds,
      });

      setIsEditing(false);
      loadData(); // Reload fresh data
      alert('LPO updated successfully');
    } catch (error) {
      console.error('Error updating LPO:', error);
      alert('Failed to update LPO');
    }
    setActionLoading(false);
  };

  const formatDate = (date: string | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatDateTime = (date: string | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount: number | null, currency = 'OMR') => {
    if (amount === null || amount === undefined) return '-';
    return `${amount.toFixed(3)} ${currency}`;
  };

  // Action handlers
  const handleSubmit = async () => {
    if (!uuid || !currentUser) return;
    setActionLoading(true);
    try {
      await submitLPO(uuid, currentUser.UserID, comment);
      setComment('');
      loadData();
    } catch (error) {
      console.error('Error submitting LPO:', error);
      alert('Failed to submit LPO');
    }
    setActionLoading(false);
  };

  const handleApprove = async () => {
    if (!uuid || !lpo || !currentUser) return;
    setActionLoading(true);
    try {
      // Determine approval level based on current status
      let approvalLevel: 'department' | 'gm' | 'accounts' = 'department';
      if (lpo.StatusCode === 'PENDING_GM_APPROVAL') {
        approvalLevel = 'gm';
      } else if (lpo.StatusCode === 'PENDING_ACC_APPROVAL') {
        approvalLevel = 'accounts';
      }
      
      await approveLPO(uuid, currentUser.UserID, approvalLevel, comment);
      setComment('');
      setShowApproveDialog(false);
      loadData();
    } catch (error) {
      console.error('Error approving LPO:', error);
      alert('Failed to approve LPO');
    }
    setActionLoading(false);
  };

  const handleReject = async () => {
    if (!uuid || !rejectReason.trim() || !currentUser) return;
    setActionLoading(true);
    try {
      await rejectLPO(uuid, currentUser.UserID, rejectReason);
      setRejectReason('');
      setShowRejectDialog(false);
      loadData();
    } catch (error) {
      console.error('Error rejecting LPO:', error);
      alert('Failed to reject LPO');
    }
    setActionLoading(false);
  };

  const handleSendToVendor = async () => {
    if (!uuid || !currentUser) return;
    setActionLoading(true);
    try {
      await sendLPOToVendor(uuid, currentUser.UserID);
      loadData();
    } catch (error) {
      console.error('Error sending to vendor:', error);
      alert('Failed to send to vendor');
    }
    setActionLoading(false);
  };

  const handleDownloadPdf = () => {
    if (!uuid) return;
    downloadLPOPdf(uuid);
  };

  const handleReceiveGoods = async () => {
    if (!selectedItem || !receiveForm.branchId || !currentUser) return;
    setActionLoading(true);
    try {
      const serialNumbers = receiveForm.serialNumbers
        .split('\n')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      const result = await receiveGoods({
        lpoItemId: selectedItem.LPOItemID,
        quantityReceived: receiveForm.quantity,
        receiptDate: receiveForm.receiptDate,
        receivedBy: currentUser.UserID,
        receivedAtBranchId: parseInt(receiveForm.branchId),
        condition: receiveForm.condition,
        conditionNotes: receiveForm.conditionNotes || undefined,
        serialNumbers: serialNumbers.length > 0 ? serialNumbers : undefined,
        notes: receiveForm.notes || undefined,
      });

      if (result.success) {
        const assetCount = result.assetsCreated?.length || 0;
        alert(`Received ${receiveForm.quantity} item(s). ${assetCount} asset(s) created.`);
        setShowReceiveDialog(false);
        setSelectedItem(null);
        setReceiveForm({
          quantity: 1,
          receiptDate: new Date().toISOString().split('T')[0],
          branchId: '',
          condition: 'NEW',
          conditionNotes: '',
          serialNumbers: '',
          notes: '',
        });
        loadData();
      }
    } catch (error) {
      console.error('Error receiving goods:', error);
      alert('Failed to receive goods');
    }
    setActionLoading(false);
  };

  const openReceiveDialog = (item: LPOItem) => {
    setSelectedItem(item);
    setReceiveForm({
      quantity: Math.min(1, item.QuantityPending),
      receiptDate: new Date().toISOString().split('T')[0],
      branchId: lpo?.RequestingBranchID?.toString() || '',
      condition: 'NEW',
      conditionNotes: '',
      serialNumbers: '',
      notes: '',
    });
    setShowReceiveDialog(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!lpo) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <FileText className="w-16 h-16 text-slate-300 mb-4" />
        <p className="text-xl text-slate-600">LPO not found</p>
        <Button variant="outline" onClick={() => navigate('/lpo')} className="mt-4">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to LPOs
        </Button>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[lpo.StatusCode] || STATUS_CONFIG.DRAFT;
  const canEdit = lpo.StatusCode === 'DRAFT';
  const canSubmit = lpo.StatusCode === 'DRAFT';
  
  // Three-tier approval logic
  // Use DepartmentName since RequestingDepartmentID not always in API response
  const canApproveDept = lpo.StatusCode === 'PENDING_DEPT_APPROVAL' && canApproveForDepartment(lpo.RequestingDepartmentID, lpo.DepartmentName);
  const canApproveGM = lpo.StatusCode === 'PENDING_GM_APPROVAL' && isGM;
  const canApproveAcc = lpo.StatusCode === 'PENDING_ACC_APPROVAL' && isFinalApprover;
  const canApprove = canApproveDept || canApproveGM || canApproveAcc;
  
  const canSendToVendor = lpo.StatusCode === 'APPROVED';
  const canReceive = ['SENT_TO_VENDOR', 'PARTIALLY_RECEIVED'].includes(lpo.StatusCode);

  // Calculate totals (for view mode or edit mode)
  const totals = isEditing ? calculateEditTotals() : {
    subtotal: lpo.SubTotal,
    vatAmount: lpo.VATAmount,
    discountAmount: lpo.DiscountAmount,
    total: lpo.TotalAmount,
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <Button variant="ghost" onClick={() => navigate('/lpo')} className="mb-4 -ml-2 text-slate-600">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to LPOs
        </Button>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900">{lpo.LPONumber}</h1>
              <Badge className={`${statusConfig.bg} ${statusConfig.color} gap-1`}>
                {statusConfig.icon}
                {lpo.StatusName}
              </Badge>
              {isEditing && (
                <Badge className="bg-amber-100 text-amber-700 gap-1">
                  <Pencil className="w-3 h-3" />
                  Editing
                </Badge>
              )}
            </div>
            <p className="text-slate-500 mt-1">
              Created on {formatDate(lpo.CreatedAt)} by {lpo.CreatedByName}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            {/* Refresh Button */}
            {!isEditing && (
              <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
                <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            )}

            {/* Edit Button - Only for Draft status */}
            {canEdit && !isEditing && (
              <Button variant="outline" onClick={startEditing}>
                <Pencil className="w-4 h-4 mr-2" />
                Edit
              </Button>
            )}

            {/* Save/Cancel in Edit Mode */}
            {isEditing && (
              <>
                <Button variant="outline" onClick={cancelEditing} disabled={actionLoading}>
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={actionLoading} className="bg-green-600 hover:bg-green-700">
                  {actionLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                  Save Changes
                </Button>
              </>
            )}

            {/* Submit Button */}
            {canSubmit && !isEditing && (
              <Button onClick={handleSubmit} disabled={actionLoading} className="bg-blue-600 hover:bg-blue-700">
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                Submit for Approval
              </Button>
            )}

            {/* Approve/Reject Buttons */}
            {canApprove && !isEditing && (
              <>
                <Button variant="outline" onClick={() => setShowRejectDialog(true)}>
                  <ThumbsDown className="w-4 h-4 mr-2" /> Reject
                </Button>
                <Button onClick={() => setShowApproveDialog(true)} className="bg-green-600 hover:bg-green-700">
                  <ThumbsUp className="w-4 h-4 mr-2" /> Approve
                </Button>
              </>
            )}

            {/* Send to Vendor */}
            {canSendToVendor && !isEditing && (
              <Button onClick={handleSendToVendor} disabled={actionLoading} className="bg-indigo-600 hover:bg-indigo-700">
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Truck className="w-4 h-4 mr-2" />}
                Send to Vendor
              </Button>
            )}

            {/* Download PDF - Available after sent to vendor */}
            {['SENT_TO_VENDOR', 'PARTIALLY_RECEIVED', 'FULLY_RECEIVED', 'INVOICED', 'CLOSED'].includes(lpo.StatusCode) && !isEditing && (
              <Button 
                onClick={handleDownloadPdf} 
                variant="outline"
                className="gap-2"
              >
                <Download className="w-4 h-4" />
                Download PDF
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Vendor & Department Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
                  <Building2 className="w-4 h-4" /> Vendor
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs">Vendor Name</Label>
                      <Input
                        value={editForm.vendorName}
                        onChange={(e) => setEditForm(prev => ({ ...prev, vendorName: e.target.value }))}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Address</Label>
                      <Textarea
                        value={editForm.vendorAddress}
                        onChange={(e) => setEditForm(prev => ({ ...prev, vendorAddress: e.target.value }))}
                        className="mt-1"
                        rows={2}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Phone</Label>
                      <Input
                        value={editForm.vendorPhone}
                        onChange={(e) => setEditForm(prev => ({ ...prev, vendorPhone: e.target.value }))}
                        className="mt-1"
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="font-semibold text-lg">{lpo.VendorName}</p>
                    {lpo.VendorAddress && <p className="text-sm text-slate-500 mt-1">{lpo.VendorAddress}</p>}
                    {lpo.VendorPhone && <p className="text-sm text-slate-500">{lpo.VendorPhone}</p>}
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
                  <User className="w-4 h-4" /> Requesting Department
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-semibold text-lg">{lpo.BranchName}</p>
                <p className="text-sm text-slate-500">{lpo.DepartmentName || 'No department specified'}</p>
                {isEditing && (
                  <div className="mt-3 space-y-3">
                    <div>
                      <Label className="text-xs">Quotation Reference</Label>
                      <Input
                        value={editForm.quotationReference}
                        onChange={(e) => setEditForm(prev => ({ ...prev, quotationReference: e.target.value }))}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Expected Delivery Date</Label>
                      <Input
                        type="date"
                        value={editForm.expectedDeliveryDate}
                        onChange={(e) => setEditForm(prev => ({ ...prev, expectedDeliveryDate: e.target.value }))}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Payment Terms</Label>
                      <Select
                        value={editForm.paymentTerms}
                        onValueChange={(v) => setEditForm(prev => ({ ...prev, paymentTerms: v }))}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="100% Advance">100% Advance</SelectItem>
                          <SelectItem value="50% Advance">50% Advance</SelectItem>
                          <SelectItem value="30 Days">30 Days Credit</SelectItem>
                          <SelectItem value="60 Days">60 Days Credit</SelectItem>
                          <SelectItem value="On Delivery">On Delivery</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Line Items */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Tag className="w-5 h-5" />
                  Line Items ({isEditing ? editItems.filter(i => !i.isDeleted).length : items.length})
                </CardTitle>
                {isEditing && (
                  <Button size="sm" variant="outline" onClick={addEditItem}>
                    <Plus className="w-4 h-4 mr-1" /> Add Item
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="items">
                <TabsList>
                  <TabsTrigger value="items">
                    <Tag className="w-4 h-4 mr-2" />
                    Line Items ({isEditing ? editItems.filter(i => !i.isDeleted).length : items.length})
                  </TabsTrigger>
                  <TabsTrigger value="receipts" disabled={isEditing}>
                    <History className="w-4 h-4 mr-2" />
                    Receipt History ({receipts.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="items" className="mt-4">
                  {isEditing ? (
                    /* Edit Mode Table */
                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-slate-50">
                            <TableHead className="w-[40%]">Description</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead className="text-center">Qty</TableHead>
                            <TableHead>Unit</TableHead>
                            <TableHead className="text-right">Unit Price</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                            <TableHead className="w-10"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {editItems.filter(item => !item.isDeleted).map((item, index) => {
                            const actualIndex = editItems.findIndex(i => i === item);
                            return (
                              <TableRow key={item.LPOItemID || `new-${index}`}>
                                <TableCell>
                                  <Input
                                    value={item.ItemDescription}
                                    onChange={(e) => updateEditItem(actualIndex, 'ItemDescription', e.target.value)}
                                    placeholder="Item description..."
                                    className="w-full"
                                  />
                                </TableCell>
                                <TableCell>
                                  <Select
                                    value={item.CategoryID?.toString() || ''}
                                    onValueChange={(v) => updateEditItem(actualIndex, 'CategoryID', v ? parseInt(v) : null)}
                                  >
                                    <SelectTrigger className="w-[130px]">
                                      <SelectValue placeholder="-" />
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
                                    value={item.Quantity}
                                    onChange={(e) => updateEditItem(actualIndex, 'Quantity', parseFloat(e.target.value) || 0)}
                                    min={1}
                                    className="w-20 text-center"
                                  />
                                </TableCell>
                                <TableCell>
                                  <Select
                                    value={item.UnitOfMeasure}
                                    onValueChange={(v) => updateEditItem(actualIndex, 'UnitOfMeasure', v)}
                                  >
                                    <SelectTrigger className="w-[80px]">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {UNITS.map(u => (
                                        <SelectItem key={u} value={u}>{u}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </TableCell>
                                <TableCell>
                                  <Input
                                    type="number"
                                    value={item.UnitPrice}
                                    onChange={(e) => updateEditItem(actualIndex, 'UnitPrice', parseFloat(e.target.value) || 0)}
                                    step="0.001"
                                    min={0}
                                    className="w-28 text-right"
                                  />
                                </TableCell>
                                <TableCell className="text-right font-medium">
                                  {formatCurrency(item.Quantity * item.UnitPrice, lpo.CurrencyCode)}
                                </TableCell>
                                <TableCell>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => removeEditItem(actualIndex)}
                                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    /* View Mode Table */
                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-slate-50">
                            <TableHead>Description</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead className="text-center">Ordered</TableHead>
                            <TableHead className="text-center">Received</TableHead>
                            <TableHead className="text-center">Pending</TableHead>
                            <TableHead className="text-right">Unit Price</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                            {canReceive && <TableHead className="w-24"></TableHead>}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {items.map((item) => (
                            <TableRow key={item.LPOItemID}>
                              <TableCell>
                                <p className="font-medium">{item.ItemDescription}</p>
                                {item.Notes && (
                                  <p className="text-xs text-slate-500 mt-1">{item.Notes}</p>
                                )}
                              </TableCell>
                              <TableCell className="text-slate-500">
                                {item.CategoryName || '-'}
                              </TableCell>
                              <TableCell className="text-center">
                                {item.Quantity} {item.UnitOfMeasure}
                              </TableCell>
                              <TableCell className="text-center">{item.QuantityReceived}</TableCell>
                              <TableCell className="text-center">
                                <span className={item.QuantityPending > 0 ? 'text-orange-600 font-medium' : 'text-green-600'}>
                                  {item.QuantityPending}
                                </span>
                              </TableCell>
                              <TableCell className="text-right">
                                {formatCurrency(item.UnitPrice, lpo.CurrencyCode)}
                              </TableCell>
                              <TableCell className="text-right font-medium">
                                {formatCurrency(item.TotalPrice, lpo.CurrencyCode)}
                              </TableCell>
                              {canReceive && (
                                <TableCell>
                                  {item.QuantityPending > 0 && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => openReceiveDialog(item)}
                                    >
                                      <Box className="w-3 h-3 mr-1" />
                                      Receive
                                    </Button>
                                  )}
                                </TableCell>
                              )}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="receipts" className="mt-4">
                  {receipts.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">
                      <Package className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                      <p>No receipts recorded yet</p>
                    </div>
                  ) : (
                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-slate-50">
                            <TableHead>Date</TableHead>
                            <TableHead>Item</TableHead>
                            <TableHead className="text-center">Qty</TableHead>
                            <TableHead>Condition</TableHead>
                            <TableHead>Location</TableHead>
                            <TableHead>Received By</TableHead>
                            <TableHead>Assets Created</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {receipts.map((receipt) => (
                            <TableRow key={receipt.ReceiptID}>
                              <TableCell>{formatDate(receipt.ReceiptDate)}</TableCell>
                              <TableCell>{receipt.ItemDescription}</TableCell>
                              <TableCell className="text-center">{receipt.QuantityReceived}</TableCell>
                              <TableCell>
                                <Badge variant="outline" className={
                                  receipt.Condition === 'NEW' ? 'border-green-300 text-green-700' :
                                  receipt.Condition === 'GOOD' ? 'border-blue-300 text-blue-700' :
                                  'border-red-300 text-red-700'
                                }>
                                  {receipt.Condition}
                                </Badge>
                              </TableCell>
                              <TableCell>{receipt.BranchName}</TableCell>
                              <TableCell>{receipt.ReceivedByName}</TableCell>
                              <TableCell>
                                {receipt.AssetTags?.length > 0 ? (
                                  <span className="text-xs font-mono text-blue-600">
                                    {receipt.AssetTags.join(', ')}
                                  </span>
                                ) : '-'}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Notes - Editable */}
          {(isEditing || lpo.Notes) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  <Textarea
                    value={editForm.notes}
                    onChange={(e) => setEditForm(prev => ({ ...prev, notes: e.target.value }))}
                    rows={3}
                    placeholder="Add any notes..."
                  />
                ) : (
                  <p className="text-slate-600 whitespace-pre-line">{lpo.Notes}</p>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Summary & Status */}
        <div className="space-y-6">
          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">LPO Date</span>
                <span className="font-medium">{formatDate(lpo.LPODate)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Expected Delivery</span>
                <span className="font-medium">{formatDate(isEditing ? editForm.expectedDeliveryDate : lpo.ExpectedDeliveryDate)}</span>
              </div>
              {(lpo.QuotationReference || editForm.quotationReference) && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Quotation Ref</span>
                  <span className="font-medium text-xs">{isEditing ? editForm.quotationReference : lpo.QuotationReference}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Payment Terms</span>
                <span className="font-medium">{isEditing ? editForm.paymentTerms : lpo.PaymentTerms}</span>
              </div>

              <hr />

              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Subtotal</span>
                <span>{formatCurrency(totals.subtotal, lpo.CurrencyCode)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">
                  VAT
                  {isEditing && (
                    <span className="ml-1">
                      @ <Input
                        type="number"
                        value={editForm.vatPercent}
                        onChange={(e) => setEditForm(prev => ({ ...prev, vatPercent: parseFloat(e.target.value) || 0 }))}
                        className="w-16 h-6 inline-block text-xs px-1"
                        step="0.1"
                        min={0}
                        max={100}
                      />%
                    </span>
                  )}
                  {!isEditing && ` (${lpo.VATPercent}%)`}
                </span>
                <span>{formatCurrency(totals.vatAmount, lpo.CurrencyCode)}</span>
              </div>
              {(totals.discountAmount > 0 || isEditing) && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">
                    Discount
                    {isEditing && (
                      <span className="ml-1">
                        @ <Input
                          type="number"
                          value={editForm.discountPercent}
                          onChange={(e) => setEditForm(prev => ({ ...prev, discountPercent: parseFloat(e.target.value) || 0 }))}
                          className="w-16 h-6 inline-block text-xs px-1"
                          step="0.1"
                          min={0}
                          max={100}
                        />%
                      </span>
                    )}
                    {!isEditing && lpo.DiscountPercent > 0 && ` (${lpo.DiscountPercent}%)`}
                  </span>
                  <span className="text-green-600">-{formatCurrency(totals.discountAmount, lpo.CurrencyCode)}</span>
                </div>
              )}

              <hr />

              <div className="flex justify-between text-lg font-semibold">
                <span>Total</span>
                <span className="text-blue-600">{formatCurrency(totals.total, lpo.CurrencyCode)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Approval Status */}
          <Card>
            <CardHeader>
              <CardTitle>Approval Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Department Approval */}
              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  lpo.DeptApprovalDate ? 'bg-green-100' : 'bg-slate-100'
                }`}>
                  {lpo.DeptApprovalDate ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <Clock className="w-4 h-4 text-slate-400" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">Department Approval</p>
                  {lpo.DeptApproverName ? (
                    <p className="text-xs text-slate-500">
                      {lpo.DeptApproverName} • {formatDateTime(lpo.DeptApprovalDate)}
                    </p>
                  ) : (
                    <p className="text-xs text-slate-400">Pending</p>
                  )}
                </div>
              </div>

              {/* GM Approval - Only show if amount > 100 OMR or GM approval happened */}
              {(lpo.TotalAmount > 100 || lpo.GMApprovalDate || lpo.StatusCode === 'PENDING_GM_APPROVAL' || lpo.StatusCode === 'REJECTED_GM') && (
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    lpo.GMApprovalDate ? 'bg-green-100' : 
                    lpo.StatusCode === 'REJECTED_GM' ? 'bg-red-100' : 'bg-slate-100'
                  }`}>
                    {lpo.GMApprovalDate ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : lpo.StatusCode === 'REJECTED_GM' ? (
                      <XCircle className="w-4 h-4 text-red-600" />
                    ) : (
                      <Clock className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">GM Approval</p>
                    {lpo.GMApproverName ? (
                      <p className="text-xs text-slate-500">
                        {lpo.GMApproverName} • {formatDateTime(lpo.GMApprovalDate)}
                      </p>
                    ) : (
                      <p className="text-xs text-slate-400">
                        {lpo.StatusCode === 'REJECTED_GM' ? 'Rejected' : 'Required for amounts > 100 OMR'}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Accounts Approval */}
              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  lpo.AccApprovalDate ? 'bg-green-100' : 
                  lpo.StatusCode === 'REJECTED_ACC' ? 'bg-red-100' : 'bg-slate-100'
                }`}>
                  {lpo.AccApprovalDate ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : lpo.StatusCode === 'REJECTED_ACC' ? (
                    <XCircle className="w-4 h-4 text-red-600" />
                  ) : (
                    <Clock className="w-4 h-4 text-slate-400" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">Accounts Approval</p>
                  {lpo.AccApproverName ? (
                    <p className="text-xs text-slate-500">
                      {lpo.AccApproverName} • {formatDateTime(lpo.AccApprovalDate)}
                    </p>
                  ) : (
                    <p className="text-xs text-slate-400">
                      {lpo.StatusCode === 'REJECTED_ACC' ? 'Rejected' : 'Pending'}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Approve Dialog */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve LPO</DialogTitle>
            <DialogDescription>
              {lpo.StatusCode === 'PENDING_DEPT_APPROVAL' && 'Approve as Department Head'}
              {lpo.StatusCode === 'PENDING_GM_APPROVAL' && 'Approve as General Manager'}
              {lpo.StatusCode === 'PENDING_ACC_APPROVAL' && 'Approve as Accounts Head'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Comments (optional)</Label>
              <Textarea 
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Add approval comments..."
                className="mt-1.5"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApproveDialog(false)}>Cancel</Button>
            <Button onClick={handleApprove} disabled={actionLoading} className="bg-green-600 hover:bg-green-700">
              {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Approve'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject LPO</DialogTitle>
            <DialogDescription>Please provide a reason for rejection</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Rejection Reason *</Label>
              <Textarea 
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Enter reason for rejection..."
                className="mt-1.5"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>Cancel</Button>
            <Button 
              onClick={handleReject} 
              disabled={actionLoading || !rejectReason.trim()} 
              variant="destructive"
            >
              {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Receive Goods Dialog */}
      <Dialog open={showReceiveDialog} onOpenChange={setShowReceiveDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Receive Goods</DialogTitle>
            <DialogDescription>
              {selectedItem?.ItemDescription}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-3 bg-slate-50 rounded-lg text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Ordered:</span>
                <span className="font-medium">{selectedItem?.Quantity}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Already Received:</span>
                <span className="font-medium">{selectedItem?.QuantityReceived}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Pending:</span>
                <span className="font-medium text-orange-600">{selectedItem?.QuantityPending}</span>
              </div>
            </div>

            <div>
              <Label>Quantity to Receive *</Label>
              <Input 
                type="number"
                value={receiveForm.quantity}
                onChange={(e) => setReceiveForm(prev => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))}
                min={1}
                max={selectedItem?.QuantityPending || 1}
                className="mt-1.5"
              />
            </div>

            <div>
              <Label>Receipt Date *</Label>
              <Input 
                type="date"
                value={receiveForm.receiptDate}
                onChange={(e) => setReceiveForm(prev => ({ ...prev, receiptDate: e.target.value }))}
                className="mt-1.5"
              />
            </div>

            <div>
              <Label>Receiving Location *</Label>
              <Select value={receiveForm.branchId} onValueChange={(v) => setReceiveForm(prev => ({ ...prev, branchId: v }))}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Select branch" />
                </SelectTrigger>
                <SelectContent>
                  {branches.map(branch => (
                    <SelectItem key={branch.BranchID} value={branch.BranchID.toString()}>
                      {branch.BranchName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Condition</Label>
              <Select value={receiveForm.condition} onValueChange={(v) => setReceiveForm(prev => ({ ...prev, condition: v }))}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CONDITIONS.map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Serial Numbers (optional, one per line)</Label>
              <Textarea 
                value={receiveForm.serialNumbers}
                onChange={(e) => setReceiveForm(prev => ({ ...prev, serialNumbers: e.target.value }))}
                placeholder="SN-001&#10;SN-002"
                className="mt-1.5 font-mono text-sm"
                rows={3}
              />
            </div>

            <div>
              <Label>Notes</Label>
              <Textarea 
                value={receiveForm.notes}
                onChange={(e) => setReceiveForm(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Additional notes..."
                className="mt-1.5"
                rows={2}
              />
            </div>

            <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
              <p className="text-sm text-amber-700">
                <AlertCircle className="w-4 h-4 inline mr-1" />
                This will create <strong>{receiveForm.quantity}</strong> asset(s) with auto-generated tags
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReceiveDialog(false)}>Cancel</Button>
            <Button 
              onClick={handleReceiveGoods} 
              disabled={actionLoading || !receiveForm.branchId || receiveForm.quantity < 1}
              className="bg-green-600 hover:bg-green-700"
            >
              {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                <>
                  <Box className="w-4 h-4 mr-2" />
                  Receive & Create Assets
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
