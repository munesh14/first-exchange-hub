import { useNavigate } from 'react-router-dom';
import type { Quotation } from '@/lib/api-quotation';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  FileText, Calendar, Building2, User, DollarSign,
  CheckCircle, Eye, Download
} from 'lucide-react';

interface QuotationCardProps {
  quotation: Quotation;
  onView?: (uuid: string) => void;
  onDownload?: (uuid: string) => void;
}

export default function QuotationCard({ quotation, onView, onDownload }: QuotationCardProps) {
  const navigate = useNavigate();

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

  const handleView = () => {
    if (onView) {
      onView(quotation.QuotationUUID);
    } else {
      navigate(`/quotations/${quotation.QuotationUUID}`);
    }
  };

  const handleDownload = () => {
    if (onDownload) {
      onDownload(quotation.QuotationUUID);
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-lg text-slate-900">
                {quotation.QuotationNumber}
              </h3>
              <p className="text-sm text-slate-500">{quotation.VendorName}</p>
            </div>
          </div>

          {quotation.IsSelected && (
            <Badge className="bg-green-100 text-green-700 gap-1">
              <CheckCircle className="w-3 h-3" />
              Selected
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span className="text-slate-600">{formatDate(quotation.QuotationDate)}</span>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <Building2 className="w-4 h-4 text-slate-400" />
            <span className="text-slate-600">{quotation.DepartmentName}</span>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <User className="w-4 h-4 text-slate-400" />
            <span className="text-slate-600">{quotation.UploadedByName}</span>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <DollarSign className="w-4 h-4 text-slate-400" />
            <span className="font-semibold text-blue-600">
              {formatCurrency(quotation.TotalAmount, quotation.CurrencyCode)}
            </span>
          </div>
        </div>

        {quotation.Notes && (
          <p className="text-sm text-slate-500 mb-4 line-clamp-2">
            {quotation.Notes}
          </p>
        )}

        {quotation.IsSelected && quotation.SelectedByName && (
          <div className="mb-4 p-3 bg-green-50 rounded-lg border border-green-200">
            <p className="text-xs text-green-700">
              Selected by {quotation.SelectedByName} on {formatDate(quotation.SelectedAt)}
            </p>
            {quotation.SelectionNotes && (
              <p className="text-xs text-green-600 mt-1">{quotation.SelectionNotes}</p>
            )}
          </div>
        )}

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleView}
            className="flex-1"
          >
            <Eye className="w-4 h-4 mr-2" />
            View Details
          </Button>

          {onDownload && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
            >
              <Download className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
