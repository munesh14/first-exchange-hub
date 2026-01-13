import { useNavigate } from 'react-router-dom';
import QuotationUploader from '@/components/quotations/QuotationUploader';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function QuotationUpload() {
  const navigate = useNavigate();

  const handleSuccess = (quotationUuid: string) => {
    navigate(`/quotations/${quotationUuid}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-3xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate('/quotations')}
          className="mb-4 -ml-2"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Quotations
        </Button>

        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900">Upload Quotation</h1>
          <p className="text-slate-500 mt-1">
            Upload a vendor quotation for AI extraction and processing
          </p>
        </div>

        <QuotationUploader onSuccess={handleSuccess} />
      </div>
    </div>
  );
}
