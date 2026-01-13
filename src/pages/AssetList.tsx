import { useState, useMemo } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useUser } from '@/contexts/UserContext';
import { PageHeader } from '@/components/PageHeader';
import { StatCard } from '@/components/StatCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { format } from 'date-fns';
import {
  Monitor,
  Wrench,
  Archive,
  DollarSign,
  AlertTriangle,
  Search,
  Eye,
  FileText,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const ASSET_STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-800',
  UNDER_REPAIR: 'bg-orange-100 text-orange-800',
  IN_STORAGE: 'bg-gray-100 text-gray-800',
  DISPOSED: 'bg-red-100 text-red-800',
};

const WARRANTY_STATUS_COLORS: Record<string, string> = {
  Valid: 'bg-green-100 text-green-800',
  'Expiring Soon': 'bg-yellow-100 text-yellow-800',
  Expired: 'bg-red-100 text-red-800',
  'N/A': 'bg-gray-100 text-gray-800',
};

export default function AssetList() {
  const { canAccessAssets } = useUser();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Redirect if no access
  if (!canAccessAssets) {
    return <Navigate to="/" replace />;
  }

  const { data: stats, isLoading: statsLoading, refetch: refetchStats, isFetching: statsFetching } = useQuery({
    queryKey: ['assetStats'],
    queryFn: api.getAssetStats,
  });

  const { data: departments, refetch: refetchDepartments } = useQuery({
    queryKey: ['departments'],
    queryFn: api.getDepartments,
  });

  const { data: assets, isLoading: assetsLoading, refetch: refetchAssets, isFetching: assetsFetching } = useQuery({
    queryKey: ['assets', statusFilter, departmentFilter, categoryFilter],
    queryFn: () =>
      api.getAssets({
        status: statusFilter !== 'all' ? statusFilter : undefined,
        department: departmentFilter !== 'all' ? departmentFilter : undefined,
        category: categoryFilter !== 'all' ? categoryFilter : undefined,
      }),
  });

  const isRefreshing = statsFetching || assetsFetching;

  const handleRefresh = () => {
    refetchStats();
    refetchDepartments();
    refetchAssets();
  };

  const filteredAssets = useMemo(() => {
    if (!assets) return [];

    return assets.filter((asset) => {
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        const matchesSearch =
          asset.AssetTag?.toLowerCase().includes(search) ||
          asset.AssetName?.toLowerCase().includes(search) ||
          asset.DepartmentName?.toLowerCase().includes(search);
        if (!matchesSearch) return false;
      }
      return true;
    });
  }, [assets, searchTerm]);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Asset Register"
        description="Manage and track all company assets"
        breadcrumbs={[{ label: 'Asset Register' }]}
        actions={
          <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing} className="gap-2">
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        }
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        <StatCard
          title="Active Assets"
          value={statsLoading ? '...' : stats?.activeAssets || 0}
          icon={<Monitor className="w-6 h-6" />}
          iconBgColor="bg-green-100"
          iconColor="text-green-600"
        />
        <StatCard
          title="Under Repair"
          value={statsLoading ? '...' : stats?.underRepair || 0}
          icon={<Wrench className="w-6 h-6" />}
          iconBgColor="bg-orange-100"
          iconColor="text-orange-600"
        />
        <StatCard
          title="Disposed"
          value={statsLoading ? '...' : stats?.disposed || 0}
          icon={<Archive className="w-6 h-6" />}
          iconBgColor="bg-red-100"
          iconColor="text-red-600"
        />
        <StatCard
          title="Purchase Value"
          value={
            statsLoading
              ? '...'
              : `${(stats?.totalPurchaseValue || 0).toLocaleString('en-OM', {
                  minimumFractionDigits: 3,
                  maximumFractionDigits: 3,
                })}`
          }
          icon={<DollarSign className="w-6 h-6" />}
          iconBgColor="bg-primary/10"
          iconColor="text-primary"
        />
        <StatCard
          title="Book Value"
          value={
            statsLoading
              ? '...'
              : `${(stats?.currentBookValue || 0).toLocaleString('en-OM', {
                  minimumFractionDigits: 3,
                  maximumFractionDigits: 3,
                })}`
          }
          icon={<DollarSign className="w-6 h-6" />}
          iconBgColor="bg-accent/10"
          iconColor="text-accent"
        />
        <StatCard
          title="Warranty Expiring"
          value={statsLoading ? '...' : stats?.warrantyExpiringSoon || 0}
          icon={<AlertTriangle className="w-6 h-6" />}
          iconBgColor="bg-yellow-100"
          iconColor="text-yellow-600"
        />
      </div>

      {/* Filters */}
      <div className="bg-card rounded-xl border border-border shadow-sm p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search assets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="bg-popover">
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="UNDER_REPAIR">Under Repair</SelectItem>
              <SelectItem value="IN_STORAGE">In Storage</SelectItem>
              <SelectItem value="DISPOSED">Disposed</SelectItem>
            </SelectContent>
          </Select>

          <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
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

          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent className="bg-popover">
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="HARDWARE">Hardware</SelectItem>
              <SelectItem value="SOFTWARE">Software</SelectItem>
            </SelectContent>
          </Select>

          {(searchTerm || statusFilter !== 'all' || departmentFilter !== 'all' || categoryFilter !== 'all') && (
            <Button
              variant="ghost"
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setDepartmentFilter('all');
                setCategoryFilter('all');
              }}
            >
              Clear Filters
            </Button>
          )}
        </div>
      </div>

      {/* Asset Table */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Asset Tag</th>
                <th>Name</th>
                <th>Department</th>
                <th>Category</th>
                <th>Location</th>
                <th>Purchase Date</th>
                <th>Purchase Value</th>
                <th>Book Value</th>
                <th>Status</th>
                <th>Warranty</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {assetsLoading ? (
                <tr>
                  <td colSpan={11} className="text-center py-8">
                    <div className="flex items-center justify-center gap-2 text-muted-foreground">
                      <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      Loading assets...
                    </div>
                  </td>
                </tr>
              ) : filteredAssets.length === 0 ? (
                <tr>
                  <td colSpan={11} className="text-center py-12">
                    <Monitor className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                    <p className="text-muted-foreground">
                      {assets?.length === 0
                        ? 'No assets found'
                        : 'No assets match your filters'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredAssets.map((asset) => (
                  <tr key={asset.AssetID}>
                    <td>
                      <Link
                        to={`/asset/${asset.AssetUUID}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {asset.AssetTag}
                      </Link>
                    </td>
                    <td>{asset.AssetName}</td>
                    <td>{asset.DepartmentName}</td>
                    <td>{asset.CategoryName}</td>
                    <td>{asset.LocationName}</td>
                    <td className="text-muted-foreground">
                      {asset.PurchaseDate
                        ? format(new Date(asset.PurchaseDate), 'MMM d, yyyy')
                        : '-'}
                    </td>
                    <td className="font-medium">
                      OMR{' '}
                      {asset.PurchasePriceOMR?.toLocaleString('en-OM', {
                        minimumFractionDigits: 3,
                        maximumFractionDigits: 3,
                      })}
                    </td>
                    <td className="font-medium">
                      OMR{' '}
                      {asset.CurrentBookValue?.toLocaleString('en-OM', {
                        minimumFractionDigits: 3,
                        maximumFractionDigits: 3,
                      })}
                    </td>
                    <td>
                      <span
                        className={cn(
                          'status-badge',
                          ASSET_STATUS_COLORS[asset.StatusCode] || 'bg-gray-100 text-gray-800'
                        )}
                      >
                        {asset.StatusName}
                      </span>
                    </td>
                    <td>
                      <span
                        className={cn(
                          'status-badge',
                          WARRANTY_STATUS_COLORS[asset.WarrantyStatus] || 'bg-gray-100 text-gray-800'
                        )}
                      >
                        {asset.WarrantyStatus}
                      </span>
                    </td>
                    <td>
                      <Link to={`/asset/${asset.AssetUUID}`}>
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

        {filteredAssets.length > 0 && (
          <div className="px-6 py-4 border-t border-border bg-muted/30">
            <p className="text-sm text-muted-foreground">
              Showing {filteredAssets.length} of {assets?.length || 0} assets
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
