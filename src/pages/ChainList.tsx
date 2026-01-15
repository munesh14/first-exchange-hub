import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { listChains, type ChainSummary, type ChainListParams } from '@/lib/api-chain';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Plus,
  Search,
  Link2,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Truck,
  Receipt,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Building2,
} from 'lucide-react';

// Status styling configuration
const STATUS_CONFIG: Record<string, { color: string; bgColor: string; icon: React.ReactNode }> = {
  DRAFT: { color: 'text-gray-700', bgColor: 'bg-gray-100', icon: <FileText className="w-3 h-3" /> },
  QUOTATION: { color: 'text-blue-700', bgColor: 'bg-blue-100', icon: <FileText className="w-3 h-3" /> },
  PENDING_APPROVAL: { color: 'text-yellow-700', bgColor: 'bg-yellow-100', icon: <Clock className="w-3 h-3" /> },
  REJECTED: { color: 'text-red-700', bgColor: 'bg-red-100', icon: <XCircle className="w-3 h-3" /> },
  APPROVED: { color: 'text-indigo-700', bgColor: 'bg-indigo-100', icon: <CheckCircle className="w-3 h-3" /> },
  DELIVERED: { color: 'text-purple-700', bgColor: 'bg-purple-100', icon: <Truck className="w-3 h-3" /> },
  INVOICED: { color: 'text-teal-700', bgColor: 'bg-teal-100', icon: <Receipt className="w-3 h-3" /> },
  COMPLETED: { color: 'text-green-700', bgColor: 'bg-green-100', icon: <CheckCircle className="w-3 h-3" /> },
  CANCELLED: { color: 'text-gray-500', bgColor: 'bg-gray-200', icon: <XCircle className="w-3 h-3" /> },
  ON_HOLD: { color: 'text-orange-700', bgColor: 'bg-orange-100', icon: <AlertCircle className="w-3 h-3" /> },
};

// Department list
const DEPARTMENTS = [
  { id: 1, name: 'Information Technology' },
  { id: 2, name: 'Accounts' },
  { id: 3, name: 'Marketing' },
  { id: 4, name: 'Human Resources' },
  { id: 5, name: 'Operations' },
  { id: 6, name: 'Compliance' },
];

