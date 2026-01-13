import type { DeliveryOrderReceipt } from '@/lib/api-delivery-order';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package, Calendar, User, MapPin, Hash } from 'lucide-react';

interface DOTimelineProps {
  receipts: DeliveryOrderReceipt[];
}

export default function DOTimeline({ receipts }: DOTimelineProps) {
  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (receipts.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600">No receipts recorded yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="w-5 h-5" />
          Receipt History ({receipts.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {receipts.map((receipt, index) => (
            <div
              key={receipt.ReceiptID}
              className="relative pl-8 pb-4 border-l-2 border-slate-200 last:border-0 last:pb-0"
            >
              {/* Timeline dot */}
              <div className="absolute left-0 top-0 w-4 h-4 -ml-[9px] rounded-full bg-blue-600 border-4 border-white" />

              <div className="bg-slate-50 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-semibold text-slate-900">
                      {receipt.ItemDescription}
                    </h4>
                    <div className="flex items-center gap-4 mt-2 text-sm text-slate-600">
                      <div className="flex items-center gap-1">
                        <Package className="w-4 h-4" />
                        <span>Qty: {receipt.QuantityReceived}</span>
                      </div>
                      <Badge
                        variant="outline"
                        className={
                          receipt.Condition === 'NEW'
                            ? 'border-green-300 text-green-700'
                            : receipt.Condition === 'GOOD'
                            ? 'border-blue-300 text-blue-700'
                            : 'border-red-300 text-red-700'
                        }
                      >
                        {receipt.Condition}
                      </Badge>
                    </div>
                  </div>

                  {receipt.AssetsCreated > 0 && (
                    <Badge className="bg-green-100 text-green-700">
                      {receipt.AssetsCreated} Asset{receipt.AssetsCreated > 1 ? 's' : ''}
                    </Badge>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2 text-slate-600">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span>{formatDate(receipt.ReceiptDate)}</span>
                  </div>

                  <div className="flex items-center gap-2 text-slate-600">
                    <User className="w-4 h-4 text-slate-400" />
                    <span>{receipt.ReceivedByName}</span>
                  </div>

                  <div className="flex items-center gap-2 text-slate-600">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    <span>{receipt.ReceivedAtBranchName}</span>
                  </div>

                  {receipt.AssetTags && receipt.AssetTags.length > 0 && (
                    <div className="flex items-center gap-2 text-slate-600">
                      <Hash className="w-4 h-4 text-slate-400" />
                      <span className="text-xs font-mono">
                        {receipt.AssetTags.join(', ')}
                      </span>
                    </div>
                  )}
                </div>

                {receipt.SerialNumbers && (
                  <div className="mt-3 p-2 bg-white rounded border border-slate-200">
                    <p className="text-xs text-slate-500 mb-1">Serial Numbers:</p>
                    <p className="text-xs font-mono text-slate-700">
                      {receipt.SerialNumbers}
                    </p>
                  </div>
                )}

                {(receipt.ConditionNotes || receipt.Notes) && (
                  <div className="mt-3 text-sm text-slate-600">
                    {receipt.ConditionNotes && (
                      <p className="italic">Condition: {receipt.ConditionNotes}</p>
                    )}
                    {receipt.Notes && <p>{receipt.Notes}</p>}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
