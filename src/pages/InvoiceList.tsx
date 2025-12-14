import { useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { PageHeader } from '@/components/PageHeader';
import { StatusBadge } from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { format } from 'date-fns';
import {
  Search,
  Calendar as CalendarIcon,
  FileText,
  Filter,
  Upload,
  Eye,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Status' },
  { value: 'PENDING_REVIEW', label: 'Pending Review' },
  { value: 'PENDING_APPROVAL', label: 'Pending Approval' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'CORRECTION_NEEDED', label: 'Correction Needed' },
  { value: 'PROCESSED', label: 'Processed' },
];

export default function InvoiceList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState(
    searchParams.get('status') || 'all'
  );
  const [departmentFilter, setDepartmentFilter] = useState(
    searchParams.get('department') || 'all'
  );
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({ from: undefined, to: undefined });

  const { data: departments } = useQuery({
    queryKey: ['departments'],
    queryFn: api.getDepartments,
  });

  const { data: invoices, isLoading } = useQuery({
    queryKey: ['invoices', statusFilter, departmentFilter],
    queryFn: () =>
      api.getInvoices({
        status: statusFilter !== 'all' ? statusFilter : undefined,
        department: departmentFilter !== 'all' ? departmentFilter : undefined,
      }),
  });

  const filteredInvoices = useMemo(() => {
    if (!invoices) return [];

    return invoices.filter((invoice) => {
      // Search filter
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        const matchesSearch =
          invoice.InvoiceNumber?.toLowerCase().includes(search) ||
          invoice.VendorName?.toLowerCase().includes(search) ||
          invoice.DepartmentName?.toLowerCase().includes(search);
        if (!matchesSearch) return false;
      }

      // Date range filter
      if (dateRange.from && invoice.InvoiceDate) {
        const invoiceDate = new Date(invoice.InvoiceDate);
        if (invoiceDate < dateRange.from) return false;
      }
      if (dateRange.to && invoice.InvoiceDate) {
        const invoiceDate = new Date(invoice.InvoiceDate);
        if (invoiceDate > dateRange.to) return false;
      }

      return true;
    });
  }, [invoices, searchTerm, dateRange]);

  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
    const params = new URLSearchParams(searchParams);
    if (value === 'all') {
      params.delete('status');
    } else {
      params.set('status', value);
    }
    setSearchParams(params);
  };

  const handleDepartmentChange = (value: string) => {
    setDepartmentFilter(value);
    const params = new URLSearchParams(searchParams);
    if (value === 'all') {
      params.delete('department');
    } else {
      params.set('department', value);
    }
    setSearchParams(params);
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="All Invoices"
        description="View and manage all invoices in the system"
        breadcrumbs={[{ label: 'All Invoices' }]}
        actions={
          <Link to="/upload">
            <Button className="gap-2">
              <Upload className="w-4 h-4" />
              Upload Invoice
            </Button>
          </Link>
        }
      />

      {/* Filters */}
      <div className="bg-card rounded-xl border border-border shadow-sm p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search invoices..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <Select value={statusFilter} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="bg-popover">
              {STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={departmentFilter} onValueChange={handleDepartmentChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Department" />
            </SelectTrigger>
            <SelectContent className="bg-popover">
              <SelectItem value="all">All Departments</SelectItem>
              {departments?.map((dept) => (
                <SelectItem key={dept.DepartmentID} value={dept.DepartmentName}>
                  {dept.DepartmentName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2">
                <CalendarIcon className="w-4 h-4" />
                {dateRange.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, 'LLL dd')} -{' '}
                      {format(dateRange.to, 'LLL dd')}
                    </>
                  ) : (
                    format(dateRange.from, 'LLL dd, yyyy')
                  )
                ) : (
                  'Date Range'
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-popover" align="end">
              <Calendar
                mode="range"
                selected={dateRange}
                onSelect={(range) =>
                  setDateRange({ from: range?.from, to: range?.to })
                }
                numberOfMonths={2}
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>

          {(searchTerm ||
            statusFilter !== 'all' ||
            departmentFilter !== 'all' ||
            dateRange.from) && (
            <Button
              variant="ghost"
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setDepartmentFilter('all');
                setDateRange({ from: undefined, to: undefined });
                setSearchParams({});
              }}
            >
              Clear Filters
            </Button>
          )}
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
              ) : filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12">
                    <FileText className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                    <p className="text-muted-foreground">
                      {invoices?.length === 0
                        ? 'No invoices found'
                        : 'No invoices match your filters'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((invoice) => (
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
                        <Button variant="ghost" size="sm" className="gap-1.5">
                          <Eye className="w-4 h-4" />
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

        {filteredInvoices.length > 0 && (
          <div className="px-6 py-4 border-t border-border bg-muted/30">
            <p className="text-sm text-muted-foreground">
              Showing {filteredInvoices.length} of {invoices?.length || 0}{' '}
              invoices
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
