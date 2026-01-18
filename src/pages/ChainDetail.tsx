import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getChainDetail, type ChainFullResponse } from '@/lib/api-chain';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { WorkflowProgress } from '@/components/WorkflowProgress';
import {
  ArrowLeft,
  RefreshCw,
  FileText,
  ClipboardList,
  Truck,
  Receipt,
  CreditCard,
  Package,
  Clock,
  CheckCircle,
  AlertCircle,
  User,
  Building2,
  Calendar,
  DollarSign,
  Download,
  Eye,
  Plus,
  ArrowRight,
} from 'lucide-react';

export default function ChainDetail() {
  const { uuid } = useParams<{ uuid: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<ChainFullResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (uuid) loadData();
  }, [uuid]);

  async function loadData() {
    if (!uuid) return;
    setLoading(true);
    setError(null);

    try {
      const response = await getChainDetail(uuid);
      if (response.success) {
        setData(response.data);
      }
    } catch (err) {
      console.error('Error loading chain:', err);
      setError('Failed to load chain details.');
    }

    setLoading(false);
  }

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6 flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
        <Card className="max-w-2xl mx-auto mt-20 border-0 shadow-xl">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-lg font-medium text-red-600 mb-4">{error}</p>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" onClick={() => navigate('/chains')}>
                Back to Chains
              </Button>
              <Button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800" onClick={loadData}>Retry</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { chain, documents, assets, activityLog } = data;

  // Calculate workflow progress states
  const workflowData = {
    quotations: documents.quotations.length,
    lpos: documents.lpos.length,
    lpoApproved: documents.lpos.some(lpo => lpo.status === 'APPROVED' || lpo.status === 'Approved'),
    deliveryOrders: documents.deliveryOrders.length,
    doReceived: documents.deliveryOrders.some(
      d => d.status === 'RECEIVED' || d.itemsReceived === d.itemsTotal
    ),
    invoices: documents.invoices.length,
    invoiceApproved: documents.invoices.some(inv => inv.status === 'APPROVED' || inv.status === 'Approved'),
    payments: documents.payments.length,
    fullyPaid: chain.amounts.balance === 0 && chain.amounts.paid > 0,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <Button variant="ghost" onClick={() => navigate('/chains')} className="mb-4 gap-2 hover:bg-white/80">
          <ArrowLeft className="w-4 h-4" />
          Back to Chains
        </Button>

        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-slate-900">{chain.chainNumber}</h1>
              <Badge className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0 shadow-md px-3 py-1">
                {chain.status.name}
              </Badge>
            </div>
            <p className="text-xl text-slate-700 font-semibold mb-3">{chain.title}</p>
            {chain.description && (
              <p className="text-sm text-slate-600">{chain.description}</p>
            )}
          </div>
          <Button onClick={loadData} className="gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Chain Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="border-0 shadow-md hover:shadow-xl transition-all hover:scale-105">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Department</p>
                <p className="font-semibold text-slate-900">{chain.department.name}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md hover:shadow-xl transition-all hover:scale-105">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg">
                <User className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Vendor</p>
                <p className="font-semibold text-slate-900">{chain.vendor.name || 'Not specified'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md hover:shadow-xl transition-all hover:scale-105">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl shadow-lg">
                <DollarSign className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Total Amount</p>
                <p className="font-semibold text-slate-900">
                  {formatCurrency(chain.amounts.invoiced || chain.amounts.estimated)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md hover:shadow-xl transition-all hover:scale-105">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl shadow-lg">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Created</p>
                <p className="font-semibold text-slate-900">{formatDate(chain.createdAt)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Workflow Progress */}
      <Card className="mb-6 border-0 shadow-lg bg-gradient-to-br from-white to-blue-50">
        <CardHeader>
          <CardTitle className="text-slate-900 flex items-center gap-2">
            <div className="h-1 w-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
            Workflow Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <WorkflowProgress documents={workflowData} status={chain.status.code} />
        </CardContent>
      </Card>

      {/* Documents Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Quotations */}
        <Card className="border-0 shadow-lg hover:shadow-xl transition-all">
            <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-blue-50 to-white">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg text-slate-900">
                    QUOTATION{documents.quotations.length > 1 ? 'S' : ''} {documents.quotations.length > 1 ? `(${documents.quotations.length})` : ''}
                  </CardTitle>
                </div>
              </div>
              <Badge className={documents.quotations.length > 0 ? "bg-emerald-100 text-emerald-700 border-emerald-200 border" : "bg-blue-100 text-blue-700 border-blue-200 border"}>
                {documents.quotations.length > 0 ? '✓ UPLOADED' : '○ NEXT'}
              </Badge>
            </CardHeader>
            <CardContent className="pt-6">
              {documents.quotations.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-slate-600 mb-4">Ready to add quotation</p>
                  <Button
                    size="lg"
                    className="gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all"
                    onClick={() => navigate(`/quotations/upload?chainId=${chain.chainUuid}`)}
                  >
                    <Plus className="w-5 h-5" />
                    Add Quotation
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {documents.quotations.map(quot => (
                    <div
                      key={quot.quotationId}
                      className="p-4 bg-gradient-to-r from-blue-50 to-white rounded-lg border border-blue-100 hover:shadow-md transition-all"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-semibold text-slate-900 text-lg">{quot.quotationNumber}</p>
                          <p className="text-sm text-slate-600">{quot.vendorName}</p>
                          <p className="text-sm text-slate-500 mt-1">
                            Uploaded: {formatDate(quot.quotationDate)} • {formatCurrency(quot.totalAmount)}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-2"
                          onClick={() => navigate(`/quotations/${quot.quotationUuid}`)}
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-2"
                          onClick={() => window.open(`/api/quotations/${quot.quotationUuid}/download`, '_blank')}
                        >
                          <Download className="w-4 h-4" />
                          Download
                        </Button>
                        <Button
                          size="sm"
                          className="gap-2 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white"
                          onClick={() => navigate(`/lpo/new?chainId=${chain.chainUuid}&quotationId=${quot.quotationUuid}`)}
                        >
                          <ClipboardList className="w-4 h-4" />
                          Create LPO →
                        </Button>
                      </div>
                    </div>
                  ))}
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full gap-2 border-dashed"
                    onClick={() => navigate(`/quotations/upload?chainId=${chain.chainUuid}`)}
                  >
                    <Plus className="w-4 h-4" />
                    Add Another Quotation
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

        {/* LPOs */}
        <Card className="border-0 shadow-lg hover:shadow-xl transition-all">
            <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-indigo-50 to-white">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg shadow">
                  <ClipboardList className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg text-slate-900">
                    LPO{documents.lpos.length > 1 ? 'S' : ''} {documents.lpos.length > 1 ? `(${documents.lpos.length})` : ''}
                  </CardTitle>
                </div>
              </div>
              <Badge className={
                workflowData.lpoApproved ? "bg-emerald-100 text-emerald-700 border-emerald-200 border" :
                documents.lpos.length > 0 ? "bg-amber-100 text-amber-700 border-amber-200 border" :
                documents.quotations.length > 0 ? "bg-blue-100 text-blue-700 border-blue-200 border" :
                "bg-slate-100 text-slate-500 border-slate-200 border"
              }>
                {workflowData.lpoApproved ? '✓ APPROVED' :
                 documents.lpos.length > 0 ? '⋯ PENDING APPROVAL' :
                 documents.quotations.length > 0 ? '○ NEXT' :
                 '○ WAITING'}
              </Badge>
            </CardHeader>
            <CardContent className="pt-6">
              {documents.lpos.length === 0 ? (
                documents.quotations.length > 0 ? (
                  <div className="text-center py-8">
                    <p className="text-slate-600 mb-4">Ready to create LPO from quotation</p>
                    <Button
                      size="lg"
                      className="gap-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white shadow-lg hover:shadow-xl transition-all"
                      onClick={() => navigate(`/lpo/new?chainId=${chain.chainUuid}`)}
                    >
                      <Plus className="w-5 h-5" />
                      Create LPO
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-slate-400 italic">Waiting for quotation</p>
                    <Button size="lg" disabled className="gap-2 mt-4 opacity-50">
                      <Plus className="w-5 h-5" />
                      Create LPO
                    </Button>
                  </div>
                )
              ) : (
                <div className="space-y-3">
                  {documents.lpos.map(lpo => (
                    <div
                      key={lpo.lpoId}
                      className="p-4 bg-gradient-to-r from-indigo-50 to-white rounded-lg border border-indigo-100 hover:shadow-md transition-all"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-semibold text-slate-900 text-lg">{lpo.lpoNumber}</p>
                          <p className="text-sm text-slate-600">{lpo.vendorName}</p>
                          <p className="text-sm text-slate-500 mt-1">
                            Created: {formatDate(lpo.lpoDate)} • {formatCurrency(lpo.totalAmount)}
                          </p>
                          <Badge variant="outline" className="mt-2">
                            {lpo.status}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-2"
                          onClick={() => navigate(`/lpo/${lpo.lpoUuid}`)}
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-2"
                          onClick={() => window.open(`/api/lpos/${lpo.lpoUuid}/download`, '_blank')}
                        >
                          <Download className="w-4 h-4" />
                          Download
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

        {/* Delivery Orders */}
        <Card className="border-0 shadow-lg hover:shadow-xl transition-all">
            <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-purple-50 to-white">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow">
                  <Truck className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg text-slate-900">
                    DELIVERY ORDER{documents.deliveryOrders.length > 1 ? 'S' : ''} {documents.deliveryOrders.length > 1 ? `(${documents.deliveryOrders.length})` : ''}
                  </CardTitle>
                </div>
              </div>
              <Badge className={
                workflowData.doReceived ? "bg-emerald-100 text-emerald-700 border-emerald-200 border" :
                documents.deliveryOrders.length > 0 ? "bg-amber-100 text-amber-700 border-amber-200 border" :
                workflowData.lpoApproved ? "bg-blue-100 text-blue-700 border-blue-200 border" :
                "bg-slate-100 text-slate-500 border-slate-200 border"
              }>
                {workflowData.doReceived ? '✓ RECEIVED' :
                 documents.deliveryOrders.length > 0 ? '⋯ PARTIAL' :
                 workflowData.lpoApproved ? '○ NEXT' :
                 '○ WAITING'}
              </Badge>
            </CardHeader>
            <CardContent className="pt-6">
              {documents.deliveryOrders.length === 0 ? (
                workflowData.lpoApproved ? (
                  <div className="text-center py-8">
                    <p className="text-slate-600 mb-4">Ready to record delivery</p>
                    <Button
                      size="lg"
                      className="gap-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white shadow-lg hover:shadow-xl transition-all"
                      onClick={() => navigate(`/delivery-orders/new?chainId=${chain.chainUuid}`)}
                    >
                      <Plus className="w-5 h-5" />
                      Add Delivery Order
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-slate-400 italic">Waiting for LPO approval</p>
                    <Button size="lg" disabled className="gap-2 mt-4 opacity-50">
                      <Plus className="w-5 h-5" />
                      Add Delivery Order
                    </Button>
                  </div>
                )
              ) : (
                <div className="space-y-3">
                  {documents.deliveryOrders.map(dorder => (
                    <div
                      key={dorder.doId}
                      className="p-4 bg-gradient-to-r from-purple-50 to-white rounded-lg border border-purple-100 hover:shadow-md transition-all"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-semibold text-slate-900 text-lg">{dorder.doNumber}</p>
                          <p className="text-sm text-slate-500 mt-1">
                            Delivered: {formatDate(dorder.deliveryDate)} • {dorder.itemsReceived}/{dorder.itemsTotal} items
                          </p>
                          <Badge variant="outline" className="mt-2">
                            {dorder.status}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-2"
                          onClick={() => navigate(`/delivery-orders/${dorder.doUuid}`)}
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </Button>
                      </div>
                    </div>
                  ))}
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full gap-2 border-dashed"
                    onClick={() => navigate(`/delivery-orders/new?chainId=${chain.chainUuid}`)}
                  >
                    <Plus className="w-4 h-4" />
                    Add Another Delivery
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

        {/* Invoices */}
        <Card className="border-0 shadow-lg hover:shadow-xl transition-all">
            <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-teal-50 to-white">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-teal-500 to-teal-600 rounded-lg shadow">
                  <Receipt className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg text-slate-900">
                    INVOICE{documents.invoices.length > 1 ? 'S' : ''} {documents.invoices.length > 1 ? `(${documents.invoices.length})` : ''}
                  </CardTitle>
                </div>
              </div>
              <Badge className={
                workflowData.invoiceApproved ? "bg-emerald-100 text-emerald-700 border-emerald-200 border" :
                documents.invoices.length > 0 ? "bg-amber-100 text-amber-700 border-amber-200 border" :
                workflowData.doReceived ? "bg-blue-100 text-blue-700 border-blue-200 border" :
                "bg-slate-100 text-slate-500 border-slate-200 border"
              }>
                {workflowData.invoiceApproved ? '✓ APPROVED' :
                 documents.invoices.length > 0 ? '⋯ PENDING APPROVAL' :
                 workflowData.doReceived ? '○ NEXT' :
                 '○ WAITING'}
              </Badge>
            </CardHeader>
            <CardContent className="pt-6">
              {documents.invoices.length === 0 ? (
                workflowData.doReceived ? (
                  <div className="text-center py-8">
                    <p className="text-slate-600 mb-4">Ready to add invoice</p>
                    <Button
                      size="lg"
                      className="gap-2 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white shadow-lg hover:shadow-xl transition-all"
                      onClick={() => navigate(`/upload?chainId=${chain.chainUuid}`)}
                    >
                      <Plus className="w-5 h-5" />
                      Add Invoice
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-slate-400 italic">Waiting for delivery confirmation</p>
                    <Button size="lg" disabled className="gap-2 mt-4 opacity-50">
                      <Plus className="w-5 h-5" />
                      Add Invoice
                    </Button>
                  </div>
                )
              ) : (
                <div className="space-y-3">
                  {documents.invoices.map(inv => (
                    <div
                      key={inv.invoiceId}
                      className="p-4 bg-gradient-to-r from-teal-50 to-white rounded-lg border border-teal-100 hover:shadow-md transition-all"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-semibold text-slate-900 text-lg">{inv.invoiceNumber}</p>
                          <p className="text-sm text-slate-600">{inv.vendorName}</p>
                          <p className="text-sm text-slate-500 mt-1">
                            Date: {formatDate(inv.invoiceDate)} • {formatCurrency(inv.totalAmount)}
                          </p>
                          <Badge variant="outline" className="mt-2">
                            {inv.status}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-2"
                          onClick={() => navigate(`/invoices/${inv.invoiceUuid}`)}
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-2"
                          onClick={() => window.open(`/api/invoices/${inv.invoiceUuid}/download`, '_blank')}
                        >
                          <Download className="w-4 h-4" />
                          Download
                        </Button>
                      </div>
                    </div>
                  ))}
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full gap-2 border-dashed"
                    onClick={() => navigate(`/upload?chainId=${chain.chainUuid}`)}
                  >
                    <Plus className="w-4 h-4" />
                    Add Another Invoice
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

        {/* Payments */}
        <Card className="border-0 shadow-lg hover:shadow-xl transition-all">
          <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-emerald-50 to-white">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-emerald-500 to-green-600 rounded-lg shadow">
                <CreditCard className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg text-slate-900">
                  PAYMENT{documents.payments.length > 1 ? 'S' : ''} {documents.payments.length > 1 ? `(${documents.payments.length})` : ''}
                </CardTitle>
              </div>
            </div>
            <Badge className={
              workflowData.fullyPaid ? "bg-emerald-100 text-emerald-700 border-emerald-200 border" :
              documents.payments.length > 0 ? "bg-amber-100 text-amber-700 border-amber-200 border" :
              workflowData.invoiceApproved ? "bg-blue-100 text-blue-700 border-blue-200 border" :
              "bg-slate-100 text-slate-500 border-slate-200 border"
            }>
              {workflowData.fullyPaid ? '✓ PAID' :
               documents.payments.length > 0 ? '⋯ PARTIAL' :
               workflowData.invoiceApproved ? '○ NEXT' :
               '○ WAITING'}
            </Badge>
          </CardHeader>
          <CardContent className="pt-6">
            {documents.payments.length === 0 ? (
              workflowData.invoiceApproved ? (
                <div className="text-center py-8">
                  <p className="text-slate-600 mb-4">Ready to record payment</p>
                  <Button
                    size="lg"
                    className="gap-2 bg-gradient-to-r from-emerald-600 to-green-700 hover:from-emerald-700 hover:to-green-800 text-white shadow-lg hover:shadow-xl transition-all"
                    onClick={() => navigate(`/payments/new?chainId=${chain.chainUuid}`)}
                  >
                    <Plus className="w-5 h-5" />
                    Add Payment
                  </Button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-slate-400 italic">Waiting for invoice approval</p>
                  <Button size="lg" disabled className="gap-2 mt-4 opacity-50">
                    <Plus className="w-5 h-5" />
                    Add Payment
                  </Button>
                </div>
              )
            ) : (
              <div className="space-y-3">
                {documents.payments.map(payment => (
                  <div
                    key={payment.paymentId}
                    className="p-4 bg-gradient-to-r from-emerald-50 to-white rounded-lg border border-emerald-100"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-semibold text-slate-900 text-lg">{payment.referenceNumber}</p>
                        <p className="text-sm text-slate-600 mt-1">
                          {formatDate(payment.paymentDate)} • {payment.paymentMethod}
                        </p>
                      </div>
                      <p className="font-bold text-emerald-600 text-xl">
                        {formatCurrency(payment.amount)}
                      </p>
                    </div>
                  </div>
                ))}
                {!workflowData.fullyPaid && (
                  <>
                    <div className="border-t pt-3 flex justify-between items-center text-sm">
                      <span className="text-slate-600">Balance Remaining:</span>
                      <span className="font-semibold text-amber-600">
                        {formatCurrency(chain.amounts.balance)}
                      </span>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full gap-2 border-dashed"
                      onClick={() => navigate(`/payments/new?chainId=${chain.chainUuid}`)}
                    >
                      <Plus className="w-4 h-4" />
                      Add Another Payment
                    </Button>
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Assets */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Package className="w-5 h-5 text-amber-600" />
              Assets ({assets.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {assets.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No assets linked to this chain
              </p>
            ) : (
              <div className="space-y-2">
                {assets.map(asset => (
                  <div
                    key={asset.assetId}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 cursor-pointer"
                    onClick={() => navigate(`/assets/${asset.assetUuid}`)}
                  >
                    <div>
                      <p className="font-medium">{asset.assetTag}</p>
                      <p className="text-sm text-muted-foreground">{asset.assetName}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Activity Log */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-slate-50 to-white">
          <CardTitle className="flex items-center gap-2 text-slate-900">
            <div className="p-2 bg-gradient-to-br from-slate-500 to-slate-600 rounded-lg">
              <Clock className="w-5 h-5 text-white" />
            </div>
            Activity Log
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {activityLog.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-8 italic">
              No activity recorded yet
            </p>
          ) : (
            <div className="space-y-4">
              {activityLog.map(log => {
                // Determine dot color based on activity type
                const getDotColor = () => {
                  const type = log.activityType.toLowerCase();
                  if (type.includes('create')) return 'bg-slate-400';
                  if (type.includes('upload') || type.includes('add')) return 'bg-blue-500';
                  if (type.includes('submit')) return 'bg-amber-500';
                  if (type.includes('approve')) return 'bg-emerald-500';
                  if (type.includes('reject')) return 'bg-red-500';
                  if (type.includes('receive')) return 'bg-green-500';
                  if (type.includes('pay') || type.includes('paid')) return 'bg-emerald-600';
                  return 'bg-slate-400';
                };

                const formatTime = (dateStr: string) => {
                  const date = new Date(dateStr);
                  return date.toLocaleString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  });
                };

                return (
                  <div key={log.logId} className="flex gap-4 pb-4 border-b last:border-0 last:pb-0">
                    {/* Colored dot indicator */}
                    <div className="flex-shrink-0 pt-1">
                      <div className={`w-3 h-3 rounded-full ${getDotColor()} shadow-md`} />
                    </div>

                    {/* Activity content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="font-semibold text-slate-900 leading-tight">
                            {log.activityDescription}
                          </p>
                          <p className="text-sm text-slate-600 mt-1">
                            by {log.performedBy.name}
                          </p>
                        </div>
                        <time className="text-xs text-slate-500 whitespace-nowrap">
                          {formatTime(log.performedAt)}
                        </time>
                      </div>

                      {log.newStatus && (
                        <Badge
                          className="mt-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0"
                          variant="default"
                        >
                          → {log.newStatus.name}
                        </Badge>
                      )}

                      {log.notes && (
                        <p className="text-sm text-slate-600 mt-2 italic bg-slate-50 p-2 rounded border-l-2 border-slate-300">
                          {log.notes}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
