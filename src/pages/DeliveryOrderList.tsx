import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDeliveryOrders } from '@/lib/api-delivery-order';
import type { DeliveryOrder } from '@/lib/api-delivery-order';
import DOCard from '@/components/delivery-orders/DOCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Search, Loader2, Truck } from 'lucide-react';

export default function DeliveryOrderList() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [deliveryOrders, setDeliveryOrders] = useState<DeliveryOrder[]>([]);
  const [filteredDOs, setFilteredDOs] = useState<DeliveryOrder[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTab, setSelectedTab] = useState<string>('all');

  useEffect(() => {
    loadDeliveryOrders();
  }, []);

  useEffect(() => {
    filterDeliveryOrders();
  }, [deliveryOrders, searchTerm, selectedTab]);

  async function loadDeliveryOrders() {
    setLoading(true);
    try {
      const data = await getDeliveryOrders();
      setDeliveryOrders(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading delivery orders:', error);
      setDeliveryOrders([]);
    }
    setLoading(false);
  }

  function filterDeliveryOrders() {
    let filtered = [...deliveryOrders];

    // Filter by tab
    if (selectedTab === 'pending') {
      filtered = filtered.filter(d => d.Status === 'PENDING');
    } else if (selectedTab === 'partial') {
      filtered = filtered.filter(d => d.Status === 'PARTIALLY_RECEIVED');
    } else if (selectedTab === 'received') {
      filtered = filtered.filter(d => d.Status === 'FULLY_RECEIVED');
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(d =>
        d.DONumber.toLowerCase().includes(term) ||
        d.VendorName.toLowerCase().includes(term) ||
        (d.LPONumber && d.LPONumber.toLowerCase().includes(term))
      );
    }

    setFilteredDOs(filtered);
  }

  const stats = {
    total: deliveryOrders.length,
    pending: deliveryOrders.filter(d => d.Status === 'PENDING').length,
    partial: deliveryOrders.filter(d => d.Status === 'PARTIALLY_RECEIVED').length,
    received: deliveryOrders.filter(d => d.Status === 'FULLY_RECEIVED').length,
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
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Delivery Orders</h1>
              <p className="text-slate-500 mt-1">Track and manage deliveries</p>
            </div>
            <Button onClick={() => navigate('/delivery-orders/create')} className="gap-2">
              <Plus className="w-4 h-4" />
              Create Delivery Order
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg p-4 border border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Total DOs</p>
                  <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
                </div>
                <Truck className="w-8 h-8 text-indigo-600" />
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 border border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Pending</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                </div>
                <Truck className="w-8 h-8 text-yellow-600" />
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 border border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Partial</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.partial}</p>
                </div>
                <Truck className="w-8 h-8 text-blue-600" />
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 border border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Received</p>
                  <p className="text-2xl font-bold text-green-600">{stats.received}</p>
                </div>
                <Truck className="w-8 h-8 text-green-600" />
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search by DO number, LPO, or vendor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList>
            <TabsTrigger value="all">All ({stats.total})</TabsTrigger>
            <TabsTrigger value="pending">Pending ({stats.pending})</TabsTrigger>
            <TabsTrigger value="partial">Partial ({stats.partial})</TabsTrigger>
            <TabsTrigger value="received">Received ({stats.received})</TabsTrigger>
          </TabsList>

          <TabsContent value={selectedTab} className="mt-6">
            {filteredDOs.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg border border-slate-200">
                <Truck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-600">No delivery orders found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredDOs.map((deliveryOrder) => (
                  <DOCard key={deliveryOrder.DOUUID} deliveryOrder={deliveryOrder} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
