import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';

interface PDFPreviewProps {
  fileUrl: string;
  fileName?: string;
}

export function PDFPreview({ fileUrl, fileName }: PDFPreviewProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages] = useState(1); // Simplified - single page for now
  const [zoom, setZoom] = useState(100);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 25, 200));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 25, 50));

  return (
    <div className="flex flex-col h-full bg-slate-100 rounded-xl border border-slate-200">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-300 bg-white rounded-t-xl">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-700">
            {fileName || 'Quotation.pdf'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Zoom controls */}
          <Button
            size="sm"
            variant="outline"
            onClick={handleZoomOut}
            disabled={zoom <= 50}
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
          <span className="text-sm text-slate-600 min-w-[60px] text-center">
            {zoom}%
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={handleZoomIn}
            disabled={zoom >= 200}
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* PDF Viewer */}
      <div className="flex-1 overflow-auto p-4">
        <div className="bg-white shadow-lg" style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top left' }}>
          <iframe
            src={`${fileUrl}#toolbar=0&navpanes=0`}
            className="w-full h-[800px] border-0"
            title="PDF Preview"
          />
        </div>
      </div>

      {/* Footer - Page navigation */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 p-3 border-t border-slate-300 bg-white rounded-b-xl">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage <= 1}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Prev
          </Button>

          <span className="text-sm text-slate-600">
            Page {currentPage} of {totalPages}
          </span>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage >= totalPages}
          >
            Next
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
}
