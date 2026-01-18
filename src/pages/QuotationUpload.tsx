import { useNavigate, useSearchParams } from 'react-router-dom';
import { QuotationExtraction } from '@/components/quotations/QuotationExtraction';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function QuotationUpload() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const chainId = searchParams.get('chainId');

  const handleSuccess = (quotationUuid: string) => {
    if (chainId) {
      // If uploaded to a chain, go back to chain detail
      navigate(`/chains/${chainId}`);
    } else {
      // Otherwise go to quotation detail
      navigate(`/quotations/${quotationUuid}`);
    }
  };

  const handleCancel = () => {
    if (chainId) {
      navigate(`/chains/${chainId}`);
    } else {
      navigate('/quotations');
    }
  };

  if (!chainId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
        <div className="max-w-2xl mx-auto">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-slate-900 mb-4">Chain ID Required</h1>
            <p className="text-slate-600 mb-6">
              Please provide a chain ID to upload a quotation.
            </p>
            <Button onClick={() => navigate('/chains')}>
              Go to Chains
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        <Button
          variant="ghost"
          onClick={handleCancel}
          className="mb-4 gap-2 hover:bg-white/80"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Chain
        </Button>

        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900">Add Quotation to Chain</h1>
          <p className="text-slate-600 mt-1">
            Upload a vendor quotation for AI extraction and review
          </p>
        </div>

        <QuotationExtraction
          chainId={chainId}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
}
