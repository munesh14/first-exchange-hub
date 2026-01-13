import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getQuotations, downloadQuotationFile } from '@/lib/api-quotation';
import type { Quotation } from '@/lib/api-quotation';
import QuotationCard from '@/components/quotations/QuotationCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, Search, Filter, Loader2, FileText } from 'lucide-react';

export default function QuotationList() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [filteredQuotations, setFilteredQuotations] = useState<Quotation[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedTab, setSelectedTab] = useState<string>('all');

  useEffect(() => {
    loadQuotations();
  }, []);

  useEffect(() => {
    filterQuotations();
  }, [quotations, searchTerm, statusFilter, selectedTab]);

  async function loadQuotations() {
    setLoading(true);
    try {
      const data = await getQuotations();
      setQuotations(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading quotations:', error);
      setQuotations([]);
    }
    setLoading(false);
  }

  function filterQuotations() {
    let filtered = [...quotations];

    // Filter by tab
    if (selectedTab === 'selected') {
      filtered = filtered.filter(q => q.IsSelected);
    } else if (selectedTab === 'pending') {
      filtered = filtered.filter(q => !q.IsSelected);
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(q =>
        q.QuotationNumber.toLowerCase().includes(term) ||
        q.VendorName.toLowerCase().includes(term) ||
        q.DepartmentName.toLowerCase().includes(term)
      );
    }

    setFilteredQuotations(filtered);
  }

  const handleDownload = (uuid: string) => {
    downloadQuotationFile(uuid);
  };

  const stats = {
    total: quotations.length,
    selected: quotations.filter(q => q.IsSelected).length,
    pending: quotations.filter(q => !q.IsSelected).length,
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
              <h1 className="text-3xl font-bold text-slate-900">Quotations</h1>
              <p className="text-slate-500 mt-1">Manage vendor quotations</p>
            </div>
            <Button onClick={() => navigate('/quotations/upload')} className="gap-2">
              <Upload className="w-4 h-4" />
              Upload Quotation
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-lg p-4 border border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Total Quotations</p>
                  <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
                </div>
                <FileText className="w-8 h-8 text-blue-600" />
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 border border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Selected</p>
                  <p className="text-2xl font-bold text-green-600">{stats.selected}</p>
                </div>
                <FileText className="w-8 h-8 text-green-600" />
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 border border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Pending</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.pending}</p>
                </div>
                <FileText className="w-8 h-8 text-orange-600" />
              </div>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search by quotation number, vendor, or department..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList>
            <TabsTrigger value="all">
              All ({stats.total})
            </TabsTrigger>
            <TabsTrigger value="pending">
              Pending ({stats.pending})
            </TabsTrigger>
            <TabsTrigger value="selected">
              Selected ({stats.selected})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6">
            {selectedTab === 'all' && (filteredQuotations.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg border border-slate-200">
                <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-600">No quotations found</p>
                <p className="text-sm text-slate-400 mt-1">
                  {searchTerm
                    ? 'Try adjusting your search criteria'
                    : 'Upload your first quotation to get started'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredQuotations.map((quotation) => (
                  <QuotationCard
                    key={quotation.QuotationUUID}
                    quotation={quotation}
                    onDownload={handleDownload}
                  />
                ))}
              </div>
            ))}
          </TabsContent>

          <TabsContent value="pending" className="mt-6">
            {selectedTab === 'pending' && (filteredQuotations.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg border border-slate-200">
                <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-600">No pending quotations</p>
                <p className="text-sm text-slate-400 mt-1">
                  All quotations have been reviewed
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredQuotations.map((quotation) => (
                  <QuotationCard
                    key={quotation.QuotationUUID}
                    quotation={quotation}
                    onDownload={handleDownload}
                  />
                ))}
              </div>
            ))}
          </TabsContent>

          <TabsContent value="selected" className="mt-6">
            {selectedTab === 'selected' && (filteredQuotations.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg border border-slate-200">
                <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-600">No selected quotations</p>
                <p className="text-sm text-slate-400 mt-1">
                  Select quotations to create purchase orders
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredQuotations.map((quotation) => (
                  <QuotationCard
                    key={quotation.QuotationUUID}
                    quotation={quotation}
                    onDownload={handleDownload}
                  />
                ))}
              </div>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
