import { useState } from 'react';
import type { DeliveryOrderItem } from '@/lib/api-delivery-order';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Package, CheckCircle } from 'lucide-react';

interface DOItemsReceiverProps {
  items: DeliveryOrderItem[];
  onReceive?: (itemId: number, quantity: number) => void;
  readOnly?: boolean;
}

export default function DOItemsReceiver({ items, onReceive, readOnly = false }: DOItemsReceiverProps) {
  const [receivingQuantities, setReceivingQuantities] = useState<Record<number, number>>({});

  const handleQuantityChange = (itemId: number, value: string) => {
    const quantity = parseInt(value) || 0;
    setReceivingQuantities(prev => ({ ...prev, [itemId]: quantity }));
  };

  const handleReceive = (item: DeliveryOrderItem) => {
    const quantity = receivingQuantities[item.DOItemID] || 0;
    if (quantity > 0 && quantity <= item.PendingQuantity && onReceive) {
      onReceive(item.DOItemID, quantity);
      setReceivingQuantities(prev => ({ ...prev, [item.DOItemID]: 0 }));
    }
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500">
        No items found
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50">
            <TableHead className="w-16">Line</TableHead>
            <TableHead>Description</TableHead>
            <TableHead className="text-center w-24">Ordered</TableHead>
            <TableHead className="text-center w-24">Received</TableHead>
            <TableHead className="text-center w-24">Pending</TableHead>
            <TableHead className="w-32">Status</TableHead>
            {!readOnly && <TableHead className="w-48">Receive Qty</TableHead>}
            {!readOnly && <TableHead className="w-24"></TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => {
            const isPending = item.PendingQuantity > 0;
            const receivingQty = receivingQuantities[item.DOItemID] || 0;

            return (
              <TableRow key={item.DOItemID}>
                <TableCell className="text-center">{item.LineNumber}</TableCell>
                <TableCell>
                  <div className="font-medium">{item.ItemDescription}</div>
                  {item.Notes && (
                    <div className="text-xs text-slate-500 mt-1">{item.Notes}</div>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  {item.Quantity} {item.UnitOfMeasure}
                </TableCell>
                <TableCell className="text-center text-green-600 font-medium">
                  {item.ReceivedQuantity}
                </TableCell>
                <TableCell className="text-center">
                  <span className={isPending ? 'text-orange-600 font-medium' : 'text-green-600'}>
                    {item.PendingQuantity}
                  </span>
                </TableCell>
                <TableCell>
                  {isPending ? (
                    <Badge className="bg-orange-100 text-orange-700">
                      <Package className="w-3 h-3 mr-1" />
                      Pending
                    </Badge>
                  ) : (
                    <Badge className="bg-green-100 text-green-700">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Complete
                    </Badge>
                  )}
                </TableCell>
                {!readOnly && (
                  <>
                    <TableCell>
                      {isPending && (
                        <Input
                          type="number"
                          min={1}
                          max={item.PendingQuantity}
                          value={receivingQty || ''}
                          onChange={(e) => handleQuantityChange(item.DOItemID, e.target.value)}
                          placeholder="Qty"
                          className="w-full"
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      {isPending && (
                        <Button
                          size="sm"
                          onClick={() => handleReceive(item)}
                          disabled={!receivingQty || receivingQty > item.PendingQuantity}
                        >
                          Receive
                        </Button>
                      )}
                    </TableCell>
                  </>
                )}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
