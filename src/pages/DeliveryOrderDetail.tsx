import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUser } from '@/contexts/UserContext';
import { getDeliveryOrder, receiveDeliveryItems } from '@/lib/api-delivery-order';
import type { DeliveryOrder, DeliveryOrderItem, DeliveryOrderReceipt } from '@/lib/api-delivery-order';
import { getBranches } from '@/lib/api-lpo';
import type { Branch } from '@/lib/api-lpo';
import DOItemsReceiver from '@/components/delivery-orders/DOItemsReceiver';
import DOTimeline from '@/components/delivery-orders/DOTimeline';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Truck, Calendar, Building2, User, Loader2, Package } from 'lucide-react';

const CONDITIONS = ['NEW', 'GOOD', 'DAMAGED', 'DEFECTIVE'];

export default function DeliveryOrderDetail() {
  const { uuid } = useParams<{ uuid: string }>();
  const navigate = useNavigate();
  const { currentUser } = useUser();

  const [loading, setLoading] = useState(true);
  const [deliveryOrder, setDeliveryOrder] = useState<DeliveryOrder | null>(null);
  const [items, setItems] = useState<DeliveryOrderItem[]>([]);
  const [receipts, setReceipts] = useState<DeliveryOrderReceipt[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);

  const [showReceiveDialog, setShowReceiveDialog] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

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
  }, [uuid]);

  async function loadData() {
    if (!uuid) return;
    setLoading(true);
    try {
      const data = await getDeliveryOrder(uuid);
      setDeliveryOrder(data.deliveryOrder);
      setItems(Array.isArray(data.items) ? data.items : []);
      setReceipts(Array.isArray(data.receipts) ? data.receipts : []);
    } catch (error) {
      console.error('Error loading delivery order:', error);
    }
    setLoading(false);
  }

  async function loadBranches() {
    try {
      const data = await getBranches();
      setBranches(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading branches:', error);
    }
  }

  const handleReceive = async (itemId: number, quantity: number) => {
    if (!currentUser) return;
    setSelectedItemId(itemId);
    setReceiveForm(prev => ({ ...prev, quantity }));
    setShowReceiveDialog(true);
  };

  const handleConfirmReceive = async () => {
    if (!selectedItemId || !currentUser || !receiveForm.branchId) return;

    setActionLoading(true);
    try {
      const serialNumbers = receiveForm.serialNumbers
        .split('\n')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      const result = await receiveDeliveryItems({
        doItemId: selectedItemId,
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
        alert(`Received ${receiveForm.quantity} item(s)${result.assetsCreated ? `. ${result.assetsCreated.length} assets created.` : ''}`);
        setShowReceiveDialog(false);
        setSelectedItemId(null);
        loadData();
      } else {
        alert(result.error || 'Failed to receive items');
      }
    } catch (error) {
      console.error('Error receiving items:', error);
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!deliveryOrder) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <Truck className="w-16 h-16 text-slate-300 mb-4" />
        <p className="text-xl text-slate-600">Delivery Order not found</p>
        <Button variant="outline" onClick={() => navigate('/delivery-orders')} className="mt-4">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Delivery Orders
        </Button>
      </div>
    );
  }

  const canReceive = ['PENDING', 'PARTIALLY_RECEIVED'].includes(deliveryOrder.Status);

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-6xl mx-auto">
        <Button variant="ghost" onClick={() => navigate('/delivery-orders')} className="mb-4 -ml-2">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Delivery Orders
        </Button>

        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{deliveryOrder.DONumber}</h1>
            <p className="text-slate-500 mt-1">
              Created on {formatDate(deliveryOrder.CreatedAt)} by {deliveryOrder.CreatedByName}
            </p>
          </div>
          <Badge className={
            deliveryOrder.Status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
            deliveryOrder.Status === 'PARTIALLY_RECEIVED' ? 'bg-blue-100 text-blue-700' :
            'bg-green-100 text-green-700'
          }>
            {deliveryOrder.StatusName}
          </Badge>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
                <Building2 className="w-4 h-4" /> Vendor
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-semibold text-lg">{deliveryOrder.VendorName}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
                <Calendar className="w-4 h-4" /> Delivery Info
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">DO Date:</span>
                  <span className="font-medium">{formatDate(deliveryOrder.DODate)}</span>
                </div>
                {deliveryOrder.ExpectedDeliveryDate && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Expected:</span>
                    <span className="font-medium">{formatDate(deliveryOrder.ExpectedDeliveryDate)}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
                <Package className="w-4 h-4" /> Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm">
                <div className="flex justify-between mb-2">
                  <span className="text-slate-500">Received:</span>
                  <span className="font-medium">{deliveryOrder.ReceivedQuantity} / {deliveryOrder.TotalQuantity}</span>
                </div>
                <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600"
                    style={{ width: `${(deliveryOrder.ReceivedQuantity / deliveryOrder.TotalQuantity) * 100}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Items and Timeline */}
        <Tabs defaultValue="items" className="mb-6">
          <TabsList>
            <TabsTrigger value="items">Items ({items.length})</TabsTrigger>
            <TabsTrigger value="timeline">Receipt History ({receipts.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="items" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Delivery Items</CardTitle>
              </CardHeader>
              <CardContent>
                <DOItemsReceiver
                  items={items}
                  onReceive={canReceive ? handleReceive : undefined}
                  readOnly={!canReceive}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="timeline" className="mt-4">
            <DOTimeline receipts={receipts} />
          </TabsContent>
        </Tabs>

        {/* Receive Dialog */}
        <Dialog open={showReceiveDialog} onOpenChange={setShowReceiveDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Receive Items</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Quantity to Receive *</Label>
                <Input
                  type="number"
                  value={receiveForm.quantity}
                  onChange={(e) => setReceiveForm(prev => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))}
                  min={1}
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
                <Label>Serial Numbers (one per line)</Label>
                <Textarea
                  value={receiveForm.serialNumbers}
                  onChange={(e) => setReceiveForm(prev => ({ ...prev, serialNumbers: e.target.value }))}
                  placeholder="SN-001&#10;SN-002"
                  rows={3}
                  className="mt-1.5 font-mono text-sm"
                />
              </div>

              <div>
                <Label>Notes</Label>
                <Textarea
                  value={receiveForm.notes}
                  onChange={(e) => setReceiveForm(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Additional notes..."
                  rows={2}
                  className="mt-1.5"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowReceiveDialog(false)}>Cancel</Button>
              <Button
                onClick={handleConfirmReceive}
                disabled={actionLoading || !receiveForm.branchId || receiveForm.quantity < 1}
                className="bg-green-600"
              >
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Receive & Create Assets'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