export default function ChainList() {
  const navigate = useNavigate();
  const [chains, setChains] = useState<ChainSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');

  // Pagination
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 20,
    offset: 0,
    hasMore: false,
  });

  // Stats
  const [stats, setStats] = useState<{ status: string; count: number }[]>([]);

  useEffect(() => {
    loadData();
  }, [statusFilter, departmentFilter, pagination.offset]);

  async function loadData() {
    setLoading(true);
    setError(null);

    try {
      const params: ChainListParams = {
        limit: pagination.limit,
        offset: pagination.offset,
      };

      if (statusFilter !== 'all') params.status = statusFilter;
      if (departmentFilter !== 'all') params.departmentId = parseInt(departmentFilter);
      if (searchTerm.trim()) params.search = searchTerm.trim();

      const response = await listChains(params);

      if (response.success) {
        setChains(response.data.chains);
        setPagination(prev => ({
          ...prev,
          total: response.data.pagination.total,
          hasMore: response.data.pagination.hasMore,
        }));

        // Calculate stats from chains
        const statusCounts = response.data.chains.reduce((acc, chain) => {
          const status = chain.status.code;
          acc[status] = (acc[status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        setStats(Object.entries(statusCounts).map(([status, count]) => ({ status, count })));
      }
    } catch (err) {
      console.error('Error loading chains:', err);
      setError('Failed to load procurement chains. Please check if the API is active.');
      setChains([]);
    }

    setLoading(false);
    setRefreshing(false);
  }

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleSearch = () => {
    setPagination(prev => ({ ...prev, offset: 0 }));
    loadData();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  const handlePrevPage = () => {
    setPagination(prev => ({
      ...prev,
      offset: Math.max(0, prev.offset - prev.limit),
    }));
  };

  const handleNextPage = () => {
    if (pagination.hasMore) {
      setPagination(prev => ({
        ...prev,
        offset: prev.offset + prev.limit,
      }));
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatCurrency = (amount: number | null) => {
    if (amount === null || amount === undefined || amount === 0) return '-';
    return `${amount.toLocaleString('en-OM', { minimumFractionDigits: 3 })} OMR`;
  };

  const getStatusConfig = (statusCode: string) => {
    return STATUS_CONFIG[statusCode] || STATUS_CONFIG.DRAFT;
  };

  const currentPage = Math.floor(pagination.offset / pagination.limit) + 1;
  const totalPages = Math.ceil(pagination.total / pagination.limit);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
              <Link2 className="w-8 h-8 text-primary" />
              Procurement Chains
            </h1>
            <p className="text-slate-500 mt-1">
              Track complete procurement workflows from quotation to payment
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={refreshing}
              className="gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button onClick={() => navigate('/chains/new')} className="gap-2">
              <Plus className="w-4 h-4" />
              New Chain
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter('all')}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{pagination.total}</p>
              </div>
              <Link2 className="w-8 h-8 text-slate-400" />
            </div>
          </CardContent>
        </Card>

        {['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'DELIVERED', 'COMPLETED'].map(status => {
          const config = getStatusConfig(status);
          const count = stats.find(s => s.status === status)?.count || 0;
          return (
            <Card
              key={status}
              className={`cursor-pointer hover:shadow-md transition-shadow ${statusFilter === status ? 'ring-2 ring-primary' : ''}`}
              onClick={() => setStatusFilter(status === statusFilter ? 'all' : status)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {status.replace(/_/g, ' ')}
                    </p>
                    <p className="text-2xl font-bold">{count}</p>
                  </div>
                  <div className={`p-2 rounded-full ${config.bgColor}`}>
                    {config.icon}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by chain number, title, or vendor..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="QUOTATION">Quotation</SelectItem>
                <SelectItem value="PENDING_APPROVAL">Pending Approval</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="DELIVERED">Delivered</SelectItem>
                <SelectItem value="INVOICED">Invoiced</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="ON_HOLD">On Hold</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger className="w-[200px]">
                <Building2 className="w-4 h-4 mr-2" />
                <SelectValue placeholder="All Departments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {DEPARTMENTS.map(dept => (
                  <SelectItem key={dept.id} value={dept.id.toString()}>
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button onClick={handleSearch} className="gap-2">
              <Search className="w-4 h-4" />
              Search
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error State */}
      {error && (
        <Card className="mb-6 border-destructive bg-destructive/10">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-destructive" />
            <p className="text-destructive">{error}</p>
            <Button variant="outline" size="sm" onClick={handleRefresh} className="ml-auto">
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Chain Table */}
      <Card>
        <CardHeader className="border-b">
          <CardTitle className="text-lg flex items-center justify-between">
            <span>Procurement Chains</span>
            {pagination.total > 0 && (
              <span className="text-sm font-normal text-muted-foreground">
                Showing {pagination.offset + 1}-{Math.min(pagination.offset + pagination.limit, pagination.total)} of {pagination.total}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : chains.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <Link2 className="w-12 h-12 mb-4" />
              <p className="text-lg font-medium">No chains found</p>
              <p className="text-sm">Create a new procurement chain to get started</p>
              <Button onClick={() => navigate('/chains/new')} className="mt-4 gap-2">
                <Plus className="w-4 h-4" />
                New Chain
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[140px]">Chain #</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">Documents</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {chains.map(chain => {
                  const statusConfig = getStatusConfig(chain.status.code);
                  const docCount =
                    chain.documentCounts.quotations +
                    chain.documentCounts.lpos +
                    chain.documentCounts.deliveryOrders +
                    chain.documentCounts.invoices;

                  return (
                    <TableRow
                      key={chain.chainId}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => navigate(`/chains/${chain.chainUuid}`)}
                    >
                      <TableCell className="font-mono font-medium text-primary">
                        {chain.chainNumber}
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[250px] truncate" title={chain.title}>
                          {chain.title}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[150px] truncate" title={chain.vendor.name || '-'}>
                          {chain.vendor.name || <span className="text-muted-foreground">-</span>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{chain.department.name}</span>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${statusConfig.bgColor} ${statusConfig.color} gap-1`}>
                          {statusConfig.icon}
                          {chain.status.name}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          {chain.documentCounts.quotations > 0 && (
                            <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-xs rounded" title="Quotations">
                              Q:{chain.documentCounts.quotations}
                            </span>
                          )}
                          {chain.documentCounts.lpos > 0 && (
                            <span className="px-1.5 py-0.5 bg-indigo-100 text-indigo-700 text-xs rounded" title="LPOs">
                              L:{chain.documentCounts.lpos}
                            </span>
                          )}
                          {chain.documentCounts.deliveryOrders > 0 && (
                            <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 text-xs rounded" title="Delivery Orders">
                              D:{chain.documentCounts.deliveryOrders}
                            </span>
                          )}
                          {chain.documentCounts.invoices > 0 && (
                            <span className="px-1.5 py-0.5 bg-teal-100 text-teal-700 text-xs rounded" title="Invoices">
                              I:{chain.documentCounts.invoices}
                            </span>
                          )}
                          {docCount === 0 && (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(chain.amounts.invoiced || chain.amounts.estimated)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(chain.createdAt)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}

          {/* Pagination */}
          {chains.length > 0 && totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevPage}
                disabled={pagination.offset === 0}
                className="gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextPage}
                disabled={!pagination.hasMore}
                className="gap-1"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
