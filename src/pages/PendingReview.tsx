import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { PageHeader } from '@/components/PageHeader';
import { StatusBadge } from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { Clock, FileText, Eye, Upload, RefreshCw } from 'lucide-react';

export default function PendingReview() {
  const { data: invoices, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['invoices', 'PENDING_REVIEW'],
    queryFn: () => api.getInvoices({ status: 'PENDING_REVIEW' }),
  });

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Pending Review"
        description="Invoices awaiting your review and verification"
        breadcrumbs={[{ label: 'Pending Review' }]}
        actions={
          <>
            <Button variant="outline" onClick={() => refetch()} disabled={isFetching} className="gap-2">
              <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Link to="/upload">
              <Button className="gap-2">
                <Upload className="w-4 h-4" />
                Upload Invoice
              </Button>
            </Link>
          </>
        }
      />

      {/* Stats Card */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-yellow-100 flex items-center justify-center">
            <Clock className="w-6 h-6 text-yellow-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-yellow-800">
              {invoices?.length || 0}
            </p>
            <p className="text-sm text-yellow-600">invoices pending review</p>
          </div>
        </div>
      </div>

      {/* Invoice Table */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Date</th>
                <th>Department</th>
                <th>Vendor</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Uploaded By</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="text-center py-8">
                    <div className="flex items-center justify-center gap-2 text-muted-foreground">
                      <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      Loading invoices...
                    </div>
                  </td>
                </tr>
              ) : invoices?.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12">
                    <FileText className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                    <p className="text-muted-foreground mb-2">
                      No invoices pending review
                    </p>
                    <p className="text-sm text-muted-foreground">
                      All caught up! Upload a new invoice to get started.
                    </p>
                  </td>
                </tr>
              ) : (
                invoices?.map((invoice) => (
                  <tr key={invoice.InvoiceID}>
                    <td>
                      <Link
                        to={`/invoices/${invoice.InvoiceUUID}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {invoice.InvoiceNumber}
                      </Link>
                    </td>
                    <td className="text-muted-foreground">
                      {invoice.InvoiceDate
                        ? format(new Date(invoice.InvoiceDate), 'MMM d, yyyy')
                        : '-'}
                    </td>
                    <td>{invoice.DepartmentName}</td>
                    <td>{invoice.VendorName || '-'}</td>
                    <td className="font-medium">
                      {invoice.CurrencyCode}{' '}
                      {invoice.TotalAmount?.toLocaleString('en-OM', {
                        minimumFractionDigits: 3,
                        maximumFractionDigits: 3,
                      })}
                    </td>
                    <td>
                      <StatusBadge status={invoice.StatusCode} />
                    </td>
                    <td className="text-muted-foreground">
                      {invoice.UploadedBy || '-'}
                    </td>
                    <td>
                      <Link to={`/invoices/${invoice.InvoiceUUID}`}>
                        <Button variant="default" size="sm" className="gap-1.5">
                          <Eye className="w-4 h-4" />
                          Review
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {invoices && invoices.length > 0 && (
          <div className="px-6 py-4 border-t border-border bg-muted/30">
            <p className="text-sm text-muted-foreground">
              Showing {invoices.length} pending invoices
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
