import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useDropzone } from 'react-dropzone';
import { api } from '@/lib/api';
import { useUser } from '@/contexts/UserContext';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import {
  Upload,
  FileText,
  Image,
  X,
  Loader2,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Edit3,
  Save,
  ExternalLink,
  Plus,
  Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const API_BASE = 'http://172.16.35.76:5679/webhook';

const ACCEPTED_FILE_TYPES = {
  'application/pdf': ['.pdf'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/heic': ['.heic'],
  'image/webp': ['.webp'],
};

// Simple UUID generator that works in HTTP context
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

interface InvoiceItem {
  id: string;
  lineNumber: number;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
}

interface ExtractedInvoice {
  InvoiceID: number;
  InvoiceUUID: string;
  InvoiceNumber: string;
  InvoiceDate: string;
  VendorName: string;
  VendorAddress?: string;
  CurrencyCode: string;
  SubTotal: number;
  TaxAmount: number;
  DiscountAmount: number;
  TotalAmount: number;
  AIConfidenceScore: number;
  Notes?: string;
  Items: InvoiceItem[];
}

const UNITS = ['EA', 'SET', 'BOX', 'PKT', 'KG', 'LTR', 'MTR', 'HR', 'DAY', 'MONTH', 'YEAR'];

export default function UploadInvoice() {
  const navigate = useNavigate();
  const { currentUser } = useUser();
  const [file, setFile] = useState<File | null>(null);
  const [departmentId, setDepartmentId] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [notes, setNotes] = useState('');
  
  // Upload state
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  
  // Success modal state
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdInvoice, setCreatedInvoice] = useState<ExtractedInvoice | null>(null);
  
  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editedInvoice, setEditedInvoice] = useState<ExtractedInvoice | null>(null);

  const { data: departments } = useQuery({
    queryKey: ['departments'],
    queryFn: api.getDepartments,
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: api.getCategories,
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setUploadError(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_FILE_TYPES,
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
    disabled: uploading,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file || !departmentId || !categoryId) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);
    setUploadError(null);

    try {
      // Convert file to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(',')[1]);
        };
        reader.onerror = error => reject(error);
      });

      // Upload invoice
      const uploadResponse = await fetch(`${API_BASE}/invoice-upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file: base64,
          fileName: file.name,
          fileType: file.type,
          departmentId: parseInt(departmentId),
          userId: currentUser?.UserID || 1,
          categoryId: parseInt(categoryId),
          notes: notes,
        }),
      });

      const uploadResult = await uploadResponse.json();

      if (!uploadResult.success) {
        throw new Error(uploadResult.error || 'Failed to upload invoice');
      }

      // Get the UUID from response
      const invoiceUUID = uploadResult.InvoiceUUID || uploadResult.invoiceUUID || uploadResult.uuid;
      
      if (!invoiceUUID) {
        // If no UUID, create basic invoice data from upload response
        const basicInvoice: ExtractedInvoice = {
          InvoiceID: uploadResult.InvoiceID || 0,
          InvoiceUUID: '',
          InvoiceNumber: uploadResult.InvoiceNumber || 'Unknown',
          InvoiceDate: new Date().toISOString().split('T')[0],
          VendorName: uploadResult.VendorName || 'Unknown Vendor',
          CurrencyCode: uploadResult.CurrencyCode || 'OMR',
          SubTotal: uploadResult.SubTotal || 0,
          TaxAmount: uploadResult.TaxAmount || 0,
          DiscountAmount: uploadResult.DiscountAmount || 0,
          TotalAmount: uploadResult.TotalAmount || 0,
          AIConfidenceScore: uploadResult.AIConfidenceScore || 0,
          Items: [],
        };
        setCreatedInvoice(basicInvoice);
        setEditedInvoice({ ...basicInvoice });
        setShowSuccessModal(true);
        return;
      }

      // Fetch full invoice details
      const detailResponse = await fetch(`${API_BASE}/invoice-api/get-invoice?uuid=${invoiceUUID}`);
      const detailResult = await detailResponse.json();

      if (detailResult.success && detailResult.invoice) {
        const inv = detailResult.invoice;
        const items = (detailResult.items || []).map((item: any, idx: number) => ({
          id: generateUUID(),
          lineNumber: item.LineNumber || idx + 1,
          description: item.ItemDescription || item.description || '',
          quantity: item.Quantity || item.quantity || 1,
          unit: item.UnitOfMeasure || item.unit || 'EA',
          unitPrice: item.UnitPrice || item.unitPrice || 0,
          totalPrice: item.TotalPrice || item.totalPrice || 0,
        }));

        const invoiceData: ExtractedInvoice = {
          InvoiceID: inv.InvoiceID,
          InvoiceUUID: inv.InvoiceUUID || invoiceUUID,
          InvoiceNumber: inv.InvoiceNumber,
          InvoiceDate: inv.InvoiceDate?.split('T')[0] || new Date().toISOString().split('T')[0],
          VendorName: inv.VendorName || inv.VendorNameExtracted || 'Unknown Vendor',
          VendorAddress: inv.VendorAddress,
          CurrencyCode: inv.CurrencyCode || 'OMR',
          SubTotal: inv.SubTotal || 0,
          TaxAmount: inv.TaxAmount || 0,
          DiscountAmount: inv.DiscountAmount || 0,
          TotalAmount: inv.TotalAmount || 0,
          AIConfidenceScore: inv.AIConfidenceScore || uploadResult.AIConfidenceScore || 0,
          Notes: inv.Notes,
          Items: items,
        };

        setCreatedInvoice(invoiceData);
        setEditedInvoice({ ...invoiceData, Items: items.map((i: InvoiceItem) => ({ ...i })) });
        setShowSuccessModal(true);
      } else {
        // Fallback to basic data from upload response
        const basicInvoice: ExtractedInvoice = {
          InvoiceID: uploadResult.InvoiceID || 0,
          InvoiceUUID: invoiceUUID,
          InvoiceNumber: uploadResult.InvoiceNumber || 'Unknown',
          InvoiceDate: new Date().toISOString().split('T')[0],
          VendorName: 'Unknown Vendor',
          CurrencyCode: 'OMR',
          SubTotal: 0,
          TaxAmount: 0,
          DiscountAmount: 0,
          TotalAmount: 0,
          AIConfidenceScore: uploadResult.AIConfidenceScore || 0,
          Items: [],
        };
        setCreatedInvoice(basicInvoice);
        setEditedInvoice({ ...basicInvoice });
        setShowSuccessModal(true);
      }

      toast({
        title: 'Invoice Uploaded',
        description: 'AI extraction complete. Review the extracted data.',
      });

    } catch (error) {
      console.error('Error uploading invoice:', error);
      setUploadError(error instanceof Error ? error.message : 'Failed to upload invoice');
      toast({
        title: 'Upload Failed',
        description: error instanceof Error ? error.message : 'Failed to upload invoice. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const removeFile = () => {
    setFile(null);
    setUploadError(null);
  };

  const isImage = file?.type.startsWith('image/');

  // Calculate totals from items
  const calculateTotals = (invoice: ExtractedInvoice) => {
    const subtotal = invoice.Items.reduce((sum, item) => sum + item.totalPrice, 0);
    const taxAmount = invoice.TaxAmount || 0;
    const discountAmount = invoice.DiscountAmount || 0;
    const total = subtotal + taxAmount - discountAmount;
    return { subtotal, taxAmount, discountAmount, total };
  };

  // Update item field
  const updateItem = (itemId: string, field: keyof InvoiceItem, value: any) => {
    if (!editedInvoice) return;
    
    const updatedItems = editedInvoice.Items.map(item => {
      if (item.id === itemId) {
        const updated = { ...item, [field]: value };
        // Recalculate total if quantity or price changes
        if (field === 'quantity' || field === 'unitPrice') {
          updated.totalPrice = updated.quantity * updated.unitPrice;
        }
        return updated;
      }
      return item;
    });
    
    setEditedInvoice({ ...editedInvoice, Items: updatedItems });
  };

  // Add new item
  const addItem = () => {
    if (!editedInvoice) return;
    
    const newItem: InvoiceItem = {
      id: generateUUID(),
      lineNumber: editedInvoice.Items.length + 1,
      description: '',
      quantity: 1,
      unit: 'EA',
      unitPrice: 0,
      totalPrice: 0,
    };
    
    setEditedInvoice({ ...editedInvoice, Items: [...editedInvoice.Items, newItem] });
  };

  // Remove item
  const removeItem = (itemId: string) => {
    if (!editedInvoice) return;
    const updatedItems = editedInvoice.Items.filter(item => item.id !== itemId);
    setEditedInvoice({ ...editedInvoice, Items: updatedItems });
  };

  // Save edits
  const handleSaveEdits = async () => {
    if (!editedInvoice) return;
    
    setSaving(true);
    try {
      const totals = calculateTotals(editedInvoice);
      
      const response = await fetch(`${API_BASE}/invoice-api/invoice/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceUuid: editedInvoice.InvoiceUUID,
          userId: currentUser?.UserID || 1,
          updates: {
            VendorName: editedInvoice.VendorName,
            VendorAddress: editedInvoice.VendorAddress,
            SubTotal: totals.subtotal,
            TaxAmount: editedInvoice.TaxAmount,
            DiscountAmount: editedInvoice.DiscountAmount,
            TotalAmount: totals.total,
            Notes: editedInvoice.Notes,
          },
          items: editedInvoice.Items.map((item, idx) => ({
            lineNumber: idx + 1,
            description: item.description,
            quantity: item.quantity,
            unit: item.unit,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
          })),
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        // Update the created invoice with edited values
        setCreatedInvoice({
          ...editedInvoice,
          SubTotal: totals.subtotal,
          TotalAmount: totals.total,
        });
        setIsEditing(false);
        toast({
          title: 'Changes Saved',
          description: 'Invoice has been updated successfully.',
        });
      } else {
        throw new Error(result.error || 'Failed to save changes');
      }
    } catch (error) {
      console.error('Error saving edits:', error);
      toast({
        title: 'Save Failed',
        description: error instanceof Error ? error.message : 'Failed to save changes.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  // Navigation handlers
  const handleCloseAndContinue = () => {
    setShowSuccessModal(false);
    setCreatedInvoice(null);
    setEditedInvoice(null);
    setFile(null);
    setNotes('');
    setIsEditing(false);
  };

  const handleViewInvoice = () => {
    if (createdInvoice?.InvoiceUUID) {
      navigate(`/invoices/${createdInvoice.InvoiceUUID}`);
    } else {
      navigate('/invoices');
    }
  };

  const handleGoToInvoices = () => {
    navigate('/invoices');
  };

  // Confidence score badge
  const getConfidenceBadge = (score: number) => {
    if (score >= 80) {
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">High Confidence: {score}%</Badge>;
    } else if (score >= 60) {
      return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Medium Confidence: {score}%</Badge>;
    } else {
      return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Low Confidence: {score}%</Badge>;
    }
  };

  return (
    <div className="animate-fade-in max-w-3xl mx-auto">
      <PageHeader
        title="Upload Invoice"
        description="Upload an invoice document for AI-powered data extraction"
        breadcrumbs={[{ label: 'Upload Invoice' }]}
      />

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* File Upload Area */}
        <div className="bg-card rounded-xl border border-border shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Invoice Document</h2>

          {!file ? (
            <div
              {...getRootProps()}
              className={cn(
                'dropzone',
                isDragActive && 'dropzone-active',
                'hover:border-accent hover:bg-accent/5',
                uploading && 'opacity-50 cursor-not-allowed'
              )}
            >
              <input {...getInputProps()} />
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                  <Upload className="w-8 h-8 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-lg font-medium text-foreground">
                    {isDragActive
                      ? 'Drop your file here...'
                      : 'Drag & drop your invoice'}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    or click to browse • PDF, JPG, PNG, HEIC, WebP (max 10MB)
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="border border-border rounded-xl p-4 bg-muted/30">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  {isImage ? (
                    <Image className="w-6 h-6 text-primary" />
                  ) : (
                    <FileText className="w-6 h-6 text-primary" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">
                    {file.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={removeFile}
                  disabled={uploading}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              {isImage && (
                <div className="mt-4 rounded-lg overflow-hidden border border-border">
                  <img
                    src={URL.createObjectURL(file)}
                    alt="Preview"
                    className="max-h-48 w-full object-contain bg-white"
                  />
                </div>
              )}
            </div>
          )}

          {uploadError && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{uploadError}</span>
            </div>
          )}
        </div>

        {/* Invoice Details */}
        <div className="bg-card rounded-xl border border-border shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Invoice Details</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="department">Department *</Label>
              <Select value={departmentId} onValueChange={setDepartmentId} disabled={uploading}>
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  {departments?.map((dept) => (
                    <SelectItem
                      key={dept.DepartmentID}
                      value={dept.DepartmentID.toString()}
                    >
                      {dept.DepartmentName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select value={categoryId} onValueChange={setCategoryId} disabled={uploading}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  {categories?.map((cat) => (
                    <SelectItem
                      key={cat.CategoryID}
                      value={cat.CategoryID.toString()}
                    >
                      {cat.CategoryName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any additional notes or context..."
                rows={3}
                disabled={uploading}
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/')}
            disabled={uploading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={!file || !departmentId || !categoryId || uploading}
            className="gap-2"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                AI is extracting data...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Upload & Extract
              </>
            )}
          </Button>
        </div>

        {/* AI Processing Indicator */}
        {uploading && (
          <div className="bg-accent/10 border border-accent/20 rounded-xl p-6 text-center animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-accent animate-pulse" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              AI Processing Your Invoice
            </h3>
            <p className="text-muted-foreground">
              Our AI is analyzing your document and extracting invoice data.
              This usually takes 10-30 seconds...
            </p>
          </div>
        )}
      </form>

      {/* Success Modal */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <DialogTitle className="text-xl">Invoice Uploaded Successfully!</DialogTitle>
                <DialogDescription>
                  Review the AI-extracted data below. You can edit if needed.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {createdInvoice && (
            <div className="space-y-6 py-4">
              {/* Header Info */}
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant="outline" className="text-base px-3 py-1">
                  {createdInvoice.InvoiceNumber}
                </Badge>
                {getConfidenceBadge(createdInvoice.AIConfidenceScore)}
                {!isEditing && (
                  <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                    <Edit3 className="w-4 h-4 mr-1" /> Edit
                  </Button>
                )}
              </div>

              {createdInvoice.AIConfidenceScore < 80 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-yellow-800">Review Recommended</p>
                    <p className="text-sm text-yellow-700">
                      AI confidence is below 80%. Please review and correct the extracted data.
                    </p>
                  </div>
                </div>
              )}

              {/* Vendor Info Card */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Vendor Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-slate-500 text-sm">Vendor Name</Label>
                      {isEditing ? (
                        <Input 
                          value={editedInvoice?.VendorName || ''}
                          onChange={(e) => setEditedInvoice(prev => prev ? {...prev, VendorName: e.target.value} : null)}
                          className="mt-1"
                        />
                      ) : (
                        <p className="font-medium">{createdInvoice.VendorName}</p>
                      )}
                    </div>
                    <div>
                      <Label className="text-slate-500 text-sm">Invoice Date</Label>
                      <p className="font-medium">{createdInvoice.InvoiceDate}</p>
                    </div>
                    <div>
                      <Label className="text-slate-500 text-sm">Currency</Label>
                      <p className="font-medium">{createdInvoice.CurrencyCode}</p>
                    </div>
                    <div>
                      <Label className="text-slate-500 text-sm">Vendor Address</Label>
                      {isEditing ? (
                        <Textarea 
                          value={editedInvoice?.VendorAddress || ''}
                          onChange={(e) => setEditedInvoice(prev => prev ? {...prev, VendorAddress: e.target.value} : null)}
                          className="mt-1"
                          rows={2}
                        />
                      ) : (
                        <p className="font-medium">{createdInvoice.VendorAddress || '-'}</p>
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
                  {(isEditing ? editedInvoice?.Items : createdInvoice.Items)?.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">
                      <p>No line items extracted.</p>
                      {isEditing && (
                        <Button size="sm" variant="outline" onClick={addItem} className="mt-2">
                          <Plus className="w-4 h-4 mr-1" /> Add First Item
                        </Button>
                      )}
                    </div>
                  ) : (
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
                        {(isEditing ? editedInvoice?.Items : createdInvoice.Items)?.map((item, index) => (
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
                                item.description || '-'
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
                                  disabled={(editedInvoice?.Items.length || 0) <= 1}
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
                  )}

                  {/* Totals */}
                  <div className="mt-4 pt-4 border-t">
                    {(() => {
                      const invoice = isEditing ? editedInvoice : createdInvoice;
                      const totals = invoice ? calculateTotals(invoice) : { subtotal: 0, taxAmount: 0, discountAmount: 0, total: 0 };
                      return (
                        <div className="flex justify-end">
                          <div className="w-64 space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-slate-500">Subtotal</span>
                              <span className="font-medium">{totals.subtotal.toFixed(3)} {createdInvoice.CurrencyCode}</span>
                            </div>
                            {(isEditing || (invoice?.TaxAmount || 0) > 0) && (
                              <div className="flex justify-between text-sm">
                                <span className="text-slate-500">Tax</span>
                                {isEditing ? (
                                  <Input 
                                    type="number"
                                    value={editedInvoice?.TaxAmount || 0}
                                    onChange={(e) => setEditedInvoice(prev => prev ? {...prev, TaxAmount: parseFloat(e.target.value) || 0} : null)}
                                    min={0}
                                    step={0.001}
                                    className="w-24 text-right h-7"
                                  />
                                ) : (
                                  <span className="font-medium">{(invoice?.TaxAmount || 0).toFixed(3)} {createdInvoice.CurrencyCode}</span>
                                )}
                              </div>
                            )}
                            {(isEditing || (invoice?.DiscountAmount || 0) > 0) && (
                              <div className="flex justify-between text-sm">
                                <span className="text-slate-500">Discount</span>
                                {isEditing ? (
                                  <Input 
                                    type="number"
                                    value={editedInvoice?.DiscountAmount || 0}
                                    onChange={(e) => setEditedInvoice(prev => prev ? {...prev, DiscountAmount: parseFloat(e.target.value) || 0} : null)}
                                    min={0}
                                    step={0.001}
                                    className="w-24 text-right h-7"
                                  />
                                ) : (
                                  <span className="font-medium">-{(invoice?.DiscountAmount || 0).toFixed(3)} {createdInvoice.CurrencyCode}</span>
                                )}
                              </div>
                            )}
                            <div className="flex justify-between pt-2 border-t">
                              <span className="font-semibold">Total</span>
                              <span className="font-bold text-lg text-primary">{totals.total.toFixed(3)} {createdInvoice.CurrencyCode}</span>
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
                  setEditedInvoice(createdInvoice ? { 
                    ...createdInvoice, 
                    Items: createdInvoice.Items.map(i => ({ ...i })) 
                  } : null);
                  setIsEditing(false);
                }}>
                  Cancel
                </Button>
                <Button onClick={handleSaveEdits} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={handleCloseAndContinue}>
                  Upload Another
                </Button>
                <Button variant="outline" onClick={handleGoToInvoices}>
                  Go to Invoices
                </Button>
                <Button onClick={handleViewInvoice}>
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View Invoice Details
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
