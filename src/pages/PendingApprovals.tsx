import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useUser } from '@/contexts/UserContext';
import { getLPOs } from '@/lib/api-lpo';
import type { LPO } from '@/lib/api-lpo';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Loader2, Clock, Building2, User, Briefcase, AlertCircle,
  CheckCircle, FileText, ArrowRight, RefreshCw
} from 'lucide-react';

const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  PENDING_DEPT_APPROVAL: { color: 'text-yellow-700', bg: 'bg-yellow-100', label: 'Pending HOD' },
  PENDING_GM_APPROVAL: { color: 'text-amber-700', bg: 'bg-amber-100', label: 'Pending GM' },
  PENDING_ACC_APPROVAL: { color: 'text-orange-700', bg: 'bg-orange-100', label: 'Pending Final Approval' },
};

export default function PendingApprovals() {
  const { currentUser, isHOD, isGM, isFinalApprover, canApproveForDepartment } = useUser();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [allLpos, setAllLpos] = useState<LPO[]>([]);

  useEffect(() => {
    loadPendingApprovals();
  }, []);

  async function loadPendingApprovals() {
    setLoading(true);
    try {
      const lpos = await getLPOs();
      setAllLpos(Array.isArray(lpos) ? lpos : []);
    } catch (error) {
      console.error('Error loading LPOs:', error);
    }
    setLoading(false);
    setRefreshing(false);
  }

  const handleRefresh = () => {
    setRefreshing(true);
    loadPendingApprovals();
  };

  // Filter LPOs based on current user's approval permissions
  const pendingForUser = allLpos.filter((lpo) => {
    switch (lpo.StatusCode) {
      case 'PENDING_DEPT_APPROVAL':
        // Use DepartmentName since RequestingDepartmentID not in API response
        return canApproveForDepartment(null, lpo.DepartmentName);
      case 'PENDING_GM_APPROVAL':
        return isGM;
      case 'PENDING_ACC_APPROVAL':
        // Final Approver (Ms. Nafha) sees these
        return isFinalApprover;
      default:
        return false;
    }
  });

  // Group by status
  const groupedPending = {
    dept: pendingForUser.filter(l => l.StatusCode === 'PENDING_DEPT_APPROVAL'),
    gm: pendingForUser.filter(l => l.StatusCode === 'PENDING_GM_APPROVAL'),
    finalApproval: pendingForUser.filter(l => l.StatusCode === 'PENDING_ACC_APPROVAL'),
  };

  const formatCurrency = (amount: number, currency = 'OMR') => {
    return `${amount.toFixed(3)} ${currency}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
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
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Pending Approvals</h1>
            <p className="text-slate-500 mt-1">
              LPOs awaiting your approval action
            </p>
          </div>
          <Button variant="outline" onClick={handleRefresh} disabled={refreshing} className="gap-2">
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className={`border-l-4 ${groupedPending.dept.length > 0 ? 'border-l-yellow-500' : 'border-l-slate-200'}`}>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 font-medium">Department Approval</p>
                <p className="text-3xl font-bold text-slate-800">{groupedPending.dept.length}</p>
              </div>
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                groupedPending.dept.length > 0 ? 'bg-yellow-100' : 'bg-slate-100'
              }`}>
                <Building2 className={`w-6 h-6 ${
                  groupedPending.dept.length > 0 ? 'text-yellow-600' : 'text-slate-400'
                }`} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={`border-l-4 ${groupedPending.gm.length > 0 ? 'border-l-amber-500' : 'border-l-slate-200'}`}>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 font-medium">GM Approval</p>
                <p className="text-3xl font-bold text-slate-800">{groupedPending.gm.length}</p>
              </div>
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                groupedPending.gm.length > 0 ? 'bg-amber-100' : 'bg-slate-100'
              }`}>
                <Briefcase className={`w-6 h-6 ${
                  groupedPending.gm.length > 0 ? 'text-amber-600' : 'text-slate-400'
                }`} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={`border-l-4 ${groupedPending.finalApproval.length > 0 ? 'border-l-orange-500' : 'border-l-slate-200'}`}>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 font-medium">Final Approval</p>
                <p className="text-3xl font-bold text-slate-800">{groupedPending.finalApproval.length}</p>
              </div>
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                groupedPending.finalApproval.length > 0 ? 'bg-orange-100' : 'bg-slate-100'
              }`}>
                <FileText className={`w-6 h-6 ${
                  groupedPending.finalApproval.length > 0 ? 'text-orange-600' : 'text-slate-400'
                }`} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Empty State */}
      {pendingForUser.length === 0 && (
        <Card className="border-2 border-dashed">
          <CardContent className="py-12 text-center">
            <CheckCircle className="w-16 h-16 mx-auto text-green-500 mb-4" />
            <h3 className="text-lg font-semibold text-slate-700">All caught up!</h3>
            <p className="text-slate-500 mt-2">
              You have no pending approvals at this time.
            </p>
            <Link to="/lpo">
              <Button variant="outline" className="mt-4">
                View all LPOs <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Pending List */}
      {pendingForUser.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-500" />
              Awaiting Your Action ({pendingForUser.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead>LPO Number</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-center">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingForUser.map((lpo) => {
                    const statusConfig = STATUS_CONFIG[lpo.StatusCode] || STATUS_CONFIG.PENDING_DEPT_APPROVAL;
                    return (
                      <TableRow key={lpo.LPOUUID} className="hover:bg-slate-50">
                        <TableCell>
                          <Link 
                            to={`/lpo/${lpo.LPOUUID}`}
                            className="text-blue-600 hover:text-blue-800 font-medium"
                          >
                            {lpo.LPONumber}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <Badge className={`${statusConfig.bg} ${statusConfig.color}`}>
                            {statusConfig.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-slate-700">
                          {lpo.VendorName}
                        </TableCell>
                        <TableCell className="text-slate-600">
                          {lpo.DepartmentName || lpo.BranchName}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(lpo.TotalAmount, lpo.CurrencyCode)}
                          {lpo.TotalAmount > 100 && (
                            <span className="block text-xs text-amber-600">GM Required</span>
                          )}
                        </TableCell>
                        <TableCell className="text-slate-500 text-sm">
                          {formatDate(lpo.CreatedAt)}
                          <span className="block text-xs text-slate-400">
                            by {lpo.CreatedByName?.split(' ')[0]}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <Link to={`/lpo/${lpo.LPOUUID}`}>
                            <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                              Review <ArrowRight className="w-3 h-3 ml-1" />
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Quick Stats Footer */}
            <div className="mt-4 text-sm text-slate-500 flex items-center justify-between">
              <span>
                Total pending: <strong>{pendingForUser.length}</strong> LPO{pendingForUser.length !== 1 ? 's' : ''}
              </span>
              <span>
                Total value: <strong>
                  {formatCurrency(pendingForUser.reduce((sum, lpo) => sum + lpo.TotalAmount, 0))}
                </strong>
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
