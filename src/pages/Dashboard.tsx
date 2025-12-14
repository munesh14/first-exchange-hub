import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '@/lib/api';
import { useUser } from '@/contexts/UserContext';
import { PageHeader } from '@/components/PageHeader';
import { StatCard } from '@/components/StatCard';
import { StatusBadge } from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import {
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  FileCheck,
  DollarSign,
  Upload,
  ArrowRight,
  FileText,
} from 'lucide-react';
import { format } from 'date-fns';

export default function Dashboard() {
  const { currentUser } = useUser();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['stats'],
    queryFn: api.getStats,
  });

  const { data: invoices, isLoading: invoicesLoading } = useQuery({
    queryKey: ['invoices', 'recent'],
    queryFn: () => api.getInvoices(),
  });

  const recentInvoices = invoices?.slice(0, 10) || [];

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={`Welcome back, ${currentUser?.FullName?.split(' ')[0]}!`}
        description="Here's what's happening with your invoices today."
        actions={
          <Link to="/upload">
            <Button className="gap-2">
              <Upload className="w-4 h-4" />
              Upload Invoice
            </Button>
          </Link>
        }
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        <StatCard
          title="Pending Review"
          value={statsLoading ? '...' : stats?.pendingReview || 0}
          icon={<Clock className="w-6 h-6" />}
          iconBgColor="bg-yellow-100"
          iconColor="text-yellow-600"
        />
        <StatCard
          title="Pending Approval"
          value={statsLoading ? '...' : stats?.pendingApproval || 0}
          icon={<FileCheck className="w-6 h-6" />}
          iconBgColor="bg-blue-100"
          iconColor="text-blue-600"
        />
        <StatCard
          title="Approved"
          value={statsLoading ? '...' : stats?.approved || 0}
          icon={<CheckCircle className="w-6 h-6" />}
          iconBgColor="bg-green-100"
          iconColor="text-green-600"
        />
        <StatCard
          title="Rejected"
          value={statsLoading ? '...' : stats?.rejected || 0}
          icon={<XCircle className="w-6 h-6" />}
          iconBgColor="bg-red-100"
          iconColor="text-red-600"
        />
        <StatCard
          title="Correction Needed"
          value={statsLoading ? '...' : stats?.correctionNeeded || 0}
          icon={<AlertTriangle className="w-6 h-6" />}
          iconBgColor="bg-orange-100"
          iconColor="text-orange-600"
        />
        <StatCard
          title="Total Approved (OMR)"
          value={
            statsLoading
              ? '...'
              : `${(stats?.totalApprovedAmount || 0).toLocaleString('en-OM', {
                  minimumFractionDigits: 3,
                  maximumFractionDigits: 3,
                })}`
          }
          icon={<DollarSign className="w-6 h-6" />}
          iconBgColor="bg-accent/10"
          iconColor="text-accent"
        />
      </div>

      {/* Recent Invoices */}
      <div className="bg-card rounded-xl border border-border shadow-sm">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Recent Invoices
            </h2>
            <p className="text-sm text-muted-foreground">
              Latest invoices uploaded to the system
            </p>
          </div>
          <Link to="/invoices">
            <Button variant="outline" size="sm" className="gap-2">
              View All
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>

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
                <th></th>
              </tr>
            </thead>
            <tbody>
              {invoicesLoading ? (
                <tr>
                  <td colSpan={7} className="text-center py-8">
                    <div className="flex items-center justify-center gap-2 text-muted-foreground">
                      <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      Loading invoices...
                    </div>
                  </td>
                </tr>
              ) : recentInvoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12">
                    <FileText className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                    <p className="text-muted-foreground">No invoices yet</p>
                    <Link to="/upload" className="mt-2 inline-block">
                      <Button size="sm" variant="outline">
                        Upload your first invoice
                      </Button>
                    </Link>
                  </td>
                </tr>
              ) : (
                recentInvoices.map((invoice) => (
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
                    <td>
                      <Link to={`/invoices/${invoice.InvoiceUUID}`}>
                        <Button variant="ghost" size="sm">
                          View
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
