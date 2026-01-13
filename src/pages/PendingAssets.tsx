import { useState, useEffect } from 'react';
import { useUser } from '@/contexts/UserContext';
import { getPendingAssets, putAssetToUse } from '@/lib/api-asset';
import type { Asset } from '@/lib/api-asset';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, Package, CheckCircle, Calendar, Building2 } from 'lucide-react';

export default function PendingAssets() {
  const { currentUser } = useUser();
  const [loading, setLoading] = useState(true);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [showPutToUseDialog, setShowPutToUseDialog] = useState(false);
  const [putToUseDate, setPutToUseDate] = useState(new Date().toISOString().split('T')[0]);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadAssets();
  }, []);

  async function loadAssets() {
    setLoading(true);
    try {
      const data = await getPendingAssets();
      setAssets(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading assets:', error);
    }
    setLoading(false);
  }

  const handlePutToUse = async () => {
    if (!selectedAsset || !currentUser) return;

    setActionLoading(true);
    try {
      const result = await putAssetToUse(selectedAsset.AssetUUID, putToUseDate, currentUser.UserID);
      if (result.success) {
        alert(`Asset activated! Tag: ${result.assetTag}`);
        setShowPutToUseDialog(false);
        loadAssets();
      } else {
        alert(result.error || 'Failed to activate asset');
      }
    } catch (error) {
      console.error('Error activating asset:', error);
      alert('An error occurred');
    }
    setActionLoading(false);
  };

  const formatDate = (date: string | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900">Pending Assets</h1>
          <p className="text-slate-500 mt-1">Assets awaiting activation and tag assignment</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Pending Activation</p>
                  <p className="text-2xl font-bold text-orange-600">{assets.length}</p>
                </div>
                <Package className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Assets Table */}
        <Card>
          <CardHeader>
            <CardTitle>Assets Awaiting Activation</CardTitle>
          </CardHeader>
          <CardContent>
            {assets.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <Package className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p>No pending assets</p>
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50">
                      <TableHead>Asset Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Received Date</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Branch</TableHead>
                      <TableHead>Condition</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assets.map((asset) => (
                      <TableRow key={asset.AssetID}>
                        <TableCell className="font-medium">{asset.ItemDescription}</TableCell>
                        <TableCell>{asset.CategoryName || '-'}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="w-4 h-4 text-slate-400" />
                            {formatDate(asset.ReceivedDate)}
                          </div>
                        </TableCell>
                        <TableCell>{asset.DepartmentName || '-'}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-sm">
                            <Building2 className="w-4 h-4 text-slate-400" />
                            {asset.BranchName}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              asset.Condition === 'NEW'
                                ? 'border-green-300 text-green-700'
                                : asset.Condition === 'GOOD'
                                ? 'border-blue-300 text-blue-700'
                                : 'border-red-300 text-red-700'
                            }
                          >
                            {asset.Condition}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedAsset(asset);
                              setShowPutToUseDialog(true);
                            }}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Put to Use
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Put to Use Dialog */}
        <Dialog open={showPutToUseDialog} onOpenChange={setShowPutToUseDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Put Asset to Use</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Asset Name</Label>
                <Input value={selectedAsset?.ItemDescription || ''} disabled className="mt-1.5" />
              </div>
              <div>
                <Label>Put to Use Date *</Label>
                <Input
                  type="date"
                  value={putToUseDate}
                  onChange={(e) => setPutToUseDate(e.target.value)}
                  className="mt-1.5"
                />
              </div>
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-700">
                  This will activate the asset and generate an asset tag. Depreciation will start from the put-to-use date.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowPutToUseDialog(false)}>Cancel</Button>
              <Button onClick={handlePutToUse} disabled={actionLoading} className="bg-green-600">
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm & Generate Tag'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
