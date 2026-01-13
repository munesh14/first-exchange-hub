import { useNavigate } from 'react-router-dom';
import type { DeliveryOrder } from '@/lib/api-delivery-order';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Truck, Calendar, Building2, User, Package, Eye } from 'lucide-react';

interface DOCardProps {
  deliveryOrder: DeliveryOrder;
  onView?: (uuid: string) => void;
}

const STATUS_CONFIG: Record<string, { color: string; bg: string }> = {
  PENDING: { color: 'text-yellow-700', bg: 'bg-yellow-100' },
  PARTIALLY_RECEIVED: { color: 'text-blue-700', bg: 'bg-blue-100' },
  FULLY_RECEIVED: { color: 'text-green-700', bg: 'bg-green-100' },
  COMPLETED: { color: 'text-slate-700', bg: 'bg-slate-100' },
  CANCELLED: { color: 'text-red-700', bg: 'bg-red-100' },
};

export default function DOCard({ deliveryOrder, onView }: DOCardProps) {
  const navigate = useNavigate();

  const formatDate = (date: string | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const handleView = () => {
    if (onView) {
      onView(deliveryOrder.DOUUID);
    } else {
      navigate(`/delivery-orders/${deliveryOrder.DOUUID}`);
    }
  };

  const statusConfig = STATUS_CONFIG[deliveryOrder.Status] || STATUS_CONFIG.PENDING;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
              <Truck className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h3 className="font-semibold text-lg text-slate-900">
                {deliveryOrder.DONumber}
              </h3>
              <p className="text-sm text-slate-500">{deliveryOrder.VendorName}</p>
            </div>
          </div>

          <Badge className={`${statusConfig.bg} ${statusConfig.color}`}>
            {deliveryOrder.StatusName}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span className="text-slate-600">{formatDate(deliveryOrder.DODate)}</span>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <Building2 className="w-4 h-4 text-slate-400" />
            <span className="text-slate-600">{deliveryOrder.BranchName}</span>
          </div>

          {deliveryOrder.LPONumber && (
            <div className="flex items-center gap-2 text-sm">
              <Package className="w-4 h-4 text-slate-400" />
              <span className="text-slate-600">{deliveryOrder.LPONumber}</span>
            </div>
          )}

          {deliveryOrder.ReceivedByName && (
            <div className="flex items-center gap-2 text-sm">
              <User className="w-4 h-4 text-slate-400" />
              <span className="text-slate-600">{deliveryOrder.ReceivedByName}</span>
            </div>
          )}
        </div>

        {/* Progress */}
        <div className="mb-4">
          <div className="flex justify-between text-xs text-slate-500 mb-1">
            <span>Received: {deliveryOrder.ReceivedQuantity} / {deliveryOrder.TotalQuantity}</span>
            <span>{Math.round((deliveryOrder.ReceivedQuantity / deliveryOrder.TotalQuantity) * 100)}%</span>
          </div>
          <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 transition-all"
              style={{ width: `${(deliveryOrder.ReceivedQuantity / deliveryOrder.TotalQuantity) * 100}%` }}
            />
          </div>
        </div>

        <Button variant="outline" size="sm" onClick={handleView} className="w-full">
          <Eye className="w-4 h-4 mr-2" />
          View Details
        </Button>
      </CardContent>
    </Card>
  );
}
