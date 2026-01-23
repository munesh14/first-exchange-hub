import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getLPO, type LPO, type LPOItem } from '@/lib/api-lpo';
import { createDeliveryOrder } from '@/lib/api-delivery-order';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Loader2, Save, CheckCircle2 } from 'lucide-react';

interface DeliveryItem {
  lpoItemId: number;
  lineNumber: number;
  description: string;
  orderedQty: number;
  receivedQty: number;
  unitOfMeasure: string;
}

export default function DeliveryOrderNew() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  const chainId = searchParams.get('chainId');
  const lpoId = searchParams.get('lpoId');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lpo, setLpo] = useState<LPO | null>(null);
  const [items, setItems] = useState<DeliveryItem[]>([]);
  const [deliveryDate, setDeliveryDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [deliveryNoteNumber, setDeliveryNoteNumber] = useState('');
  const [remarks, setRemarks] = useState('');

  useEffect(() => {
    if (!chainId) {
      toast({
        title: 'Error',
        description: 'Chain ID is required',
        variant: 'destructive',
      });
      navigate('/chains');
      return;
    }

    if (lpoId) {
      loadLPOData();
    } else {
      setLoading(false);
    }
  }, [chainId, lpoId]);

  async function loadLPOData() {
    if (!lpoId) return;

    try {
      const response = await getLPO(lpoId);
      if (response.lpo && response.items) {
        setLpo(response.lpo);

        // Map LPO items to delivery items with default received = ordered
        const deliveryItems: DeliveryItem[] = response.items.map((item: LPOItem) => ({
          lpoItemId: item.LPOItemID,
          lineNumber: item.LineNumber,
          description: item.ItemDescription,
          orderedQty: item.Quantity,
          receivedQty: item.Quantity, // Default to full quantity
          unitOfMeasure: item.UnitOfMeasure || 'pcs',
        }));

        setItems(deliveryItems);
      }
    } catch (error) {
      console.error('Error loading LPO:', error);
      toast({
        title: 'Error',
        description: 'Failed to load LPO data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  function handleQuantityChange(index: number, value: string) {
    const qty = parseFloat(value) || 0;
    const updatedItems = [...items];
    updatedItems[index].receivedQty = qty;
    setItems(updatedItems);
  }

  function markAllReceived() {
    const updatedItems = items.map(item => ({
      ...item,
      receivedQty: item.orderedQty,
    }));
    setItems(updatedItems);
  }

  function getItemStatus(item: DeliveryItem): {
    label: string;
    color: string;
    icon: string;
  } {
    if (item.receivedQty === item.orderedQty) {
      return { label: 'Full', color: 'text-green-600', icon: '✓' };
    } else if (item.receivedQty > 0 && item.receivedQty < item.orderedQty) {
      return { label: 'Partial', color: 'text-amber-600', icon: '⚠' };
    } else {
      return { label: 'Pending', color: 'text-slate-400', icon: '○' };
    }
  }

  function getOverallStatus(): 'RECEIVED' | 'PARTIAL' {
    const allFull = items.every(item => item.receivedQty === item.orderedQty);
    return allFull ? 'RECEIVED' : 'PARTIAL';
  }

  async function handleSave() {
    if (!chainId) {
      toast({
        title: 'Error',
        description: 'Chain ID is missing',
        variant: 'destructive',
      });
      return;
    }

    if (items.length === 0) {
      toast({
        title: 'Error',
        description: 'No items to save',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);

    try {
      // Calculate totals
      const totalOrdered = items.reduce((sum, item) => sum + item.orderedQty, 0);
      const totalReceived = items.reduce((sum, item) => sum + item.receivedQty, 0);

      const data = {
        chainId,
        lpoId: lpo?.LPOID,
        vendorId: lpo?.VendorID,
        vendorName: lpo?.VendorName || 'Unknown Vendor',
        doDate: deliveryDate,
        receivedDate: deliveryDate,
        receivedBy: 'Current User', // TODO: Get from user context
        receivedByUserId: 1, // TODO: Get from user context
        departmentId: lpo?.RequestingDepartmentID || 1,
        branchId: lpo?.RequestingBranchID,
        totalItemsOrdered: totalOrdered,
        totalItemsReceived: totalReceived,
        // Note: Status is auto-determined by backend based on received quantities
        notes: `${deliveryNoteNumber ? `Delivery Note: ${deliveryNoteNumber}\n` : ''}${remarks || ''}`.trim() || undefined,
        createdBy: 1, // TODO: Get from user context
        items: items.map((item, index) => ({
          description: item.description,
          quantityOrdered: item.orderedQty,
          quantityReceived: item.receivedQty,
          unitOfMeasure: item.unitOfMeasure,
        })),
      };

      const response = await createDeliveryOrder(data as any);

      if (response.success) {
        const doNumber = response.data?.doNumber || response.doNumber || 'DO';
        toast({
          title: 'Success',
          description: `Delivery Order ${doNumber} created successfully`,
        });
        navigate(`/chains/${chainId}`);
      } else {
        throw new Error(response.error || 'Failed to create delivery order');
      }
    } catch (error) {
      console.error('Error creating delivery order:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create delivery order',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50 p-6 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <Button
          variant="ghost"
          onClick={() => navigate(`/chains/${chainId}`)}
          className="mb-4 gap-2 hover:bg-white/80"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Chain
        </Button>

        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">ADD DELIVERY ORDER</h1>
          {lpo && (
            <p className="text-slate-600">
              Record goods receipt for LPO: <span className="font-semibold">{lpo.LPONumber}</span>
            </p>
          )}
        </div>

        {/* Delivery Details Card */}
        <Card className="mb-6 border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-white">
            <CardTitle className="text-lg">Delivery Details</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="deliveryDate">
                  Delivery Date <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="deliveryDate"
                  type="date"
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="receivedBy">Received By</Label>
                <Input
                  id="receivedBy"
                  value="Current User" // TODO: Get from user context
                  disabled
                  className="mt-1 bg-slate-50"
                />
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="deliveryNote">Delivery Note Number (optional)</Label>
                <Input
                  id="deliveryNote"
                  placeholder="e.g., DN-12345"
                  value={deliveryNoteNumber}
                  onChange={(e) => setDeliveryNoteNumber(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Items Received Card */}
        <Card className="mb-6 border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-white">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Items Received</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={markAllReceived}
                className="gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                Mark All Received
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {items.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                No items found. Please select an LPO with items.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-slate-200">
                      <th className="text-left py-3 px-2 text-sm font-semibold text-slate-700">
                        #
                      </th>
                      <th className="text-left py-3 px-2 text-sm font-semibold text-slate-700">
                        Description
                      </th>
                      <th className="text-center py-3 px-2 text-sm font-semibold text-slate-700">
                        Ordered
                      </th>
                      <th className="text-center py-3 px-2 text-sm font-semibold text-slate-700">
                        Received
                      </th>
                      <th className="text-center py-3 px-2 text-sm font-semibold text-slate-700">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, index) => {
                      const status = getItemStatus(item);
                      return (
                        <tr key={item.lpoItemId} className="border-b border-slate-100">
                          <td className="py-3 px-2 text-sm text-slate-600">
                            {item.lineNumber}
                          </td>
                          <td className="py-3 px-2 text-sm text-slate-900">
                            {item.description}
                          </td>
                          <td className="py-3 px-2 text-sm text-center text-slate-700">
                            {item.orderedQty}
                          </td>
                          <td className="py-3 px-2 text-center">
                            <Input
                              type="number"
                              min="0"
                              max={item.orderedQty}
                              value={item.receivedQty}
                              onChange={(e) => handleQuantityChange(index, e.target.value)}
                              className="w-20 text-center"
                            />
                          </td>
                          <td className="py-3 px-2 text-center">
                            <Badge
                              variant="outline"
                              className={`${status.color} border-current`}
                            >
                              {status.icon} {status.label}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Remarks Card */}
        <Card className="mb-6 border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-white">
            <CardTitle className="text-lg">Remarks</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <Textarea
              placeholder="Optional notes..."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              rows={3}
            />
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <Button
            variant="outline"
            onClick={() => navigate(`/chains/${chainId}`)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || items.length === 0}
            className="gap-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white shadow-lg"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Delivery Order
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
