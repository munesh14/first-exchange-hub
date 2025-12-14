import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, InvoiceItem, Vendor } from '@/lib/api';
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
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import {
  Calendar as CalendarIcon,
  Save,
  Send,
  Plus,
  Trash2,
  FileText,
  Image,
  Loader2,
  Check,
  ChevronsUpDown,
  Building2,
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
  const { uuid } = useParams<{ uuid: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

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

  const { data: invoiceData, isLoading } = useQuery({
    queryKey: ['invoice', uuid],
    queryFn: () => api.getInvoice(uuid!),
    enabled: !!uuid,
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
    }
  }, [invoiceData]);

  const updateMutation = useMutation({
    mutationFn: (data: any) => api.updateInvoice(uuid!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoice', uuid] });
      toast({
        title: 'Changes Saved',
        description: 'Invoice has been updated successfully.',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to save changes. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const submitMutation = useMutation({
    mutationFn: () => api.submitInvoice(uuid!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoice', uuid] });
      toast({
        title: 'Invoice Submitted',
        description: 'Invoice has been submitted for approval.',
      });
      navigate('/invoices');
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to submit invoice. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const handleSave = () => {
    updateMutation.mutate({
      ...formData,
      items,
    });
  };

  const handleSubmit = () => {
    handleSave();
    submitMutation.mutate();
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

    // Auto-calculate total price
    if (field === 'Quantity' || field === 'UnitPrice') {
      newItems[index].TotalPrice =
        (newItems[index].Quantity || 0) * (newItems[index].UnitPrice || 0);
    }

    setItems(newItems);

    // Update subtotal
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
        </div>
      </div>
    );
  }

  const { invoice } = invoiceData;
  const isImage = invoice.FileType?.startsWith('image/');

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={`Invoice ${invoice.InvoiceNumber}`}
        breadcrumbs={[
          { label: 'All Invoices', href: '/invoices' },
          { label: invoice.InvoiceNumber },
        ]}
        actions={
          <div className="flex items-center gap-3">
            <StatusBadge status={invoice.StatusCode} />
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
              disabled={submitMutation.isPending}
              className="gap-2"
            >
              {submitMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              Submit for Approval
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Document Preview */}
        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="p-4 border-b border-border bg-muted/30">
            <h2 className="font-semibold">Original Document</h2>
          </div>
          <div className="p-4 min-h-[500px] bg-muted/10">
            {invoice.FileURL ? (
              isImage ? (
                <img
                  src={invoice.FileURL}
                  alt="Invoice"
                  className="max-w-full h-auto rounded-lg border border-border"
                />
              ) : (
                <iframe
                  src={invoice.FileURL}
                  title="Invoice PDF"
                  className="w-full h-[600px] rounded-lg border border-border"
                />
              )
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

          {/* Invoice Details */}
          <div className="bg-card rounded-xl border border-border shadow-sm p-6">
            <h2 className="font-semibold mb-4">Invoice Details</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Invoice Number</Label>
                <Input
                  value={formData.invoiceNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, invoiceNumber: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Invoice Date</Label>
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
              </div>

              <div className="space-y-2">
                <Label>Vendor</Label>
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
              </div>

              <div className="space-y-2">
                <Label>Currency</Label>
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
              </div>

              <div className="space-y-2 col-span-2">
                <Label>Category</Label>
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
              </div>
            </div>
          </div>

          {/* Line Items */}
          <div className="bg-card rounded-xl border border-border shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">Line Items</h2>
              <Button variant="outline" size="sm" onClick={addItem}>
                <Plus className="w-4 h-4 mr-1" />
                Add Item
              </Button>
            </div>

            <div className="space-y-4">
              {items.map((item, index) => (
                <div
                  key={index}
                  className="grid grid-cols-12 gap-2 items-end p-3 bg-muted/30 rounded-lg"
                >
                  <div className="col-span-4 space-y-1">
                    <Label className="text-xs">Description</Label>
                    <Input
                      value={item.ItemDescription}
                      onChange={(e) =>
                        updateItem(index, 'ItemDescription', e.target.value)
                      }
                      placeholder="Item description"
                    />
                  </div>
                  <div className="col-span-2 space-y-1">
                    <Label className="text-xs">Qty</Label>
                    <Input
                      type="number"
                      value={item.Quantity}
                      onChange={(e) =>
                        updateItem(index, 'Quantity', parseFloat(e.target.value) || 0)
                      }
                    />
                  </div>
                  <div className="col-span-2 space-y-1">
                    <Label className="text-xs">Unit</Label>
                    <Select
                      value={item.UnitOfMeasure}
                      onValueChange={(value) =>
                        updateItem(index, 'UnitOfMeasure', value)
                      }
                    >
                      <SelectTrigger>
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
                  </div>
                  <div className="col-span-2 space-y-1">
                    <Label className="text-xs">Unit Price</Label>
                    <Input
                      type="number"
                      step="0.001"
                      value={item.UnitPrice}
                      onChange={(e) =>
                        updateItem(index, 'UnitPrice', parseFloat(e.target.value) || 0)
                      }
                    />
                  </div>
                  <div className="col-span-1 space-y-1">
                    <Label className="text-xs">Total</Label>
                    <p className="h-10 flex items-center font-medium text-sm">
                      {item.TotalPrice?.toFixed(3)}
                    </p>
                  </div>
                  <div className="col-span-1 flex justify-end">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeItem(index)}
                      disabled={items.length === 1}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="bg-card rounded-xl border border-border shadow-sm p-6">
            <h2 className="font-semibold mb-4">Totals</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label>Subtotal</Label>
                <p className="font-medium">
                  {formData.currencyCode} {formData.subTotal.toFixed(3)}
                </p>
              </div>
              <div className="flex justify-between items-center gap-4">
                <Label>Tax Amount</Label>
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
              </div>
              <div className="flex justify-between items-center gap-4">
                <Label>Discount Amount</Label>
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
            <Textarea
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              placeholder="Add any notes or comments..."
              rows={3}
            />
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
    </div>
  );
}
