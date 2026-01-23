import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUser } from '@/contexts/UserContext';
import {
  getQuotation,
  selectQuotation,
  createLPOFromQuotation,
  downloadQuotationFile,
} from '@/lib/api-quotation';
import type { Quotation, QuotationItem } from '@/lib/api-quotation';
import QuotationItemsTable from '@/components/quotations/QuotationItemsTable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  ArrowLeft, Download, CheckCircle, FileText, Calendar,
  Building2, User, DollarSign, Loader2, ShoppingCart
} from 'lucide-react';

export default function QuotationDetail() {
  const { uuid } = useParams<{ uuid: string }>();
  const navigate = useNavigate();
  const { currentUser } = useUser();

  const [loading, setLoading] = useState(true);
  const [quotation, setQuotation] = useState<Quotation | null>(null);
  const [items, setItems] = useState<QuotationItem[]>([]);

  const [showSelectDialog, setShowSelectDialog] = useState(false);
  const [showCreateLPODialog, setShowCreateLPODialog] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const [selectionNotes, setSelectionNotes] = useState('');
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('30 Days');
  const [lpoNotes, setLpoNotes] = useState('');

  useEffect(() => {
    if (uuid) {
      loadData();
    }
  }, [uuid]);

  async function loadData() {
    if (!uuid) return;
    setLoading(true);
    try {
      const data = await getQuotation(uuid);
      setQuotation(data.quotation);
      setItems(Array.isArray(data.items) ? data.items : []);
    } catch (error) {
      console.error('Error loading quotation:', error);
    }
    setLoading(false);
  }

  const handleSelect = async () => {
    if (!uuid || !currentUser) return;
    setActionLoading(true);
    try {
      const result = await selectQuotation(uuid, currentUser.UserID, selectionNotes);
      if (result.success) {
        setShowSelectDialog(false);
        loadData();
        alert('Quotation selected successfully!');
      } else {
        alert(result.error || 'Failed to select quotation');
      }
    } catch (error) {
      console.error('Error selecting quotation:', error);
      alert('An error occurred');
    }
    setActionLoading(false);
  };

  const handleCreateLPO = async () => {
    if (!uuid || !currentUser) return;
    setActionLoading(true);
    try {
      const result = await createLPOFromQuotation(uuid, currentUser.UserID, {
        expectedDeliveryDate,
        paymentTerms,
        notes: lpoNotes,
      });

      if (result.success && result.lpoUuid) {
        setShowCreateLPODialog(false);
        alert(`LPO created successfully! ${result.lpoNumber}`);
        navigate(`/lpo/${result.lpoUuid}`);
      } else {
        alert(result.error || 'Failed to create LPO');
      }
    } catch (error) {
      console.error('Error creating LPO:', error);
      alert('An error occurred');
    }
    setActionLoading(false);
  };

  const handleDownload = () => {
    if (!quotation?.FilePath || quotation.FilePath === '') {
      alert('No file attached to this quotation');
      return;
    }
    if (uuid) {
      downloadQuotationFile(uuid);
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatCurrency = (amount: number, currency = 'OMR') => {
    return `${amount.toFixed(3)} ${currency}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!quotation) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <FileText className="w-16 h-16 text-slate-300 mb-4" />
        <p className="text-xl text-slate-600">Quotation not found</p>
        <Button variant="outline" onClick={() => navigate('/quotations')} className="mt-4">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Quotations
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button variant="ghost" onClick={() => navigate('/quotations')} className="mb-4 -ml-2">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Quotations
          </Button>

          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-slate-900">
                  {quotation.QuotationNumber}
                </h1>
                {quotation.IsSelected && (
                  <Badge className="bg-green-100 text-green-700 gap-1">
                    <CheckCircle className="w-3 h-3" />
                    Selected
                  </Badge>
                )}
              </div>
              <p className="text-slate-500 mt-1">
                Uploaded on {formatDate(quotation.UploadedAt)} by {quotation.UploadedByName}
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleDownload}
                disabled={!quotation.FilePath || quotation.FilePath === ''}
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>

              {!quotation.IsSelected && (
                <Button onClick={() => setShowSelectDialog(true)} className="bg-blue-600">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Select Quotation
                </Button>
              )}

              {quotation.IsSelected && (
                <Button onClick={() => setShowCreateLPODialog(true)} className="bg-green-600">
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Create LPO
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
                <Building2 className="w-4 h-4" /> Vendor
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-semibold text-lg">{quotation.VendorName}</p>
              {quotation.VendorAddress && <p className="text-sm text-slate-500 mt-1">{quotation.VendorAddress}</p>}
              {quotation.VendorPhone && <p className="text-sm text-slate-500">{quotation.VendorPhone}</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
                <User className="w-4 h-4" /> Department
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-semibold text-lg">{quotation.BranchName}</p>
              <p className="text-sm text-slate-500">{quotation.DepartmentName}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
                <Calendar className="w-4 h-4" /> Quotation Info
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Date:</span>
                  <span className="font-medium">{formatDate(quotation.QuotationDate)}</span>
                </div>
                {quotation.ValidityDays && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Validity:</span>
                    <span className="font-medium">{quotation.ValidityDays} days</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Selection Info */}
        {quotation.IsSelected && quotation.SelectedByName && (
          <Card className="mb-6 border-green-200 bg-green-50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-green-900">
                    Selected by {quotation.SelectedByName}
                  </p>
                  <p className="text-sm text-green-700">{formatDate(quotation.SelectedAt)}</p>
                  {quotation.SelectionNotes && (
                    <p className="text-sm text-green-600 mt-1">{quotation.SelectionNotes}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Line Items */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Line Items ({items.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <QuotationItemsTable items={items} currencyCode={quotation.CurrencyCode} />
          </CardContent>
        </Card>

        {/* Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Subtotal:</span>
                <span className="font-medium">{formatCurrency(quotation.SubTotal, quotation.CurrencyCode)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">VAT ({quotation.VATPercent}%):</span>
                <span className="font-medium">{formatCurrency(quotation.VATAmount, quotation.CurrencyCode)}</span>
              </div>
              {quotation.DiscountAmount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Discount:</span>
                  <span className="font-medium text-green-600">-{formatCurrency(quotation.DiscountAmount, quotation.CurrencyCode)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-semibold pt-2 border-t">
                <span>Total:</span>
                <span className="text-blue-600">{formatCurrency(quotation.TotalAmount, quotation.CurrencyCode)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Select Dialog */}
        <Dialog open={showSelectDialog} onOpenChange={setShowSelectDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Select Quotation</DialogTitle>
              <DialogDescription>
                Mark this quotation as selected for LPO creation
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Selection Notes (Optional)</Label>
                <Textarea
                  value={selectionNotes}
                  onChange={(e) => setSelectionNotes(e.target.value)}
                  placeholder="Reason for selection..."
                  className="mt-1.5"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowSelectDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleSelect} disabled={actionLoading}>
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Select'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Create LPO Dialog */}
        <Dialog open={showCreateLPODialog} onOpenChange={setShowCreateLPODialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create LPO</DialogTitle>
              <DialogDescription>
                Create a Local Purchase Order from this quotation
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Expected Delivery Date</Label>
                <Input
                  type="date"
                  value={expectedDeliveryDate}
                  onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label>Payment Terms</Label>
                <Input
                  value={paymentTerms}
                  onChange={(e) => setPaymentTerms(e.target.value)}
                  placeholder="e.g., 30 Days"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label>Notes (Optional)</Label>
                <Textarea
                  value={lpoNotes}
                  onChange={(e) => setLpoNotes(e.target.value)}
                  placeholder="Additional notes..."
                  className="mt-1.5"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateLPODialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateLPO} disabled={actionLoading} className="bg-green-600">
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create LPO'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
