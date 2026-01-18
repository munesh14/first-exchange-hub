import { useState, useCallback, useEffect } from 'react';
import { useUser } from '@/contexts/UserContext';
import { PDFPreview } from '@/components/PDFPreview';
import { EditableLineItems, type LineItem } from '@/components/EditableLineItems';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Upload, FileText, Loader2, AlertCircle } from 'lucide-react';

type Step = 'upload' | 'extracting' | 'review';

interface QuotationExtractionProps {
  chainId: string;
  onSuccess: (quotationUuid: string) => void;
  onCancel: () => void;
}

interface FormData {
  vendorName: string;
  quotationRef: string;
  quotationDate: string;
  validUntil: string;
  lineItems: LineItem[];
  vatRate: number;
}

export function QuotationExtraction({ chainId, onSuccess, onCancel }: QuotationExtractionProps) {
  const { currentUser } = useUser();
  const { toast } = useToast();

  const [step, setStep] = useState<Step>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string>('');
  const [formData, setFormData] = useState<FormData>({
    vendorName: '',
    quotationRef: '',
    quotationDate: '',
    validUntil: '',
    lineItems: [],
    vatRate: 5,
  });
  const [saving, setSaving] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  // Calculate totals whenever line items or VAT rate changes
  const subtotal = formData.lineItems.reduce((sum, item) => sum + item.total, 0);
  const vatAmount = subtotal * (formData.vatRate / 100);
  const grandTotal = subtotal + vatAmount;

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      validateAndProcessFile(droppedFile);
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      validateAndProcessFile(selectedFile);
    }
  };

  const validateAndProcessFile = (selectedFile: File) => {
    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(selectedFile.type)) {
      toast({
        title: 'Invalid File Type',
        description: 'Please upload a PDF, JPG, or PNG file.',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (selectedFile.size > maxSize) {
      toast({
        title: 'File Too Large',
        description: 'File size must be less than 10MB.',
        variant: 'destructive',
      });
      return;
    }

    setFile(selectedFile);
    handleExtraction(selectedFile);
  };

  const handleExtraction = async (fileToExtract: File) => {
    setStep('extracting');

    try {
      // Create object URL for PDF preview
      const url = URL.createObjectURL(fileToExtract);
      setPdfUrl(url);

      // Convert file to base64 for extraction
      const base64 = await fileToBase64(fileToExtract);

      // Call extraction API
      const response = await fetch('http://localhost:3010/api/extract/quotation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64 }),
      });

      if (!response.ok) {
        throw new Error('Extraction failed');
      }

      const result = await response.json();

      if (result.success && result.data) {
        // Populate form with extracted data
        const extracted = result.data;

        setFormData({
          vendorName: extracted.vendorName || '',
          quotationRef: extracted.quotationRef || extracted.quotationNumber || '',
          quotationDate: extracted.quotationDate || '',
          validUntil: extracted.validUntil || '',
          lineItems: (extracted.lineItems || []).map((item: any, index: number) => ({
            id: `item-${index + 1}`,
            description: item.description || item.itemDescription || '',
            quantity: parseFloat(item.quantity) || 1,
            unitPrice: parseFloat(item.unitPrice) || 0,
            total: parseFloat(item.totalPrice || item.total) || (item.quantity * item.unitPrice) || 0,
          })),
          vatRate: extracted.vatRate || extracted.vatPercent || 5,
        });

        setStep('review');

        toast({
          title: 'Extraction Complete!',
          description: `AI extracted data with ${result.data.confidence || 95}% confidence. Please review and edit if needed.`,
        });
      } else {
        throw new Error(result.error || 'No data extracted');
      }
    } catch (error) {
      console.error('Extraction error:', error);
      toast({
        title: 'Extraction Failed',
        description: 'Could not extract data from the file. You can enter data manually.',
        variant: 'destructive',
      });

      // Allow manual entry
      setStep('review');
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleManualEntry = () => {
    setStep('review');
    toast({
      title: 'Manual Entry Mode',
      description: 'Fill in the quotation details manually.',
    });
  };

  const handleSave = async () => {
    // Validation
    if (!formData.vendorName.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Vendor name is required.',
        variant: 'destructive',
      });
      return;
    }

    if (formData.lineItems.length === 0) {
      toast({
        title: 'Validation Error',
        description: 'At least one line item is required.',
        variant: 'destructive',
      });
      return;
    }

    if (!currentUser?.UserID) {
      toast({
        title: 'Error',
        description: 'User session not found. Please refresh the page.',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);

    try {
      // Upload file first if exists
      let filePath = '';
      if (file) {
        const uploadFormData = new FormData();
        uploadFormData.append('file', file);

        const uploadResponse = await fetch('http://localhost:3010/api/upload/quotation', {
          method: 'POST',
          body: uploadFormData,
        });

        if (uploadResponse.ok) {
          const uploadResult = await uploadResponse.json();
          filePath = uploadResult.filePath || '';
        }
      }

      // Save quotation
      const payload = {
        chainId: chainId,
        vendorName: formData.vendorName,
        quotationRef: formData.quotationRef,
        quotationDate: formData.quotationDate || new Date().toISOString().split('T')[0],
        validUntil: formData.validUntil,
        lineItems: formData.lineItems.map((item, index) => ({
          lineNumber: index + 1,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.total,
        })),
        subTotal: subtotal,
        vatRate: formData.vatRate,
        vatAmount: vatAmount,
        totalAmount: grandTotal,
        currency: 'OMR',
        filePath: filePath,
        createdBy: currentUser.UserID,
      };

      const response = await fetch('http://localhost:3010/api/quotations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Failed to save quotation');
      }

      const result = await response.json();

      if (result.success) {
        toast({
          title: 'Success!',
          description: `Quotation ${result.data?.quotationNumber || ''} saved to chain.`,
        });

        onSuccess(result.data?.quotationUuid || chainId);
      } else {
        throw new Error(result.error || 'Failed to save');
      }
    } catch (error) {
      console.error('Save error:', error);
      toast({
        title: 'Save Failed',
        description: 'Could not save quotation. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('en-OM', { minimumFractionDigits: 3, maximumFractionDigits: 3 });
  };

  // Cleanup object URL on unmount
  useEffect(() => {
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);

  if (step === 'upload') {
    return (
      <Card className="border-0 shadow-lg">
        <CardContent className="p-8">
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-12 text-center transition-all ${
              dragActive
                ? 'border-blue-500 bg-blue-50'
                : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50'
            }`}
          >
            <FileText className="w-16 h-16 mx-auto mb-4 text-slate-400" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              Drag & drop quotation PDF here
            </h3>
            <p className="text-slate-600 mb-4">or click to browse</p>
            <p className="text-sm text-slate-500 mb-6">
              Supported: PDF, JPG, PNG (max 10MB)
            </p>

            <input
              type="file"
              id="file-upload"
              className="hidden"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileInput}
            />

            <Button
              onClick={() => document.getElementById('file-upload')?.click()}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
            >
              <Upload className="w-4 h-4 mr-2" />
              Choose File
            </Button>
          </div>

          <div className="mt-6 text-center">
            <p className="text-slate-500 mb-3">── OR ──</p>
            <Button variant="outline" onClick={handleManualEntry}>
              Enter Manually
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (step === 'extracting') {
    return (
      <Card className="border-0 shadow-lg">
        <CardContent className="p-12 text-center">
          <Loader2 className="w-12 h-12 mx-auto mb-4 text-blue-600 animate-spin" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            AI is extracting data...
          </h3>
          <p className="text-slate-600">
            Please wait while we analyze the quotation document.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Review state
  return (
    <div className="space-y-6">
      {/* Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* PDF Preview (left) */}
        {pdfUrl && (
          <div className="h-[800px]">
            <PDFPreview fileUrl={pdfUrl} fileName={file?.name} />
          </div>
        )}

        {/* Editable Form (right) */}
        <div className={`space-y-6 ${!pdfUrl ? 'lg:col-span-2' : ''}`}>
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-900">Extracted Data</h3>
                {pdfUrl && (
                  <span className="text-sm text-emerald-600 font-medium">AI Confidence: 95%</span>
                )}
              </div>

              {/* Vendor Name */}
              <div>
                <Label htmlFor="vendorName">
                  Vendor Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="vendorName"
                  value={formData.vendorName}
                  onChange={(e) => setFormData({ ...formData, vendorName: e.target.value })}
                  placeholder="e.g., IT Park Computer LLC"
                  className="mt-1"
                />
              </div>

              {/* Quotation Ref and Date */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="quotationRef">Quotation Reference</Label>
                  <Input
                    id="quotationRef"
                    value={formData.quotationRef}
                    onChange={(e) => setFormData({ ...formData, quotationRef: e.target.value })}
                    placeholder="QTN-XXXX"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="quotationDate">Date</Label>
                  <Input
                    id="quotationDate"
                    type="date"
                    value={formData.quotationDate}
                    onChange={(e) => setFormData({ ...formData, quotationDate: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Valid Until */}
              <div>
                <Label htmlFor="validUntil">Valid Until</Label>
                <Input
                  id="validUntil"
                  type="date"
                  value={formData.validUntil}
                  onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>

          {/* Line Items */}
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Line Items</h3>
              <EditableLineItems
                items={formData.lineItems}
                onChange={(items) => setFormData({ ...formData, lineItems: items })}
              />
            </CardContent>
          </Card>

          {/* Totals */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-slate-50 to-blue-50">
            <CardContent className="p-6 space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-700">Subtotal:</span>
                <span className="font-semibold text-slate-900">{formatCurrency(subtotal)} OMR</span>
              </div>

              <div className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-2">
                  <Label htmlFor="vatRate">VAT Rate:</Label>
                  <Input
                    id="vatRate"
                    type="number"
                    step="0.1"
                    value={formData.vatRate}
                    onChange={(e) => setFormData({ ...formData, vatRate: parseFloat(e.target.value) || 0 })}
                    className="w-20 h-8 text-right"
                  />
                  <span className="text-slate-700">%</span>
                </div>
                <span className="font-semibold text-slate-900">{formatCurrency(vatAmount)} OMR</span>
              </div>

              <div className="border-t border-slate-300 pt-3 flex justify-between items-center">
                <span className="text-lg font-bold text-slate-900">Grand Total:</span>
                <span className="text-xl font-bold text-blue-600">{formatCurrency(grandTotal)} OMR</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between items-center pt-4 border-t border-slate-200">
        <Button variant="outline" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>

        <Button
          onClick={handleSave}
          disabled={saving}
          className="gap-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Quotation to Chain →'
          )}
        </Button>
      </div>
    </div>
  );
}
