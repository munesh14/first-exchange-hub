import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getLPOs, getLPOStats, type LPO } from '@/lib/api-lpo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Search, FileText, Clock, CheckCircle, XCircle, Truck, Package, AlertCircle, RefreshCw } from 'lucide-react';

const STATUS_CONFIG: Record<string, { color: string; icon: React.ReactNode }> = {
  DRAFT: { color: 'bg-gray-100 text-gray-800', icon: <FileText className="w-3 h-3" /> },
  PENDING_DEPT_APPROVAL: { color: 'bg-yellow-100 text-yellow-800', icon: <Clock className="w-3 h-3" /> },
  PENDING_ACC_APPROVAL: { color: 'bg-orange-100 text-orange-800', icon: <Clock className="w-3 h-3" /> },
  APPROVED: { color: 'bg-blue-100 text-blue-800', icon: <CheckCircle className="w-3 h-3" /> },
  SENT_TO_VENDOR: { color: 'bg-indigo-100 text-indigo-800', icon: <Truck className="w-3 h-3" /> },
  PARTIALLY_RECEIVED: { color: 'bg-purple-100 text-purple-800', icon: <Package className="w-3 h-3" /> },
  FULLY_RECEIVED: { color: 'bg-green-100 text-green-800', icon: <Package className="w-3 h-3" /> },
  INVOICED: { color: 'bg-teal-100 text-teal-800', icon: <FileText className="w-3 h-3" /> },
  CLOSED: { color: 'bg-gray-200 text-gray-600', icon: <CheckCircle className="w-3 h-3" /> },
  CANCELLED: { color: 'bg-red-100 text-red-800', icon: <XCircle className="w-3 h-3" /> },
  REJECTED_DEPT: { color: 'bg-red-100 text-red-800', icon: <XCircle className="w-3 h-3" /> },
  REJECTED_ACC: { color: 'bg-red-100 text-red-800', icon: <XCircle className="w-3 h-3" /> },
};

export default function LPOList() {
  const navigate = useNavigate();
  const [lpos, setLpos] = useState<LPO[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  async function loadData() {
    setLoading(true);
    try {
      const [lpoData, statsData] = await Promise.all([
        getLPOs(statusFilter !== 'all' ? { status: statusFilter } : undefined),
        getLPOStats(),
      ]);
      setLpos(Array.isArray(lpoData) ? lpoData : []);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading LPOs:', error);
      setLpos([]);
    }
    setLoading(false);
    setRefreshing(false);
  }

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const filteredLPOs = lpos.filter(lpo => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      lpo.LPONumber?.toLowerCase().includes(search) ||
      lpo.VendorName?.toLowerCase().includes(search) ||
      lpo.BranchName?.toLowerCase().includes(search)
    );
  });

  const formatDate = (date: string | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatCurrency = (amount: number | null, currency = 'OMR') => {
    if (amount === null || amount === undefined) return '-';
    return `${amount.toFixed(3)} ${currency}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Local Purchase Orders</h1>
            <p className="text-slate-500 mt-1">Manage purchase orders and track deliveries</p>
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
            <Button
              onClick={() => navigate('/lpo/create')}
              className="bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create LPO
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
          <Card className="bg-white/80 backdrop-blur border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-yellow-100">
                  <Clock className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">
                    {(stats.PendingDeptApproval || 0) + (stats.PendingAccApproval || 0)}
                  </p>
                  <p className="text-xs text-slate-500">Pending Approval</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100">
                  <CheckCircle className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{stats.Approved || 0}</p>
                  <p className="text-xs text-slate-500">Approved</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-indigo-100">
                  <Truck className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{stats.SentToVendor || 0}</p>
                  <p className="text-xs text-slate-500">Sent to Vendor</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-100">
                  <Package className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{stats.PartiallyReceived || 0}</p>
                  <p className="text-xs text-slate-500">Partially Received</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-100">
                  <Package className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{stats.FullyReceived || 0}</p>
                  <p className="text-xs text-slate-500">Fully Received</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-slate-100">
                  <FileText className="w-5 h-5 text-slate-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{stats.TotalLPOs || 0}</p>
                  <p className="text-xs text-slate-500">Total LPOs</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card className="bg-white/80 backdrop-blur border-0 shadow-sm mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search LPO number, vendor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white border-slate-200"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[200px] bg-white border-slate-200">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="PENDING_DEPT_APPROVAL">Pending Dept Approval</SelectItem>
                <SelectItem value="PENDING_ACC_APPROVAL">Pending Acc Approval</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="SENT_TO_VENDOR">Sent to Vendor</SelectItem>
                <SelectItem value="PARTIALLY_RECEIVED">Partially Received</SelectItem>
                <SelectItem value="FULLY_RECEIVED">Fully Received</SelectItem>
                <SelectItem value="INVOICED">Invoiced</SelectItem>
                <SelectItem value="CLOSED">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="bg-white/80 backdrop-blur border-0 shadow-sm">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : filteredLPOs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-500">
              <FileText className="w-12 h-12 mb-4 text-slate-300" />
              <p className="text-lg font-medium">No LPOs found</p>
              <p className="text-sm">Create your first LPO to get started</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/50">
                  <TableHead className="font-semibold">LPO Number</TableHead>
                  <TableHead className="font-semibold">Date</TableHead>
                  <TableHead className="font-semibold">Vendor</TableHead>
                  <TableHead className="font-semibold">Branch</TableHead>
                  <TableHead className="font-semibold text-right">Amount</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold text-center">Received</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLPOs.map((lpo) => {
                  const statusConfig = STATUS_CONFIG[lpo.StatusCode] || STATUS_CONFIG.DRAFT;
                  const receivedPercent = lpo.TotalQuantity > 0 
                    ? Math.round((lpo.TotalReceived / lpo.TotalQuantity) * 100) 
                    : 0;

                  return (
                    <TableRow 
                      key={lpo.LPOUUID}
                      className="cursor-pointer hover:bg-slate-50 transition-colors"
                      onClick={() => navigate(`/lpo/${lpo.LPOUUID}`)}
                    >
                      <TableCell className="font-medium text-indigo-600">
                        {lpo.LPONumber}
                      </TableCell>
                      <TableCell className="text-slate-600">
                        {formatDate(lpo.LPODate)}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {lpo.VendorName}
                      </TableCell>
                      <TableCell>
                        <span className="text-slate-600">{lpo.BranchName}</span>
                        {lpo.DepartmentName && (
                          <span className="text-slate-400 text-sm"> / {lpo.DepartmentName}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(lpo.TotalAmount, lpo.CurrencyCode)}
                      </TableCell>
                      <TableCell>
                        <Badge className={`${statusConfig.color} gap-1 font-medium`}>
                          {statusConfig.icon}
                          {lpo.StatusName}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {lpo.TotalQuantity > 0 && (
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-green-500 rounded-full transition-all"
                                style={{ width: `${receivedPercent}%` }}
                              />
                            </div>
                            <span className="text-xs text-slate-500">{receivedPercent}%</span>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
