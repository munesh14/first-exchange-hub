import { useState } from 'react';
import { useParams, useNavigate, Navigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useUser } from '@/contexts/UserContext';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import {
  Monitor,
  Calendar,
  Building2,
  MapPin,
  User,
  Shield,
  Loader2,
  Edit,
  RefreshCw,
  ArrowRightLeft,
  Trash2,
  FileText,
  AlertTriangle,
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

export default function AssetDetail() {
  const { uuid } = useParams<{ uuid: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { canAccessAssets } = useUser();

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [disposeModalOpen, setDisposeModalOpen] = useState(false);

  const [newStatus, setNewStatus] = useState('');
  const [disposeReason, setDisposeReason] = useState('');
  const [disposeValue, setDisposeValue] = useState('0');
  const [transferDept, setTransferDept] = useState('');
  const [transferLocation, setTransferLocation] = useState('');

  if (!canAccessAssets) {
    return <Navigate to="/" replace />;
  }

  const { data: assetData, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['asset', uuid],
    queryFn: () => api.getAsset(uuid!),
    enabled: !!uuid,
  });

  const { data: departments } = useQuery({
    queryKey: ['departments'],
    queryFn: api.getDepartments,
  });

  const { data: locations } = useQuery({
    queryKey: ['locations'],
    queryFn: api.getLocations,
  });

  const statusMutation = useMutation({
    mutationFn: (data: { status: string; reason?: string }) =>
      api.updateAssetStatus(uuid!, data.status, data.reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['asset', uuid] });
      toast({ title: 'Status Updated', description: 'Asset status has been updated.' });
      setStatusModalOpen(false);
      setDisposeModalOpen(false);
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to update status.', variant: 'destructive' });
    },
  });

  const transferMutation = useMutation({
    mutationFn: () => api.transferAsset(uuid!, parseInt(transferDept), parseInt(transferLocation)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['asset', uuid] });
      toast({ title: 'Asset Transferred', description: 'Asset has been transferred.' });
      setTransferModalOpen(false);
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to transfer asset.', variant: 'destructive' });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="w-6 h-6 animate-spin" />
          Loading asset...
        </div>
      </div>
    );
  }

  if (!assetData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Monitor className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
          <p className="text-muted-foreground">Asset not found</p>
        </div>
      </div>
    );
  }

  const { asset, auditLog } = assetData;
  const depreciationPercent = asset.PurchasePriceOMR > 0
    ? ((asset.AccumulatedDepreciation || 0) / asset.PurchasePriceOMR) * 100
    : 0;

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={asset.AssetName}
        breadcrumbs={[
          { label: 'Asset Register', href: '/assets' },
          { label: asset.AssetTag },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCw className={`w-4 h-4 mr-1 ${isFetching ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <span
              className={cn(
                'status-badge text-sm',
                ASSET_STATUS_COLORS[asset.StatusCode] || 'bg-gray-100 text-gray-800'
              )}
            >
              {asset.StatusName}
            </span>
            <Button variant="outline" size="sm" onClick={() => setEditModalOpen(true)}>
              <Edit className="w-4 h-4 mr-1" />
              Edit
            </Button>
            <Button variant="outline" size="sm" onClick={() => setStatusModalOpen(true)}>
              <RefreshCw className="w-4 h-4 mr-1" />
              Status
            </Button>
            <Button variant="outline" size="sm" onClick={() => setTransferModalOpen(true)}>
              <ArrowRightLeft className="w-4 h-4 mr-1" />
              Transfer
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-destructive"
              onClick={() => setDisposeModalOpen(true)}
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Dispose
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Asset Information */}
        <div className="space-y-6">
          <div className="bg-card rounded-xl border border-border shadow-sm p-6">
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              <Monitor className="w-5 h-5 text-muted-foreground" />
              Asset Information
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between py-2 border-b border-border/50">
                <span className="text-muted-foreground">Asset Tag</span>
                <span className="font-medium">{asset.AssetTag}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border/50">
                <span className="text-muted-foreground">Name</span>
                <span className="font-medium">{asset.AssetName}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border/50">
                <span className="text-muted-foreground">Category</span>
                <span className="font-medium">{asset.CategoryName}</span>
              </div>
              {asset.Description && (
                <div className="py-2">
                  <span className="text-muted-foreground block mb-1">Description</span>
                  <span className="text-sm">{asset.Description}</span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border shadow-sm p-6">
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-muted-foreground" />
              Location & Assignment
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between py-2 border-b border-border/50">
                <span className="text-muted-foreground">Department</span>
                <span className="font-medium">{asset.DepartmentName}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border/50">
                <span className="text-muted-foreground">Location</span>
                <span className="font-medium">{asset.LocationName}</span>
              </div>
              {asset.AssignedTo && (
                <div className="flex justify-between py-2 border-b border-border/50">
                  <span className="text-muted-foreground">Assigned To</span>
                  <span className="font-medium">{asset.AssignedTo}</span>
                </div>
              )}
            </div>
          </div>

          {/* Warranty */}
          <div className="bg-card rounded-xl border border-border shadow-sm p-6">
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-muted-foreground" />
              Warranty Information
            </h2>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Warranty Status</p>
                <span
                  className={cn(
                    'status-badge mt-1',
                    WARRANTY_STATUS_COLORS[asset.WarrantyStatus] || 'bg-gray-100 text-gray-800'
                  )}
                >
                  {asset.WarrantyStatus}
                </span>
              </div>
              {asset.WarrantyExpiryDate && (
                <div className="text-right">
                  <p className="text-muted-foreground text-sm">Expires On</p>
                  <p className="font-medium">
                    {format(new Date(asset.WarrantyExpiryDate), 'MMM d, yyyy')}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Purchase & Depreciation */}
        <div className="space-y-6">
          <div className="bg-card rounded-xl border border-border shadow-sm p-6">
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-muted-foreground" />
              Purchase Information
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between py-2 border-b border-border/50">
                <span className="text-muted-foreground">Purchase Date</span>
                <span className="font-medium">
                  {asset.PurchaseDate
                    ? format(new Date(asset.PurchaseDate), 'MMM d, yyyy')
                    : '-'}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-border/50">
                <span className="text-muted-foreground">Purchase Price</span>
                <span className="font-medium">
                  OMR {asset.PurchasePriceOMR?.toFixed(3)}
                </span>
              </div>
              {asset.InvoiceUUID && (
                <div className="flex justify-between py-2">
                  <span className="text-muted-foreground">Source Invoice</span>
                  <Link
                    to={`/invoice/${asset.InvoiceUUID}`}
                    className="text-primary hover:underline flex items-center gap-1"
                  >
                    <FileText className="w-4 h-4" />
                    View Invoice
                  </Link>
                </div>
              )}
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border shadow-sm p-6">
            <h2 className="font-semibold mb-4">Depreciation</h2>
            <div className="space-y-4">
              <div className="flex justify-between py-2 border-b border-border/50">
                <span className="text-muted-foreground">Purchase Price</span>
                <span className="font-medium">OMR {asset.PurchasePriceOMR?.toFixed(3)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border/50">
                <span className="text-muted-foreground">Useful Life</span>
                <span className="font-medium">{asset.UsefulLifeYears || 5} years</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border/50">
                <span className="text-muted-foreground">Annual Depreciation</span>
                <span className="font-medium">
                  OMR {(asset.AnnualDepreciation || 0).toFixed(3)}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-border/50">
                <span className="text-muted-foreground">Accumulated Depreciation</span>
                <span className="font-medium text-red-600">
                  - OMR {(asset.AccumulatedDepreciation || 0).toFixed(3)}
                </span>
              </div>
              <div className="flex justify-between py-2">
                <span className="font-semibold">Current Book Value</span>
                <span className="font-bold text-lg text-primary">
                  OMR {(asset.CurrentBookValue || 0).toFixed(3)}
                </span>
              </div>
              <div className="mt-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Depreciation Progress</span>
                  <span className="font-medium">{depreciationPercent.toFixed(1)}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-accent rounded-full transition-all"
                    style={{ width: `${Math.min(depreciationPercent, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Audit Log */}
          <div className="bg-card rounded-xl border border-border shadow-sm p-6">
            <h2 className="font-semibold mb-4">Audit Log</h2>
            <div className="space-y-4">
              {auditLog.length === 0 ? (
                <p className="text-muted-foreground text-sm">No activity recorded</p>
              ) : (
                auditLog.map((log, index) => (
                  <div key={index} className="flex gap-3 pb-3 border-b border-border/50 last:border-0">
                    <div className="w-2 h-2 rounded-full bg-accent mt-2 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-sm">{log.Action}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(log.ActionAt), 'MMM d, yyyy HH:mm')}
                        {log.ActionBy && ` • ${log.ActionBy}`}
                      </p>
                      {log.Notes && (
                        <p className="text-sm text-muted-foreground mt-1">{log.Notes}</p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Status Modal */}
      <Dialog open={statusModalOpen} onOpenChange={setStatusModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Asset Status</DialogTitle>
            <DialogDescription>Select a new status for this asset</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>New Status</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="UNDER_REPAIR">Under Repair</SelectItem>
                  <SelectItem value="IN_STORAGE">In Storage</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setStatusModalOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => statusMutation.mutate({ status: newStatus })}
                disabled={!newStatus || statusMutation.isPending}
              >
                {statusMutation.isPending ? 'Updating...' : 'Update Status'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Transfer Modal */}
      <Dialog open={transferModalOpen} onOpenChange={setTransferModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transfer Asset</DialogTitle>
            <DialogDescription>Move this asset to a different department or location</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Department</Label>
              <Select value={transferDept} onValueChange={setTransferDept}>
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  {departments?.map((dept) => (
                    <SelectItem key={dept.DepartmentID} value={dept.DepartmentID.toString()}>
                      {dept.DepartmentName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Location</Label>
              <Select value={transferLocation} onValueChange={setTransferLocation}>
                <SelectTrigger>
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  {locations?.map((loc) => (
                    <SelectItem key={loc.LocationID} value={loc.LocationID.toString()}>
                      {loc.LocationName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setTransferModalOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => transferMutation.mutate()}
                disabled={!transferDept || !transferLocation || transferMutation.isPending}
              >
                {transferMutation.isPending ? 'Transferring...' : 'Transfer Asset'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dispose Modal */}
      <Dialog open={disposeModalOpen} onOpenChange={setDisposeModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              Dispose Asset
            </DialogTitle>
            <DialogDescription>
              This action will mark the asset as disposed and remove it from active inventory.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Reason for Disposal</Label>
              <Textarea
                value={disposeReason}
                onChange={(e) => setDisposeReason(e.target.value)}
                placeholder="Enter reason..."
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Disposal Value (OMR)</Label>
              <Input
                type="number"
                step="0.001"
                value={disposeValue}
                onChange={(e) => setDisposeValue(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDisposeModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() =>
                  statusMutation.mutate({ status: 'DISPOSED', reason: disposeReason })
                }
                disabled={!disposeReason || statusMutation.isPending}
              >
                {statusMutation.isPending ? 'Processing...' : 'Dispose Asset'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
