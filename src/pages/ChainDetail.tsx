import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getChainDetail, type ChainFullResponse } from '@/lib/api-chain';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6 flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <Card className="max-w-2xl mx-auto mt-20 border-destructive">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <p className="text-lg font-medium text-destructive mb-4">{error}</p>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" onClick={() => navigate('/chains')}>
                Back to Chains
              </Button>
              <Button onClick={loadData}>Retry</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { chain, documents, assets, activityLog } = data;

  // Workflow stages
  const stages = [
    {
      key: 'quotation',
      label: 'Quotation',
      icon: <FileText className="w-5 h-5" />,
      count: documents.quotations.length,
      expected: chain.expectedDocuments.hasQuotation,
      color: 'blue',
    },
    {
      key: 'lpo',
      label: 'LPO',
      icon: <ClipboardList className="w-5 h-5" />,
      count: documents.lpos.length,
      expected: chain.expectedDocuments.hasLPO,
      color: 'indigo',
    },
    {
      key: 'delivery',
      label: 'Delivery',
      icon: <Truck className="w-5 h-5" />,
      count: documents.deliveryOrders.length,
      expected: chain.expectedDocuments.hasDeliveryOrder,
      color: 'purple',
    },
    {
      key: 'invoice',
      label: 'Invoice',
      icon: <Receipt className="w-5 h-5" />,
      count: documents.invoices.length,
      expected: chain.expectedDocuments.hasInvoice,
      color: 'teal',
    },
    {
      key: 'payment',
      label: 'Payment',
      icon: <CreditCard className="w-5 h-5" />,
      count: documents.payments.length,
      expected: true,
      color: 'green',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      {/* Header */}
      <div className="mb-6">
        <Button variant="ghost" onClick={() => navigate('/chains')} className="mb-4 gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back to Chains
        </Button>

        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-slate-900">{chain.chainNumber}</h1>
              <Badge
                className={`bg-${chain.status.color} text-${chain.status.color.replace('400', '900')}`}
              >
                {chain.status.name}
              </Badge>
            </div>
            <p className="text-xl text-slate-600 mb-3">{chain.title}</p>
            {chain.description && (
              <p className="text-sm text-slate-500">{chain.description}</p>
            )}
          </div>
          <Button onClick={loadData} variant="outline" className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Chain Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Building2 className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Department</p>
                <p className="font-medium">{chain.department.name}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <User className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Vendor</p>
                <p className="font-medium">{chain.vendor.name || 'Not specified'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Amount</p>
                <p className="font-medium">
                  {formatCurrency(chain.amounts.invoiced || chain.amounts.estimated)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Calendar className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="font-medium">{formatDate(chain.createdAt)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Workflow Progress */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Workflow Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            {/* Progress Line */}
            <div className="absolute top-8 left-0 right-0 h-0.5 bg-slate-200 hidden lg:block" />

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
              {stages.map((stage, index) => {
                const isActive = stage.count > 0;
                const isCompleted = isActive && stage.count > 0;
                const bgColor = isActive
                  ? `bg-${stage.color}-100`
                  : 'bg-slate-100';
                const textColor = isActive
                  ? `text-${stage.color}-700`
                  : 'text-slate-500';

                return (
                  <div key={stage.key} className="relative flex flex-col items-center text-center">
                    {/* Connector line (mobile) */}
                    {index < stages.length - 1 && (
                      <div className="absolute left-1/2 top-16 h-12 w-0.5 bg-slate-200 lg:hidden" />
                    )}

                    {/* Stage Circle */}
                    <div
                      className={`relative z-10 w-16 h-16 rounded-full flex items-center justify-center ${bgColor} ${textColor} mb-2`}
                    >
                      {isCompleted ? (
                        <CheckCircle className="w-6 h-6" />
                      ) : (
                        stage.icon
                      )}
                    </div>

                    {/* Stage Label */}
                    <p className={`font-medium mb-1 ${textColor}`}>{stage.label}</p>

                    {/* Document Count */}
                    {stage.expected && (
                      <Badge
                        variant={isActive ? 'default' : 'outline'}
                        className={isActive ? `bg-${stage.color}-600` : ''}
                      >
                        {stage.count} {stage.count === 1 ? 'doc' : 'docs'}
                      </Badge>
                    )}

                    {!stage.expected && (
                      <span className="text-xs text-muted-foreground">N/A</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Documents Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Quotations */}
        {chain.expectedDocuments.hasQuotation && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                Quotations ({documents.quotations.length})
              </CardTitle>
              <Button size="sm" variant="outline" className="gap-2">
                <Plus className="w-4 h-4" />
                Add
              </Button>
            </CardHeader>
            <CardContent>
              {documents.quotations.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No quotations added yet
                </p>
              ) : (
                <div className="space-y-2">
                  {documents.quotations.map(quot => (
                    <div
                      key={quot.quotationId}
                      className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 cursor-pointer"
                      onClick={() => navigate(`/quotations/${quot.quotationUuid}`)}
                    >
                      <div>
                        <p className="font-medium">{quot.quotationNumber}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(quot.quotationDate)} • {formatCurrency(quot.totalAmount)}
                        </p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* LPOs */}
        {chain.expectedDocuments.hasLPO && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-indigo-600" />
                LPOs ({documents.lpos.length})
              </CardTitle>
              <Button size="sm" variant="outline" className="gap-2">
                <Plus className="w-4 h-4" />
                Add
              </Button>
            </CardHeader>
            <CardContent>
              {documents.lpos.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No LPOs created yet
                </p>
              ) : (
                <div className="space-y-2">
                  {documents.lpos.map(lpo => (
                    <div
                      key={lpo.lpoId}
                      className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 cursor-pointer"
                      onClick={() => navigate(`/lpo/${lpo.lpoUuid}`)}
                    >
                      <div>
                        <p className="font-medium">{lpo.lpoNumber}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(lpo.lpoDate)} • {formatCurrency(lpo.totalAmount)}
                        </p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Delivery Orders */}
        {chain.expectedDocuments.hasDeliveryOrder && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Truck className="w-5 h-5 text-purple-600" />
                Delivery Orders ({documents.deliveryOrders.length})
              </CardTitle>
              <Button size="sm" variant="outline" className="gap-2">
                <Plus className="w-4 h-4" />
                Add
              </Button>
            </CardHeader>
            <CardContent>
              {documents.deliveryOrders.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No delivery orders recorded
                </p>
              ) : (
                <div className="space-y-2">
                  {documents.deliveryOrders.map(dorder => (
                    <div
                      key={dorder.doId}
                      className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 cursor-pointer"
                      onClick={() => navigate(`/delivery-orders/${dorder.doUuid}`)}
                    >
                      <div>
                        <p className="font-medium">{dorder.doNumber}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(dorder.deliveryDate)} • {dorder.itemsReceived}/{dorder.itemsTotal} items
                        </p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Invoices */}
        {chain.expectedDocuments.hasInvoice && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Receipt className="w-5 h-5 text-teal-600" />
                Invoices ({documents.invoices.length})
              </CardTitle>
              <Button size="sm" variant="outline" className="gap-2">
                <Plus className="w-4 h-4" />
                Add
              </Button>
            </CardHeader>
            <CardContent>
              {documents.invoices.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No invoices uploaded
                </p>
              ) : (
                <div className="space-y-2">
                  {documents.invoices.map(inv => (
                    <div
                      key={inv.invoiceId}
                      className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 cursor-pointer"
                      onClick={() => navigate(`/invoices/${inv.invoiceUuid}`)}
                    >
                      <div>
                        <p className="font-medium">{inv.invoiceNumber}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(inv.invoiceDate)} • {formatCurrency(inv.totalAmount)}
                        </p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Payments */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-green-600" />
              Payments ({documents.payments.length})
            </CardTitle>
            <Button size="sm" variant="outline" className="gap-2">
              <Plus className="w-4 h-4" />
              Add
            </Button>
          </CardHeader>
          <CardContent>
            {documents.payments.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No payments recorded
              </p>
            ) : (
              <div className="space-y-2">
                {documents.payments.map(payment => (
                  <div
                    key={payment.paymentId}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{payment.referenceNumber}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(payment.paymentDate)} • {payment.paymentMethod}
                      </p>
                    </div>
                    <p className="font-medium text-green-600">
                      {formatCurrency(payment.amount)}
                    </p>
                  </div>
                ))}
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Activity Log
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activityLog.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No activity recorded
            </p>
          ) : (
            <div className="space-y-3">
              {activityLog.map(log => (
                <div key={log.logId} className="flex gap-4 pb-3 border-b last:border-0">
                  <div className="flex-shrink-0 w-2 h-2 mt-2 rounded-full bg-primary" />
                  <div className="flex-1">
                    <p className="font-medium">{log.activityDescription}</p>
                    <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                      <span>{log.performedBy.name}</span>
                      <span>•</span>
                      <span>{formatDate(log.performedAt)}</span>
                      {log.newStatus && (
                        <>
                          <span>•</span>
                          <Badge variant="outline" className="text-xs">
                            {log.newStatus.name}
                          </Badge>
                        </>
                      )}
                    </div>
                    {log.notes && (
                      <p className="text-sm text-muted-foreground mt-1">{log.notes}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
