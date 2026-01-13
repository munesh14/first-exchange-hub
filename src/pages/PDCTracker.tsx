import { useState, useEffect } from 'react';
import { getPDCTracker, updatePDCStatus } from '@/lib/api-payment';
import type { Payment } from '@/lib/api-payment';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Loader2, CreditCard, Calendar, AlertCircle } from 'lucide-react';

export default function PDCTracker() {
  const [loading, setLoading] = useState(true);
  const [pdcs, setPdcs] = useState<Payment[]>([]);
  const [selectedPDC, setSelectedPDC] = useState<Payment | null>(null);
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [statusDate, setStatusDate] = useState(new Date().toISOString().split('T')[0]);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadPDCs();
  }, []);

  async function loadPDCs() {
    setLoading(true);
    try {
      const data = await getPDCTracker();
      setPdcs(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading PDCs:', error);
    }
    setLoading(false);
  }

  const handleUpdateStatus = async () => {
    if (!selectedPDC || !newStatus) return;

    setActionLoading(true);
    try {
      const result = await updatePDCStatus(selectedPDC.PaymentUUID, newStatus, statusDate);
      if (result.success) {
        setShowUpdateDialog(false);
        loadPDCs();
        alert('PDC status updated successfully!');
      } else {
        alert(result.error || 'Failed to update status');
      }
    } catch (error) {
      console.error('Error updating PDC status:', error);
      alert('An error occurred');
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

  const formatCurrency = (amount: number, currency = 'OMR') => {
    return `${amount.toFixed(3)} ${currency}`;
  };

  const getStatusBadge = (status: string | null) => {
    const config: Record<string, { bg: string; color: string }> = {
      PENDING: { bg: 'bg-yellow-100', color: 'text-yellow-700' },
      DEPOSITED: { bg: 'bg-blue-100', color: 'text-blue-700' },
      CLEARED: { bg: 'bg-green-100', color: 'text-green-700' },
      BOUNCED: { bg: 'bg-red-100', color: 'text-red-700' },
      CANCELLED: { bg: 'bg-slate-100', color: 'text-slate-700' },
    };

    const cfg = config[status || 'PENDING'] || config.PENDING;
    return <Badge className={`${cfg.bg} ${cfg.color}`}>{status || 'PENDING'}</Badge>;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const pending = pdcs.filter(p => p.PDCStatus === 'PENDING');
  const deposited = pdcs.filter(p => p.PDCStatus === 'DEPOSITED');
  const cleared = pdcs.filter(p => p.PDCStatus === 'CLEARED');

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900">PDC Tracker</h1>
          <p className="text-slate-500 mt-1">Track post-dated cheques</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Total PDCs</p>
                  <p className="text-2xl font-bold">{pdcs.length}</p>
                </div>
                <CreditCard className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Pending</p>
                  <p className="text-2xl font-bold text-yellow-600">{pending.length}</p>
                </div>
                <AlertCircle className="w-8 h-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Deposited</p>
                  <p className="text-2xl font-bold text-blue-600">{deposited.length}</p>
                </div>
                <CreditCard className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Cleared</p>
                  <p className="text-2xl font-bold text-green-600">{cleared.length}</p>
                </div>
                <CreditCard className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* PDC Table */}
        <Card>
          <CardHeader>
            <CardTitle>Post-Dated Cheques</CardTitle>
          </CardHeader>
          <CardContent>
            {pdcs.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <CreditCard className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p>No PDCs found</p>
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50">
                      <TableHead>Cheque #</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Cheque Date</TableHead>
                      <TableHead>Bank</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pdcs.map((pdc) => (
                      <TableRow key={pdc.PaymentID}>
                        <TableCell className="font-mono">{pdc.ChequeNumber}</TableCell>
                        <TableCell className="font-semibold">
                          {formatCurrency(pdc.Amount, pdc.CurrencyCode)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-slate-400" />
                            {formatDate(pdc.ChequeDate)}
                          </div>
                        </TableCell>
                        <TableCell>{pdc.BankAccountName || pdc.BankName || '-'}</TableCell>
                        <TableCell>{getStatusBadge(pdc.PDCStatus)}</TableCell>
                        <TableCell>
                          {pdc.PDCStatus !== 'CLEARED' && pdc.PDCStatus !== 'CANCELLED' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedPDC(pdc);
                                setNewStatus(pdc.PDCStatus === 'PENDING' ? 'DEPOSITED' : 'CLEARED');
                                setShowUpdateDialog(true);
                              }}
                            >
                              Update
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Update Status Dialog */}
        <Dialog open={showUpdateDialog} onOpenChange={setShowUpdateDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Update PDC Status</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Cheque Number</Label>
                <Input value={selectedPDC?.ChequeNumber || ''} disabled className="mt-1.5" />
              </div>
              <div>
                <Label>New Status *</Label>
                <Input value={newStatus} disabled className="mt-1.5" />
              </div>
              <div>
                <Label>{newStatus === 'DEPOSITED' ? 'Deposit Date' : 'Clear Date'} *</Label>
                <Input
                  type="date"
                  value={statusDate}
                  onChange={(e) => setStatusDate(e.target.value)}
                  className="mt-1.5"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowUpdateDialog(false)}>Cancel</Button>
              <Button onClick={handleUpdateStatus} disabled={actionLoading}>
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Update Status'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
