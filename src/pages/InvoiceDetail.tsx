import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, InvoiceItem, Vendor } from '@/lib/api';
import { useUser } from '@/contexts/UserContext';
import { PageHeader } from '@/components/PageHeader';
import { StatusBadge } from '@/components/StatusBadge';
import { ConfidenceIndicator } from '@/components/ConfidenceIndicator';
import { AddVendorModal } from '@/components/AddVendorModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import {
  Calendar as CalendarIcon,
  Save,
  Send,
  Plus,
  Trash2,
  FileText,
  Loader2,
  Check,
  ChevronsUpDown,
  ArrowLeft,
  CheckCircle,
  XCircle,
  RotateCcw,
  Download,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const CURRENCIES = [
  'OMR',
  'USD',
  'INR',
  'PKR',
  'BDT',
  'PHP',
  'AED',
  'EUR',
  'GBP',
];

const UNITS = ['EA', 'KG', 'HR', 'PCS', 'BOX', 'SET', 'LTR', 'MTR', 'SQM'];

export default function InvoiceDetail() {
  const { invoiceUuid } = useParams<{ invoiceUuid: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { currentUser } = useUser();

  const [formData, setFormData] = useState({
    invoiceNumber: '',
    invoiceDate: new Date(),
    vendorName: '',
    vendorId: 0,
    currencyCode: 'OMR',
    categoryId: 0,
    subTotal: 0,
    taxAmount: 0,
    discountAmount: 0,
    totalAmount: 0,
    notes: '',
  });

  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [vendorOpen, setVendorOpen] = useState(false);
  const [addVendorOpen, setAddVendorOpen] = useState(false);
  const [newVendorName, setNewVendorName] = useState('');
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'correction' | null>(null);
  const [actionComment, setActionComment] = useState('');
  const [fileData, setFileData] = useState<string | null>(null);
  const [fileMimeType, setFileMimeType] = useState<string | null>(null);
  const [fileLoading, setFileLoading] = useState(false);
  const [fileError, setFileError] = useState(false);

  const { data: invoiceData, isLoading } = useQuery({
    queryKey: ['invoice', invoiceUuid],
    queryFn: () => api.getInvoice(invoiceUuid!),
    enabled: !!invoiceUuid,
  });

  const { data: vendors } = useQuery({
    queryKey: ['vendors'],
    queryFn: api.getVendors,
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: api.getCategories,
  });

  useEffect(() => {
    if (invoiceData) {
      const { invoice, items: invoiceItems } = invoiceData;
      setFormData({
        invoiceNumber: invoice.InvoiceNumber || '',
        invoiceDate: invoice.InvoiceDate
          ? new Date(invoice.InvoiceDate)
          : new Date(),
        vendorName: invoice.VendorName || '',
        vendorId: invoice.VendorID || 0,
        currencyCode: invoice.CurrencyCode || 'OMR',
        categoryId: invoice.CategoryID || 0,
        subTotal: invoice.SubTotal || 0,
        taxAmount: invoice.TaxAmount || 0,
        discountAmount: invoice.DiscountAmount || 0,
        totalAmount: invoice.TotalAmount || 0,
        notes: invoice.Notes || '',
      });
      setItems(
        invoiceItems.length > 0
          ? invoiceItems
          : [
              {
                LineNumber: 1,
                ItemDescription: '',
                Quantity: 1,
                UnitOfMeasure: 'EA',
                UnitPrice: 0,
                TotalPrice: 0,
              },
            ]
      );

      // Fetch file if StoredFilePath exists
      if (invoice.StoredFilePath) {
        setFileLoading(true);
        setFileError(false);
        api.getInvoiceFile(invoice.StoredFilePath)
          .then((result) => {
            if (result.success) {
              setFileData(result.data);
              setFileMimeType(result.mimeType);
            } else {
              setFileError(true);
            }
          })
          .catch(() => {
            setFileError(true);
          })
          .finally(() => {
            setFileLoading(false);
          });
      }
    }
  }, [invoiceData]);

  const updateMutation = useMutation({
    mutationFn: () => api.updateInvoice({
      invoiceUuid: invoiceUuid!,
      updates: {
        InvoiceNumber: formData.invoiceNumber,
        InvoiceDate: format(formData.invoiceDate, 'yyyy-MM-dd'),
        VendorID: formData.vendorId,
        CurrencyCode: formData.currencyCode,
        CategoryID: formData.categoryId,
        SubTotal: formData.subTotal,
        TaxAmount: formData.taxAmount,
        DiscountAmount: formData.discountAmount,
        TotalAmount: formData.totalAmount,
        Notes: formData.notes,
        items,
      },
      userId: currentUser?.UserID || 0,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoice', invoiceUuid] });
      toast({
        title: 'Changes Saved',
        description: 'Invoice has been updated successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save changes.',
        variant: 'destructive',
      });
    },
  });

  const submitMutation = useMutation({
    mutationFn: () => api.submitInvoice({
      invoiceUuid: invoiceUuid!,
      userId: currentUser?.UserID || 0,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoice', invoiceUuid] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast({
        title: 'Invoice Submitted',
        description: 'Invoice has been submitted for approval.',
      });
      navigate('/invoices');
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to submit invoice.',
        variant: 'destructive',
      });
    },
  });

  const approveMutation = useMutation({
    mutationFn: (action: 'approve' | 'reject' | 'correction') => api.approveInvoice({
      invoiceUuid: invoiceUuid!,
      action,
      userId: currentUser?.UserID || 0,
      comment: actionComment,
    }),
    onSuccess: (_, action) => {
      queryClient.invalidateQueries({ queryKey: ['invoice', invoiceUuid] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      const messages = {
        approve: 'Invoice has been approved.',
        reject: 'Invoice has been rejected.',
        correction: 'Invoice has been sent back for correction.',
      };
      toast({
        title: 'Action Completed',
        description: messages[action],
      });
      setActionDialogOpen(false);
      setActionComment('');
      navigate('/invoices');
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to process action.',
        variant: 'destructive',
      });
    },
  });

  const handleSave = () => {
    updateMutation.mutate();
  };

  const handleSubmit = async () => {
    await updateMutation.mutateAsync();
    submitMutation.mutate();
  };

  const handleAction = (action: 'approve' | 'reject' | 'correction') => {
    setActionType(action);
    setActionDialogOpen(true);
  };

  const confirmAction = () => {
    if (actionType) {
      approveMutation.mutate(actionType);
    }
  };

  const addItem = () => {
    setItems([
      ...items,
      {
        LineNumber: items.length + 1,
        ItemDescription: '',
        Quantity: 1,
        UnitOfMeasure: 'EA',
        UnitPrice: 0,
        TotalPrice: 0,
      },
    ]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, field: keyof InvoiceItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };

    if (field === 'Quantity' || field === 'UnitPrice') {
      newItems[index].TotalPrice =
        (newItems[index].Quantity || 0) * (newItems[index].UnitPrice || 0);
    }

    setItems(newItems);

    const subtotal = newItems.reduce(
      (sum, item) => sum + (item.TotalPrice || 0),
      0
    );
    setFormData((prev) => ({
      ...prev,
      subTotal: subtotal,
      totalAmount: subtotal + prev.taxAmount - prev.discountAmount,
    }));
  };

  const handleVendorSelect = (vendor: Vendor) => {
    setFormData((prev) => ({
      ...prev,
      vendorName: vendor.VendorName,
      vendorId: vendor.VendorID,
    }));
    setVendorOpen(false);
  };

  const handleAddNewVendor = (name: string) => {
    setNewVendorName(name);
    setAddVendorOpen(true);
    setVendorOpen(false);
  };

  const handleDownload = () => {
    if (!fileData || !fileMimeType) return;
    
    const byteCharacters = atob(fileData);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: fileMimeType });
    
    const extension = fileMimeType === 'application/pdf' ? 'pdf' : 
                      fileMimeType === 'image/png' ? 'png' : 'jpg';
    const fileName = `${invoice?.InvoiceNumber || 'invoice'}.${extension}`;
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="w-6 h-6 animate-spin" />
          Loading invoice...
        </div>
      </div>
    );
  }

  if (!invoiceData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <FileText className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
          <p className="text-muted-foreground">Invoice not found</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate('/invoices')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Invoices
          </Button>
        </div>
      </div>
    );
  }

  const { invoice } = invoiceData;
  const isImage = invoice.FileType?.startsWith('image/');
  const isPendingReview = invoice.StatusCode === 'PENDING_REVIEW';
  const isPendingApproval = invoice.StatusCode === 'PENDING_APPROVAL';
  const isEditable = isPendingReview;

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={`Invoice ${invoice.InvoiceNumber || 'Details'}`}
        breadcrumbs={[
          { label: 'All Invoices', href: '/invoices' },
          { label: invoice.InvoiceNumber || invoiceUuid || '' },
        ]}
        actions={
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => navigate('/invoices')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <StatusBadge status={invoice.StatusCode} />
            
            {isPendingReview && (
              <>
                <Button
                  variant="outline"
                  onClick={handleSave}
                  disabled={updateMutation.isPending}
                  className="gap-2"
                >
                  {updateMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Save Changes
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={submitMutation.isPending || updateMutation.isPending}
                  className="gap-2"
                >
                  {submitMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  Submit for Approval
                </Button>
              </>
            )}

            {isPendingApproval && (
              <>
                <Button
                  variant="default"
                  onClick={() => handleAction('approve')}
                  disabled={approveMutation.isPending}
                  className="gap-2 bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="w-4 h-4" />
                  Approve
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleAction('reject')}
                  disabled={approveMutation.isPending}
                  className="gap-2"
                >
                  <XCircle className="w-4 h-4" />
                  Reject
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleAction('correction')}
                  disabled={approveMutation.isPending}
                  className="gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  Request Correction
                </Button>
              </>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Document Preview */}
        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="p-4 border-b border-border bg-muted/30 flex items-center justify-between">
            <h2 className="font-semibold">Original Document</h2>
            {fileData && (
              <Button variant="outline" size="sm" onClick={handleDownload} className="gap-2">
                <Download className="w-4 h-4" />
                Download
              </Button>
            )}
          </div>
          <div className="p-4 min-h-[500px] bg-muted/10">
            {fileLoading ? (
              <div className="flex items-center justify-center h-[400px] text-muted-foreground">
                <div className="flex items-center gap-3">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  Loading document...
                </div>
              </div>
            ) : fileError ? (
              <div className="flex items-center justify-center h-[400px] text-muted-foreground">
                <div className="text-center">
                  <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Preview not available</p>
                </div>
              </div>
            ) : fileData && fileMimeType === 'application/pdf' ? (
              <iframe
                src={`data:application/pdf;base64,${fileData}`}
                title="Invoice PDF"
                className="w-full h-[600px] rounded-lg border border-border"
              />
            ) : fileData && (fileMimeType === 'image/png' || fileMimeType === 'image/jpeg') ? (
              <img
                src={`data:${fileMimeType};base64,${fileData}`}
                alt="Invoice"
                className="max-w-full h-auto rounded-lg border border-border"
              />
            ) : (
              <div className="flex items-center justify-center h-[400px] text-muted-foreground">
                <div className="text-center">
                  <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No document preview available</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Edit Form */}
        <div className="space-y-6">
          {/* AI Confidence */}
          {invoice.AIConfidenceScore !== undefined && (
            <ConfidenceIndicator score={invoice.AIConfidenceScore} />
          )}

          {/* Vendor Details Card */}
          <div className="bg-card rounded-xl border border-border shadow-sm p-6">
            <h2 className="font-semibold mb-4">Vendor Details</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
                <Label>Vendor</Label>
                {isEditable ? (
                  <Popover open={vendorOpen} onOpenChange={setVendorOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={vendorOpen}
                        className="w-full justify-between"
                      >
                        {formData.vendorName || 'Select vendor...'}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0 bg-popover">
                      <Command>
                        <CommandInput placeholder="Search vendors..." />
                        <CommandList>
                          <CommandEmpty>
                            <div className="p-2">
                              <p className="text-sm text-muted-foreground mb-2">
                                No vendor found
                              </p>
                              <Button
                                size="sm"
                                className="w-full gap-2"
                                onClick={() =>
                                  handleAddNewVendor(formData.vendorName)
                                }
                              >
                                <Plus className="w-4 h-4" />
                                Add New Vendor
                              </Button>
                            </div>
                          </CommandEmpty>
                          <CommandGroup>
                            {vendors?.map((vendor) => (
                              <CommandItem
                                key={vendor.VendorID}
                                value={vendor.VendorName}
                                onSelect={() => handleVendorSelect(vendor)}
                              >
                                <Check
                                  className={cn(
                                    'mr-2 h-4 w-4',
                                    formData.vendorId === vendor.VendorID
                                      ? 'opacity-100'
                                      : 'opacity-0'
                                  )}
                                />
                                {vendor.VendorName}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                ) : (
                  <p className="text-sm py-2 px-3 bg-muted rounded-md">{formData.vendorName || '-'}</p>
                )}
              </div>
            </div>
          </div>

          {/* Invoice Details */}
          <div className="bg-card rounded-xl border border-border shadow-sm p-6">
            <h2 className="font-semibold mb-4">Invoice Details</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Invoice Number</Label>
                {isEditable ? (
                  <Input
                    value={formData.invoiceNumber}
                    onChange={(e) =>
                      setFormData({ ...formData, invoiceNumber: e.target.value })
                    }
                  />
                ) : (
                  <p className="text-sm py-2 px-3 bg-muted rounded-md">{formData.invoiceNumber || '-'}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Invoice Date</Label>
                {isEditable ? (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-left font-normal',
                          !formData.invoiceDate && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.invoiceDate
                          ? format(formData.invoiceDate, 'PPP')
                          : 'Pick a date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-popover">
                      <Calendar
                        mode="single"
                        selected={formData.invoiceDate}
                        onSelect={(date) =>
                          date && setFormData({ ...formData, invoiceDate: date })
                        }
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                ) : (
                  <p className="text-sm py-2 px-3 bg-muted rounded-md">
                    {formData.invoiceDate ? format(formData.invoiceDate, 'PPP') : '-'}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Currency</Label>
                {isEditable ? (
                  <Select
                    value={formData.currencyCode}
                    onValueChange={(value) =>
                      setFormData({ ...formData, currencyCode: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover">
                      {CURRENCIES.map((currency) => (
                        <SelectItem key={currency} value={currency}>
                          {currency}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-sm py-2 px-3 bg-muted rounded-md">{formData.currencyCode}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Category</Label>
                {isEditable ? (
                  <Select
                    value={formData.categoryId.toString()}
                    onValueChange={(value) =>
                      setFormData({ ...formData, categoryId: parseInt(value) })
                    }
                  >
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
                ) : (
                  <p className="text-sm py-2 px-3 bg-muted rounded-md">
                    {invoice?.CategoryName || '-'}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Line Items */}
          <div className="bg-card rounded-xl border border-border shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">Line Items</h2>
              {isEditable && (
                <Button variant="outline" size="sm" onClick={addItem}>
                  <Plus className="w-4 h-4 mr-1" />
                  Add Item
                </Button>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-2 font-medium">Description</th>
                    <th className="text-right py-2 px-2 font-medium w-20">Qty</th>
                    <th className="text-left py-2 px-2 font-medium w-20">Unit</th>
                    <th className="text-right py-2 px-2 font-medium w-28">Unit Price</th>
                    <th className="text-right py-2 px-2 font-medium w-28">Total</th>
                    {isEditable && <th className="w-10"></th>}
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <tr key={index} className="border-b last:border-0">
                      <td className="py-2 px-2">
                        {isEditable ? (
                          <Input
                            value={item.ItemDescription}
                            onChange={(e) =>
                              updateItem(index, 'ItemDescription', e.target.value)
                            }
                            placeholder="Item description"
                            className="h-8"
                          />
                        ) : (
                          item.ItemDescription
                        )}
                      </td>
                      <td className="py-2 px-2 text-right">
                        {isEditable ? (
                          <Input
                            type="number"
                            value={item.Quantity}
                            onChange={(e) =>
                              updateItem(index, 'Quantity', parseFloat(e.target.value) || 0)
                            }
                            className="h-8 w-20 text-right"
                          />
                        ) : (
                          item.Quantity
                        )}
                      </td>
                      <td className="py-2 px-2">
                        {isEditable ? (
                          <Select
                            value={item.UnitOfMeasure}
                            onValueChange={(value) =>
                              updateItem(index, 'UnitOfMeasure', value)
                            }
                          >
                            <SelectTrigger className="h-8 w-20">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-popover">
                              {UNITS.map((unit) => (
                                <SelectItem key={unit} value={unit}>
                                  {unit}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          item.UnitOfMeasure
                        )}
                      </td>
                      <td className="py-2 px-2 text-right">
                        {isEditable ? (
                          <Input
                            type="number"
                            step="0.001"
                            value={item.UnitPrice}
                            onChange={(e) =>
                              updateItem(index, 'UnitPrice', parseFloat(e.target.value) || 0)
                            }
                            className="h-8 w-28 text-right"
                          />
                        ) : (
                          item.UnitPrice?.toFixed(3)
                        )}
                      </td>
                      <td className="py-2 px-2 text-right font-medium">
                        {item.TotalPrice?.toFixed(3)}
                      </td>
                      {isEditable && (
                        <td className="py-2 px-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeItem(index)}
                            disabled={items.length === 1}
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals */}
          <div className="bg-card rounded-xl border border-border shadow-sm p-6">
            <h2 className="font-semibold mb-4">Amount Summary</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label>Subtotal</Label>
                <p className="font-medium">
                  {formData.currencyCode} {formData.subTotal.toFixed(3)}
                </p>
              </div>
              <div className="flex justify-between items-center gap-4">
                <Label>Tax Amount</Label>
                {isEditable ? (
                  <Input
                    type="number"
                    step="0.001"
                    value={formData.taxAmount}
                    onChange={(e) => {
                      const tax = parseFloat(e.target.value) || 0;
                      setFormData((prev) => ({
                        ...prev,
                        taxAmount: tax,
                        totalAmount: prev.subTotal + tax - prev.discountAmount,
                      }));
                    }}
                    className="w-32 text-right"
                  />
                ) : (
                  <p className="font-medium">
                    {formData.currencyCode} {formData.taxAmount.toFixed(3)}
                  </p>
                )}
              </div>
              <div className="flex justify-between items-center gap-4">
                <Label>Discount Amount</Label>
                {isEditable ? (
                  <Input
                    type="number"
                    step="0.001"
                    value={formData.discountAmount}
                    onChange={(e) => {
                      const discount = parseFloat(e.target.value) || 0;
                      setFormData((prev) => ({
                        ...prev,
                        discountAmount: discount,
                        totalAmount: prev.subTotal + prev.taxAmount - discount,
                      }));
                    }}
                    className="w-32 text-right"
                  />
                ) : (
                  <p className="font-medium">
                    {formData.currencyCode} {formData.discountAmount.toFixed(3)}
                  </p>
                )}
              </div>
              <div className="border-t pt-3">
                <div className="flex justify-between items-center">
                  <Label className="text-lg font-semibold">Total Amount</Label>
                  <p className="text-xl font-bold text-primary">
                    {formData.currencyCode} {formData.totalAmount.toFixed(3)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="bg-card rounded-xl border border-border shadow-sm p-6">
            <h2 className="font-semibold mb-4">Notes</h2>
            {isEditable ? (
              <Textarea
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                placeholder="Add any notes or comments..."
                rows={3}
              />
            ) : (
              <p className="text-sm text-muted-foreground">
                {formData.notes || 'No notes'}
              </p>
            )}
          </div>
        </div>
      </div>

      <AddVendorModal
        open={addVendorOpen}
        onOpenChange={setAddVendorOpen}
        defaultVendorName={newVendorName}
        onSuccess={(vendor) => {
          setFormData((prev) => ({
            ...prev,
            vendorName: vendor.VendorName,
            vendorId: vendor.VendorID,
          }));
        }}
      />

      {/* Action Confirmation Dialog */}
      <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'approve' && 'Approve Invoice'}
              {actionType === 'reject' && 'Reject Invoice'}
              {actionType === 'correction' && 'Request Correction'}
            </DialogTitle>
            <DialogDescription>
              {actionType === 'approve' && 'Are you sure you want to approve this invoice?'}
              {actionType === 'reject' && 'Please provide a reason for rejecting this invoice.'}
              {actionType === 'correction' && 'Please describe the corrections needed.'}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label>Comment {(actionType === 'reject' || actionType === 'correction') && '(Required)'}</Label>
            <Textarea
              value={actionComment}
              onChange={(e) => setActionComment(e.target.value)}
              placeholder="Enter your comment..."
              rows={3}
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={confirmAction}
              disabled={
                approveMutation.isPending ||
                ((actionType === 'reject' || actionType === 'correction') && !actionComment.trim())
              }
              variant={actionType === 'reject' ? 'destructive' : 'default'}
              className={actionType === 'approve' ? 'bg-green-600 hover:bg-green-700' : ''}
            >
              {approveMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
