import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { listChains, getChainStats } from '@/lib/api-chain';
import { useUser } from '@/contexts/UserContext';
import { PipelineProgress } from '@/components/PipelineProgress';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Plus,
  Search,
  ArrowRight,
  RefreshCw,
  Activity,
  CheckCircle,
  DollarSign,
  Clock,
} from 'lucide-react';

export default function Dashboard() {
  const { currentUser } = useUser();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch chain stats
  const { data: statsResponse, isLoading: statsLoading, refetch: refetchStats } = useQuery({
    queryKey: ['chain-stats'],
    queryFn: getChainStats,
  });

  // Fetch chains list
  const { data: chainsResponse, isLoading: chainsLoading, refetch: refetchChains } = useQuery({
    queryKey: ['chains'],
    queryFn: () => listChains({ limit: 20 }),
  });

  const stats = statsResponse?.data;
  const chains = chainsResponse?.chains || [];

  const handleRefresh = () => {
    refetchStats();
    refetchChains();
  };

  // Filter chains by search query
  const filteredChains = chains.filter(chain =>
    chain.chainNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chain.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chain.vendor.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatCurrency = (amount: number | null) => {
    if (amount === null || amount === undefined || amount === 0) return '0.000';
    return amount.toLocaleString('en-OM', { minimumFractionDigits: 3, maximumFractionDigits: 3 });
  };

  const getStatusColor = (statusCode: string) => {
    switch (statusCode) {
      case 'DRAFT': return 'bg-gradient-to-r from-slate-500 to-slate-600 text-white border-2 border-slate-400';
      case 'IN_PROGRESS': return 'bg-gradient-to-r from-blue-500 to-blue-600 text-white border-2 border-blue-400';
      case 'PENDING_APPROVAL': return 'bg-gradient-to-r from-amber-500 to-orange-600 text-white border-2 border-amber-400';
      case 'COMPLETED': return 'bg-gradient-to-r from-emerald-500 to-green-600 text-white border-2 border-emerald-400';
      case 'CANCELLED': return 'bg-gradient-to-r from-red-500 to-red-600 text-white border-2 border-red-400';
      default: return 'bg-gradient-to-r from-slate-500 to-slate-600 text-white border-2 border-slate-400';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="p-6 pb-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
              Welcome back, {currentUser?.FullName?.split(' ')[0]}!
            </h1>
            <p className="text-slate-600 mt-1">Here's your procurement overview</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRefresh}
            className="rounded-full hover:bg-white/80"
          >
            <RefreshCw className={`w-5 h-5 text-slate-600 ${statsLoading || chainsLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Active Chains */}
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 border-0 shadow-lg hover:shadow-xl transition-all hover:scale-105">
            <CardContent className="p-6 relative overflow-hidden">
              <Activity className="absolute top-4 right-4 w-16 h-16 text-white opacity-20" />
              <div className="relative z-10">
                <p className="text-sm font-medium text-blue-100 mb-1">Active Chains</p>
                <p className="text-4xl font-bold text-white">
                  {statsLoading ? '...' : stats?.activeChains || 0}
                </p>
                <div className="mt-4 pt-4 border-t border-blue-400/30">
                  <p className="text-xs text-blue-100">In progress</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pending Approval */}
          <Card className="bg-gradient-to-br from-amber-500 to-orange-600 border-0 shadow-lg hover:shadow-xl transition-all hover:scale-105">
            <CardContent className="p-6 relative overflow-hidden">
              <Clock className="absolute top-4 right-4 w-16 h-16 text-white opacity-20" />
              <div className="relative z-10">
                <p className="text-sm font-medium text-amber-100 mb-1">Pending Approval</p>
                <p className="text-4xl font-bold text-white">
                  {statsLoading ? '...' : stats?.pendingApproval || 0}
                </p>
                <div className="mt-4 pt-4 border-t border-amber-400/30">
                  <p className="text-xs text-amber-100">Awaiting action</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Completed This Month */}
          <Card className="bg-gradient-to-br from-emerald-500 to-green-600 border-0 shadow-lg hover:shadow-xl transition-all hover:scale-105">
            <CardContent className="p-6 relative overflow-hidden">
              <CheckCircle className="absolute top-4 right-4 w-16 h-16 text-white opacity-20" />
              <div className="relative z-10">
                <p className="text-sm font-medium text-emerald-100 mb-1">Completed This Month</p>
                <p className="text-4xl font-bold text-white">
                  {statsLoading ? '...' : stats?.completedThisMonth || 0}
                </p>
                <div className="mt-4 pt-4 border-t border-emerald-400/30">
                  <p className="text-xs text-emerald-100">Successfully closed</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Value */}
          <Card className="bg-gradient-to-br from-purple-500 to-pink-600 border-0 shadow-lg hover:shadow-xl transition-all hover:scale-105">
            <CardContent className="p-6 relative overflow-hidden">
              <DollarSign className="absolute top-4 right-4 w-16 h-16 text-white opacity-20" />
              <div className="relative z-10">
                <p className="text-sm font-medium text-purple-100 mb-1">Total Value</p>
                <p className="text-3xl font-bold text-white">
                  {statsLoading ? '...' : formatCurrency(stats?.totalValue || 0)}
                </p>
                <p className="text-xs text-purple-100 mt-0.5">OMR</p>
                <div className="mt-4 pt-4 border-t border-purple-400/30">
                  <p className="text-xs text-purple-100">Active chains value</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Bar */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-6">
          <Button
            onClick={() => navigate('/chains/new')}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg shadow-blue-300 gap-2 px-6 h-11 transition-all hover:scale-105"
          >
            <Plus className="w-5 h-5" />
            New Chain
          </Button>

          <div className="flex gap-3 items-center flex-1 max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                type="text"
                placeholder="Search chains..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white border-slate-200 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Chain List */}
      <div className="px-6 pb-6">
        <div className="space-y-3">
          {chainsLoading ? (
            <div className="text-center py-12">
              <RefreshCw className="w-8 h-8 animate-spin text-blue-500 mx-auto" />
              <p className="text-slate-600 mt-2">Loading chains...</p>
            </div>
          ) : filteredChains.length === 0 ? (
            <Card className="bg-white border-0 shadow-sm">
              <CardContent className="p-12 text-center">
                <p className="text-slate-600">
                  {searchQuery ? 'No chains found matching your search.' : 'No chains yet. Create your first one!'}
                </p>
                {!searchQuery && (
                  <Button
                    onClick={() => navigate('/chains/new')}
                    className="mt-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg transition-all hover:scale-105"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create First Chain
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            filteredChains.map((chain) => (
              <Card
                key={chain.chainId}
                className="bg-white border-0 shadow-md hover:shadow-xl transition-all cursor-pointer group hover:scale-[1.02] hover:bg-gradient-to-br hover:from-white hover:to-blue-50"
                onClick={() => navigate(`/chains/${chain.chainUuid}`)}
              >
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    {/* Chain Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-slate-900 text-lg truncate">
                              {chain.chainNumber}
                            </h3>
                            <Badge className={`${getStatusColor(chain.status.code)} font-medium px-3 py-1 shadow-md`}>
                              {chain.status.name}
                            </Badge>
                          </div>
                          <p className="text-slate-700 font-medium mb-2">{chain.title}</p>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600">
                            <span>Vendor: <span className="font-medium text-slate-900">{chain.vendor.name}</span></span>
                            <span>•</span>
                            <span>Dept: <span className="font-medium text-slate-900">{chain.department.name}</span></span>
                            <span>•</span>
                            <span>Amount: <span className="font-medium text-slate-900">{formatCurrency(chain.amounts.estimated)} OMR</span></span>
                          </div>
                        </div>
                        <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all flex-shrink-0" />
                      </div>

                      {/* Pipeline Progress */}
                      <div className="mt-4 pt-4 border-t border-slate-100">
                        <PipelineProgress
                          hasQuotation={chain.documentCounts.quotations > 0}
                          hasLPO={chain.documentCounts.lpos > 0}
                          hasDeliveryOrder={chain.documentCounts.deliveryOrders > 0}
                          hasInvoice={chain.documentCounts.invoices > 0}
                          hasPayment={chain.documentCounts.payments > 0}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Pagination Info */}
        {filteredChains.length > 0 && (
          <div className="mt-6 text-center">
            <p className="text-sm text-slate-600">
              Showing {filteredChains.length} of {chains.length} chains
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
