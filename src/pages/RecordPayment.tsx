import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useUser } from '@/contexts/UserContext';
import { recordPayment, getPaymentModes, getBankAccounts } from '@/lib/api-payment';
import type { PaymentMode, BankAccount } from '@/lib/api-payment';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ArrowLeft, Loader2, CheckCircle, DollarSign } from 'lucide-react';

export default function RecordPayment() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { currentUser } = useUser();

  const [loading, setLoading] = useState(false);
  const [paymentModes, setPaymentModes] = useState<PaymentMode[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);

  const [formData, setFormData] = useState({
    linkType: searchParams.get('type') || 'INVOICE', // LPO or INVOICE
    linkId: searchParams.get('id') || '',
    paymentDate: new Date().toISOString().split('T')[0],
    amount: '',
    paymentCategory: 'FULL',
    paymentModeId: '',
    bankAccountId: '',
    referenceNumber: '',
    chequeNumber: '',
    chequeDate: '',
    notes: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [modes, accounts] = await Promise.all([
        getPaymentModes(),
        getBankAccounts(),
      ]);
      setPaymentModes(Array.isArray(modes) ? modes : []);
      setBankAccounts(Array.isArray(accounts) ? accounts : []);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    setLoading(true);
    try {
      const result = await recordPayment({
        [formData.linkType === 'LPO' ? 'lpoId' : 'invoiceId']: parseInt(formData.linkId),
        paymentDate: formData.paymentDate,
        amount: parseFloat(formData.amount),
        paymentModeId: parseInt(formData.paymentModeId),
        paymentCategory: formData.paymentCategory as any,
        referenceNumber: formData.referenceNumber || undefined,
        bankAccountId: formData.bankAccountId ? parseInt(formData.bankAccountId) : undefined,
        chequeNumber: formData.chequeNumber || undefined,
        chequeDate: formData.chequeDate || undefined,
        notes: formData.notes || undefined,
        recordedBy: currentUser.UserID,
      });

      if (result.success) {
        alert('Payment recorded successfully!');
        navigate('/payments');
      } else {
        alert(result.error || 'Failed to record payment');
      }
    } catch (error) {
      console.error('Error recording payment:', error);
      alert('An error occurred');
    }
    setLoading(false);
  };

  const selectedMode = paymentModes.find(m => m.ModeID.toString() === formData.paymentModeId);
  const isPDC = formData.paymentCategory === 'PDC';
  const isBankTransfer = selectedMode?.ModeCode === 'BANK_TRANSFER';

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-3xl mx-auto">
        <Button variant="ghost" onClick={() => navigate('/payments')} className="mb-4 -ml-2">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Payments
        </Button>

        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900">Record Payment</h1>
          <p className="text-slate-500 mt-1">Record a new payment transaction</p>
        </div>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Payment Details
              </CardTitle>
              <CardDescription>Enter payment information</CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Link To Document */}
              <div>
                <Label>Link Payment To</Label>
                <div className="grid grid-cols-2 gap-3 mt-1.5">
                  <Select value={formData.linkType} onValueChange={(v) => setFormData(prev => ({ ...prev, linkType: v }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LPO">LPO (Advance)</SelectItem>
                      <SelectItem value="INVOICE">Invoice</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder={`${formData.linkType} ID`}
                    value={formData.linkId}
                    onChange={(e) => setFormData(prev => ({ ...prev, linkId: e.target.value }))}
                    required
                  />
                </div>
              </div>

              {/* Payment Category */}
              <div>
                <Label>Payment Category *</Label>
                <RadioGroup value={formData.paymentCategory} onValueChange={(v) => setFormData(prev => ({ ...prev, paymentCategory: v }))}>
                  <div className="grid grid-cols-2 gap-3 mt-1.5">
                    <div className="flex items-center space-x-2 border rounded-lg p-3">
                      <RadioGroupItem value="ADVANCE" id="advance" />
                      <Label htmlFor="advance" className="cursor-pointer flex-1">Advance Payment</Label>
                    </div>
                    <div className="flex items-center space-x-2 border rounded-lg p-3">
                      <RadioGroupItem value="PDC" id="pdc" />
                      <Label htmlFor="pdc" className="cursor-pointer flex-1">Post-Dated Cheque</Label>
                    </div>
                    <div className="flex items-center space-x-2 border rounded-lg p-3">
                      <RadioGroupItem value="BALANCE" id="balance" />
                      <Label htmlFor="balance" className="cursor-pointer flex-1">Balance Payment</Label>
                    </div>
                    <div className="flex items-center space-x-2 border rounded-lg p-3">
                      <RadioGroupItem value="FULL" id="full" />
                      <Label htmlFor="full" className="cursor-pointer flex-1">Full Payment</Label>
                    </div>
                  </div>
                </RadioGroup>
              </div>

              {/* Payment Mode */}
              <div>
                <Label>Payment Mode *</Label>
                <Select value={formData.paymentModeId} onValueChange={(v) => setFormData(prev => ({ ...prev, paymentModeId: v }))}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="Select payment mode" />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentModes.map(mode => (
                      <SelectItem key={mode.ModeID} value={mode.ModeID.toString()}>
                        {mode.ModeName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Bank Account (for Bank Transfer) */}
              {isBankTransfer && (
                <div>
                  <Label>From Bank Account *</Label>
                  <Select value={formData.bankAccountId} onValueChange={(v) => setFormData(prev => ({ ...prev, bankAccountId: v }))}>
                    <SelectTrigger className="mt-1.5">
                      <SelectValue placeholder="Select bank account" />
                    </SelectTrigger>
                    <SelectContent>
                      {bankAccounts.map(account => (
                        <SelectItem key={account.BankAccountID} value={account.BankAccountID.toString()}>
                          {account.BankName} - {account.AccountNumber}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Amount */}
              <div>
                <Label>Amount (OMR) *</Label>
                <Input
                  type="number"
                  step="0.001"
                  value={formData.amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                  placeholder="0.000"
                  className="mt-1.5"
                  required
                />
              </div>

              {/* Payment Date */}
              <div>
                <Label>Payment Date *</Label>
                <Input
                  type="date"
                  value={formData.paymentDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, paymentDate: e.target.value }))}
                  className="mt-1.5"
                  required
                />
              </div>

              {/* PDC-specific fields */}
              {isPDC && (
                <>
                  <div>
                    <Label>Cheque Number *</Label>
                    <Input
                      value={formData.chequeNumber}
                      onChange={(e) => setFormData(prev => ({ ...prev, chequeNumber: e.target.value }))}
                      placeholder="123456"
                      className="mt-1.5"
                      required
                    />
                  </div>
                  <div>
                    <Label>Cheque Date (Post-Dated) *</Label>
                    <Input
                      type="date"
                      value={formData.chequeDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, chequeDate: e.target.value }))}
                      className="mt-1.5"
                      required
                    />
                  </div>
                </>
              )}

              {/* Reference Number */}
              <div>
                <Label>Reference Number</Label>
                <Input
                  value={formData.referenceNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, referenceNumber: e.target.value }))}
                  placeholder="TRF-123456"
                  className="mt-1.5"
                />
              </div>

              {/* Notes */}
              <div>
                <Label>Notes</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Additional notes..."
                  rows={3}
                  className="mt-1.5"
                />
              </div>

              {/* Submit Button */}
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Recording...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Record Payment
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  );
}
